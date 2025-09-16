import {cn} from '@/lib/utils'
export function ChevronRight({className}: {className: string}) {
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
      className={cn('lucide lucide-chevron-right-icon lucide-chevron-right', className)}
    >
      <path d='m9 18 6-6-6-6' />
    </svg>
  )
}
