import { cn } from '@/lib/cn'

interface RatingStarsProps {
  value: number
  className?: string
}

export default function RatingStars({
  value,
  className,
}: RatingStarsProps) {
  const roundedValue = Math.round(value)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < roundedValue

        return (
          <svg
            key={index}
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={cn(
              'h-4 w-4',
              filled ? 'text-amber-300' : 'text-slate-600'
            )}
          >
            <path
              d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1 6.1-5.4-2.9-5.6 2.9 1.1-6.1L3 9.5l6.3-.9L12 3Z"
              fill="currentColor"
            />
          </svg>
        )
      })}
    </div>
  )
}
