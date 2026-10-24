interface BadgeProps {
  text: string;
  color?: string;
  className?: string;
}

export default function Badge({ text, color, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={color ? { backgroundColor: `${color}33`, color, borderColor: `${color}66`, borderWidth: 1 } : {}}
    >
      {text}
    </span>
  );
}
