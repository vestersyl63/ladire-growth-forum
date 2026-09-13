import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Megaphone, Pin } from "lucide-react";

import { getPublishedAnnouncements } from "@/lib/site";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & Announcements",
  description:
    "News, announcements and updates from LADIRE Growth Forum — events, programmes, the awards and the community.",
};

export default async function NewsPage() {
  const posts = await getPublishedAnnouncements(50);
  const [first, ...rest] = posts;

  return (
    <>
      <section className="bg-navy-950 py-12 text-white sm:py-16">
        <div className="container-x">
          <p className="eyebrow !text-flame-300">Newsroom</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Announcements & News
          </h1>
          <p className="mt-4 max-w-2xl text-white/75">
            Official updates from LADIRE Growth Forum.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          {posts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/50 p-12 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-extrabold text-navy-900">
                There are no announcements currently
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
                Announcements and news will be published here by the LADIRE team.
              </p>
            </div>
          ) : (
            <>
              {/* Featured / pinned first post */}
              {first ? (
                <Link
                  href={`/news/${first.slug}`}
                  className="card card-hover group grid overflow-hidden md:grid-cols-2"
                >
                  <div className="relative h-60 bg-navy-100 md:h-full">
                    {first.imageUrl ? (
                      <Image
                        src={first.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 640px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 via-navy-900 to-crimson-950">
                        <Megaphone className="h-12 w-12 text-white/25" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-crimson-600">
                      {first.isPinned ? <Pin className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                      {fmtDate(first.publishedAt, "d MMM yyyy")}
                      {first.isPinned ? <span className="chip bg-crimson-100 text-crimson-700">Pinned</span> : null}
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-navy-950 group-hover:text-crimson-700">
                      {first.title}
                    </h2>
                    {first.excerpt ? (
                      <p className="mt-3 line-clamp-3 text-navy-600">{first.excerpt}</p>
                    ) : null}
                    <span className="mt-5 inline-flex items-center gap-1 font-bold text-crimson-600">
                      Read announcement →
                    </span>
                  </div>
                </Link>
              ) : null}

              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <Link key={a.id} href={`/news/${a.slug}`} className="card card-hover group flex flex-col overflow-hidden">
                    <div className="relative h-40 bg-navy-100">
                      {a.imageUrl ? (
                        <Image src={a.imageUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 to-navy-900">
                          <Megaphone className="h-8 w-8 text-white/20" aria-hidden="true" />
                        </div>
                      )}
                      {a.isPinned ? (
                        <span className="chip absolute left-3 top-3 bg-white/95 text-crimson-700">
                          <Pin className="h-3 w-3" aria-hidden="true" /> Pinned
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                        {fmtDate(a.publishedAt, "d MMM yyyy")}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-navy-950 group-hover:text-crimson-700">
                        {a.title}
                      </h3>
                      {a.excerpt ? (
                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-navy-600">{a.excerpt}</p>
                      ) : null}
                      <span className="mt-4 text-sm font-bold text-crimson-600">Read →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
