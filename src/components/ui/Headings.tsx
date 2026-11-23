import type { ComponentProps } from 'react'

export function PageHeading({ className = '', ...props }: ComponentProps<'div'>) {
  return <div {...props} className={('page-heading ' + className).trimEnd()} />
}

export function PanelTitle({ className = '', ...props }: ComponentProps<'div'>) {
  return <div {...props} className={('panel-heading ' + className).trimEnd()} />
}
