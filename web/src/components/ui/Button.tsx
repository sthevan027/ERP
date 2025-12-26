import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: 12,
    border: '1px solid var(--border)',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.6 : 1,
    background:
      variant === 'primary'
        ? 'linear-gradient(180deg, rgba(59,130,246,0.95), rgba(29,78,216,0.95))'
        : variant === 'danger'
          ? 'linear-gradient(180deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))'
          : 'rgba(255,255,255,0.06)',
    color: 'var(--text)',
  }

  return <button {...props} style={{ ...base, ...style }} />
}


