import React, { forwardRef } from 'react'

type SelectSize = 'sm' | 'md' | 'lg'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  selectSize?: SelectSize
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ selectSize = 'md', error = false, style, children, ...props }, ref) => {
    const sizeStyles: Record<SelectSize, React.CSSProperties> = {
      sm: { padding: '6px 32px 6px 10px', fontSize: '0.8125rem' },
      md: { padding: '10px 36px 10px 12px', fontSize: '0.875rem' },
      lg: { padding: '12px 40px 12px 16px', fontSize: '1rem' },
    }

    const baseStyle: React.CSSProperties = {
      width: '100%',
      borderRadius: '8px',
      border: `1px solid ${error ? 'var(--danger-border)' : 'var(--border-default)'}`,
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      outline: 'none',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
      fontFamily: 'inherit',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      ...sizeStyles[selectSize],
      ...style,
    }

    return (
      <select ref={ref} {...props} style={baseStyle}>
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'
