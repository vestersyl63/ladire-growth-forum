"use server";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import {
  memberSchema,
  contactSchema,
  eventRegistrationSchema,
  eventBookingSchema,
  vacationBookingSchema,
} from "@/lib/validations";
import {
  generateBookingReference,
  generateRegistrationReference,
  generateVacationBookingReference,
} from "@/lib/reference";
import { logAudit } from "@/lib/audit";

export type FormResult = { ok: boolean; error?: string; message?: string };

const pickString = (d: FormData, k: string) => {
  const v = d.get(k);
  return typeof v === "string" ? v : undefined;
};
const pickNumber = (d: FormData, k: string) => {
  const v = d.get(k);
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

/** Public membership form. */
export async function submitMember(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const rl = rateLimit("member", { limit: 5, windowSec: 900 });
  if (!rl.ok) return { ok: false, error: "Too many submissions. Try again shortly." };

  const session = await getSession();

  const parsed = memberSchema.safeParse({
    fullName: pickString(formData, "fullName"),
    email: pickString(formData, "email") || undefined,
    phone: pickString(formData, "phone") || null,
    dob: pickString(formData, "dob") || null,
    city: pickString(formData, "city") || null,
    areaOfInterest: pickString(formData, "areaOfInterest") || null,
    skills: (pickString(formData, "skills") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15),
    instagram: pickString(formData, "instagram") || null,
    tiktok: pickString(formData, "tiktok") || null,
    x: pickString(formData, "x") || null,
    facebook: pickString(formData, "facebook") || null,
    reason: pickString(formData, "reason") || null,
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your details." };
  }
  const data = parsed.data;

  await prisma.member.create({
    data: {
      userId: session?.user?.id ?? null,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      dob: data.dob ? new Date(data.dob) : null,
      city: data.city ?? null,
      areaOfInterest: data.areaOfInterest ?? null,
      skills: data.skills ?? [],
      socials: {
        instagram: data.instagram ?? "",
        tiktok: data.tiktok ?? "",
        x: data.x ?? "",
        facebook: data.facebook ?? "",
      },
      reason: data.reason ?? null,
      consent: true,
    },
  });

  if (session?.user?.id) {
    await notify(session.user.id, {
      type: "MEMBERSHIP",
      title: "Membership request received",
      body: "Thank you for joining LADIRE Growth Forum. We will be in touch soon.",
      link: "/dashboard",
    });
  }
  await logAudit({
    actorKind: session?.user ? "USER" : "SYSTEM",
    actorId: session?.user?.id,
    action: "MEMBER_APPLIED",
    entityType: "MEMBER",
    metadata: { email: data.email, phone: data.phone },
  });

  return {
    ok: true,
    message: "Thank you! Your membership request has been received.",
  };
}

/** Contact form (saved for admins). */
export async function submitContact(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const rl = rateLimit("contact", { limit: 4, windowSec: 600 });
  if (!rl.ok) return { ok: false, error: "Too many messages. Please try again later." };

  const parsed = contactSchema.safeParse({
    name: pickString(formData, "name"),
    email: pickString(formData, "email") || undefined,
    phone: pickString(formData, "phone") || null,
    subject: pickString(formData, "subject") || null,
    message: pickString(formData, "message"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your message." };
  }
  const data = parsed.data;

  await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject ?? null,
      message: data.message,
    },
  });
  return {
    ok: true,
    message: "Message sent. Thank you — we’ll get back to you soon.",
  };
}

/** Register interest to attend an event (logged-in user). */
export async function registerForEvent(
  eventId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const session = await getSession();
  if (!session?.user?.id)
    return { ok: false, error: "Please sign in to register for events." };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED")
    return { ok: false, error: "Event not found or not open." };
  if (!["REGISTRATION", "BOTH"].includes(event.participation))
    return { ok: false, error: "This event does not take registrations." };
  if (event.registrationDeadline && event.registrationDeadline < new Date())
    return { ok: false, error: "Registration for this event has closed." };

  const rl = rateLimit(`event-reg:${eventId}`, { limit: 5, windowSec: 600 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please try again later." };

  const parsed = eventRegistrationSchema.safeParse({
    name: pickString(formData, "name"),
    email: pickString(formData, "email") || undefined,
    phone: pickString(formData, "phone") || null,
    quantity: pickNumber(formData, "quantity") ?? 1,
    notes: pickString(formData, "notes") || null,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your details." };
  }
  const d = parsed.data;

  // capacity check (registration count)
  if (event.capacity != null) {
    const count = await prisma.eventRegistration.count({
      where: { eventId: event.id, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (count + d.quantity > event.capacity)
      return { ok: false, error: "Sorry, this event has reached capacity." };
  }

  const existing = await prisma.eventRegistration.findFirst({
    where: { eventId: event.id, userId: session.user.id },
  });
  if (existing)
    return { ok: false, error: "You already registered for this event." };

  const ref = generateRegistrationReference();
  const rec = await prisma.eventRegistration.create({
    data: {
      reference: ref,
      eventId: event.id,
      userId: session.user.id,
      name: d.name,
      email: d.email ?? session.user.email,
      phone: d.phone ?? null,
      quantity: d.quantity,
      notes: d.notes ?? null,
      status: "CONFIRMED",
    },
  });
  await notify(session.user.id, {
    type: "REGISTRATION_CONFIRMED",
    title: "Event registration received",
    body: `You registered for “${event.title}”. Reference ${ref}.`,
    link: "/dashboard/registrations",
  });
  void rec;
  return {
    ok: true,
    message: `Registration submitted. Reference: ${ref}`,
  };
}

/** Book a specific table/seat/option for an event (logged-in user). */
export async function bookEventOption(
  eventId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const session = await getSession();
  if (!session?.user?.id)
    return { ok: false, error: "Please sign in to make a booking." };

  const optionId = pickString(formData, "optionId");
  if (!optionId) return { ok: false, error: "Select a booking option." };
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { bookingOptions: true },
  });
  if (!event || event.status !== "PUBLISHED")
    return { ok: false, error: "Event not found or not open." };
  if (!["BOOKING", "BOTH"].includes(event.participation))
    return { ok: false, error: "Booking is not available for this event." };
  if (event.bookingDeadline && event.bookingDeadline < new Date())
    return { ok: false, error: "Booking for this event has closed." };

  const option = event.bookingOptions.find((o) => o.id === optionId);
  if (!option || !option.isAvailable)
    return { ok: false, error: "That option is not available." };

  const rl = rateLimit(`event-book:${eventId}`, { limit: 5, windowSec: 600 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please try again later." };

  const parsed = eventBookingSchema.safeParse({
    optionId,
    name: pickString(formData, "name"),
    email: pickString(formData, "email") || undefined,
    phone: pickString(formData, "phone") || null,
    quantity: pickNumber(formData, "quantity") ?? 1,
    notes: pickString(formData, "notes") || null,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your details." };
  }
  const d = parsed.data;

  // availability guard (option capacity)
  if (option.capacity != null) {
    const booked = await prisma.eventBooking.aggregate({
      where: { optionId: option.id, status: { in: ["PENDING", "CONFIRMED"] } },
      _sum: { quantity: true },
    });
    const sold = booked._sum.quantity ?? 0;
    if (sold + d.quantity > option.capacity)
      return { ok: false, error: "Not enough space for that quantity — try a smaller number." };
  }
  // price computed server-side
  const unit = option.priceInKobo ?? 0;
  const total = unit * d.quantity;

  const ref = generateBookingReference();
  const booking = await prisma.eventBooking.create({
    data: {
      reference: ref,
      eventId: event.id,
      optionId: option.id,
      userId: session.user.id,
      name: d.name,
      email: d.email ?? session.user.email,
      phone: d.phone ?? null,
      quantity: d.quantity,
      unitPriceKobo: option.priceInKobo,
      totalKobo: total,
      notes: d.notes ?? null,
      status: total > 0 ? "PENDING" : "CONFIRMED",
    },
  });
  await notify(session.user.id, {
    type: "BOOKING_CONFIRMED",
    title: "Booking received",
    body: `Booking ${ref} for “${option.title}” (${event.title}) received${total > 0 ? ". Follow the instructions to complete payment." : "."}`,
    link: "/dashboard/bookings",
  });
  void booking;
  return {
    ok: true,
    message:
      total > 0
        ? `Booking ${ref} submitted. We’ll contact you about payment for this reservation.`
        : `Booking ${ref} confirmed. See you there!`,
  };
}

/** Reserve a place in the Vacation/Holiday Programme (logged-in user). */
export async function bookVacationProgramme(
  programmeId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const session = await getSession();
  if (!session?.user?.id)
    return { ok: false, error: "Please sign in to reserve a place." };

  const programme = await prisma.vacationProgramme.findUnique({
    where: { id: programmeId },
  });
  if (!programme || !programme.isPublished)
    return { ok: false, error: "Programme not found." };
  if (!programme.bookingOpen)
    return { ok: false, error: "Booking for this programme is currently closed." };
  if (programme.bookingDeadline && programme.bookingDeadline < new Date())
    return { ok: false, error: "Booking for this programme has closed." };

  const rl = rateLimit(`vac-book:${programmeId}`, { limit: 5, windowSec: 600 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Try again later." };

  const parsed = vacationBookingSchema.safeParse({
    participantName: pickString(formData, "participantName"),
    participantAge: pickString(formData, "participantAge") || null,
    parentName: pickString(formData, "parentName"),
    parentPhone: pickString(formData, "parentPhone"),
    parentEmail: pickString(formData, "parentEmail") || undefined,
    quantity: pickNumber(formData, "quantity") ?? 1,
    notes: pickString(formData, "notes") || null,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check the booking details." };
  }
  const d = parsed.data;

  if (programme.capacity != null) {
    const count = await prisma.vacationBooking.aggregate({
      where: { programmeId, status: { in: ["PENDING", "CONFIRMED"] } },
      _sum: { quantity: true },
    });
    const filled = count._sum.quantity ?? 0;
    if (filled + d.quantity > programme.capacity)
      return { ok: false, error: "The programme is almost full — fewer places are available." };
  }

  const ref = generateVacationBookingReference();
  await prisma.vacationBooking.create({
    data: {
      reference: ref,
      programmeId,
      userId: session.user.id,
      participantName: d.participantName,
      participantAge: d.participantAge ?? null,
      parentName: d.parentName,
      parentPhone: d.parentPhone,
      parentEmail: d.parentEmail ?? null,
      quantity: d.quantity,
      notes: d.notes ?? null,
      status: "PENDING",
    },
  });
  await notify(session.user.id, {
    type: "BOOKING_CONFIRMED",
    title: "Vacation programme reservation received",
    body: `Reservation ${ref} for “${programme.title}” received. We’ll confirm shortly.`,
    link: "/dashboard/bookings",
  });
  return {
    ok: true,
    message: `Reservation ${ref} submitted. The LADIRE team will confirm shortly.`,
  };
}
