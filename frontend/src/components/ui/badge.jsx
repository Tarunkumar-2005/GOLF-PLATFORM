import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-brand-600/20 text-brand-400 border-brand-500/30',
        gold:        'border-transparent bg-gold-500/20 text-gold-400 border-gold-500/30',
        secondary:   'border-transparent bg-white/10 text-gray-300',
        destructive: 'border-transparent bg-red-500/20 text-red-400 border-red-500/30',
        outline:     'text-gray-300 border-white/20',
        active:      'border-transparent bg-green-500/20 text-green-400 border-green-500/30',
        inactive:    'border-transparent bg-red-500/20 text-red-400 border-red-500/30',
        pending:     'border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
