import { cache } from "react";
import {
  flattenSettings,
  getSettingsMap,
  parseJson,
  type PublicSiteSettings,
} from "./settings";
import { prisma } from "./prisma";

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  const map = await getSettingsMap();
  return flattenSettings(map);
});

export type PublicEvent = Awaited<ReturnType<typeof getPublishedEvents>>[number];

export async function getPublishedEvents(opts?: { category?: string; limit?: number; upcomingOnly?: boolean }) {
  const now = new Date();
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (opts?.category) where.category = opts.category;
  if (opts?.upcomingOnly) {
    where.startsAt = { gte: now };
  }
  return prisma.event.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { startsAt: "asc" }],
    take: opts?.limit ?? 50,
    include: { _count: { select: { registrations: true, bookings: true } } },
  });
}

export async function getPublishedAnnouncements(limit?: number) {
  return prisma.announcement.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit ?? 30,
  });
}

export type PublicAwardBundle = {
  award: PublicAward;
  categories: Array<{
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isVotingEnabled: boolean;
    nomineeCount: number;
    nominees: Array<{
      id: string;
      name: string;
      stageName: string | null;
      bio: string | null;
      imageUrl: string | null;
      isFeatured: boolean;
      sortOrder: number;
      officialVotes: number;
    }>;
  }>;
};

export async function findActiveAward() {
  return prisma.award.findFirst({
    where: { isActive: true, isPublished: true },
    orderBy: { createdAt: "desc" },
  });
}

export type PublicAward = NonNullable<Awaited<ReturnType<typeof findActiveAward>>>;

export async function getActiveAwardBundle(): Promise<PublicAwardBundle | null> {
  const award = await findActiveAward();
  if (!award) return null;

  const categories = await prisma.awardCategory.findMany({
    where: { awardId: award.id, isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      nominees: {
        where: { isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          name: true,
          stageName: true,
          bio: true,
          imageUrl: true,
          isFeatured: true,
          sortOrder: true,
          officialVotes: true,
        },
      },
    },
  });

  return {
    award,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      isVotingEnabled: c.isVotingEnabled,
      nomineeCount: c.nominees.length,
      nominees: c.nominees.map((n) => ({
        id: n.id,
        name: n.name,
        stageName: n.stageName,
        bio: n.bio,
        imageUrl: n.imageUrl,
        isFeatured: n.isFeatured,
        sortOrder: n.sortOrder,
        officialVotes: n.officialVotes,
      })),
    })),
  };
}

export function parseValuesArray(json?: string): Array<{ title: string; text: string }> {
  if (!json) return [];
  try {
    const arr = parseJson<unknown>(json, []);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is { title: string; text: string } =>
        !!x && typeof x === "object" && typeof (x as { title?: unknown }).title === "string"
    );
  } catch {
    return [];
  }
}

export function parseStringArray(json?: string): string[] {
  if (!json) return [];
  try {
    const arr = parseJson<unknown>(json, []);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

/** Voting deadline state for public pages. */
export async function getVotingState() {
  const bundle = await getActiveAwardBundle();
  if (!bundle) return { exists: false as const };
  const award = bundle.award;
  const now = Date.now();
  const opens = award.votingOpensAt ? award.votingOpensAt.getTime() : null;
  const closes = award.votingClosesAt ? award.votingClosesAt.getTime() : null;
  let state: "opened" | "not_yet_open" | "closed" | "no_schedule" = "no_schedule";
  if (opens && now < opens) state = "not_yet_open";
  else if (closes && now > closes) state = "closed";
  else state = "opened";
  return {
    exists: true as const,
    award,
    opensAt: award.votingOpensAt,
    closesAt: award.votingClosesAt,
    state,
    showPublicCounts: award.showPublicVoteCounts,
    pricePerVoteKobo: award.pricePerVoteKobo,
    resultsStatus: award.resultsStatus,
  };
}
