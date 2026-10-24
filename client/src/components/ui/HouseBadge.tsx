// House color map
export const HOUSE_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  Gryffindor:  { primary: '#D3A625', secondary: '#740001', bg: 'rgba(116,0,1,0.15)' },
  Hufflepuff:  { primary: '#ECB939', secondary: '#372E29', bg: 'rgba(236,185,57,0.15)' },
  Ravenclaw:   { primary: '#946B2D', secondary: '#0E1A40', bg: 'rgba(14,26,64,0.3)' },
  Slytherin:   { primary: '#5D5D5D', secondary: '#1A472A', bg: 'rgba(26,71,42,0.2)' },
};

interface HouseBadgeProps {
  house: string;
  size?: 'sm' | 'md';
}

export default function HouseBadge({ house, size = 'sm' }: HouseBadgeProps) {
  const colors = HOUSE_COLORS[house] || { primary: '#d4af37', secondary: '#1a0a2e', bg: 'rgba(212,175,55,0.1)' };
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold font-heading ${padding}`}
      style={{ backgroundColor: colors.bg, color: colors.primary, border: `1px solid ${colors.primary}40` }}>
      {house}
    </span>
  );
}
