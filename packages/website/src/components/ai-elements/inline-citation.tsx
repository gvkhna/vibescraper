'use client'

import * as React from 'react'
import type {ComponentProps} from 'react'
import {cn} from '@/lib/utils'
import {Badge} from '@/components/ui/badge'
import {HoverCard, HoverCardTrigger, HoverCardContent} from '@/components/ui/hover-card'
import {Carousel, CarouselContent, CarouselItem, useCarousel} from '@/components/ui/carousel'
import {ArrowLeftIcon, ArrowRightIcon} from 'lucide-react'

export type InlineCitationProps = ComponentProps<'span'>

export const InlineCitation = ({className, ...props}: InlineCitationProps) => (
  <span
    className={cn('group inline items-center gap-1', className)}
    {...props}
  />
)

export type InlineCitationTextProps = ComponentProps<'span'>

export const InlineCitationText = ({className, ...props}: InlineCitationTextProps) => (
  <span
    className={cn('group-hover:bg-accent transition-colors', className)}
    {...props}
  />
)

export type InlineCitationCardProps = ComponentProps<typeof HoverCard>

export const InlineCitationCard = (props: InlineCitationCardProps) => (
  <HoverCard
    openDelay={0}
    closeDelay={0}
    {...props}
  />
)

export type InlineCitationCardTriggerProps = ComponentProps<'button'> & {
  sources: string[]
}

export const InlineCitationCardTrigger = ({sources, className, ...props}: InlineCitationCardTriggerProps) => (
  <HoverCardTrigger asChild>
    <Badge
      variant='secondary'
      className={cn('ml-1 rounded-full', className)}
      {...props}
    >
      {sources.length ? (
        <>
          {new URL(sources[0]).hostname} {sources.length > 1 && `+${sources.length - 1}`}
        </>
      ) : (
        'unknown'
      )}
    </Badge>
  </HoverCardTrigger>
)

export type InlineCitationCardBodyProps = ComponentProps<'div'>

export const InlineCitationCardBody = ({className, ...props}: InlineCitationCardBodyProps) => (
  <HoverCardContent
    className={cn('relative w-80 p-0', className)}
    {...props}
  />
)

export type InlineCitationCarouselProps = ComponentProps<typeof Carousel>

export const InlineCitationCarousel = ({className, ...props}: InlineCitationCarouselProps) => (
  <Carousel
    className={cn('w-full', className)}
    {...props}
  />
)

export type InlineCitationCarouselContentProps = ComponentProps<'div'>

export const InlineCitationCarouselContent = (props: InlineCitationCarouselContentProps) => (
  <CarouselContent {...props} />
)

export type InlineCitationCarouselItemProps = ComponentProps<'div'>

export const InlineCitationCarouselItem = ({className, ...props}: InlineCitationCarouselItemProps) => (
  <CarouselItem
    className={cn('w-full space-y-2 p-4', className)}
    {...props}
  />
)

export type InlineCitationCarouselHeaderProps = ComponentProps<'div'>

export const InlineCitationCarouselHeader = ({className, ...props}: InlineCitationCarouselHeaderProps) => (
  <div
    className={cn('bg-secondary flex items-center justify-between gap-2 rounded-t-md p-2', className)}
    {...props}
  />
)

export type InlineCitationCarouselIndexProps = ComponentProps<'div'>

export const InlineCitationCarouselIndex = ({
  children,
  className,
  ...props
}: InlineCitationCarouselIndexProps) => {
  const {api} = useCarousel()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-1 items-center justify-end px-3 py-1 text-xs',
        className
      )}
      {...props}
    >
      {children ?? `${current}/${count}`}
    </div>
  )
}

export type InlineCitationCarouselPrevProps = ComponentProps<'button'>

export const InlineCitationCarouselPrev = ({className, ...props}: InlineCitationCarouselPrevProps) => {
  const {api} = useCarousel()

  const handleClick = React.useCallback(() => {
    if (api) {
      api.scrollPrev()
    }
  }, [api])

  return (
    <button
      type='button'
      className={cn('shrink-0', className)}
      onClick={handleClick}
      aria-label='Previous'
      {...props}
    >
      <ArrowLeftIcon className='text-muted-foreground size-4' />
    </button>
  )
}

export type InlineCitationCarouselNextProps = ComponentProps<'button'>

export const InlineCitationCarouselNext = ({className, ...props}: InlineCitationCarouselNextProps) => {
  const {api} = useCarousel()

  const handleClick = React.useCallback(() => {
    if (api) {
      api.scrollNext()
    }
  }, [api])

  return (
    <button
      type='button'
      className={cn('shrink-0', className)}
      onClick={handleClick}
      aria-label='Next'
      {...props}
    >
      <ArrowRightIcon className='text-muted-foreground size-4' />
    </button>
  )
}

export type InlineCitationSourceProps = ComponentProps<'div'> & {
  title?: string
  url?: string
  description?: string
}

export const InlineCitationSource = ({
  title,
  url,
  description,
  className,
  children,
  ...props
}: InlineCitationSourceProps) => (
  <div
    className={cn('space-y-1', className)}
    {...props}
  >
    {title && <h4 className='truncate text-sm font-medium leading-tight'>{title}</h4>}
    {url && <p className='text-muted-foreground truncate break-all text-xs'>{url}</p>}
    {description && (
      <p className='text-muted-foreground line-clamp-3 text-sm leading-relaxed'>{description}</p>
    )}
    {children}
  </div>
)

export type InlineCitationQuoteProps = ComponentProps<'blockquote'>

export const InlineCitationQuote = ({children, className, ...props}: InlineCitationQuoteProps) => (
  <blockquote
    className={cn('border-muted text-muted-foreground border-l-2 pl-3 text-sm italic', className)}
    {...props}
  >
    {children}
  </blockquote>
)
