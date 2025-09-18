'use client';

import { useState } from 'react';

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  employees: number;
  revenue: string;
  location: string;
  description: string;
}

interface CompanySearchProps {
  onCompanySelect: (companyData: Company) => void;
}

export default function CompanySearch({ onCompanySelect }: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchCompanies = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/company-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      setError('Failed to search companies. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCompanies();
    }
  };

  const formatEmployees = (count: number) => {
    if (count === 0) return 'Unknown';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${Math.round(count / 1000)}K`;
    return `${Math.round(count / 1000000)}M`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Search for a Company
        </h2>
        <p className="text-gray-600 mb-4">
          Enter a company name to search our database and select the correct match.
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Verizon, Microsoft, Apple..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={searchCompanies}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {companies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Found {companies.length} companies:
          </h3>
          
          <div className="grid gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onCompanySelect(company)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {company.name}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {company.website}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                  <div>
                    <span className="font-medium">Industry:</span> {company.industry}
                  </div>
                  <div>
                    <span className="font-medium">Employees:</span> {formatEmployees(company.employees)}
                  </div>
                  <div>
                    <span className="font-medium">Revenue:</span> {company.revenue}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {company.location}
                  </div>
                </div>
                
                {company.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {company.description}
                  </p>
                )}
                
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Click to analyze this company
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {companies.length === 0 && !loading && query && (
        <div className="text-center py-8 text-gray-500">
          <p>No companies found matching "{query}"</p>
          <p className="text-sm mt-2">Try a different search term or check the spelling.</p>
        </div>
      )}
    </div>
  );
}
