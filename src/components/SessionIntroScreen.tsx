'use client'

import StartListeningButton from '@/components/StartListeningButton'
import {
  BoltIcon,
  HeadphonesIcon,
  ShieldIcon,
} from '@/components/AppIcons'

const introFeatures = [
  {
    icon: HeadphonesIcon,
    title: '30 total seconds',
    body: 'Playback time accumulates while the song is actively playing in Spotify.',
  },
  {
    icon: ShieldIcon,
    title: 'Flexible listen flow',
    body: 'Pause or scrub if you need to. Your total earned time stays intact.',
  },
  {
    icon: BoltIcon,
    title: '+1 verified credit',
    body: 'Submit feedback after the listen unlocks and fund the next promotion cycle.',
  },
] as const

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof HeadphonesIcon
  title: string
  body: string
}) {
  return (
    <div className="surface-card-soft pointer-events-none p-5">
      <Icon className="h-5 w-5 text-brand-300" />
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  )
}

export default function SessionIntroScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6 text-center">
      <div className="space-y-4">
        <span className="eyebrow-badge justify-center">
          <HeadphonesIcon className="h-4 w-4" />
          Listen & Earn
        </span>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Start a focused listening session
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-400">
            Listen for 30 real seconds, leave meaningful feedback, and move
            straight into playlist verification without leaving the session.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {introFeatures.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            body={feature.body}
          />
        ))}
      </div>

      <div className="mx-auto max-w-sm">
        <StartListeningButton
          label="Start a Session"
          fullWidth
          showHelperText
        />
      </div>
    </div>
  )
}
