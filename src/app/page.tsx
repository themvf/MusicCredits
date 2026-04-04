import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import AppLogo from '@/components/AppLogo'
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BoltIcon,
  CheckIcon,
  HeadphonesIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  TracksIcon,
  UploadIcon,
  UserGroupIcon,
  WalletIcon,
  WaveformIcon,
} from '@/components/AppIcons'

const steps = [
  {
    title: 'Submit your Spotify track',
    description: 'Launch a campaign whenever you have credits ready to spend.',
    icon: UploadIcon,
    stat: '10 credits',
  },
  {
    title: 'Listen for 30 focused seconds',
    description: 'Every session is built for real attention, not passive bot traffic.',
    icon: HeadphonesIcon,
    stat: '30s minimum',
  },
  {
    title: 'Earn credits and discovery',
    description: 'Rate what you hear, grow your balance, and keep your music circulating.',
    icon: StarIcon,
    stat: '+1 credit',
  },
] as const

const featureCards = [
  {
    title: 'Real listens, not vanity metrics',
    description: 'Playback gating, friction prompts, and timed sessions keep engagement honest.',
    icon: ShieldIcon,
  },
  {
    title: 'Earn while discovering new artists',
    description: 'Every listen builds your network and funds the next promotion cycle.',
    icon: SparkIcon,
  },
  {
    title: 'Fair credit loop',
    description: 'Growth comes from contribution, not ad spend or hidden boosts.',
    icon: WalletIcon,
  },
  {
    title: 'Built for creator momentum',
    description: 'Dashboard-grade analytics help artists see what is actually moving.',
    icon: ActivityIcon,
  },
] as const

const showcaseTracks = [
  {
    title: 'Night Drives',
    artist: 'Kira Vale',
    listens: '482 listens',
    rating: '4.8 avg',
  },
  {
    title: 'Faded Satellites',
    artist: 'Hotel Static',
    listens: '351 listens',
    rating: '4.6 avg',
  },
  {
    title: 'Blue Arcade',
    artist: 'Atlas Bloom',
    listens: '590 listens',
    rating: '4.9 avg',
  },
] as const

const testimonials = [
  {
    quote:
      'It feels like the first promo tool that actually respects attention instead of inflating numbers.',
    name: 'Nina Foster',
    role: 'Independent pop artist',
  },
  {
    quote:
      'The exchange loop is clean. Listen, earn, submit, repeat. That simplicity makes it sticky.',
    name: 'Dante Reyes',
    role: 'Producer and songwriter',
  },
] as const

