"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BookingOptionType, EventCategory, ParticipationMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { saveFile, FileValidationError, type SavedFile } from "@/lib/storage";
import { slugify, appTzLocalToUtc } from "@/lib/utils";
import { requireAdminRole, auditAdminAction } from "./admin-actions";
import { canManageContent } from "@/lib/admin-permissions";

export type AdminActionResult = { ok: boolean; error?: string; message?: string; id?: string };

function reqString(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" ? v : undefined;
}
function reqNum(form: FormData, key: string): number | null {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function reqBool(form: FormData, key: string): boolean {
  return form.get(key) === "on";
}
function reqDate(form: FormData, key: string): Date | null {
  const v = reqString(form, key);
  if (!v) return null;
  return appTzLocalToUtc(v);
}

async function storeUpload(form: FormData, field: string, folder: string): Promise<SavedFile | null> {
  const file = form.get(field);
  if (!file || !(file instanceof File) || file.size === 0) return null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    return await saveFile({
      buffer,
      mimeType: file.type || "application/octet-stream",
      originalName: file.name,
      isPublic: true,
      folder,
    });
  } catch (e) {
    if (e instanceof FileValidationError) throw e;
    throw new FileValidationError("Upload failed. Please try another file.");
  }
}

// ============================================================
// EVENTS
// ============================================================

const eventSchema = z.object({
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(400).nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.enum(["AWARDS", "DAYTIME_HANGOUT", "VACATION_PROGRAMME", "WORKSHOP", "TRAINING", "COMMUNITY", "CULTURAL", "OTHER"]),
  startsAt: z.string().min(1),
  endsAt: z.string().nullable().optional(),
  venue: z.string().trim().max(180).nullable().optional(),
  location: z.string().trim().max(180).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  priceInKobo: z.number().min(0).nullable().optional(),
  participation: z.enum(["NONE", "REGISTRATION", "BOOKING", "BOTH"]),
  registrationDeadline: z.string().nullable().optional(),
  bookingType: z.enum(["SEAT", "TABLE", "GENERAL", "CUSTOM"]).nullable().optional(),
  bookingDeadline: z.string().nullable().optional(),
  externalUrl: z.string().trim().max(300).nullable().optional(),
  instructions: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]),
});

