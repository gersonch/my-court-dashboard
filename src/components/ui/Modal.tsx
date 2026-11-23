import type { ComponentProps, ComponentPropsWithoutRef, MouseEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

function openDialog(dialog: HTMLDialogElement | null) {
  if (dialog && !dialog.open) dialog.showModal()
}

function closeDialog(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.closest('dialog')?.close()
}

export function Modal({ className = '', ...props }: ComponentPropsWithoutRef<'dialog'>) {
  return <dialog {...props} ref={openDialog} className={('dialog ' + className).trimEnd()} />
}

export function ModalTitle(props: ComponentProps<'h2'>) {
  return (
    <div className="dialog-heading">
      <h2 {...props} />
      <Button className="button--quiet icon-button" aria-label="Cerrar" onClick={closeDialog}>
        <X size={20} />
      </Button>
    </div>
  )
}

export function ModalActions({ className = '', children, ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={('form-actions ' + className).trimEnd()}>
      <Button className="button--secondary" onClick={closeDialog}>
        Cancelar
      </Button>
      {children}
    </div>
  )
}
