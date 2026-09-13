"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toLocalInputValue } from "@/lib/utils";
import type { AdminActionResult } from "@/app/actions/admin-content-actions";
import {
  createEvent,
  updateEvent,
  createCategory,
  updateCategory,
  createNominee,
  updateNominee,
  createAnnouncement,
  updateAnnouncement,
  createBanner,
  updateBanner,
  upsertVacationProgramme,
  updateAward,
} from "@/app/actions/admin-content-actions";

function Msg({ state }: { state: AdminActionResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> {state.message}
    </p>
  ) : (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" /> {state.error}
    </p>
  );
}

function ImageUpload({ id, label, currentUrl }: { id: string; label: string; currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div>
      <label htmlFor={id} className="lbl">{label}</label>
      <input
        id={id}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="field cursor-pointer py-2"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
      {(preview || currentUrl) ? (
        <div className="mt-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview || currentUrl || ""}
            alt="Upload preview"
            className="h-16 w-24 rounded-lg border border-navy-100 object-cover"
          />
          <span className="text-xs text-navy-400">{preview ? "New image selected" : "Current image"}</span>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------
// EVENT form
// ---------------------------------------------------------------

export function EventForm({
  initial,
}: {
  initial?: {
    id?: string;
    title?: string;
    summary?: string;
    description?: string;
    imageUrl?: string | null;
    category?: string;
    startsAt?: Date | null;
    endsAt?: Date | null;
    venue?: string | null;
    location?: string | null;
    capacity?: number | null;
    priceInKobo?: number | null;
    participation?: string;
    registrationDeadline?: Date | null;
    bookingType?: string | null;
    bookingDeadline?: Date | null;
    externalUrl?: string | null;
    instructions?: string | null;
    isFeatured?: boolean;
    status?: string;
  } | null;
}) {
  const action = initial?.id ? updateEvent.bind(null, initial.id) : createEvent;
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  const priceNaira = initial?.priceInKobo != null ? initial.priceInKobo / 100 : "";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-title" className="lbl">Event title *</label>
          <input id="ev-title" name="title" required minLength={3} defaultValue={initial?.title} className="field" />
        </div>
        <div>
          <label htmlFor="ev-cat" className="lbl">Category *</label>
          <select id="ev-cat" name="category" defaultValue={initial?.category ?? "OTHER"} className="field">
            {["AWARDS", "DAYTIME_HANGOUT", "VACATION_PROGRAMME", "WORKSHOP", "TRAINING", "COMMUNITY", "CULTURAL", "OTHER"].map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ev-sum" className="lbl">Short summary (card text)</label>
          <textarea id="ev-sum" name="summary" rows={2} defaultValue={initial?.summary ?? ""} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ev-desc" className="lbl">Full description</label>
          <textarea id="ev-desc" name="description" rows={6} defaultValue={initial?.description ?? ""} className="field" placeholder="Event details — keep each paragraph separated by a blank line." />
        </div>
        <ImageUpload id="ev-img" label="Event image" currentUrl={initial?.imageUrl} />
        <div>
          <label htmlFor="ev-featured" className="flex cursor-pointer items-center gap-3 pt-6 text-sm font-semibold text-navy-800">
            <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} className="h-4 w-4 accent-crimson-600" />
            Feature on homepage / events
          </label>
        </div>
        <div>
          <label htmlFor="ev-start" className="lbl">Starts *</label>
          <input id="ev-start" name="startsAt" type="datetime-local" required defaultValue={toLocalInputValue(initial?.startsAt)} className="field" />
        </div>
        <div>
          <label htmlFor="ev-end" className="lbl">Ends</label>
          <input id="ev-end" name="endsAt" type="datetime-local" defaultValue={toLocalInputValue(initial?.endsAt)} className="field" />
        </div>
        <div>
          <label htmlFor="ev-venue" className="lbl">Venue</label>
          <input id="ev-venue" name="venue" defaultValue={initial?.venue ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="ev-loc" className="lbl">Location / city</label>
          <input id="ev-loc" name="location" defaultValue={initial?.location ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="ev-cap" className="lbl">Capacity</label>
          <input id="ev-cap" name="capacity" type="number" min={1} defaultValue={initial?.capacity ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="ev-price" className="lbl">Price in ₦ (leave empty for free)</label>
          <input id="ev-price" name="price" type="number" min={0} step="0.01" defaultValue={priceNaira} className="field" />
        </div>
        <div>
          <label htmlFor="ev-part" className="lbl">Participation mode *</label>
          <select id="ev-part" name="participation" defaultValue={initial?.participation ?? "REGISTRATION"} className="field">
            <option value="NONE">Open event — no registration/booking</option>
            <option value="REGISTRATION">Registration only</option>
            <option value="BOOKING">Booking only (tables/seats/packages)</option>
            <option value="BOTH">Both registration & booking</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-status" className="lbl">Status *</label>
          <select id="ev-status" name="status" defaultValue={initial?.status ?? "DRAFT"} className="field">
            {["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ev-regdl" className="lbl">Registration closes</label>
          <input id="ev-regdl" name="registrationDeadline" type="datetime-local" defaultValue={toLocalInputValue(initial?.registrationDeadline)} className="field" />
        </div>
        <div>
          <label htmlFor="ev-bktype" className="lbl">Booking type</label>
          <select id="ev-bktype" name="bookingType" defaultValue={initial?.bookingType ?? ""} className="field">
            <option value="">—</option>
            <option value="SEAT">Seat</option>
            <option value="TABLE">Table</option>
            <option value="GENERAL">General registration</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-bkdl" className="lbl">Booking closes</label>
          <input id="ev-bkdl" name="bookingDeadline" type="datetime-local" defaultValue={toLocalInputValue(initial?.bookingDeadline)} className="field" />
        </div>
        <div>
          <label htmlFor="ev-url" className="lbl">External link</label>
          <input id="ev-url" name="externalUrl" type="url" defaultValue={initial?.externalUrl ?? ""} className="field" placeholder="https://…" />
        </div>
      </div>
      <div>
        <label htmlFor="ev-inst" className="lbl">Registration / payment instructions</label>
        <textarea id="ev-inst" name="instructions" rows={3} defaultValue={initial?.instructions ?? ""} className="field" />
      </div>
      <Msg state={state} />
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-md">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {initial?.id ? "Save event" : "Create event"}
        </button>
        {state?.ok ? (
          <button type="button" onClick={() => router.push("/admin/events")} className="btn btn-outline btn-md">
            Back to events
          </button>
        ) : null}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------
// AWARD form
// ---------------------------------------------------------------

export type AwardFormData = {
  id?: string;
  title?: string;
  tagline?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  venue?: string | null;
  eventStartsAt?: Date | null;
  eventEndsAt?: Date | null;
  votingOpensAt?: Date | null;
  votingClosesAt?: Date | null;
  pricePerVoteKobo?: number | null;
  minVotesPerTx?: number;
  maxVotesPerTx?: number;
  allowMultipleTx?: boolean;
  showPublicVoteCounts?: boolean;
  resultsStatus?: string;
  allowLateSubmissions?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
};

export function AwardForm({ initial }: { initial: AwardFormData }) {
  const action = updateAward.bind(null, initial.id!);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  const price = initial.pricePerVoteKobo != null ? initial.pricePerVoteKobo / 100 : "";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="aw-title" className="lbl">Award programme title</label>
          <input id="aw-title" name="title" defaultValue={initial.title} className="field" />
        </div>
        <div>
          <label htmlFor="aw-tag" className="lbl">Tagline / theme</label>
          <input id="aw-tag" name="tagline" defaultValue={initial.tagline ?? ""} className="field" placeholder="WHERE CULTURE MEETS DESIGN." />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="aw-desc" className="lbl">Description</label>
          <textarea id="aw-desc" name="description" rows={4} defaultValue={initial.description ?? ""} className="field" />
        </div>
        <ImageUpload id="aw-img" label="Award image" currentUrl={initial.imageUrl} />
        <div>
          <label htmlFor="aw-venue" className="lbl">Venue</label>
          <input id="aw-venue" name="venue" defaultValue={initial.venue ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="aw-ens" className="lbl">Awards night — start</label>
          <input id="aw-ens" name="eventStartsAt" type="datetime-local" defaultValue={toLocalInputValue(initial.eventStartsAt)} className="field" />
        </div>
        <div>
          <label htmlFor="aw-ene" className="lbl">Awards night — end</label>
          <input id="aw-ene" name="eventEndsAt" type="datetime-local" defaultValue={toLocalInputValue(initial.eventEndsAt)} className="field" />
        </div>
      </div>

      <fieldset className="rounded-2xl border border-navy-200 p-4">
        <legend className="px-1 text-sm font-bold text-navy-900">Voting configuration (server-enforced)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="aw-price" className="lbl">Default price per vote (₦) *</label>
            <input id="aw-price" name="pricePerVote" type="number" min={1} step="0.01" defaultValue={price} required className="field" />
          </div>
          <div>
            <label htmlFor="aw-min" className="lbl">Min votes per transaction</label>
            <input id="aw-min" name="minVotes" type="number" min={1} defaultValue={initial.minVotesPerTx ?? 1} className="field" />
          </div>
          <div>
            <label htmlFor="aw-max" className="lbl">Max votes per transaction</label>
            <input id="aw-max" name="maxVotes" type="number" min={1} defaultValue={initial.maxVotesPerTx ?? 500} className="field" />
          </div>
          <div>
            <label htmlFor="aw-vo" className="lbl">Voting opens</label>
            <input id="aw-vo" name="votingOpensAt" type="datetime-local" defaultValue={toLocalInputValue(initial.votingOpensAt)} className="field" />
          </div>
          <div>
            <label htmlFor="aw-vc" className="lbl">Voting closes (hard deadline)</label>
            <input id="aw-vc" name="votingClosesAt" type="datetime-local" defaultValue={toLocalInputValue(initial.votingClosesAt)} className="field" />
          </div>
          <div>
            <label htmlFor="aw-rs" className="lbl">Results status</label>
            <select id="aw-rs" name="resultsStatus" defaultValue={initial.resultsStatus ?? "HIDDEN"} className="field">
              <option value="HIDDEN">Hidden</option>
              <option value="LIVE">Live</option>
              <option value="FINAL">Final</option>
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-navy-800">
            <input type="checkbox" name="allowMultipleTx" defaultChecked={initial.allowMultipleTx} className="h-4 w-4 accent-crimson-600" />
            Allow multiple transactions per voter
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-navy-800">
            <input type="checkbox" name="showPublicVoteCounts" defaultChecked={initial.showPublicVoteCounts} className="h-4 w-4 accent-crimson-600" />
            Show public vote counts
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-navy-800">
            <input type="checkbox" name="allowLateSubmissions" defaultChecked={initial.allowLateSubmissions} className="h-4 w-4 accent-crimson-600" />
            Allow late submissions after deadline (advanced)
          </label>
        </div>
      </fieldset>

      <div className="flex gap-5">
        <label className="flex items-center gap-3 text-sm font-semibold text-navy-800">
          <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} className="h-4 w-4 accent-crimson-600" /> Published
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-navy-800">
          <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="h-4 w-4 accent-crimson-600" /> Active (served as current awards programme)
        </label>
      </div>

      <Msg state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-md">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} Save award settings
      </button>
    </form>
  );
}

// ---------------------------------------------------------------
// CATEGORY inline create
// ---------------------------------------------------------------

export function CategoryCreate({ awardId }: { awardId: string }) {
  const action = createCategory.bind(null, awardId);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="rounded-xl border border-navy-200 bg-navy-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="cat-name" className="lbl">New category name</label>
          <input id="cat-name" name="name" required className="field" placeholder="e.g. Best Emerging Artiste" />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 pb-2">
            <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4 accent-crimson-600" /> Publish
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 pb-2">
            <input type="checkbox" name="isVotingEnabled" defaultChecked className="h-4 w-4 accent-crimson-600" /> Voting
          </label>
          <button type="submit" disabled={pending} className="btn btn-navy btn-md">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add
          </button>
        </div>
      </div>
      <Msg state={state} />
    </form>
  );
}

export function CategoryEdit({
  initial,
}: {
  initial: {
    id: string;
    name: string;
    description: string | null;
    isPublished: boolean;
    isVotingEnabled: boolean;
    pricePerVoteKobo: number | null;
    votingOpensAt: Date | null;
    votingClosesAt: Date | null;
    nomineeLimit: number | null;
  };
}) {
  const action = updateCategory.bind(null, initial.id);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`c-${initial.id}`} className="lbl">Category name</label>
          <input id={`c-${initial.id}`} name="name" defaultValue={initial.name} required className="field" />
        </div>
        <div>
          <label htmlFor={`c-d-${initial.id}`} className="lbl">Description</label>
          <input id={`c-d-${initial.id}`} name="description" defaultValue={initial.description ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor={`c-p-${initial.id}`} className="lbl">Price per vote (₦) — leave empty to inherit award price</label>
          <input
            id={`c-p-${initial.id}`}
            name="pricePerVote"
            type="number"
            min={1}
            step="0.01"
            defaultValue={initial.pricePerVoteKobo != null ? initial.pricePerVoteKobo / 100 : ""}
            className="field"
          />
        </div>
        <div>
          <label htmlFor={`c-l-${initial.id}`} className="lbl">Nominee limit (optional)</label>
          <input id={`c-l-${initial.id}`} name="nomineeLimit" type="number" min={1} defaultValue={initial.nomineeLimit ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor={`c-o-${initial.id}`} className="lbl">Voting opens (category override)</label>
          <input id={`c-o-${initial.id}`} name="votingOpensAt" type="datetime-local" defaultValue={toLocalInputValue(initial.votingOpensAt)} className="field" />
        </div>
        <div>
          <label htmlFor={`c-x-${initial.id}`} className="lbl">Voting closes (category override)</label>
          <input id={`c-x-${initial.id}`} name="votingClosesAt" type="datetime-local" defaultValue={toLocalInputValue(initial.votingClosesAt)} className="field" />
        </div>
        <div className="flex flex-wrap gap-5 pt-2 text-sm font-semibold text-navy-800">
          <label className="flex items-center gap-2"><input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} className="h-4 w-4 accent-crimson-600" /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isVotingEnabled" defaultChecked={initial.isVotingEnabled} className="h-4 w-4 accent-crimson-600" /> Voting enabled</label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-outline btn-sm">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save category
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------
// NOMINEE form
// ---------------------------------------------------------------

export type NomineeFormData = {
  id?: string;
  name?: string;
  stageName?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  isPublished?: boolean;
  isFeatured?: boolean;
  socials?: { instagram?: string; tiktok?: string; x?: string; facebook?: string; youtube?: string } | null;
};

export function NomineeForm({ categoryId, initial }: { categoryId: string; initial?: NomineeFormData }) {
  const action = initial?.id ? updateNominee.bind(null, initial.id) : createNominee.bind(null, categoryId);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  const socials = initial?.socials ?? {};
  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nm-name" className="lbl">Real name *</label>
          <input id="nm-name" name="name" required minLength={2} defaultValue={initial?.name} className="field" />
        </div>
        <div>
          <label htmlFor="nm-stage" className="lbl">Stage name / display name</label>
          <input id="nm-stage" name="stageName" defaultValue={initial?.stageName ?? ""} className="field" placeholder="e.g. DJ Zee" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="nm-bio" className="lbl">Biography / short description</label>
          <textarea id="nm-bio" name="bio" rows={4} defaultValue={initial?.bio ?? ""} className="field" />
        </div>
        <ImageUpload id="nm-img" label="Nominee photo" currentUrl={initial?.imageUrl} />
        <div className="grid grid-cols-2 gap-4 content-start">
          <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-navy-800">
            <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished} className="h-4 w-4 accent-crimson-600" /> Published
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-navy-800">
            <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} className="h-4 w-4 accent-flame-600" /> Featured
          </label>
        </div>
      </div>
      <fieldset className="rounded-2xl border border-navy-100 p-4">
        <legend className="px-1 text-sm font-bold text-navy-800">Social links (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="instagram" placeholder="Instagram @handle" defaultValue={socials.instagram} className="field" />
          <input name="tiktok" placeholder="TikTok @handle" defaultValue={socials.tiktok} className="field" />
          <input name="x" placeholder="X / Twitter @handle" defaultValue={socials.x} className="field" />
          <input name="facebook" placeholder="Facebook page" defaultValue={socials.facebook} className="field" />
          <input name="youtube" placeholder="YouTube channel" defaultValue={socials.youtube} className="field" />
        </div>
      </fieldset>
      <Msg state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-md">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {initial?.id ? "Save nominee" : "Create nominee"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------
// ANNOUNCEMENT form
// ---------------------------------------------------------------

export function AnnouncementForm({
  initial,
}: {
  initial?: {
    id?: string;
    title?: string;
    excerpt?: string | null;
    content?: string | null;
    imageUrl?: string | null;
    authorName?: string | null;
    isPinned?: boolean;
    status?: string;
  } | null;
}) {
  const action = initial?.id ? updateAnnouncement.bind(null, initial.id) : createAnnouncement;
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="an-title" className="lbl">Title *</label>
        <input id="an-title" name="title" required minLength={3} defaultValue={initial?.title} className="field" />
      </div>
      <div>
        <label htmlFor="an-ex" className="lbl">Excerpt (card preview)</label>
        <textarea id="an-ex" name="excerpt" rows={2} defaultValue={initial?.excerpt ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="an-body" className="lbl">Content (paragraphs separated by blank lines)</label>
        <textarea id="an-body" name="content" rows={10} defaultValue={initial?.content ?? ""} className="field" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload id="an-img" label="Featured image" currentUrl={initial?.imageUrl} />
        <div>
          <label htmlFor="an-author" className="lbl">Author name</label>
          <input id="an-author" name="author" defaultValue={initial?.authorName ?? ""} className="field" />
        </div>
      </div>
      <div className="flex gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-800">
          <input type="checkbox" name="isPinned" defaultChecked={initial?.isPinned} className="h-4 w-4 accent-crimson-600" /> Pin to top
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-800">
          <input type="checkbox" name="status" value="PUBLISHED" defaultChecked={initial?.status === "PUBLISHED" || !initial} className="h-4 w-4 accent-crimson-600" />
          Publish immediately
        </label>
        <input type="hidden" name="status" value={initial?.status === "DRAFT" ? "DRAFT" : "PUBLISHED"} />
      </div>
      <Msg state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-md">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {initial?.id ? "Save announcement" : "Create announcement"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------
// BANNER form
// ---------------------------------------------------------------

export function BannerForm({
  initial,
}: {
  initial?: {
    id?: string;
    title?: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    startAt?: Date | null;
    endAt?: Date | null;
    priority?: number;
    isActive?: boolean;
  } | null;
}) {
  const action = initial?.id ? updateBanner.bind(null, initial.id) : createBanner;
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bn-title" className="lbl">Hero title *</label>
          <input id="bn-title" name="title" required defaultValue={initial?.title} className="field" />
        </div>
        <div>
          <label htmlFor="bn-priority" className="lbl">Priority (higher first)</label>
          <input id="bn-priority" name="priority" type="number" defaultValue={initial?.priority ?? 0} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bn-sub" className="lbl">Subtitle</label>
          <textarea id="bn-sub" name="subtitle" rows={2} defaultValue={initial?.subtitle ?? ""} className="field" />
        </div>
        <ImageUpload id="bn-img" label="Hero background image" currentUrl={initial?.imageUrl} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bn-cta" className="lbl">Button text</label>
            <input id="bn-cta" name="ctaLabel" defaultValue={initial?.ctaLabel ?? ""} className="field" />
          </div>
          <div>
            <label htmlFor="bn-cta-href" className="lbl">Button link</label>
            <input id="bn-cta-href" name="ctaHref" defaultValue={initial?.ctaHref ?? ""} className="field" placeholder="/vote" />
          </div>
          <div>
            <label htmlFor="bn-start" className="lbl">Show from</label>
            <input id="bn-start" name="startAt" type="datetime-local" defaultValue={toLocalInputValue(initial?.startAt)} className="field" />
          </div>
          <div>
            <label htmlFor="bn-end" className="lbl">Show until</label>
            <input id="bn-end" name="endAt" type="datetime-local" defaultValue={toLocalInputValue(initial?.endAt)} className="field" />
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-navy-800">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="h-4 w-4 accent-crimson-600" /> Active
      </label>
      <Msg state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-md">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {initial?.id ? "Save banner" : "Create banner"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------
// VACATION PROGRAMME form
// ---------------------------------------------------------------

export type VacationFormData = {
  id?: string;
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  ageRange?: string | null;
  requirements?: string | null;
  activities?: string[];
  venue?: string | null;
  location?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  priceInKobo?: number | null;
  capacity?: number | null;
  bookingOpen?: boolean;
  bookingDeadline?: Date | null;
  isPublished?: boolean;
  isFeatured?: boolean;
};

export function VacationForm({ initial }: { initial?: VacationFormData | null }) {
  const action = upsertVacationProgramme.bind(null, initial?.id ?? null);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="vp-title" className="lbl">Programme title *</label>
          <input id="vp-title" name="title" required defaultValue={initial?.title} className="field" />
        </div>
        <div>
          <label htmlFor="vp-age" className="lbl">Age range</label>
          <input id="vp-age" name="ageRange" defaultValue={initial?.ageRange ?? ""} className="field" placeholder="8 – 16 years" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="vp-desc" className="lbl">Description</label>
          <textarea id="vp-desc" name="description" rows={4} defaultValue={initial?.description ?? ""} className="field" />
        </div>
        <ImageUpload id="vp-img" label="Programme image" currentUrl={initial?.imageUrl} />
        <div>
          <label htmlFor="vp-ven" className="lbl">Venue / location</label>
          <input id="vp-ven" name="venue" defaultValue={initial?.venue ?? ""} className="field" />
          <input name="location" defaultValue={initial?.location ?? ""} className="field mt-2" placeholder="City / area" />
        </div>
        <div>
          <label htmlFor="vp-s" className="lbl">Starts *</label>
          <input id="vp-s" name="startsAt" type="datetime-local" required defaultValue={toLocalInputValue(initial?.startsAt)} className="field" />
        </div>
        <div>
          <label htmlFor="vp-e" className="lbl">Ends</label>
          <input id="vp-e" name="endsAt" type="datetime-local" defaultValue={toLocalInputValue(initial?.endsAt)} className="field" />
        </div>
        <div>
          <label htmlFor="vp-price" className="lbl">Price in ₦ (empty = free)</label>
          <input id="vp-price" name="price" type="number" min={0} step="0.01" defaultValue={initial?.priceInKobo != null ? initial.priceInKobo / 100 : ""} className="field" />
        </div>
        <div>
          <label htmlFor="vp-cap" className="lbl">Capacity (places)</label>
          <input id="vp-cap" name="capacity" type="number" min={1} defaultValue={initial?.capacity ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="vp-dl" className="lbl">Booking deadline</label>
          <input id="vp-dl" name="bookingDeadline" type="datetime-local" defaultValue={toLocalInputValue(initial?.bookingDeadline)} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="vp-act" className="lbl">Activities (one per line)</label>
        <textarea id="vp-act" name="activities" rows={5} defaultValue={(initial?.activities ?? []).join("\n")} className="field" placeholder={"Music & dance\nArt & craft\nGames"} />
      </div>
      <div>
        <label htmlFor="vp-req" className="lbl">Requirements / what to bring</label>
        <textarea id="vp-req" name="requirements" rows={3} defaultValue={initial?.requirements ?? ""} className="field" />
      </div>
      <div className="flex flex-wrap gap-5 text-sm font-semibold text-navy-800">
        <label className="flex items-center gap-2"><input type="checkbox" name="bookingOpen" defaultChecked={initial?.bookingOpen} className="h-4 w-4 accent-crimson-600" /> Booking open</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished} className="h-4 w-4 accent-crimson-600" /> Published</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} className="h-4 w-4 accent-flame-600" /> Featured</label>
      </div>
      <Msg state={state} />
      <button type="submit" disabled={pending} className="btn btn-olive btn-md">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {initial?.id ? "Save programme" : "Create programme"}
      </button>
    </form>
  );
}

// re-export Image for conveniences if used by parent pages
