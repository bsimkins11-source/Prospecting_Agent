import { ReactNode } from 'react';
import { createTypographyStyle, createSectionHeaderStyle } from '@/lib/utils';
import { COLORS, SPACING } from '@/lib/constants';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: CollapsibleSectionProps) {
  return (
    <div id={id} style={{ marginBottom: "2rem" }}>
      <div
        onClick={() => onToggle(id)}
        style={createSectionHeaderStyle()}
      >
        <h3 style={createTypographyStyle('h3')}>
          {icon && `${icon} `}{title}
        </h3>
        <span style={{ fontSize: "1.5rem", color: COLORS.text.secondary }}>
          {isExpanded ? "−" : "+"}
        </span>
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: SPACING.md }}>
          {children}
        </div>
      )}
    </div>
  );
}
