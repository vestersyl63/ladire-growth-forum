"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  submitMember,
  submitContact,
  type FormResult,
} from "@/app/actions/content-actions";

function Result({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      <span>{state.message}</span>
    </p>
  ) : (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" />
      <span>{state.error}</span>
    </p>
  );
}

export function MembershipForm() {
  const [state, formAction] = useActionState<FormResult | null, FormData>(submitMember, null);
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mem-name" className="lbl">Full name *</label>
          <input id="mem-name" name="fullName" required minLength={2} className="field" placeholder="e.g. Ada Obi" />
        </div>
        <div>
          <label htmlFor="mem-phone" className="lbl">Phone</label>
          <input id="mem-phone" name="phone" className="field" placeholder="0700 000 0000" inputMode="tel" />
        </div>
        <div>
          <label htmlFor="mem-email" className="lbl">Email</label>
          <input id="mem-email" name="email" type="email" className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="mem-dob" className="lbl">Date of birth (optional)</label>
          <input id="mem-dob" name="dob" type="date" className="field" />
        </div>
        <div>
          <label htmlFor="mem-city" className="lbl">Your city / area</label>
          <input id="mem-city" name="city" className="field" placeholder="e.g. Lagos" />
        </div>
        <div>
          <label htmlFor="mem-interest" className="lbl">Area of interest</label>
          <select id="mem-interest" name="areaOfInterest" className="field">
            <option value="">Select…</option>
            <option>Music & performance</option>
            <option>Art & design</option>
            <option>Fashion</option>
            <option>Film & media</option>
            <option>Content creation</option>
            <option>Events & community</option>
            <option>Skills & learning</option>
            <option>Business & entrepreneurship</option>
            <option>Just want to belong</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="mem-skills" className="lbl">Skills (comma separated)</label>
        <input id="mem-skills" name="skills" className="field" placeholder="singing, design, writing, photography…" />
      </div>

      <fieldset className="rounded-xl border border-navy-100 p-4">
        <legend className="px-1 text-sm font-bold text-navy-800">Social media (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mem-ig" className="lbl">Instagram</label>
            <input id="mem-ig" name="instagram" className="field" placeholder="@handle" />
          </div>
          <div>
            <label htmlFor="mem-tiktok" className="lbl">TikTok</label>
            <input id="mem-tiktok" name="tiktok" className="field" placeholder="@handle" />
          </div>
          <div>
            <label htmlFor="mem-x" className="lbl">X (Twitter)</label>
            <input id="mem-x" name="x" className="field" placeholder="@handle" />
          </div>
          <div>
            <label htmlFor="mem-fb" className="lbl">Facebook</label>
            <input id="mem-fb" name="facebook" className="field" placeholder="profile / page name" />
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="mem-reason" className="lbl">Why do you want to join LADIRE?</label>
        <textarea id="mem-reason" name="reason" rows={3} className="field" placeholder="Tell us what you’d love to do with the community…" />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/50 p-3.5 text-sm text-navy-700">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-crimson-600" />
        <span>
          I agree to be contacted by LADIRE Growth Forum about community activities and agree to
          the website{" "}
          <a href="/privacy" className="font-semibold underline">privacy policy</a> and{" "}
          <a href="/terms" className="font-semibold underline">terms of use</a>. *
        </span>
      </label>

      <Result state={state} />
      <SubmitButton className="btn-primary btn-lg w-full">Join LADIRE Growth Forum</SubmitButton>
      <p className="text-center text-xs text-navy-500">
        Membership is free. We never collect more personal data than we need.
      </p>
    </form>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<FormResult | null, FormData>(submitContact, null);
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-name" className="lbl">Your name *</label>
          <input id="ct-name" name="name" required minLength={2} className="field" placeholder="Your full name" />
        </div>
        <div>
          <label htmlFor="ct-email" className="lbl">Email</label>
          <input id="ct-email" name="email" type="email" className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="ct-phone" className="lbl">Phone</label>
          <input id="ct-phone" name="phone" className="field" placeholder="0700 000 0000" inputMode="tel" />
        </div>
        <div>
          <label htmlFor="ct-subject" className="lbl">Subject</label>
          <input id="ct-subject" name="subject" className="field" placeholder="What is this about?" />
        </div>
      </div>
      <div>
        <label htmlFor="ct-message" className="lbl">Message *</label>
        <textarea id="ct-message" name="message" required rows={5} className="field" placeholder="Write your message here…" />
      </div>
      <Result state={state} />
      <SubmitButton>Send message</SubmitButton>
    </form>
  );
}
