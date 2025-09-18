import { Person, AccountMapLane } from '@/types';
import { createTypographyStyle, truncateText } from '@/lib/utils';
import { COLORS, SPACING, BORDER_RADIUS } from '@/lib/constants';

interface AccountMapProps {
  accountMap: Record<AccountMapLane, Person[]>;
}

export default function AccountMap({ accountMap }: AccountMapProps) {
  const getDepartmentIcon = (dept: string): string => {
    const icons: Record<string, string> = {
      'Marketing': '📈',
      'Media and Advertising': '📺',
      'Content and Creative': '✍️',
      'Social Media': '📱',
      'Brand': '🏷️',
      'CRM': '🤝',
      'MarTech': '🔧',
      'Analytics & Data': '📊',
      'Customer Strategy': '🎯'
    };
    return icons[dept] || '👥';
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={createTypographyStyle('h2')}>👥 Account Map</h2>
      <div style={{ display: "grid", gap: SPACING.lg }}>
        {Object.entries(accountMap).map(([dept, people]) => (
          <div key={dept} style={{ marginBottom: SPACING.lg }}>
            <h3 style={{
              ...createTypographyStyle('h3'),
              display: "flex",
              alignItems: "center",
              gap: SPACING.sm,
              marginBottom: SPACING.md
            }}>
              {getDepartmentIcon(dept)} {dept}
            </h3>
            
            {people.length > 0 ? (
              <div style={{ display: "grid", gap: SPACING.sm }}>
                {people.map((person, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: COLORS.surface,
                      padding: SPACING.md,
                      borderRadius: BORDER_RADIUS.md,
                      border: `1px solid ${COLORS.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: "600",
                        color: COLORS.text.primary,
                        marginBottom: SPACING.xs
                      }}>
                        {person.name}
                      </div>
                      <div style={{
                        color: COLORS.text.secondary,
                        fontSize: "0.875rem",
                        marginBottom: SPACING.xs
                      }}>
                        {person.title}
                      </div>
                      {person.seniority && (
                        <div style={{
                          color: COLORS.text.muted,
                          fontSize: "0.75rem",
                          textTransform: "capitalize"
                        }}>
                          {person.seniority.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", gap: SPACING.sm, alignItems: "center" }}>
                      {person.email && (
                        <a
                          href={`mailto:${person.email}`}
                          style={{
                            color: COLORS.primary,
                            textDecoration: "none",
                            fontSize: "0.875rem"
                          }}
                        >
                          📧
                        </a>
                      )}
                      {person.linkedin_url && (
                        <a
                          href={person.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: COLORS.primary,
                            textDecoration: "none",
                            fontSize: "0.875rem"
                          }}
                        >
                          💼
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                color: COLORS.text.muted,
                fontStyle: "italic",
                padding: SPACING.md,
                textAlign: "center",
                backgroundColor: COLORS.surface,
                borderRadius: BORDER_RADIUS.md,
                border: `1px solid ${COLORS.border}`
              }}>
                No contacts found for this department
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
