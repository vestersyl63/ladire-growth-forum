import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Megaphone, User } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate, toParagraphs } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.announcement.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  const paragraphs = toParagraphs(post.content);
  const more = await prisma.announcement.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <>
      <section className="border-b border-navy-100 bg-navy-950 py-10 text-white">
        <div className="container-x max-w-3xl">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All announcements
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
            {post.publishedAt ? (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> {fmtDate(post.publishedAt, "EEEE, d MMMM yyyy")}
              </span>
            ) : null}
            {post.authorName ? (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden="true" /> {post.authorName}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <article className="section bg-white">
        <div className="container-x max-w-3xl">
          {post.imageUrl ? (
            <div className="relative mb-8 aspect-[16/8] overflow-hidden rounded-2xl">
              <Image src={post.imageUrl} alt="" fill sizes="100vw" className="object-cover" />
            </div>
          ) : null}
          {paragraphs.length ? (
            <div className="prose-sm text-[16px] leading-8">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : post.excerpt ? (
            <p className="text-navy-700">{post.excerpt}</p>
          ) : null}
          <p className="mt-8 flex items-center gap-2 text-xs text-navy-400">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            Published by {post.authorName || "LADIRE Growth Forum"}
          </p>
        </div>
      </article>

      {more.length ? (
        <section className="border-t border-navy-100 bg-navy-50/60 py-12">
          <div className="container-x">
            <h2 className="font-display text-xl font-extrabold text-navy-950">More announcements</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {more.map((a) => (
                <Link key={a.id} href={`/news/${a.slug}`} className="card card-hover p-4">
                  <p className="text-xs font-semibold text-navy-400">{fmtDate(a.publishedAt)}</p>
                  <h3 className="mt-1 font-display font-bold leading-snug text-navy-950">{a.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.announcement.findUnique({ where: { slug } });
  if (!post) return { title: "Announcement" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}
