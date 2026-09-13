"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, BarChart3, Search } from "lucide-react";

import type { WizardCategory, WizardNominee } from "./vote-wizard";
import {
  CategoryTabs,
  NomineeVoteCard,
  VoteModal,
  LoginPrompt,
} from "./vote-wizard";

export type WizardBank = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  whatsapp: string;
};

type ExplorerNominee = {
  id: string;
  name: string;
  stageName: string | null;
  bio: string | null;
  imageUrl: string | null;
  officialVotes: number;
  categoryId: string;
  isFeatured: boolean;
};

export function VoteExplorer({
  categories,
  nomineesMap,
  showCounts,
  signedIn,
  bank,
  preselectCategory,
  resultsPublic,
  resultsFinal,
}: {
  categories: WizardCategory[];
  nomineesMap: Record<string, ExplorerNominee[]>;
  showCounts: boolean;
  signedIn: boolean;
  bank: WizardBank;
  preselectCategory: string | null;
  resultsPublic: boolean;
  resultsFinal: boolean;
}) {
  const allNominees: WizardNominee[] = useMemo(
    () =>
      Object.entries(nomineesMap)
        .flatMap(([catId, list]) =>
          list.map((n) => ({ ...n, categoryId: catId }))
        )
        .sort((a, b) => Number(b.isFeatured ?? 0) - Number(a.isFeatured ?? 0)),
    [nomineesMap]
  );

  const [activeCat, setActiveCat] = useState<string | null>(preselectCategory);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<WizardNominee | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const filtered = useMemo(() => {
    let list = activeCat ? nomineesMap[activeCat] ?? [] : allNominees;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) => n.name.toLowerCase().includes(q) || (n.stageName ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCat, query, nomineesMap, allNominees]);

  const catOf = (id: string) => categories.find((c) => c.id === id);

  // Results view: ranked by official votes (approved only) when released
  const showResults = resultsPublic && allNominees.length > 0;

  if (showResults) {
    const ranked = [...allNominees].sort((a, b) => b.officialVotes - a.officialVotes);
    const top = ranked.filter((n) => n.officialVotes > 0);
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-300 bg-gold-400/10 px-5 py-4">
          <p className="flex items-center gap-2 font-display font-extrabold text-navy-950">
            <BarChart3 className="h-5 w-5 text-gold-500" aria-hidden="true" />
            {resultsFinal ? "Final results" : "Live results"} — based on verified votes only
          </p>
          {!resultsFinal ? (
            <Link href="/vote" className="btn btn-outline btn-sm">Back to voting</Link>
          ) : null}
        </div>

        {top.length ? (
          <div className="mt-6 space-y-4">
            {top.map((n, i) => {
              const cat = catOf(n.categoryId);
              const winner = resultsFinal && i === 0;
              return (
                <div
                  key={n.id}
                  className="card flex items-center gap-4 p-4"
                >
                  <span
                    className={
                      winner
                        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400 font-display text-base font-extrabold text-navy-950"
                        : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-base font-extrabold text-navy-800"
                    }
                  >
                    {winner ? <Trophy className="h-5 w-5" aria-hidden="true" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-extrabold text-navy-950">
                      {n.stageName || n.name}
                    </p>
                    <p className="text-xs font-semibold text-navy-500">{cat?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-extrabold text-crimson-600">
                      {n.officialVotes.toLocaleString()}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-navy-400">
                      verified votes
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-navy-200 p-10 text-center">
            <Trophy className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
            <p className="mt-3 font-semibold text-navy-700">Results will appear here once votes are verified.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <CategoryTabs
        categories={categories.map((c) => ({ id: c.id, name: c.name, count: c.count ?? 0 }))}
        active={activeCat}
        onChange={setActiveCat}
      />

      <div className="mt-6 max-w-md">
        <label htmlFor="nominee-search" className="sr-only">Search nominees</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          <input
            id="nominee-search"
            type="search"
            placeholder="Search nominees…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field pl-10"
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-navy-200 bg-white p-10 text-center">
          <p className="font-semibold text-navy-700">No categories have been published yet.</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((n) => {
            const cat = catOf(n.categoryId) as WizardCategory;
            return (
              <NomineeVoteCard
                key={n.id}
                nominee={n}
                category={cat}
                showCounts={showCounts}
                signedIn={signedIn}
                onVote={() => {
                  if (!signedIn) {
                    setShowLogin(true);
                    return;
                  }
                  if (cat.open) setSelected(n);
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-navy-200 bg-white p-10 text-center">
          <Search className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
          <p className="mt-3 font-semibold text-navy-700">
            No nominees match your search. Try a different name or category.
          </p>
        </div>
      )}

      {selected && (
        <VoteModal
          nominee={selected}
          category={catOf(selected.categoryId) as WizardCategory}
          bank={bank}
          onClose={() => setSelected(null)}
        />
      )}
      {showLogin ? <LoginPrompt onClose={() => setShowLogin(false)} /> : null}
    </div>
  );
}
