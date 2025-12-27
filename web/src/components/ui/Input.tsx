import React, { forwardRef } from 'react'

type InputSize = 'sm' | 'md' | 'lg'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: InputSize
  error?: boolean
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', error = false, icon, suffix, style, className, ...props }, ref) => {
    const sizeStyles: Record<InputSize, React.CSSProperties> = {
      sm: { padding: '6px 10px', fontSize: '0.8125rem' },
      md: { padding: '10px 12px', fontSize: '0.875rem' },
      lg: { padding: '12px 16px', fontSize: '1rem' },
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
      ...sizeStyles[inputSize],
      ...(icon && { paddingLeft: '40px' }),
      ...(suffix && { paddingRight: '40px' }),
      ...style,
    }

    if (icon || suffix) {
      return (
        <div style={{ position: 'relative', width: '100%' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </span>
          )}
          <input ref={ref} {...props} style={baseStyle} />
          {suffix && (
            <span
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {suffix}
            </span>
          )}
        </div>
      )
    }

    return <input ref={ref} {...props} style={baseStyle} />
  }
)

Input.displayName = 'Input'
