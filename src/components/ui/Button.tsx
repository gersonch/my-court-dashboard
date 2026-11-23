import type { ComponentProps } from 'react'

export function Button({ className = '', type = 'button', ...props }: ComponentProps<'button'>) {
  return <button {...props} type={type} className={('button ' + className).trimEnd()} />
}
