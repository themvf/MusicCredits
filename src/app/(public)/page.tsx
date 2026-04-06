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
    initials: 'JK',
    name: 'Jordan Kim',
    meta: 'EDM · House · Techno',
    quote: '"The drop either hits or it doesn\'t. My playlist doesn\'t lie."',
    tags: ['EDM', 'House', 'Techno'],
    bg: 'bg-cobalt',
    tagBg: 'bg-white/10 text-white',
    quoteClass: 'text-white',
    metaClass: 'text-white/60',
    nameClass: 'text-white',
  },
  {
    initials: 'DW',
    name: 'Devon Wallace',
    meta: 'Rap · Hip-Hop · Trap',
    quote: '"I know a hit before the hook. My ears don\'t miss."',
    tags: ['Rap', 'Hip-Hop', 'Trap'],
    bg: 'bg-[#111111]',
    tagBg: 'text-white/70 border border-white/10',
    quoteClass: 'text-white',
    metaClass: 'text-white/50',
    nameClass: 'text-white',
  },
] as const

// ─── Offset shadow CTA button ─────────────────────────────────────────────────

function PitchButton({ mainColor }: { mainColor: string }) {
  const label = 'Pitch your track \u2192'
  const padding = '16px 36px'
  const fontSize = '16px'
  const fontWeight = '500'
  const borderRadius = '50px'
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Layer 3 — black shadow, furthest back */}
      <div style={{
        position: 'absolute', top: '8px', left: '8px',
        background: NEAR_BLACK, borderRadius,
        padding, fontSize, fontWeight,
        whiteSpace: 'nowrap', color: 'transparent',
        userSelect: 'none', pointerEvents: 'none',
      }}>{label}</div>
      {/* Layer 2 — pink shadow */}
      <div style={{
        position: 'absolute', top: '4px', left: '4px',
        background: '#FF2D6B', borderRadius,
        padding, fontSize, fontWeight,
        whiteSpace: 'nowrap', color: 'transparent',
        border: `2px solid ${NEAR_BLACK}`,
        userSelect: 'none', pointerEvents: 'none',
      }}>{label}</div>
      {/* Layer 1 — main button, front */}
      <Link href="/sign-up" style={{
        position: 'relative', display: 'block',
        background: mainColor, color: NEAR_BLACK,
        border: `2.5px solid ${NEAR_BLACK}`,
        padding, borderRadius,
        fontSize, fontWeight,
        cursor: 'pointer', whiteSpace: 'nowrap',
        textDecoration: 'none',
      }}>{label}</Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    // gap-[3px] + near-black bg = thin divider lines between every section
    <div className="flex flex-col gap-[3px] overflow-hidden bg-[#0D0D0D]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-[#0A0A0A] px-6 py-4 md:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-0.5 text-xl font-bold tracking-tight text-white">
            Sound<span className="text-acid">Swap</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="#free-discovery"
              style={{
                fontSize: '14px',
                color: 'rgba(200,240,0,0.6)',
                textDecoration: 'none',
                fontWeight: 400,
                borderBottom: '1px solid rgba(200,240,0,0.25)',
                paddingBottom: '1px',
              }}
            >
              Start for free
            </Link>
            <PitchButton mainColor={ACID} />
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      {/*
        pb-0: no bottom padding — sub-row sits flush beneath headline
        relative: needed to position the stamp badge absolutely
      */}
      <section className="relative bg-acid px-6 pb-0 pt-8 md:px-10 lg:px-16">

        {/* Graphic cluster — positioned absolutely, hidden on small screens */}
        <svg
          viewBox="0 0 320 280"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute hidden sm:block"
          style={{ top: '20px', right: '0', width: '320px', height: '280px', zIndex: 2 }}
          aria-hidden
        >
          <rect x="180" y="10" width="90" height="90" fill="#FF2D6B" stroke={NEAR_BLACK} strokeWidth="2.5"/>
          <rect x="188" y="18" width="90" height="90" fill="none" stroke={NEAR_BLACK} strokeWidth="2.5"/>
          <rect x="196" y="26" width="90" height="90" fill="none" stroke={NEAR_BLACK} strokeWidth="1.5" strokeDasharray="4 3"/>

          <circle cx="80" cy="80" r="56" fill="none" stroke={NEAR_BLACK} strokeWidth="2.5"/>
          <circle cx="80" cy="80" r="40" fill="none" stroke={NEAR_BLACK} strokeWidth="1.5"/>
          <circle cx="80" cy="80" r="22" fill={NEAR_BLACK}/>
          <circle cx="80" cy="80" r="8" fill={ACID}/>

          <text x="225" y="62" textAnchor="middle" fontSize="11" fontWeight="500" fill={ACID} fontFamily="sans-serif" letterSpacing="0.5">TASTE NOT</text>
          <text x="225" y="76" textAnchor="middle" fontSize="11" fontWeight="500" fill={ACID} fontFamily="sans-serif" letterSpacing="0.5">TRANSACTIONS</text>

          <line x1="155" y1="55" x2="175" y2="55" stroke={NEAR_BLACK} strokeWidth="2"/>
          <line x1="155" y1="62" x2="175" y2="62" stroke={NEAR_BLACK} strokeWidth="2"/>
          <line x1="155" y1="69" x2="175" y2="69" stroke={NEAR_BLACK} strokeWidth="2"/>

          <polygon points="60,170 90,140 120,170 105,170 105,200 75,200 75,170" fill="#FF2D6B" stroke={NEAR_BLACK} strokeWidth="2"/>

          <rect x="160" y="150" width="60" height="60" fill={NEAR_BLACK} stroke={NEAR_BLACK} strokeWidth="2"/>
          <rect x="172" y="162" width="36" height="36" fill={ACID}/>
          <rect x="182" y="172" width="16" height="16" fill="#FF2D6B"/>

          <line x1="250" y1="140" x2="310" y2="140" stroke={NEAR_BLACK} strokeWidth="2.5"/>
          <line x1="250" y1="155" x2="295" y2="155" stroke={NEAR_BLACK} strokeWidth="2.5"/>
          <line x1="250" y1="170" x2="310" y2="170" stroke={NEAR_BLACK} strokeWidth="1.5"/>
          <line x1="250" y1="182" x2="280" y2="182" stroke={NEAR_BLACK} strokeWidth="1.5"/>

          <polygon points="20,230 35,200 50,230 42,230 42,260 28,260 28,230" fill="none" stroke={NEAR_BLACK} strokeWidth="2"/>
          <polygon points="240,220 260,195 280,220" fill="#FF2D6B" stroke={NEAR_BLACK} strokeWidth="2"/>
          <polygon points="250,245 270,220 290,245" fill="none" stroke={NEAR_BLACK} strokeWidth="2"/>
        </svg>

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
              <PitchButton mainColor={ACID} />
              <p className="text-xs text-black/50">
                One track &middot; No commitment &middot;{' '}
                <span className="font-semibold text-hp">From 10 credits</span>
              </p>
              <div style={{
                marginTop: '4px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(13,13,13,0.12)',
                textAlign: 'right',
                width: '100%',
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(13,13,13,0.45)' }}>
                  Not ready to spend credits?{' '}
                </span>
                <Link
                  href="#free-discovery"
                  style={{
                    fontSize: '12px',
                    color: NEAR_BLACK,
                    fontWeight: 500,
                    textDecoration: 'none',
                    borderBottom: `1.5px solid ${NEAR_BLACK}`,
                    paddingBottom: '1px',
                  }}
                >
                  Start with Free Discovery →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pink marquee ────────────────────────────────────────────── */}
      <Marquee text={TICKER_TEXT} bgClass="bg-hp" textClass="text-black" />

      {/* ── Feature cards — gap-[3px] between columns ─────────────── */}
      <section className="grid grid-cols-2 gap-[3px] bg-[#0D0D0D] lg:grid-cols-4">
        {/* Card 1 — Real Listen */}
        <div className="bg-hp flex min-h-[380px] flex-col justify-between p-7 lg:min-h-[440px]">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-black/50">Real Listen</p>
            <p className="mt-3 font-black leading-tight tracking-tighter text-white" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}>
              <span className="block">Human ears.</span>
              <span className="block">Every time.</span>
            </p>
            <svg viewBox="0 0 200 80" width="100%" aria-hidden style={{ display: 'block', margin: '16px 0' }}>
              <rect x="0" y="20" width="180" height="18" fill="#C8F000" />
              <rect x="20" y="46" width="140" height="18" fill="#C8F000" opacity="0.5" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-white/70">Not an algorithm. Not a bot. A real person in your genre who actually cares.</p>
        </div>

        {/* Card 2 — Curator Feedback */}
        <div className="bg-[#0A0A0A] flex min-h-[380px] flex-col justify-between p-7 lg:min-h-[440px]">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/40">Curator Feedback</p>
            <p className="mt-3 font-black leading-tight tracking-tighter text-hp" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}>
              <span className="block">Their take.</span>
              <span className="block">Unfiltered.</span>
            </p>
            <svg viewBox="0 0 200 80" width="100%" aria-hidden style={{ display: 'block', margin: '16px 0' }}>
              <circle cx="40" cy="40" r="36" fill="none" stroke="#FF2D6B" strokeWidth="8" />
              <circle cx="40" cy="40" r="18" fill="#FF2D6B" />
              <rect x="90" y="10" width="12" height="60" fill="#FF2D6B" opacity="0.4" />
              <rect x="110" y="24" width="12" height="46" fill="#FF2D6B" opacity="0.7" />
              <rect x="130" y="16" width="12" height="54" fill="#FF2D6B" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-white/50">Straight from the curator. What they heard. What they felt. What it means for your music.</p>
        </div>

        {/* Card 3 — Placement */}
        <div className="bg-cobalt flex min-h-[380px] flex-col justify-between p-7 lg:min-h-[440px]">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/50">Placement</p>
            <p className="mt-3 font-black leading-tight tracking-tighter text-white" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}>
              <span className="block">Earned.</span>
              <span className="block">Never bought.</span>
            </p>
            <svg viewBox="0 0 200 80" width="100%" aria-hidden style={{ display: 'block', margin: '16px 0' }}>
              <polygon points="0,70 40,10 80,70" fill="#C8F000" />
              <polygon points="60,70 100,10 140,70" fill="#C8F000" opacity="0.4" />
              <polygon points="120,70 160,10 200,70" fill="#C8F000" opacity="0.2" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-white/70">Reputation on the line. Their name on it. Their call alone.</p>
        </div>

        {/* Card 4 — Curator Ratings */}
        <div className="bg-acid flex min-h-[380px] flex-col justify-between p-7 lg:min-h-[440px]">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-black/40">Curator Ratings</p>
            <p className="mt-3 font-black leading-tight tracking-tighter text-black" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}>
              <span className="block">Every curator</span>
              <span className="block">rated.</span>
            </p>
            <svg viewBox="0 0 200 60" width="100%" aria-hidden style={{ display: 'block', margin: '16px 0' }}>
              <defs>
                <clipPath id="clip4">
                  <rect x="0" y="0" width="170" height="60" />
                </clipPath>
              </defs>
              <text x="0" y="52" fontSize="56" fontWeight="700" fill="#0D0D0D" opacity="0.12" fontFamily="sans-serif">★★★★★</text>
              <text x="0" y="52" fontSize="56" fontWeight="700" fill="#0D0D0D" fontFamily="sans-serif" clipPath="url(#clip4)">★★★★★</text>
            </svg>
          </div>
          <p className="text-sm leading-6 text-black/60">Artists rate every session. Only the best curators stay on the platform.</p>
        </div>
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
      <section id="free-discovery" className="relative overflow-hidden bg-[#0A0A0A] px-6 py-10 md:px-10">
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
            <PitchButton mainColor="#FF2D6B" />
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
