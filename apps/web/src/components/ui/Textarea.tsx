import { type TextareaHTMLAttributes, forwardRef } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, className = '', ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-colors resize-y ${
            error ? 'border-red-500' : 'border-gray-700'
          } ${className}`}
          rows={3}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
