import { type TextareaHTMLAttributes, forwardRef } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, helperText, className = '', ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2.5 
            bg-dark-900 border rounded-lg
            text-white placeholder:text-gray-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' 
              : 'border-dark-700 hover:border-dark-600 focus:border-brand-500 focus:ring-brand-500/50'
            }
            ${className}
          `}
          {...rest}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
