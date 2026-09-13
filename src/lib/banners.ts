import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Homepage banners that are currently active and within their window,
 * highest priority first.
 */
export const getActiveHomeBanners = cache(async () => {
  const now = new Date();
  return prisma.homepageBanner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
});