export async function createEvent(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  if (!canManageContent(admin.role)) return { ok: false, error: "Not permitted." };

  const parsed = eventSchema.safeParse({
    title: reqString(formData, "title"),
    summary: reqString(formData, "summary") || null,
    description: reqString(formData, "description") || null,
    category: reqString(formData, "category"),
    startsAt: reqString(formData, "startsAt"),
    endsAt: reqString(formData, "endsAt") || null,
    venue: reqString(formData, "venue") || null,
    location: reqString(formData, "location") || null,
    capacity: reqNum(formData, "capacity"),
    priceInKobo: (reqNum(formData, "price") ?? 0) * 100,
    participation: reqString(formData, "participation"),
    registrationDeadline: reqString(formData, "registrationDeadline") || null,
    bookingType: reqString(formData, "bookingType") || null,
    bookingDeadline: reqString(formData, "bookingDeadline") || null,
    externalUrl: reqString(formData, "externalUrl") || null,
    instructions: reqString(formData, "instructions") || null,
    isFeatured: reqBool(formData, "isFeatured"),
    status: reqString(formData, "status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;
  const startsAt = appTzLocalToUtc(d.startsAt) ?? new Date();
  const endsAt = d.endsAt ? appTzLocalToUtc(d.endsAt) : null;
  const regDeadline = d.registrationDeadline ? appTzLocalToUtc(d.registrationDeadline) : null;
  const bookDeadline = d.bookingDeadline ? appTzLocalToUtc(d.bookingDeadline) : null;

  let slug = slugify(d.title);
  if (!slug) return { ok: false, error: "Title must produce a valid slug." };
  const clash = await prisma.event.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "events");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }

  const ev = await prisma.event.create({
    data: {
      title: d.title,
      slug,
      summary: d.summary ?? null,
      description: d.description ?? null,
      imageUrl: stored?.url ?? null,
      category: d.category as EventCategory,
      startsAt,
      endsAt,
      venue: d.venue ?? null,
      location: d.location ?? null,
      capacity: d.capacity ?? null,
      priceInKobo: d.priceInKobo ?? null,
      participation: d.participation as ParticipationMode,
      registrationDeadline: regDeadline,
      bookingType: d.bookingType as BookingOptionType | null,
      bookingDeadline: bookDeadline,
      externalUrl: d.externalUrl ?? null,
      instructions: d.instructions ?? null,
      isFeatured: d.isFeatured,
      status: d.status as never,
      createdById: admin.id,
    },
  });
  await auditAdminAction(admin, {
    action: "EVENT_CREATED",
    entityType: "EVENT",
    entityId: ev.id,
    description: `Created event "${ev.title}".`,
  });
  revalidatePath("/events");
  return { ok: true, id: ev.id, message: "Event created." };
}

export async function updateEvent(
  eventId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  if (!canManageContent(admin.role)) return { ok: false, error: "Not permitted." };
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { ok: false, error: "Event not found." };

  const parsed = eventSchema.safeParse({
    title: reqString(formData, "title"),
    summary: reqString(formData, "summary") || null,
    description: reqString(formData, "description") || null,
    category: reqString(formData, "category"),
    startsAt: reqString(formData, "startsAt"),
    endsAt: reqString(formData, "endsAt") || null,
    venue: reqString(formData, "venue") || null,
    location: reqString(formData, "location") || null,
    capacity: reqNum(formData, "capacity"),
    priceInKobo: (reqNum(formData, "price") ?? 0) * 100,
    participation: reqString(formData, "participation"),
    registrationDeadline: reqString(formData, "registrationDeadline") || null,
    bookingType: reqString(formData, "bookingType") || null,
    bookingDeadline: reqString(formData, "bookingDeadline") || null,
    externalUrl: reqString(formData, "externalUrl") || null,
    instructions: reqString(formData, "instructions") || null,
    isFeatured: reqBool(formData, "isFeatured"),
    status: reqString(formData, "status"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  const d = parsed.data;
  const startsAt = appTzLocalToUtc(d.startsAt) ?? new Date();
  const endsAt = d.endsAt ? appTzLocalToUtc(d.endsAt) : null;
  const regDeadline = d.registrationDeadline ? appTzLocalToUtc(d.registrationDeadline) : null;
  const bookDeadline = d.bookingDeadline ? appTzLocalToUtc(d.bookingDeadline) : null;

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "events");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }

  const ev = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: d.title,
      summary: d.summary ?? null,
      description: d.description ?? null,
      imageUrl: stored?.url ?? existing.imageUrl,
      category: d.category as EventCategory,
      startsAt,
      endsAt,
      venue: d.venue ?? null,
      location: d.location ?? null,
      capacity: d.capacity ?? null,
      priceInKobo: d.priceInKobo ?? null,
      participation: d.participation as ParticipationMode,
      registrationDeadline: regDeadline,
      bookingType: d.bookingType as BookingOptionType | null,
      bookingDeadline: bookDeadline,
      externalUrl: d.externalUrl ?? null,
      instructions: d.instructions ?? null,
      isFeatured: d.isFeatured,
      status: d.status as never,
    },
  });
  await auditAdminAction(admin, {
    action: "EVENT_UPDATED",
    entityType: "EVENT",
    entityId: ev.id,
    description: `Updated event "${ev.title}".`,
  });
  revalidatePath("/events");
  return { ok: true, message: "Event saved." };
}

export async function deleteEvent(eventId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) return { ok: false, error: "Event not found." };
  await prisma.event.delete({ where: { id: eventId } });
  await auditAdminAction(admin, {
    action: "EVENT_DELETED",
    entityType: "EVENT",
    entityId: eventId,
    description: `Deleted event "${ev.title}".`,
    metadata: { slug: ev.slug },
  });
  revalidatePath("/events");
  return { ok: true, message: "Event deleted." };
}

export async function setEventStatus(eventId: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.event.update({ where: { id: eventId }, data: { status: status as never } });
  await auditAdminAction(admin, { action: "EVENT_STATUS", entityType: "EVENT", entityId: eventId, description: `Set event status to ${status}.` });
  revalidatePath("/events");
  return { ok: true };
}

