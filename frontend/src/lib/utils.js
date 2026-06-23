import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function calculatePrizePool(subscriberCount, subscriptionFee = 9.99) {
  const totalPool = subscriberCount * subscriptionFee * 0.60 // 60% goes to prize pool
  return {
    total: totalPool,
    jackpot: totalPool * 0.40,
    fourMatch: totalPool * 0.35,
    threeMatch: totalPool * 0.25,
  }
}

export function calculateCharityContribution(subscriptionFee, percentage) {
  return (subscriptionFee * percentage) / 100
}

export function getScoreLabel(score) {
  if (score >= 36) return { label: 'Excellent', color: 'text-brand-400' }
  if (score >= 28) return { label: 'Good', color: 'text-gold-400' }
  if (score >= 18) return { label: 'Average', color: 'text-blue-400' }
  return { label: 'Needs Work', color: 'text-red-400' }
}
