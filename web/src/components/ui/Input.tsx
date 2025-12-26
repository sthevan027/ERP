import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ style, ...props }: Props) {
  const base: React.CSSProperties = {
    width: '100%',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'rgba(0,0,0,0.22)',
    color: 'var(--text)',
    padding: '10px 12px',
    outline: 'none',
  }

  return <input {...props} style={{ ...base, ...style }} />
}