// Booking options
export async function addBookingOption(
  eventId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const title = reqString(formData, "title")?.trim();
  if (!title) return { ok: false, error: "Option title is required." };
  const type = (reqString(formData, "type") || "SEAT") as BookingOptionType;
  const capacity = reqNum(formData, "capacity");
  const price = (reqNum(formData, "price") ?? 0) * 100;
  const maxSort = await prisma.eventBookingOption.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });
  const opt = await prisma.eventBookingOption.create({
    data: { eventId, title, type, capacity, priceInKobo: price, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });
  await auditAdminAction(admin, { action: "BOOKING_OPTION_CREATED", entityType: "EVENT", entityId: eventId, description: `Added booking option "${title}".`, metadata: { optionId: opt.id } });
  return { ok: true, id: opt.id, message: "Option added." };
}

export async function toggleBookingOption(optionId: string, available: boolean): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.eventBookingOption.update({ where: { id: optionId }, data: { isAvailable: available } });
  await auditAdminAction(admin, { action: "BOOKING_OPTION_TOGGLED", entityType: "EVENT_BOOKING_OPTION", entityId: optionId, description: `Set availability ${available}.` });
  return { ok: true };
}

export async function deleteBookingOption(optionId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.eventBookingOption.delete({ where: { id: optionId } });
  await auditAdminAction(admin, { action: "BOOKING_OPTION_DELETED", entityType: "EVENT_BOOKING_OPTION", entityId: optionId });
  return { ok: true };
}

export async function setRegistrationStatus(regId: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.eventRegistration.update({ where: { id: regId }, data: { status: status as never } });
  await auditAdminAction(admin, { action: "REGISTRATION_STATUS", entityType: "EVENT_REGISTRATION", entityId: regId, description: `Registration → ${status}` });
  return { ok: true };
}

// ============================================================
// AWARDS, CATEGORIES, NOMINEES
// ============================================================

export async function updateAward(
  awardId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const award = await prisma.award.findUnique({ where: { id: awardId } });
  if (!award) return { ok: false, error: "Award not found." };

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "awards");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }

  const priceRaw = reqNum(formData, "pricePerVote");
  const updated = await prisma.award.update({
    where: { id: awardId },
    data: {
      title: reqString(formData, "title") || award.title,
      tagline: reqString(formData, "tagline") || null,
      description: reqString(formData, "description") || null,
      imageUrl: stored?.url ?? award.imageUrl,
      venue: reqString(formData, "venue") || null,
      eventStartsAt: reqDate(formData, "eventStartsAt"),
      eventEndsAt: reqDate(formData, "eventEndsAt"),
      votingOpensAt: reqDate(formData, "votingOpensAt"),
      votingClosesAt: reqDate(formData, "votingClosesAt"),
      pricePerVoteKobo: priceRaw == null ? award.pricePerVoteKobo : Math.round(priceRaw * 100),
      minVotesPerTx: Math.max(1, Math.min(1000, reqNum(formData, "minVotes") ?? award.minVotesPerTx)),
      maxVotesPerTx: Math.max(1, Math.min(10000, reqNum(formData, "maxVotes") ?? award.maxVotesPerTx)),
      allowMultipleTx: reqBool(formData, "allowMultipleTx"),
      showPublicVoteCounts: reqBool(formData, "showPublicVoteCounts"),
      resultsStatus: (reqString(formData, "resultsStatus") || award.resultsStatus) as never,
      allowLateSubmissions: reqBool(formData, "allowLateSubmissions"),
      isActive: reqBool(formData, "isActive"),
      isPublished: reqBool(formData, "isPublished"),
    },
  });
  await auditAdminAction(admin, {
    action: "AWARD_UPDATED",
    entityType: "AWARD",
    entityId: updated.id,
    description: `Updated award "${updated.title}".`,
  });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true, message: "Award settings saved." };
}

export async function createCategory(
  awardId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const name = reqString(formData, "name")?.trim();
  if (!name) return { ok: false, error: "Category name is required." };
  const maxSort = await prisma.awardCategory.aggregate({ where: { awardId }, _max: { sortOrder: true } });
  const cat = await prisma.awardCategory.create({
    data: {
      awardId,
      name,
      slug: slugify(name) || undefined,
      description: reqString(formData, "description") || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isPublished: reqBool(formData, "isPublished"),
      isVotingEnabled: reqBool(formData, "isVotingEnabled"),
    },
  });
  await auditAdminAction(admin, { action: "AWARD_CATEGORY_CREATED", entityType: "AWARD_CATEGORY", entityId: cat.id, description: `Created category "${name}".` });
  revalidatePath("/awards");
  return { ok: true, id: cat.id, message: "Category created." };
}

