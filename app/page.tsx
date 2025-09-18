"use client";
import { useState } from "react";
import type { ProspectResult, TechStackCategory } from "@/types";
import CompanySearch from "@/components/CompanySearch";


export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    "account-map": false,
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
        body: JSON.stringify({ 
          company: input.trim(),
          selectedCompany: selectedCompany // Pass the selected company data
        })
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

  const handleCompanySelect = (companyData: any) => {
    setInput(companyData.name);
    setShowSearch(false);
    // Store the selected company data for more accurate people search
    setSelectedCompany(companyData);
    run();
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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
        Enter a company name or domain to get comprehensive prospect insights. We'll resolve the company domain and show you verified contacts with LinkedIn profiles.
      </p>
      
      <div style={{ display: "flex", gap: 12, marginBottom: "2rem" }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g. Verizon, Microsoft, Apple..." 
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
          onClick={() => setShowSearch(!showSearch)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {showSearch ? "Hide Search" : "Search Companies"}
        </button>
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

      {showSearch && (
        <div style={{ marginBottom: "2rem" }}>
          <CompanySearch onCompanySelect={handleCompanySelect} />
        </div>
      )}

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

      {/* Debug panel for development */}
      {data && process.env.NODE_ENV === 'development' && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#f0f9ff", 
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          color: "#0369a1",
          marginBottom: "1rem",
          fontSize: "0.875rem"
        }}>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: "600" }}>🔧 Debug Info</h4>
          <div><strong>Company Domain:</strong> {data.company?.website}</div>
          <div><strong>Industry:</strong> {data.company?.industry}</div>
          <div><strong>Total People Found:</strong> {Object.values(data.accountMap || {}).flat().length}</div>
        </div>
      )}
      
        {data && (
          <div style={{ marginTop: "2rem" }}>

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
                          <li key={i} style={{ marginBottom: "0.5rem", padding: "0.5rem", backgroundColor: "#f8fafc", borderRadius: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                              <strong>{p.name}</strong>
                              <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>— {p.title}</span>
                              {p.seniority && (
                                <span style={{ 
                                  backgroundColor: "#e5e7eb", 
                                  padding: "0.125rem 0.375rem", 
                                  borderRadius: "12px", 
                                  fontSize: "0.75rem",
                                  color: "#374151"
                                }}>
                                  {p.seniority}
                                </span>
                              )}
                            </div>
                            
                            {/* Quality badges */}
                            <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                              {p.email && (
                                <span style={{ 
                                  backgroundColor: "#dcfce7", 
                                  color: "#166534", 
                                  padding: "0.125rem 0.375rem", 
                                  borderRadius: "12px", 
                                  fontSize: "0.75rem",
                                  fontWeight: "500"
                                }}>
                                  ✓ Verified Email
                                </span>
                              )}
                              {p.linkedin_url && (
                                <span style={{ 
                                  backgroundColor: "#dbeafe", 
                                  color: "#1e40af", 
                                  padding: "0.125rem 0.375rem", 
                                  borderRadius: "12px", 
                                  fontSize: "0.75rem",
                                  fontWeight: "500"
                                }}>
                                  ✓ LinkedIn
                                </span>
                              )}
                              {p.company && (
                                <span style={{ 
                                  backgroundColor: "#fef3c7", 
                                  color: "#92400e", 
                                  padding: "0.125rem 0.375rem", 
                                  borderRadius: "12px", 
                                  fontSize: "0.75rem",
                                  fontWeight: "500"
                                }}>
                                  ✓ {p.company}
                                </span>
                              )}
                            </div>
                            
                            {/* Contact details */}
                            <div style={{ marginLeft: "0", fontSize: "0.875rem", color: "#6b7280" }}>
                              {p.email && (
                                <div style={{ marginBottom: "0.25rem" }}>
                                  📧 <a href={`mailto:${p.email}`} style={{ color: "#059669", textDecoration: "none" }}>{p.email}</a>
                                </div>
                              )}
                              {p.linkedin_url && (
                                <div>
                                  🔗 <a 
                                    href={p.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: "#3b82f6", textDecoration: "none" }}
                                  >
                                    LinkedIn Profile ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: "#6b7280", margin: 0, fontStyle: "italic" }}>
                        No verified contacts found for this department
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Articles */}
          {false && (
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
                  {[].map((a, i) => (
                    <div key={i} style={{ 
                      backgroundColor: "#f8fafc", 
                      padding: "1rem", 
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <h4 style={{ margin: "0 0 0.5rem 0" }}>
                        <a 
                          href={"#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: "#1f2937", 
                            textDecoration: "none",
                            fontSize: "1rem",
                            fontWeight: "600"
                          }}
                        >
                          {"Article Title"}
                        </a>
                      </h4>
                      
                      <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                          Source
                        </div>
                      
                      <p style={{ 
                          margin: 0, 
                          color: "#374151",
                          fontSize: "0.875rem",
                          fontStyle: "italic"
                        }}>
                          <strong>Why it matters:</strong> Description
                        </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Child Brands */}
          {false && (
            <div id="portfolio" style={{ marginBottom: "2rem" }}>
              <div 
                onClick={() => toggleSection('portfolio')}
                style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: expandedSections.portfolio ? "1rem" : "0"
                }}
              >
                <h3 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "bold", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  🏢 Portfolio Company
                </h3>
                <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>
                  {expandedSections.portfolio ? "−" : "+"}
                </span>
              </div>
              
              {expandedSections.portfolio && (
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
                    Parent Company: {""}
                  </h4>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ color: "#374151" }}>Key Child Brands:</strong>
                    <div style={{ 
                      display: "flex", 
                      flexWrap: "wrap", 
                      gap: "0.5rem", 
                      marginTop: "0.5rem" 
                    }}>
                      {[].map((brand, i) => (
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
                    {""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Technology Stack Analysis */}
          {false && (
            <div id="tech-stack" style={{ marginBottom: "2rem" }}>
              <div 
                onClick={() => toggleSection('tech-stack')}
                style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: expandedSections["tech-stack"] ? "1rem" : "0"
                }}
              >
                <h3 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "bold", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  🔧 Technology Stack Analysis
                </h3>
                <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>
                  {expandedSections["tech-stack"] ? "−" : "+"}
                </span>
              </div>
              
              {expandedSections["tech-stack"] && (
                <div>
                  <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                    {/* Technology Categories */}
                    {Object.entries({}).filter(([key]) => 
                      !['potential_issues', 'integration_complexity', 'recommendation'].includes(key)
                    ).map(([category, tech]) => {
                      const techCategory = tech as TechStackCategory;
                      return (
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
                          <strong>Primary:</strong> {techCategory.primary}
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <strong>Secondary:</strong> {techCategory.secondary}
                        </div>
                        
                        {techCategory.potential_issues && (
                          <div>
                            <strong style={{ color: "#dc2626" }}>Potential Issues:</strong>
                            <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                              {techCategory.potential_issues.map((issue, i) => (
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
                      );
                    })}
                  </div>

                  {/* Integration Issues */}
                  {false && (
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
                        {[].map((issue, i) => (
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
                                {"Category"}
                              </h5>
                              <span style={{
                                backgroundColor: "#f59e0b",
                                color: "white",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: "600"
                              }}>
                                {"Impact"} Impact
                              </span>
                            </div>
                            
                            <p style={{ 
                              margin: "0 0 0.5rem 0", 
                              color: "#374151",
                              fontSize: "0.875rem"
                            }}>
                              <strong>Issue:</strong> {"Issue description"}
                            </p>
                            
                            <p style={{ 
                              margin: 0, 
                              color: "#059669",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}>
                              <strong>Solution:</strong> {"Solution description"}
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
                        backgroundColor: "#f59e0b",
                        color: "white",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginLeft: "0.5rem"
                      }}>
                        {""}
                      </span>
                    </div>
                    
                    <p style={{ 
                      margin: 0, 
                      color: "#0369a1",
                      fontSize: "0.875rem",
                      fontWeight: "600"
                    }}>
                      <strong>Recommendation:</strong> {""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TP Alignment */}
          {false && (
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
                  {[].map((t, i) => (
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
                        {"Need"}
                      </h4>
                      
                      <p style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
                        <strong>Suggested Solution:</strong> {"Solution"}
                      </p>
                      
                      <p style={{ 
                        margin: 0, 
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        fontStyle: "italic"
                      }}>
                        <strong>Rationale:</strong> {"Rationale"}
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
