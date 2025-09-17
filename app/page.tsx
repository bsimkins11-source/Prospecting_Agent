"use client";
import { useState } from "react";
import type { ProspectResult } from "@/types";

// Navigation sections
const SECTIONS = [
  { id: "overview", title: "Company Overview", icon: "🏢" },
  { id: "account-map", title: "Account Map", icon: "👥" },
  { id: "articles", title: "Industry News", icon: "📰" },
  { id: "portfolio", title: "Portfolio Analysis", icon: "🏢" },
  { id: "tech-stack", title: "Technology Stack", icon: "🔧" },
  { id: "tp-alignment", title: "TP Solutions", icon: "🎯" }
];

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    "account-map": true,
    articles: false,
    portfolio: false,
    "tech-stack": false,
    "tp-alignment": false
  });

  const run = async () => {
    if (!input.trim()) return;
    
    setLoading(true); 
    setError(null); 
    setData(null);
    
    try {
      const res = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: input.trim() })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        setError(json.error || "Failed to fetch prospect data");
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && input.trim()) {
      run();
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const expandAllSections = () => {
    setExpandedSections({
      overview: true,
      "account-map": true,
      articles: true,
      portfolio: true,
      "tech-stack": true,
      "tp-alignment": true
    });
  };

  const collapseAllSections = () => {
    setExpandedSections({
      overview: true,
      "account-map": true,
      articles: false,
      portfolio: false,
      "tech-stack": false,
      "tp-alignment": false
    });
  };

  return (
    <main style={{ 
      maxWidth: 900, 
      margin: "40px auto", 
      padding: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img 
          src="/transparent-logo.png" 
          alt="Transparent Partners Logo" 
          style={{ height: "80px", width: "auto", marginBottom: "1rem" }}
        />
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", margin: 0 }}>
          Transparent Partners Prospecting Agent
        </h1>
      </div>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Enter a company domain (preferred) or name to get comprehensive prospect insights.
      </p>
      
      <div style={{ display: "flex", gap: 12, marginBottom: "2rem" }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g. coca-cola.com or Coca-Cola" 
          style={{ 
            flex: 1, 
            padding: "12px 16px", 
            border: "2px solid #e1e5e9",
            borderRadius: "8px",
            fontSize: "16px",
            outline: "none",
            transition: "border-color 0.2s"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#e1e5e9"}
        />
        <button 
          onClick={run} 
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: loading || !input.trim() ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>

      {loading && (
        <div style={{ 
          padding: "2rem", 
          textAlign: "center", 
          color: "#666",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0"
        }}>
          <p style={{ margin: 0 }}>🔍 Gathering prospect intelligence...</p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#fef2f2", 
          border: "1px solid #fecaca",
          borderRadius: "8px",
          color: "#dc2626",
          marginBottom: "1rem"
        }}>
          ❌ {error}
        </div>
      )}
      
      {data && (
        <div style={{ marginTop: "2rem" }}>
          {/* Navigation */}
          <div style={{ 
            backgroundColor: "#ffffff", 
            padding: "1.5rem", 
            borderRadius: "12px", 
            marginBottom: "2rem",
            border: "2px solid #e2e8f0",
            position: "sticky",
            top: "20px",
            zIndex: 10
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "bold", 
                margin: 0,
                color: "#1f2937"
              }}>
                📋 Report Navigation
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  onClick={expandAllSections}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Expand All
                </button>
                <button 
                  onClick={collapseAllSections}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Collapse All
                </button>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: expandedSections[section.id] ? "#3b82f6" : "#f3f4f6",
                    color: expandedSections[section.id] ? "white" : "#374151",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Company Overview */}
          <div id="overview" style={{ 
            backgroundColor: "#f8fafc", 
            padding: "1.5rem", 
            borderRadius: "12px", 
            marginBottom: "2rem",
            border: "1px solid #e2e8f0"
          }}>
            <div 
              onClick={() => toggleSection('overview')}
              style={{ 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: expandedSections.overview ? "1rem" : "0"
              }}
            >
              <h2 style={{ 
                fontSize: "1.5rem", 
                fontWeight: "bold", 
                margin: 0,
                color: "#1f2937"
              }}>
                🏢 {data.company?.name || "Company"}
              </h2>
              <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>
                {expandedSections.overview ? "−" : "+"}
              </span>
            </div>
            
            {expandedSections.overview && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  {data.company?.industry && (
                    <div>
                      <strong>Industry:</strong> {data.company.industry}
                    </div>
                  )}
                  {data.company?.revenue && (
                    <div>
                      <strong>Revenue:</strong> {data.company.revenue}
                    </div>
                  )}
                  {data.company?.employees && (
                    <div>
                      <strong>Employees:</strong> {data.company.employees.toLocaleString()}
                    </div>
                  )}
                  {data.company?.website && (
                    <div>
                      <strong>Website:</strong> <a href={`https://${data.company.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>{data.company.website}</a>
                    </div>
                  )}
                </div>
                
                {data.company?.locations && data.company.locations.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Locations:</strong> {data.company.locations.join(" • ")}
                  </div>
                )}
                
                {data.company?.overview && (
                  <div style={{ 
                    backgroundColor: "white", 
                    padding: "1rem", 
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <strong>Overview:</strong> {data.company.overview}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Map */}
          <div id="account-map" style={{ marginBottom: "2rem" }}>
            <div 
              onClick={() => toggleSection('account-map')}
              style={{ 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: expandedSections["account-map"] ? "1rem" : "0"
              }}
            >
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "bold", 
                margin: 0,
                color: "#1f2937"
              }}>
                👥 Account Map
              </h3>
              <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>
                {expandedSections["account-map"] ? "−" : "+"}
              </span>
            </div>
            
            {expandedSections["account-map"] && (
              <div style={{ display: "grid", gap: "1rem" }}>
                {Object.entries(data.accountMap || {}).map(([lane, people]) => (
                  <div key={lane} style={{ 
                    backgroundColor: "#f8fafc", 
                    padding: "1rem", 
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <h4 style={{ 
                      fontWeight: "600", 
                      marginBottom: "0.5rem",
                      color: "#374151"
                    }}>
                      {lane}
                    </h4>
                    
                    {people.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                        {people.map((p, i) => (
                          <li key={i} style={{ marginBottom: "0.25rem" }}>
                            <strong>{p.name}</strong> — {p.title}
                            {p.seniority && ` (${p.seniority})`}
                            {p.linkedin_url && (
                              <span style={{ marginLeft: "0.5rem" }}>
                                <a 
                                  href={p.linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: "#3b82f6", textDecoration: "none" }}
                                >
                                  LinkedIn ↗
                                </a>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: "#6b7280", margin: 0, fontStyle: "italic" }}>
                        No contacts found for this department
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Articles */}
          {data.articles && data.articles.length > 0 && (
            <div id="articles" style={{ marginBottom: "2rem" }}>
              <div 
                onClick={() => toggleSection('articles')}
                style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: expandedSections.articles ? "1rem" : "0"
                }}
              >
                <h3 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "bold", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  📰 Recent Articles
                </h3>
                <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>
                  {expandedSections.articles ? "−" : "+"}
                </span>
              </div>
              
              {expandedSections.articles && (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {data.articles.map((a, i) => (
                    <div key={i} style={{ 
                      backgroundColor: "#f8fafc", 
                      padding: "1rem", 
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <h4 style={{ margin: "0 0 0.5rem 0" }}>
                        <a 
                          href={a.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: "#1f2937", 
                            textDecoration: "none",
                            fontSize: "1rem",
                            fontWeight: "600"
                          }}
                        >
                          {a.title} ↗
                        </a>
                      </h4>
                      
                      {a.source && (
                        <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                          {a.source}
                          {a.published_at && ` • ${new Date(a.published_at).toLocaleDateString()}`}
                        </div>
                      )}
                      
                      {a.why_it_matters && (
                        <p style={{ 
                          margin: 0, 
                          color: "#374151",
                          fontSize: "0.875rem",
                          fontStyle: "italic"
                        }}>
                          <strong>Why it matters:</strong> {a.why_it_matters}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TP Alignment */}
          {data.tp_alignment && data.tp_alignment.length > 0 && (
            <div id="tp-alignment">
              <div 
                onClick={() => toggleSection('tp-alignment')}
                style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: expandedSections["tp-alignment"] ? "1rem" : "0"
                }}
              >
                <h3 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "bold", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  🎯 TP Solution Alignment
                </h3>
                <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>
                  {expandedSections["tp-alignment"] ? "−" : "+"}
                </span>
              </div>
              
              {expandedSections["tp-alignment"] && (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {data.tp_alignment.map((t, i) => (
                    <div key={i} style={{ 
                      backgroundColor: "#f0f9ff", 
                      padding: "1rem", 
                      borderRadius: "8px",
                      border: "1px solid #bae6fd"
                    }}>
                      <h4 style={{ 
                        margin: "0 0 0.5rem 0", 
                        color: "#0369a1",
                        fontSize: "1rem",
                        fontWeight: "600"
                      }}>
                        {t.need}
                      </h4>
                      
                      <p style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
                        <strong>Suggested Solution:</strong> {t.suggested_solution}
                      </p>
                      
                      <p style={{ 
                        margin: 0, 
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        fontStyle: "italic"
                      }}>
                        <strong>Rationale:</strong> {t.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
