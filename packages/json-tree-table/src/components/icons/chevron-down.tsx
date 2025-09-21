import { cn } from '@/lib/utils'
export function ChevronDown({ className }: { className: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      stroke-width='2'
      stroke-linecap='round'
      stroke-linejoin='round'
      className={cn('lucide lucide-chevron-down-icon lucide-chevron-down', className)}
    >
      <path d='m6 9 6 6 6-6' />
    </svg>
  )
}
