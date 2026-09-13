import { prisma } from "./prisma";

/**
 * Create an in-app notification for a user.
 * The email/WhatsApp layer can be attached later through lib/notify queue.
 */
export async function notify(
  userId: string,
  input: {
    type: string;
    title: string;
    body?: string;
    link?: string;
  }
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed", err);
  }
}
