import type { ComponentProps } from 'react'
import { CircleAlert } from 'lucide-react'

export function Badge({ className = '', ...props }: ComponentProps<'span'>) {
  return <span {...props} className={('badge ' + className).trimEnd()} />
}

export function Empty({ className = '', ...props }: ComponentProps<'div'>) {
  return <div {...props} className={('empty ' + className).trimEnd()} />
}

export function Loading({
  className = '',
  children = 'Cargando…',
  ...props
}: ComponentProps<'div'>) {
  return (
    <div role="status" {...props} className={('loading ' + className).trimEnd()}>
      {children}
    </div>
  )
}

export function InlineError({ className = '', children, ...props }: ComponentProps<'div'>) {
  if (!children) return null

  return (
    <div role="alert" {...props} className={('inline-error ' + className).trimEnd()}>
      <CircleAlert size={18} />
      {typeof children === 'string' ? <span>{children}</span> : children}
    </div>
  )
}
