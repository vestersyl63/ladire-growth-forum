import type { Metadata } from "next";
import { MapPin, Mail } from "lucide-react";

import { ContactForm } from "@/components/forms/public-forms";
import { getPublicSiteSettings } from "@/lib/site";
import {
  PhoneIcon,
  WhatsAppChatLink,
  WhatsAppIcon,
} from "@/components/brand/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact LADIRE Growth Forum",
  description:
    "Contact LADIRE Growth Forum — phone, email, WhatsApp and a contact form for enquiries, support and partnerships.",
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <>
      <section className="bg-navy-950 py-12 text-white sm:py-16">
        <div className="container-x max-w-5xl">
          <p className="eyebrow !text-flame-300">Contact us</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Talk to LADIRE</h1>
          <p className="mt-4 max-w-2xl text-white/75">
            Questions about membership, events, programmes or your awards payment? Reach us any way
            you like.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Info */}
          <div>
            <h2 className="section-title">Our details</h2>

            <div className="mt-6 space-y-4">
              <div className="card p-5">
                <h3 className="font-display font-extrabold text-navy-950">Phone</h3>
                <ul className="mt-2 space-y-2">
                  {settings.phones.map((p) => (
                    <li key={p}>
                      <a
                        href={`tel:${p.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-2.5 font-semibold text-navy-800 hover:text-crimson-600"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
                          <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {p}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-5">
                <h3 className="font-display font-extrabold text-navy-950">Email</h3>
                <ul className="mt-3 space-y-2.5">
                  {settings.emails.map((e) => (
                    <li key={e}>
                      <a
                        href={`mailto:${e}`}
                        className="inline-flex items-center gap-2.5 break-all font-semibold text-navy-800 hover:text-crimson-600"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
                          <Mail className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {e}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-5">
                <h3 className="font-display font-extrabold text-navy-950">WhatsApp</h3>
                <p className="mt-1.5 text-sm text-navy-600">
                  Fastest for payment/voting support.
                </p>
                {settings.whatsapp ? (
                  <WhatsAppChatLink
                    number={settings.whatsapp}
                    className="btn btn-whatsapp btn-md mt-3"
                  />
                ) : null}
                {settings.whatsappSupport && settings.whatsappSupport !== settings.whatsapp ? (
                  <WhatsAppChatLink
                    number={settings.whatsappSupport}
                    className="btn btn-outline btn-md mt-2"
                  />
                ) : null}
              </div>

              {settings.address ? (
                <div className="card flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Location</p>
                    <p className="font-semibold text-navy-900">{settings.address}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Form */}
          <div className="card self-start p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold text-navy-950">Send a message</h2>
            <p className="mb-6 mt-1 text-sm text-navy-500">
              We read every message and reply as soon as we can.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Support section */}
      <section className="section bg-navy-50/60">
        <div className="container-x max-w-4xl">
          <h2 className="section-title text-center">Voting & payment support</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-navy-600">
            Having trouble with your payment? Here’s what to do:
          </p>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "Payment submitted but not yet verified?",
                a: "Verification is done by LADIRE administrators. If it has been more than 24 hours, send us your payment reference on WhatsApp or email and we’ll check it.",
              },
              {
                q: "Uploaded the wrong receipt?",
                a: "If your payment has not been approved yet, upload a corrected receipt from your dashboard — the original is kept for our records.",
              },
              {
                q: "Need help registering or booking?",
                a: "Call or message us — we’re happy to help you sign up, register for an event or reserve a programme place.",
              },
            ].map((f) => (
              <details key={f.q} className="card">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-display font-bold text-navy-950">
                  {f.q}
                  <span className="shrink-0 text-crimson-600">＋</span>
                </summary>
                <div className="border-t border-navy-100 px-5 py-4">
                  <p className="text-sm leading-relaxed text-navy-700">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {settings.whatsapp ? (
              <WhatsAppChatLink number={settings.whatsapp} className="btn btn-whatsapp btn-lg" />
            ) : null}
            {settings.emails[0] ? (
              <a href={`mailto:${settings.emails[0]}`} className="btn btn-outline btn-lg">
                <Mail className="h-4 w-4" aria-hidden="true" /> Email us
              </a>
            ) : null}
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-navy-500">
            <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            WhatsApp is a chat channel — official payment verification is always done by LADIRE staff.
          </p>
        </div>
      </section>
    </>
  );
}