export async function updateCategory(
  catId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const cat = await prisma.awardCategory.findUnique({ where: { id: catId } });
  if (!cat) return { ok: false, error: "Category not found." };
  const priceRaw = reqNum(formData, "pricePerVote");
  await prisma.awardCategory.update({
    where: { id: catId },
    data: {
      name: reqString(formData, "name") || cat.name,
      description: reqString(formData, "description") || null,
      isPublished: reqBool(formData, "isPublished"),
      isVotingEnabled: reqBool(formData, "isVotingEnabled"),
      votingOpensAt: reqDate(formData, "votingOpensAt"),
      votingClosesAt: reqDate(formData, "votingClosesAt"),
      pricePerVoteKobo:
        reqString(formData, "useDefaultPrice") === "on"
          ? null
          : priceRaw == null
            ? null
            : Math.round(priceRaw * 100),
      nomineeLimit: reqNum(formData, "nomineeLimit"),
    },
  });
  await auditAdminAction(admin, { action: "AWARD_CATEGORY_UPDATED", entityType: "AWARD_CATEGORY", entityId: catId, description: `Updated category "${cat.name}".` });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true, message: "Category saved." };
}

export async function deleteCategory(catId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const cat = await prisma.awardCategory.findUnique({ where: { id: catId }, include: { _count: { select: { nominees: true } } } });
  if (!cat) return { ok: false, error: "Category not found." };
  if (cat._count.nominees > 0)
    return { ok: false, error: "Remove all nominees in this category before deleting it." };
  await prisma.awardCategory.delete({ where: { id: catId } });
  await auditAdminAction(admin, { action: "AWARD_CATEGORY_DELETED", entityType: "AWARD_CATEGORY", entityId: catId, description: `Deleted category "${cat.name}".` });
  revalidatePath("/awards");
  return { ok: true, message: "Category deleted." };
}

export async function moveNominee(categoryId: string, nomineeId: string, dir: "up" | "down"): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const nominees = await prisma.nominee.findMany({ where: { categoryId }, orderBy: { sortOrder: "asc" } });
  const idx = nominees.findIndex((n) => n.id === nomineeId);
  if (idx < 0) return { ok: false, error: "Not found." };
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= nominees.length) return { ok: true, message: "Already at edge." };
  const a = nominees[idx]!;
  const b = nominees[swapIdx]!;
  await prisma.$transaction([
    prisma.nominee.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.nominee.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  await auditAdminAction(admin, { action: "NOMINEE_REORDERED", entityType: "NOMINEE", entityId: nomineeId, description: `Moved nominee ${dir} in category.` });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true };
}

