import type { ComponentProps } from 'react'

export function FormField({ className = '', ...props }: ComponentProps<'label'>) {
  return <label {...props} className={('form-field ' + className).trimEnd()} />
}
