import { z } from "zod";

// ------------------------------------------------------------
// Shared server-side validations. Server actions must re-validate;
// client-only validation is never trusted.
// ------------------------------------------------------------

export const emailSchema = z.string().trim().toLowerCase().email().max(190).nullable().optional();

const NG_PHONE_RE = /^(\+?234|0)[789][01]\d{8}$/; // Nigerian mobile (070/071/080/081/090/091...)
export const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(18)
  .refine((v) => /^[+\d\s()-]+$/.test(v), "Enter a valid phone number");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(190),
  password: z.string().min(1).max(100),
});

export const memberSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: phoneSchema.optional().nullable(),
  dob: z.string().optional().nullable(), // ISO date
  city: z.string().trim().max(120).optional().nullable(),
  areaOfInterest: z.string().trim().max(120).optional().nullable(),
  skills: z.array(z.string().trim().max(80)).max(15).optional(),
  instagram: z.string().trim().max(120).optional().nullable(),
  tiktok: z.string().trim().max(120).optional().nullable(),
  x: z.string().trim().max(120).optional().nullable(),
  facebook: z.string().trim().max(120).optional().nullable(),
  reason: z.string().trim().max(3000).optional().nullable(),
  consent: z.literal(true, { error: "You must agree to the terms to join." }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(30).optional().nullable(),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(5).max(5000),
});

export const voteOrderCreateSchema = z.object({
  nomineeId: z.string().min(1),
  quantity: z.number().int().min(1).max(10000),
});

export const receiptSubmitSchema = z.object({
  amountPaid: z
    .string()
    .transform((v) => Number(v))
    .refine((n) => Number.isFinite(n) && n > 0, "Enter the amount you paid in naira"),
  bankName: z.string().trim().min(2).max(120),
  transactionDate: z.string().min(1, "Enter the date of transfer"),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const eventRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().min(7).max(30).optional().nullable(),
  quantity: z.number().int().min(1).max(20).default(1),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const eventBookingSchema = z.object({
  optionId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().min(7).max(30).optional().nullable(),
  quantity: z.number().int().min(1).max(50).default(1),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const vacationBookingSchema = z.object({
  participantName: z.string().trim().min(2).max(120),
  participantAge: z.string().trim().max(40).optional().nullable(),
  parentName: z.string().trim().min(2).max(120),
  parentPhone: z.string().trim().min(7).max(30),
  parentEmail: emailSchema,
  quantity: z.number().int().min(1).max(20).default(1),
  notes: z.string().trim().max(2000).optional().nullable(),
});