const nomineeSchema = z.object({
  name: z.string().trim().min(2).max(180),
  stageName: z.string().trim().max(180).nullable().optional(),
  bio: z.string().max(4000).nullable().optional(),
  instagram: z.string().trim().max(160).nullable().optional(),
  tiktok: z.string().trim().max(160).nullable().optional(),
  x: z.string().trim().max(160).nullable().optional(),
  facebook: z.string().trim().max(160).nullable().optional(),
  youtube: z.string().trim().max(160).nullable().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export async function createNominee(
  categoryId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const parsed = nomineeSchema.safeParse({
    name: reqString(formData, "name"),
    stageName: reqString(formData, "stageName") || null,
    bio: reqString(formData, "bio") || null,
    instagram: reqString(formData, "instagram") || null,
    tiktok: reqString(formData, "tiktok") || null,
    x: reqString(formData, "x") || null,
    facebook: reqString(formData, "facebook") || null,
    youtube: reqString(formData, "youtube") || null,
    isPublished: reqBool(formData, "isPublished"),
    isFeatured: reqBool(formData, "isFeatured"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check nominee details." };
  const d = parsed.data;

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "nominees");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }
  const maxSort = await prisma.nominee.aggregate({ where: { categoryId }, _max: { sortOrder: true } });
  const n = await prisma.nominee.create({
    data: {
      categoryId,
      name: d.name,
      stageName: d.stageName ?? null,
      bio: d.bio ?? null,
      imageUrl: stored?.url ?? null,
      socials: { instagram: d.instagram ?? "", tiktok: d.tiktok ?? "", x: d.x ?? "", facebook: d.facebook ?? "", youtube: d.youtube ?? "" },
      isPublished: d.isPublished,
      isFeatured: d.isFeatured,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  await auditAdminAction(admin, { action: "NOMINEE_CREATED", entityType: "NOMINEE", entityId: n.id, description: `Created nominee "${d.name}".` });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true, id: n.id, message: "Nominee created." };
}

export async function updateNominee(
  nomineeId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const n = await prisma.nominee.findUnique({ where: { id: nomineeId } });
  if (!n) return { ok: false, error: "Nominee not found." };
  const parsed = nomineeSchema.safeParse({
    name: reqString(formData, "name"),
    stageName: reqString(formData, "stageName") || null,
    bio: reqString(formData, "bio") || null,
    instagram: reqString(formData, "instagram") || null,
    tiktok: reqString(formData, "tiktok") || null,
    x: reqString(formData, "x") || null,
    facebook: reqString(formData, "facebook") || null,
    youtube: reqString(formData, "youtube") || null,
    isPublished: reqBool(formData, "isPublished"),
    isFeatured: reqBool(formData, "isFeatured"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check nominee details." };
  const d = parsed.data;

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "nominees");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }

  await prisma.nominee.update({
    where: { id: nomineeId },
    data: {
      name: d.name,
      stageName: d.stageName ?? null,
      bio: d.bio ?? null,
      imageUrl: stored?.url ?? n.imageUrl,
      socials: { instagram: d.instagram ?? "", tiktok: d.tiktok ?? "", x: d.x ?? "", facebook: d.facebook ?? "", youtube: d.youtube ?? "" },
      isPublished: d.isPublished,
      isFeatured: d.isFeatured,
    },
  });
  await auditAdminAction(admin, { action: "NOMINEE_UPDATED", entityType: "NOMINEE", entityId: nomineeId, description: `Updated nominee "${d.name}".` });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true, message: "Nominee saved." };
}

export async function deleteNominee(nomineeId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const n = await prisma.nominee.findUnique({ where: { id: nomineeId } });
  if (!n) return { ok: false, error: "Nominee not found." };
  if (n.officialVotes > 0)
    return { ok: false, error: "This nominee already has verified votes — delete is disabled to protect the record. Unpublish instead." };
  await prisma.nominee.delete({ where: { id: nomineeId } });
  await auditAdminAction(admin, { action: "NOMINEE_DELETED", entityType: "NOMINEE", entityId: nomineeId, description: `Deleted nominee "${n.name}".` });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true, message: "Nominee deleted." };
}

export async function toggleNomineeFlag(nomineeId: string, field: "isPublished" | "isFeatured"): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const n = await prisma.nominee.findUnique({ where: { id: nomineeId } });
  if (!n) return { ok: false, error: "Not found." };
  const next = field === "isPublished" ? !n.isPublished : !n.isFeatured;
  await prisma.nominee.update({ where: { id: nomineeId }, data: { [field]: next } });
  await auditAdminAction(admin, { action: field === "isPublished" ? "NOMINEE_PUBLISH_TOGGLED" : "NOMINEE_FEATURED_TOGGLED", entityType: "NOMINEE", entityId: nomineeId, description: `${field} → ${next} for ${n.name}` });
  revalidatePath("/awards");
  revalidatePath("/vote");
  return { ok: true };
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function createAnnouncement(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const title = reqString(formData, "title")?.trim();
  if (!title) return { ok: false, error: "Title is required." };
  let slug = slugify(title);
  if (!slug) slug = `announcement-${Date.now().toString(36)}`;
  if (await prisma.announcement.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "announcements");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }
  const status = reqString(formData, "status") || "DRAFT";
  const published = status === "PUBLISHED";
  const a = await prisma.announcement.create({
    data: {
      title,
      slug,
      excerpt: reqString(formData, "excerpt") || null,
      content: reqString(formData, "content") || null,
      imageUrl: stored?.url ?? null,
      authorName: reqString(formData, "author") || admin.name,
      isPinned: reqBool(formData, "isPinned"),
      status: status as never,
      publishedAt: published ? new Date() : null,
    },
  });
  await auditAdminAction(admin, { action: "ANNOUNCEMENT_CREATED", entityType: "ANNOUNCEMENT", entityId: a.id, description: `Created announcement "${title}".` });
  revalidatePath("/news");
  return { ok: true, id: a.id, message: "Announcement created." };
}

export async function updateAnnouncement(
  id: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Not found." };
  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "announcements");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }
  const title = reqString(formData, "title")?.trim() || existing.title;
  const status = (reqString(formData, "status") || existing.status) as never;
  const wasPublished = existing.status === "PUBLISHED";
  const isNowPublished = status === "PUBLISHED";
  await prisma.announcement.update({
    where: { id },
    data: {
      title,
      excerpt: reqString(formData, "excerpt") || null,
      content: reqString(formData, "content") || null,
      imageUrl: stored?.url ?? existing.imageUrl,
      authorName: reqString(formData, "author") || existing.authorName,
      isPinned: reqBool(formData, "isPinned"),
      status,
      publishedAt: isNowPublished && !wasPublished ? new Date() : existing.publishedAt,
    },
  });
  await auditAdminAction(admin, { action: "ANNOUNCEMENT_UPDATED", entityType: "ANNOUNCEMENT", entityId: id, description: `Updated announcement "${title}".` });
  revalidatePath("/news");
  return { ok: true, message: "Saved." };
}

export async function deleteAnnouncement(id: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.announcement.delete({ where: { id } });
  await auditAdminAction(admin, { action: "ANNOUNCEMENT_DELETED", entityType: "ANNOUNCEMENT", entityId: id });
  revalidatePath("/news");
  return { ok: true, message: "Deleted." };
}

export async function setAnnouncementStatus(id: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const a = await prisma.announcement.findUnique({ where: { id } });
  await prisma.announcement.update({
    where: { id },
    data: {
      status: status as never,
      publishedAt: status === "PUBLISHED" && a?.status !== "PUBLISHED" ? new Date() : undefined,
    },
  });
  await auditAdminAction(admin, { action: "ANNOUNCEMENT_STATUS", entityType: "ANNOUNCEMENT", entityId: id, description: `Status → ${status}` });
  revalidatePath("/news");
  return { ok: true };
}

// ============================================================
// HOMEPAGE BANNERS
// ============================================================

export async function createBanner(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const title = reqString(formData, "title")?.trim();
  if (!title) return { ok: false, error: "Banner title is required." };
  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "banners");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }
  const priority = reqNum(formData, "priority") ?? 0;
  const b = await prisma.homepageBanner.create({
    data: {
      title,
      subtitle: reqString(formData, "subtitle") || null,
      imageUrl: stored?.url ?? null,
      ctaLabel: reqString(formData, "ctaLabel") || null,
      ctaHref: reqString(formData, "ctaHref") || null,
      startAt: reqDate(formData, "startAt"),
      endAt: reqDate(formData, "endAt"),
      priority: Math.trunc(priority),
      isActive: reqBool(formData, "isActive"),
    },
  });
  await auditAdminAction(admin, { action: "BANNER_CREATED", entityType: "HOMEPAGE_BANNER", entityId: b.id, description: `Created banner "${title}".` });
  revalidatePath("/");
  return { ok: true, id: b.id, message: "Banner created." };
}