function HeroVisualization() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      <div className="hero-orb left-10 top-10 h-28 w-28 bg-brand-500/20" />
      <div className="hero-orb bottom-16 right-4 h-32 w-32 bg-sky-500/14" />

      <div className="relative grid gap-4">
        <div className="surface-card animate-float-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                Listening queue
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Tracks waiting for real ears
              </h3>
            </div>
            <span className="rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              Live
            </span>
          </div>

          <div className="space-y-3">
            {showcaseTracks.map((track, index) => (
              <div
                key={track.title}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(34,197,94,0.22),rgba(59,130,246,0.22))] text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{track.title}</p>
                    <p className="text-sm text-slate-400">{track.artist}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{track.listens}</p>
                  <p>{track.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-card-soft p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Credit velocity
            </p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="metric-value">+42</p>
                <p className="text-sm text-slate-400">credits earned this week</p>
              </div>
              <span className="rounded-full bg-brand-500/12 px-3 py-1 text-xs font-medium text-brand-300">
                +18%
              </span>
            </div>
            <div className="mt-5 flex h-16 items-end gap-2">
              {[34, 48, 42, 65, 58, 72, 84].map((height, index) => (
                <span
                  key={height}
                  className="animate-pulse-line w-full rounded-full bg-[linear-gradient(180deg,rgba(34,197,94,0.88),rgba(59,130,246,0.35))]"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${index * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="surface-card-soft p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Session quality
            </p>
            <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-center">
              <div>
                <p className="text-2xl font-semibold text-white">94%</p>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">
                  verified
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Anti-skip timing and feedback prompts keep every listen intentional.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <main className="relative overflow-hidden pb-24">
      <div className="hero-orb left-[-8rem] top-[-6rem] h-72 w-72 bg-brand-500/15" />
      <div className="hero-orb right-[-10rem] top-36 h-80 w-80 bg-sky-500/12" />

      <header className="section-shell relative z-10 flex items-center justify-between py-6">
        <AppLogo />
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="button-ghost px-0 py-0">
            How it works
          </a>
          <a href="#features" className="button-ghost px-0 py-0">
            Features
          </a>
          <Link href="/sign-in" className="button-ghost">
            Sign in
          </Link>
          <Link href="/sign-up" className="button-primary">
            Start free
          </Link>
        </div>
      </header>

      <section className="section-shell relative z-10 pt-10 sm:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <span className="eyebrow-badge">
                <WaveformIcon className="h-4 w-4" />
                Credit-based music exchange
              </span>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                  SoundSwap
                </h1>
                <p className="max-w-2xl text-xl leading-8 text-slate-300">
                  A credit-based music exchange. Listen, earn, grow.
                </p>
                <p className="max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                  Artists submit songs, earn attention by supporting other creators,
                  and turn every focused listen into momentum for their next release.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="button-primary">
                <HeadphonesIcon className="h-4 w-4" />
                Start Listening
              </Link>
              <Link href="/sign-in" className="button-secondary">
                <UploadIcon className="h-4 w-4" />
                Submit a Track
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-card-soft p-4">
                <p className="text-2xl font-semibold text-white">1,000+</p>
                <p className="mt-1 text-sm text-slate-400">
                  independent artists already cycling credits
                </p>
              </div>
              <div className="surface-card-soft p-4">
                <p className="text-2xl font-semibold text-white">30s</p>
                <p className="mt-1 text-sm text-slate-400">
                  minimum verified listen before rating unlocks
                </p>
              </div>
              <div className="surface-card-soft p-4">
                <p className="text-2xl font-semibold text-white">4.8/5</p>
                <p className="mt-1 text-sm text-slate-400">
                  average session quality from creator feedback
                </p>
              </div>
            </div>
          </div>

          <HeroVisualization />
        </div>
      </section>

      <section id="how-it-works" className="section-shell relative z-10 mt-24 space-y-8">
        <div className="max-w-2xl space-y-3">
          <span className="eyebrow-badge">How it works</span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A clean exchange loop built for creators
          </h2>
          <p className="text-base leading-7 text-slate-400">
            No ad auctions, no shady play farms. Just a transparent system where
            listening funds discovery.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="surface-card group p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand-400/18"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.26em] text-slate-500">
                    Step 0{index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {step.description}
                </p>
                <div className="mt-6 inline-flex rounded-full border border-brand-400/15 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                  {step.stat}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section-shell relative z-10 mt-24">
        <div className="surface-card grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="space-y-5">
            <span className="eyebrow-badge">
              <UserGroupIcon className="h-4 w-4" />
              Used by 1,000+ independent artists
            </span>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Social proof that feels like product proof
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-400">
                The best creator growth loop is one you can see. These sample
                sessions mirror the kind of transparent activity artists expect.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {showcaseTracks.map((track) => (
                <div
                  key={track.title}
                  className="rounded-[1.35rem] border border-white/8 bg-slate-950/60 p-4"
                >
                  <p className="text-sm font-semibold text-white">{track.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{track.artist}</p>
                  <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                    <span>{track.listens}</span>
                    <span className="text-brand-300">{track.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-[1.5rem] border border-white/8 bg-slate-950/55 p-6"
              >
                <div className="mb-4 flex items-center gap-2 text-brand-300">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.24em]">
                    Trusted workflow
                  </span>
                </div>
                <p className="text-lg leading-8 text-white">"{item.quote}"</p>
                <div className="mt-6">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section-shell relative z-10 mt-24 space-y-8">
        <div className="max-w-2xl space-y-3">
          <span className="eyebrow-badge">
            <SparkIcon className="h-4 w-4" />
            Feature set
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Product mechanics designed to convert attention into growth
          </h2>
          <p className="text-base leading-7 text-slate-400">
            SoundSwap is opinionated about the details that make a creator SaaS
            feel trustworthy, fast, and repeatable.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="surface-card p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section-shell relative z-10 mt-24">
        <div className="surface-card overflow-hidden px-8 py-12 text-center sm:px-12">
          <div className="hero-orb left-12 top-12 h-40 w-40 bg-brand-500/12" />
          <div className="hero-orb bottom-[-5rem] right-8 h-48 w-48 bg-sky-500/10" />
          <div className="relative mx-auto max-w-3xl space-y-6">
            <span className="eyebrow-badge">
              <BoltIcon className="h-4 w-4" />
              Ready to launch
            </span>
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Start growing your music today
            </h2>
            <p className="text-base leading-8 text-slate-400 sm:text-lg">
              Join the exchange, build credits through real listening, and put
              every new release in front of creators who are actually engaged.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="button-primary">
                Create your account
              </Link>
              <Link href="/sign-in" className="button-secondary">
                Explore the dashboard
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
