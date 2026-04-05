import type React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

// ─── Constants ───────────────────────────────────────────────────────────────

const NEAR_BLACK = '#0D0D0D'
const ACID = '#C8F000'

const TICKER_TEXT =
  'REAL EARS \u2666 HONEST FEEDBACK \u2666 TASTE NOT TRANSACTIONS \u2666 INFLUENCE IS EARNED \u2666 REAL EARS \u2666 HONEST FEEDBACK \u2666 TASTE NOT TRANSACTIONS \u2666 INFLUENCE IS EARNED \u2666 '

const FOOTER_TICKER =
  'INFLUENCE IS NOT FOR SALE \u00B7 GREATNESS EARNS IT \u00B7 \u2666 INFLUENCE IS NOT FOR SALE \u00B7 GREATNESS EARNS IT \u00B7 \u2666 INFLUENCE IS NOT FOR SALE \u00B7 GREATNESS EARNS IT \u00B7 \u2666 '

// Outlined text via text-shadow — cross-browser reliable, no -webkit-text-stroke
const OUTLINE_STYLE: React.CSSProperties = {
  color: ACID,
  textShadow: `-3px -3px 0 ${NEAR_BLACK}, 3px -3px 0 ${NEAR_BLACK}, -3px 3px 0 ${NEAR_BLACK}, 3px 3px 0 ${NEAR_BLACK}`,
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

function Marquee({
  text,
  bgClass,
  textClass,
  speed = 'normal',
}: {
  text: string
  bgClass: string
  textClass: string
  speed?: 'normal' | 'slow'
}) {
  return (
    <div className={`overflow-hidden ${bgClass} py-3`}>
      <div className={`flex whitespace-nowrap ${speed === 'slow' ? 'animate-marquee-slow' : 'animate-marquee'}`}>
        <span className={`px-6 text-xs font-bold uppercase tracking-[0.22em] ${textClass}`}>{text}</span>
        <span aria-hidden className={`px-6 text-xs font-bold uppercase tracking-[0.22em] ${textClass}`}>{text}</span>
      </div>
    </div>
  )
}

// ─── Sparkle ─────────────────────────────────────────────────────────────────

function Sparkle({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true" className={className} style={style}>
      <path d="M20 0 C20 0 21.5 14 26 18 C30 22 40 20 40 20 C40 20 30 21.5 26 26 C22 30 20 40 20 40 C20 40 18.5 30 14 26 C10 22 0 20 0 20 C0 20 10 18.5 14 14 C18 10 20 0 20 0Z" />
    </svg>
  )
}

// ─── Feature cards ───────────────────────────────────────────────────────────

const featureCards = [
  {
    eyebrow: 'Real Listen',
    headline: 'Human ears. Every time.',
    body: 'Not an algorithm. Not a bot. A real person in your genre who actually cares.',
    bg: 'bg-hp',
    eyebrowClass: 'text-black/50',
    headlineClass: 'text-white',
    bodyClass: 'text-white/70',
  },
  {
    eyebrow: 'Curator Feedback',
    headline: 'Their take.\nUnfiltered.',
    body: 'Straight from the curator. What they heard. What they felt. What it means for your music.',
    bg: 'bg-[#0A0A0A]',
    eyebrowClass: 'text-white/40',
    headlineClass: 'text-hp',
    bodyClass: 'text-white/50',
  },
  {
    eyebrow: 'Placement',
    headline: 'Earned.\nNever bought.',
    body: 'Reputation on the line. Their name on it. Their call alone.',
    bg: 'bg-cobalt',
    eyebrowClass: 'text-white/50',
    headlineClass: 'text-white',
    bodyClass: 'text-white/70',
  },
  {
    eyebrow: 'Curator Ratings',
    headline: 'Every curator rated.',
    body: 'Artists rate every session. Only the best curators stay on the platform.',
    bg: 'bg-acid',
    eyebrowClass: 'text-black/40',
    headlineClass: 'text-black',
    bodyClass: 'text-black/60',
  },
] as const

// ─── Curator profiles ────────────────────────────────────────────────────────

const curators = [
  {
    initials: 'MR',
    name: 'Marcus Reid',
    meta: 'Neo-soul · R&B · Jazz · Since 2011',
    quote: '"My playlist is my reputation. I add what moves me."',
    tags: ['Neo-soul', 'R&B', 'Jazz'],
    bg: 'bg-cobalt',
    tagBg: 'bg-white/10 text-white',
    quoteClass: 'text-white',
    metaClass: 'text-white/60',
    nameClass: 'text-white',
  },
  {
    initials: 'SL',
    name: 'Sofia Lange',
    meta: 'Indie · Alt · Bedroom pop · Since 2021',
    quote: '"I\'m not here to fill a playlist. I\'m here to be right."',
    tags: ['Indie', 'Alternative', 'Bedroom pop'],
    bg: 'bg-[#111111]',
    tagBg: 'text-white/70 border border-white/10',
    quoteClass: 'text-white',
    metaClass: 'text-white/50',
    nameClass: 'text-white',
  },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    // gap-[3px] + near-black bg = thin divider lines between every section
    <div className="flex flex-col gap-[3px] overflow-hidden bg-[#0D0D0D]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-[#0A0A0A] px-6 py-4 md:px-10">
        <Link href="/" className="inline-flex items-center gap-0.5 text-xl font-bold tracking-tight text-white">
          Sound<span className="text-acid">Swap</span>
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      {/*
        pb-0: no bottom padding — sub-row sits flush beneath headline
        relative: needed to position the stamp badge absolutely
      */}
      <section className="relative bg-acid px-6 pb-0 pt-8 md:px-10 lg:px-16">

        {/* Option B stamp — hard-edge block, top-right */}
        <div
          className="absolute right-10 top-10 hidden sm:block"
          style={{
            background: '#FF2D6B',
            padding: '14px 18px',
            border: `2px solid ${NEAR_BLACK}`,
            zIndex: 2,
          }}
          aria-hidden
        >
          <div style={{
            fontSize: 11,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: ACID,
            fontWeight: 600,
            lineHeight: 1.6,
          }}>
            Curators<br />not<br />algorithms
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          {/* Eyebrow */}
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-black/40">
            Artist &amp; Curator Network &middot; 2026
          </p>

          {/* Headline — no margin-bottom; gap comes from sub-row padding-top only */}
          <h1
            className="min-w-0 font-black leading-[0.92] tracking-tighter text-black"
            style={{ fontSize: 'clamp(3.2rem, 9vw, 8.5rem)' }}
          >
            <span className="flex items-center gap-3">
              Influence
              <Sparkle
                className="shrink-0 text-black"
                style={{ width: 'clamp(1.2rem, 3vw, 2.8rem)', height: 'clamp(1.2rem, 3vw, 2.8rem)' }}
              />
            </span>
            <span>
              is <span className="text-hp">earned.</span>
            </span>
            <span className="block">By</span>
            <span className="block" style={OUTLINE_STYLE}>greatness.</span>
          </h1>

          {/* Sub-row: border-top acts as divider; pt-6 = 24px only */}
          <div className="flex flex-col gap-5 border-t border-black/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-sm text-sm leading-7 text-black/70">
              Real curators. Honest feedback. Your music heard by someone whose
              reputation is on the line.
            </p>
            <div className="flex flex-col items-start gap-2 pb-8 sm:items-end">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-6 py-3 text-sm font-bold text-black transition hover:bg-black hover:text-acid"
              >
                Pitch your track &rarr;
              </Link>
              <p className="text-xs text-black/50">
                One track &middot; No commitment &middot;{' '}
                <span className="font-semibold text-hp">From 10 credits</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pink marquee ────────────────────────────────────────────── */}
      <Marquee text={TICKER_TEXT} bgClass="bg-hp" textClass="text-black" />

      {/* ── Feature cards — gap-[3px] between columns ─────────────── */}
      <section className="grid grid-cols-2 gap-[3px] bg-[#0D0D0D] lg:grid-cols-4">
        {featureCards.map((card) => (
          <div
            key={card.eyebrow}
            // justify-start + gap-3: label and headline pinned to top; body pushed to bottom via mt-auto
            className={`${card.bg} flex min-h-[380px] flex-col items-start gap-3 p-7 lg:min-h-[440px]`}
          >
            <p className={`text-[0.65rem] font-semibold uppercase tracking-[0.24em] ${card.eyebrowClass}`}>
              {card.eyebrow}
            </p>
            <p
              className={`font-black leading-tight tracking-tighter ${card.headlineClass}`}
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}
            >
              {card.headline.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </p>
            {/* mt-auto pushes body to bottom of card */}
            <p className={`mt-auto text-sm leading-6 ${card.bodyClass}`}>
              {card.body}
            </p>
          </div>
        ))}
      </section>

      {/* ── Curator cards — edge-to-edge, 3px gap ─────────────────── */}
      <section className="grid gap-[3px] bg-[#0D0D0D] md:grid-cols-2">
        {curators.map((curator) => (
          <div key={curator.initials} className={`${curator.bg} p-8`}>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-acid text-xs font-black text-black">
                {curator.initials}
              </div>
              <div>
                <p className={`text-sm font-bold ${curator.nameClass}`}>{curator.name}</p>
                <p className={`text-xs ${curator.metaClass}`}>{curator.meta}</p>
              </div>
            </div>
            <p
              className={`font-black leading-tight tracking-tight ${curator.quoteClass}`}
              style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)' }}
            >
              {curator.quote}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {curator.tags.map((tag) => (
                <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${curator.tagBg}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── How it works — tight band, 20px top/bottom ───────────── */}
      <section className="bg-[#0A0A0A] px-6 py-5 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10">
            {[
              {
                num: '01',
                tag: 'Match',
                title: 'Curators who know your world',
                body: 'Genre, mood, audience. Matched before a note plays.',
              },
              {
                num: '02',
                tag: 'Listen',
                title: 'Real attention. Real opinion.',
                body: 'A focused session from someone with skin in the game.',
              },
              {
                num: '03',
                tag: 'Believe',
                title: 'Earned. Never bought.',
                body: "Their name on it. Their call. That's the point.",
              },
            ].map((step) => (
              <div key={step.num} className="md:px-10 first:md:pl-0 last:md:pr-0">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/30">
                  {step.num} &mdash; {step.tag}
                </p>
                <p className="text-lg font-black leading-tight tracking-tight text-white">
                  {step.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/50">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Manifesto CTA ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0A] px-6 py-10 md:px-10">
        {/* Decorative donut */}
        <div
          className="absolute -right-16 top-1/2 -translate-y-1/2 rounded-full opacity-10"
          style={{ width: 340, height: 340, border: '40px solid #FF2D6B' }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-2">
          <h2
            className="font-black leading-[0.9] tracking-tighter"
            style={{ fontSize: 'clamp(2.8rem, 7.5vw, 7rem)' }}
          >
            <span className="block text-acid">Influence</span>
            <span className="block text-acid">is not</span>
            <span className="block text-acid">for sale.</span>
            <span className="block text-hp">Greatness</span>
            <span className="block text-hp">earns it.</span>
          </h2>

          <div className="space-y-5">
            <p className="text-base leading-7 text-white/60">
              A curator who adds your track does it because they believe in it.
              That&rsquo;s the only endorsement worth having.
            </p>
            <p className="text-sm font-semibold text-hp">
              From 10 credits &middot; No commitment
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-full border-2 border-acid bg-transparent px-7 py-3.5 text-sm font-bold text-acid transition hover:bg-acid hover:text-black"
            >
              Pitch your track &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Promise strip ─────────────────────────────────────────── */}
      <div className="bg-hp px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3">
          {[
            { text: 'Human ears', check: true },
            { text: 'Curator feedback', check: true },
            { text: 'Rated curators only', check: true },
            { text: "No guaranteed placement. That's the point.", check: false },
          ].map(({ text, check }) => (
            <div key={text} className="flex items-center gap-2">
              {/* Explicit inline dimensions for cross-browser icon consistency */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.22)',
                  fontSize: 12,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: NEAR_BLACK,
                  fontFamily: 'monospace',
                }}
              >
                {check ? '✓' : '✗'}
              </span>
              <span className="text-xs font-semibold text-black">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-[#0A0A0A]">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5 md:px-10">
          <Link href="/" className="inline-flex items-center gap-0.5 text-lg font-bold tracking-tight text-white">
            Sound<span className="text-acid">Swap</span>
          </Link>
          <div className="flex gap-4 text-xs text-white/30">
            <Link href="/sign-in" className="transition hover:text-white">Sign in</Link>
            <Link href="/sign-up" className="transition hover:text-white">Get started</Link>
          </div>
        </div>
        <Marquee text={FOOTER_TICKER} bgClass="bg-[#0A0A0A]" textClass="text-white/20" speed="slow" />
      </footer>

    </div>
  )
}
