import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>}
      <input
        {...props}
        className={`px-4 py-2.5 rounded-lg border bg-transparent text-sm outline-none transition-all duration-200
          focus:ring-2 ${className}`}
        style={{
          borderColor: error ? '#f87171' : 'rgba(212,175,55,0.3)',
          color: 'var(--color-text-primary)',
          ['--tw-ring-color' as any]: 'rgba(212,175,55,0.4)',
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
