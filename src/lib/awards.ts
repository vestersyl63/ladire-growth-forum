import "server-only";

import { prisma } from "./prisma";
import { generateVoteReference } from "./reference";
import { notify } from "./notifications";

export const VOTE_REF_PREFIX = "LADIRE-VOTE";

export type VotingWindow = {
  opensAt: Date | null;
  closesAt: Date | null;
};

export type VoteError = { error: string; code?: string };

/**
 * Effective voting window & price for a category: category-level overrides
 * fall back to award-level configuration.
 */
export function effectiveVotingConfig(
  category: { votingOpensAt: Date | null; votingClosesAt: Date | null; pricePerVoteKobo: number | null },
  award: {
    votingOpensAt: Date | null;
    votingClosesAt: Date | null;
    pricePerVoteKobo: number | null;
  }
) {
  return {
    opensAt: category.votingOpensAt ?? award.votingOpensAt,
    closesAt: category.votingClosesAt ?? award.votingClosesAt,
    pricePerVoteKobo: category.pricePerVoteKobo ?? award.pricePerVoteKobo,
  };
}

/** Server-side check of whether voting is currently open for a category. */
export function votingOpenCheck(
  category: {
    isVotingEnabled: boolean;
    isPublished: boolean;
    votingOpensAt: Date | null;
    votingClosesAt: Date | null;
    pricePerVoteKobo: number | null;
  },
  award: {
    isActive: boolean;
    isPublished: boolean;
    allowLateSubmissions: boolean;
    votingOpensAt: Date | null;
    votingClosesAt: Date | null;
    pricePerVoteKobo: number | null;
  },
  now = new Date()
): { open: boolean; reason?: string; config: ReturnType<typeof effectiveVotingConfig> } {
  const config = effectiveVotingConfig(category, award);

  if (!award.isActive || !award.isPublished)
    return { open: false, reason: "Voting is currently closed.", config };
  if (!category.isPublished)
    return { open: false, reason: "This category is not open for voting.", config };
  if (!category.isVotingEnabled)
    return { open: false, reason: "Voting is not enabled for this category.", config };
  if (config.pricePerVoteKobo == null || config.pricePerVoteKobo <= 0)
    return { open: false, reason: "Voting price has not been configured yet.", config };

  if (config.opensAt && now < config.opensAt)
    return { open: false, reason: "Voting has not opened yet.", config };
  if (config.closesAt && now > config.closesAt) {
    if (award.allowLateSubmissions) {
      return { open: true, config };
    }
    return {
      open: false,
      reason: "Voting is currently closed.",
      config,
    };
  }
  return { open: true, config };
}

export async function getActiveAward() {
  return prisma.award.findFirst({
    where: { isActive: true, isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { categories: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * Creates a VoteOrder + Payment (PENDING) for the current quantity.
 * Server validates: nominee published, category voting open/enabled,
 * quantity rules, configured price. Amount is always recomputed server side.
 */
export async function createVoteOrder(input: {
  userId: string;
  nomineeId: string;
  quantity: number;
}): Promise<{ ok: true; orderId: string; reference: string; amountKobo: number; quantity: number } | { ok: false; error: string; code?: string }> {
  const { userId, nomineeId, quantity } = input;

  const nominee = await prisma.nominee.findUnique({
    where: { id: nomineeId },
    include: { category: { include: { award: true } } },
  });
  if (!nominee || !nominee.isPublished)
    return { ok: false, error: "Nominee not found or not yet published.", code: "NOMINEE" };
  const { category } = nominee;
  const award = category.award;

  const check = votingOpenCheck(category, award);
  if (!check.open) {
    return { ok: false, error: check.reason ?? "Voting is closed.", code: "CLOSED" };
  }
  const pricePerVote = check.config.pricePerVoteKobo!;

  if (!Number.isInteger(quantity) || quantity < award.minVotesPerTx)
    return {
      ok: false,
      error: `Minimum votes per transaction is ${award.minVotesPerTx}.`,
      code: "MIN",
    };
  if (quantity > award.maxVotesPerTx)
    return {
      ok: false,
      error: `Maximum votes per transaction is ${award.maxVotesPerTx}.`,
      code: "MAX",
    };

  if (!award.allowMultipleTx) {
    const existing = await prisma.voteOrder.findFirst({
      where: {
        userId,
        payment: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      },
    });
    if (existing)
      return {
        ok: false,
        error: "You already have an active voting transaction. Multiple transactions are not allowed.",
        code: "ONGOING",
      };
  }

  const amountKobo = quantity * pricePerVote;
  const now = new Date();
  let reference = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    reference = generateVoteReference();
    const clash = await prisma.voteOrder.findUnique({ where: { reference } });
    if (!clash) break;
    if (attempt === 4) {
      return { ok: false, error: "Could not generate a unique reference. Please retry.", code: "REF" };
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    return tx.voteOrder.create({
      data: {
        reference,
        userId,
        awardId: award.id,
        categoryId: category.id,
        nomineeId: nominee.id,
        quantity,
        pricePerVoteKobo: pricePerVote,
        amountKobo,
        awardTitle: award.title,
        categoryName: category.name,
        nomineeName: nominee.stageName || nominee.name,
        payment: {
          create: {
            reference,
            userId,
            amountExpectedKobo: amountKobo,
          },
        },
      },
    });
  });

  await notify(userId, {
    type: "PAYMENT_STARTED",
    title: "Voting order created",
    body: `You are purchasing ${quantity} vote${quantity === 1 ? "" : "s"} for ${nominee.stageName || nominee.name}. Complete your bank transfer and upload your receipt to finish.`,
    link: "/dashboard/votes",
  });

  return { ok: true, orderId: order.id, reference, amountKobo, quantity };
}

/** Public vote counts (approved only) for a nominee list — respects the show-public setting. */
export async function getPublicNomineeVoteCount(nomineeId: string): Promise<number | null> {
  const nominee = await prisma.nominee.findUnique({
    where: { id: nomineeId },
    include: { category: { include: { award: true } } },
  });
  if (!nominee || !nominee.category.award.showPublicVoteCounts) return null;
  return nominee.officialVotes;
}
