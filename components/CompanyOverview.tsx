import { Company } from '@/types';
import { createTypographyStyle, formatNumber, formatDate } from '@/lib/utils';
import { COLORS, SPACING } from '@/lib/constants';

interface CompanyOverviewProps {
  company: Company;
}

export default function CompanyOverview({ company }: CompanyOverviewProps) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.lg }}>
        {company.logo_url && (
          <img
            src={company.logo_url}
            alt={`${company.name} logo`}
            style={{
              width: "60px",
              height: "60px",
              objectFit: "contain",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`
            }}
          />
        )}
        <div>
          <h1 style={createTypographyStyle('h1')}>{company.name}</h1>
          <div style={{ display: "flex", gap: SPACING.lg, flexWrap: "wrap", marginTop: SPACING.sm }}>
            {company.industry && (
              <span style={{ color: COLORS.text.secondary, fontSize: "0.875rem" }}>
                📊 {company.industry}
              </span>
            )}
            {company.revenue && (
              <span style={{ color: COLORS.text.secondary, fontSize: "0.875rem" }}>
                💰 {company.revenue}
              </span>
            )}
            {company.employees && (
              <span style={{ color: COLORS.text.secondary, fontSize: "0.875rem" }}>
                👥 {formatNumber(company.employees)} employees
              </span>
            )}
            {company.founded_year && (
              <span style={{ color: COLORS.text.secondary, fontSize: "0.875rem" }}>
                📅 Founded {company.founded_year}
              </span>
            )}
          </div>
        </div>
      </div>

      {company.overview && (
        <div style={{ marginBottom: SPACING.lg }}>
          <h3 style={createTypographyStyle('h3')}>Overview</h3>
          <p style={{ color: COLORS.text.secondary, lineHeight: "1.6", margin: 0 }}>
            {company.overview}
          </p>
        </div>
      )}

      {company.locations && company.locations.length > 0 && (
        <div style={{ marginBottom: SPACING.lg }}>
          <h3 style={createTypographyStyle('h3')}>Locations</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.sm }}>
            {company.locations.map((location, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: COLORS.surface,
                  color: COLORS.text.secondary,
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  borderRadius: "6px",
                  fontSize: "0.875rem"
                }}
              >
                📍 {location}
              </span>
            ))}
          </div>
        </div>
      )}

      {company.keywords && (
        <div style={{ marginBottom: SPACING.lg }}>
          <h3 style={createTypographyStyle('h3')}>Keywords</h3>
          <p style={{ color: COLORS.text.secondary, fontSize: "0.875rem", margin: 0 }}>
            {company.keywords}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: SPACING.md, flexWrap: "wrap" }}>
        {company.website && (
          <a
            href={`https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: COLORS.primary,
              textDecoration: "none",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: SPACING.xs
            }}
          >
            🌐 {company.website}
          </a>
        )}
        {company.linkedin_url && (
          <a
            href={company.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: COLORS.primary,
              textDecoration: "none",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: SPACING.xs
            }}
          >
            💼 LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
