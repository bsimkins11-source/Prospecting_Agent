"use client";
import { useState } from "react";
import type { ProspectResult } from "@/types";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          {/* Company Overview */}
          <div style={{ 
            backgroundColor: "#f8fafc", 
            padding: "1.5rem", 
            borderRadius: "12px", 
            marginBottom: "2rem",
            border: "1px solid #e2e8f0"
          }}>
            <h2 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "bold", 
              marginBottom: "1rem",
              color: "#1f2937"
            }}>
              🏢 {data.company?.name || "Company"}
            </h2>
            
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

          {/* Account Map */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ 
              fontSize: "1.25rem", 
              fontWeight: "bold", 
              marginBottom: "1rem",
              color: "#1f2937"
            }}>
              👥 Account Map
            </h3>
            
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
          </div>

          {/* Articles */}
          {data.articles && data.articles.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "bold", 
                marginBottom: "1rem",
                color: "#1f2937"
              }}>
                📰 Recent Articles
              </h3>
              
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
            </div>
          )}

          {/* TP Alignment */}
          {data.tp_alignment && data.tp_alignment.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "bold", 
                marginBottom: "1rem",
                color: "#1f2937"
              }}>
                🎯 TP Solution Alignment
              </h3>
              
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
            </div>
          )}

          {/* Child Brands */}
          {data.child_brands && data.child_brands.is_portfolio_company && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "bold", 
                marginBottom: "1rem",
                color: "#1f2937"
              }}>
                🏢 Portfolio Company
              </h3>
              
              <div style={{ 
                backgroundColor: "#f8fafc", 
                padding: "1.5rem", 
                borderRadius: "12px", 
                border: "1px solid #e2e8f0"
              }}>
                <h4 style={{ 
                  margin: "0 0 1rem 0", 
                  color: "#1f2937",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  Parent Company: {data.child_brands.parent_company}
                </h4>
                
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ color: "#374151" }}>Key Child Brands:</strong>
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: "0.5rem", 
                    marginTop: "0.5rem" 
                  }}>
                    {data.child_brands.child_brands.map((brand, i) => (
                      <span key={i} style={{
                        backgroundColor: "#e5e7eb",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "16px",
                        fontSize: "0.875rem",
                        color: "#374151"
                      }}>
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p style={{ 
                  margin: 0, 
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  fontStyle: "italic"
                }}>
                  {data.child_brands.note}
                </p>
              </div>
            </div>
          )}

          {/* Technology Stack Analysis */}
          {data.technology_stack && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "bold", 
                marginBottom: "1rem",
                color: "#1f2937"
              }}>
                🔧 Technology Stack Analysis
              </h3>
              
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                {/* Technology Categories */}
                {Object.entries(data.technology_stack).filter(([key]) => 
                  !['potential_issues', 'integration_complexity', 'recommendation'].includes(key)
                ).map(([category, tech]) => (
                  <div key={category} style={{ 
                    backgroundColor: "#f8fafc", 
                    padding: "1rem", 
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <h4 style={{ 
                      margin: "0 0 0.5rem 0", 
                      color: "#374151",
                      fontSize: "1rem",
                      fontWeight: "600",
                      textTransform: "capitalize"
                    }}>
                      {category.replace('_', ' ')}
                    </h4>
                    
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Primary:</strong> {tech.primary}
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Secondary:</strong> {tech.secondary}
                    </div>
                    
                    {tech.potential_issues && (
                      <div>
                        <strong style={{ color: "#dc2626" }}>Potential Issues:</strong>
                        <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                          {tech.potential_issues.map((issue, i) => (
                            <li key={i} style={{ 
                              fontSize: "0.875rem", 
                              color: "#6b7280",
                              marginBottom: "0.25rem"
                            }}>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Integration Issues */}
              {data.technology_stack.potential_issues && data.technology_stack.potential_issues.length > 0 && (
                <div style={{ 
                  backgroundColor: "#fef2f2", 
                  padding: "1.5rem", 
                  borderRadius: "12px", 
                  border: "1px solid #fecaca",
                  marginBottom: "1rem"
                }}>
                  <h4 style={{ 
                    margin: "0 0 1rem 0", 
                    color: "#dc2626",
                    fontSize: "1.1rem",
                    fontWeight: "600"
                  }}>
                    ⚠️ Critical Integration Issues
                  </h4>
                  
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {data.technology_stack.potential_issues.map((issue, i) => (
                      <div key={i} style={{ 
                        backgroundColor: "white", 
                        padding: "1rem", 
                        borderRadius: "8px",
                        border: "1px solid #fecaca"
                      }}>
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          marginBottom: "0.5rem"
                        }}>
                          <h5 style={{ 
                            margin: 0, 
                            color: "#dc2626",
                            fontSize: "1rem",
                            fontWeight: "600"
                          }}>
                            {issue.category}
                          </h5>
                          <span style={{
                            backgroundColor: issue.impact === 'High' ? "#dc2626" : "#f59e0b",
                            color: "white",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "600"
                          }}>
                            {issue.impact} Impact
                          </span>
                        </div>
                        
                        <p style={{ 
                          margin: "0 0 0.5rem 0", 
                          color: "#374151",
                          fontSize: "0.875rem"
                        }}>
                          <strong>Issue:</strong> {issue.issue}
                        </p>
                        
                        <p style={{ 
                          margin: 0, 
                          color: "#059669",
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}>
                          <strong>Solution:</strong> {issue.solution}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integration Complexity & Recommendation */}
              <div style={{ 
                backgroundColor: "#f0f9ff", 
                padding: "1.5rem", 
                borderRadius: "12px", 
                border: "1px solid #bae6fd"
              }}>
                <div style={{ marginBottom: "1rem" }}>
                  <strong>Integration Complexity:</strong> 
                  <span style={{
                    backgroundColor: data.technology_stack.integration_complexity === 'High' ? "#dc2626" : "#f59e0b",
                    color: "white",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginLeft: "0.5rem"
                  }}>
                    {data.technology_stack.integration_complexity}
                  </span>
                </div>
                
                <p style={{ 
                  margin: 0, 
                  color: "#0369a1",
                  fontSize: "0.875rem",
                  fontWeight: "600"
                }}>
                  <strong>Recommendation:</strong> {data.technology_stack.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
