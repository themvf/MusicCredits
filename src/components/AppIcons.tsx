import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface IconProps {
  className?: string
}

function IconFrame({
  className,
  children,
  viewBox = '0 0 24 24',
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
    >
      {children}
    </svg>
  )
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
      <rect x="3.5" y="12.5" width="7" height="8" rx="1.5" />
    </IconFrame>
  )
}

export function HeadphonesIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M4 13a8 8 0 1 1 16 0" />
      <path d="M6 13v5a2 2 0 0 0 2 2h1v-7H8a2 2 0 0 0-2 2Z" />
      <path d="M18 13v5a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
    </IconFrame>
  )
}

export function UploadIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </IconFrame>
  )
}

export function TracksIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M9 18V7.5l10-2v10.5" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </IconFrame>
  )
}

export function WalletIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H19a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 16Z" />
      <path d="M16 13h4" />
      <circle cx="15" cy="13" r="1" />
      <path d="M4 8.5h12.5A2.5 2.5 0 0 0 14 6H6.5A2.5 2.5 0 0 0 4 8.5Z" />
    </IconFrame>
  )
}

export function SparkIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
    </IconFrame>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M12 3c2.6 2 5.4 3 8 3.2v5.2c0 5-3.3 8.3-8 9.6-4.7-1.3-8-4.6-8-9.6V6.2C6.6 6 9.4 5 12 3Z" />
      <path d="m9.5 12.5 1.8 1.8 3.7-4" />
    </IconFrame>
  )
}

export function WaveformIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M3 12h2l2-6 4 12 2-6h2l2 4 2-8 2 4h2" />
    </IconFrame>
  )
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </IconFrame>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m8 6 10 6-10 6Z" fill="currentColor" stroke="none" />
    </IconFrame>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m5 12 4 4L19 6" />
    </IconFrame>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5l3 2" />
    </IconFrame>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1 6.1-5.4-2.9-5.6 2.9 1.1-6.1L3 9.5l6.3-.9L12 3Z" />
    </IconFrame>
  )
}

export function ActivityIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </IconFrame>
  )
}

export function UserGroupIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M16 20a4 4 0 0 0-8 0" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 20a3 3 0 0 0-3-3" />
      <path d="M18 17a3 3 0 0 1 3 3" />
      <path d="M6 8a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 6 8Z" />
      <path d="M18 8a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 18 8Z" />
    </IconFrame>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6 7v10.5A1.5 1.5 0 0 0 7.5 19h9a1.5 1.5 0 0 0 1.5-1.5V7" />
      <path d="M10 10.5v5" />
      <path d="M14 10.5v5" />
    </IconFrame>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m9 6 6 6-6 6" />
    </IconFrame>
  )
}

export function BoltIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M13 2 6 13h5l-1 9 8-12h-5l1-8Z" />
    </IconFrame>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </IconFrame>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8.5A4 4 0 0 1 12 4.5a4 4 0 0 1 4 4V11" />
    </IconFrame>
  )
}

export function InfoIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10v5" />
      <path d="M12 7.2h.01" />
    </IconFrame>
  )
}
