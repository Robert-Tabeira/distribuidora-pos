'use client'

import { useState, type InputHTMLAttributes } from 'react'

export function CustomerPasswordInput({ className = '', disabled, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return <div className="relative">
    <input autoCapitalize="none" autoCorrect="off" spellCheck={false} {...props} disabled={disabled} type={visible ? 'text' : 'password'} className={`${className} pr-24`} />
    <button type="button" disabled={disabled} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} aria-controls={props.id} onClick={() => setVisible(current => !current)} className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-blue-900 disabled:opacity-50">
      {visible ? 'Ocultar' : 'Mostrar'}
    </button>
  </div>
}
