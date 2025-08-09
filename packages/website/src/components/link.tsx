import type {HTMLProps} from 'react'
import {Link as TanstackRouterLink} from '@tanstack/react-router'
import {buttonVariants} from '@/components/ui/button'
import {cn} from '@/lib/utils'

export interface LinkProps extends HTMLProps<HTMLAnchorElement> {
  to?: string
  href: string
}

export function Link(props: LinkProps) {
  const {children, to, href, className: classNameProp, preload, ...rest} = props

  let linkHref = ''
  if (href) {
    linkHref = href
  }
  if (to) {
    linkHref = to
  }
  let className = `${classNameProp} justify-start`
  if (props.disabled) {
    className += ' opacity-60 cursor-not-allowed'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preloadAny: any = preload

  return (
    <TanstackRouterLink
      to={linkHref}
      className={cn(buttonVariants({variant: 'link'}), className)}
      preload={preloadAny}
      {...rest}
    >
      {children}
    </TanstackRouterLink>
  )
}