export async function updateBanner(
  id: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const existing = await prisma.homepageBanner.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Not found." };
  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "banners");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }
  await prisma.homepageBanner.update({
    where: { id },
    data: {
      title: reqString(formData, "title") || existing.title,
      subtitle: reqString(formData, "subtitle") ?? existing.subtitle,
      imageUrl: stored?.url ?? existing.imageUrl,
      ctaLabel: reqString(formData, "ctaLabel") ?? existing.ctaLabel,
      ctaHref: reqString(formData, "ctaHref") ?? existing.ctaHref,
      startAt: appTzLocalToUtc(reqString(formData, "startAt") ?? ""),
      endAt: appTzLocalToUtc(reqString(formData, "endAt") ?? ""),
      priority: Math.trunc(reqNum(formData, "priority") ?? existing.priority),
      isActive: reqBool(formData, "isActive"),
    },
  });
  await auditAdminAction(admin, { action: "BANNER_UPDATED", entityType: "HOMEPAGE_BANNER", entityId: id, description: `Updated banner "${existing.title}".` });
  revalidatePath("/");
  return { ok: true, message: "Banner saved." };
}

export async function toggleBanner(id: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const b = await prisma.homepageBanner.findUnique({ where: { id } });
  if (!b) return { ok: false, error: "Not found." };
  await prisma.homepageBanner.update({ where: { id }, data: { isActive: !b.isActive } });
  await auditAdminAction(admin, { action: "BANNER_TOGGLED", entityType: "HOMEPAGE_BANNER", entityId: id, description: `Active → ${!b.isActive}` });
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBanner(id: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.homepageBanner.delete({ where: { id } });
  await auditAdminAction(admin, { action: "BANNER_DELETED", entityType: "HOMEPAGE_BANNER", entityId: id });
  revalidatePath("/");
  return { ok: true, message: "Deleted." };
}

// ============================================================
// VACATION PROGRAMMES
// ============================================================

export async function upsertVacationProgramme(
  programmeId: string | null,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const title = reqString(formData, "title")?.trim();
  if (!title) return { ok: false, error: "Title is required." };

  let slug = slugify(title);
  const existingSlug = await prisma.vacationProgramme.findUnique({ where: { slug } });
  if (existingSlug && existingSlug.id !== programmeId) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  let stored: SavedFile | null = null;
  try {
    stored = await storeUpload(formData, "image", "vacation");
  } catch (e) {
    if (e instanceof FileValidationError) return { ok: false, error: e.message };
  }

  const activities = (reqString(formData, "activities") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);

  const data = {
    title,
    slug,
    description: reqString(formData, "description") || null,
    imageUrl: stored?.url ?? null,
    ageRange: reqString(formData, "ageRange") || null,
    requirements: reqString(formData, "requirements") || null,
    activities,
    venue: reqString(formData, "venue") || null,
    location: reqString(formData, "location") || null,
    startsAt: appTzLocalToUtc(reqString(formData, "startsAt") ?? "") ?? new Date(),
    endsAt: appTzLocalToUtc(reqString(formData, "endsAt") ?? ""),
    priceInKobo: (reqNum(formData, "price") ?? 0) * 100,
    capacity: reqNum(formData, "capacity"),
    bookingOpen: reqBool(formData, "bookingOpen"),
    bookingDeadline: reqDate(formData, "bookingDeadline"),
    isPublished: reqBool(formData, "isPublished"),
    isFeatured: reqBool(formData, "isFeatured"),
  };

  const prog = programmeId
    ? await prisma.vacationProgramme.update({ where: { id: programmeId }, data: { ...data, imageUrl: stored?.url ?? (await prisma.vacationProgramme.findUnique({ where: { id: programmeId } }))?.imageUrl ?? null } })
    : await prisma.vacationProgramme.create({ data });

  await auditAdminAction(admin, { action: programmeId ? "VACATION_PROGRAMME_UPDATED" : "VACATION_PROGRAMME_CREATED", entityType: "VACATION_PROGRAMME", entityId: prog.id, description: `${programmeId ? "Updated" : "Created"} programme "${title}".` });
  revalidatePath("/events/vacation-programme");
  return { ok: true, id: prog.id, message: "Saved." };
}

export async function deleteVacationProgramme(id: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.vacationProgramme.delete({ where: { id } });
  await auditAdminAction(admin, { action: "VACATION_PROGRAMME_DELETED", entityType: "VACATION_PROGRAMME", entityId: id });
  revalidatePath("/events/vacation-programme");
  return { ok: true, message: "Deleted." };
}

export async function setVacationBookingStatus(bookingId: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.vacationBooking.update({ where: { id: bookingId }, data: { status: status as never } });
  await auditAdminAction(admin, { action: "VACATION_BOOKING_STATUS", entityType: "VACATION_BOOKING", entityId: bookingId, description: `Booking → ${status}` });
  return { ok: true };
}

export async function setEventBookingStatus(bookingId: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.eventBooking.update({ where: { id: bookingId }, data: { status: status as never } });
  await auditAdminAction(admin, { action: "EVENT_BOOKING_STATUS", entityType: "EVENT_BOOKING", entityId: bookingId, description: `Booking → ${status}` });
  return { ok: true };
}

// ============================================================
// AWARDS create (bootstrap)
// ============================================================
export async function createAwardProgramme(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const title = reqString(formData, "title")?.trim();
  if (!title) return { ok: false, error: "Award title required." };
  let slug = slugify(title);
  if (await prisma.award.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const a = await prisma.award.create({
    data: {
      title,
      slug,
      tagline: reqString(formData, "tagline") || "WHERE CULTURE MEETS DESIGN.",
      description: reqString(formData, "description") || null,
      isActive: true,
      isPublished: false,
    },
  });
  await auditAdminAction(admin, { action: "AWARD_CREATED", entityType: "AWARD", entityId: a.id, description: `Created award programme "${title}".` });
  return { ok: true, id: a.id, message: "Award programme created. Edit it to publish." };
}
