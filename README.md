# 🎯 Prospecting Copilot

A Next.js application that provides comprehensive B2B prospect intelligence using Apollo.io and OpenAI.

## Features

- **Company Intelligence**: Get company overview, industry, revenue, employee count, and locations
- **Account Mapping**: Find key contacts across Marketing, Data/Analytics, Media, Customer Insights, and Procurement
- **News Analysis**: Discover recent articles about AI/MarTech/AdTech/Data topics
- **Solution Alignment**: AI-powered suggestions for Transparent Partners solution mapping

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **APIs**: Apollo.io (company/contact/news data), OpenAI (summaries & analysis)
- **Language**: TypeScript
- **Deployment**: Vercel-ready

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `env.example` to `.env.local` and fill in your API keys:

```bash
cp env.example .env.local
```

Required environment variables:
- `APOLLO_API_KEY`: Your Apollo.io API key
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4o-mini)

### 3. Get API Keys

#### Apollo.io API Key
1. Sign up at [Apollo.io](https://apollo.io)
2. Go to Settings > API Keys
3. Create a new API key with access to:
   - Organization Enrichment
   - People Search
   - News Articles

**API Documentation**: [Apollo.io API Docs](https://docs.apollo.io/reference/people-search)

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key in your account settings
3. Ensure you have credits/billing set up

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. Enter a company domain (preferred) or company name
2. Click "Run Analysis" or press Enter
3. View comprehensive prospect intelligence including:
   - Company overview and key metrics
   - Account map with key contacts by department
   - Recent relevant articles with AI-generated insights
   - Solution alignment suggestions

## API Endpoints

### POST `/api/prospect`

Analyzes a company and returns prospect intelligence.

**Request Body:**
```json
{
  "company": "coca-cola.com"
}
```

**Response:**
```json
{
  "company": {
    "name": "The Coca-Cola Company",
    "website": "coca-cola.com",
    "industry": "Food & Beverages",
    "revenue": "$43.0B",
    "employees": 79000,
    "locations": ["Atlanta, US", "London, UK"],
    "overview": "The Coca-Cola Company is a global beverage leader..."
  },
  "accountMap": {
    "Marketing": [
      {
        "name": "John Smith",
        "title": "Chief Marketing Officer",
        "seniority": "c_suite",
        "linkedin_url": "https://linkedin.com/in/johnsmith"
      }
    ]
  },
  "articles": [
    {
      "title": "Coca-Cola's AI-Driven Marketing Strategy",
      "url": "https://example.com/article",
      "source": "Marketing Weekly",
      "published_at": "2024-01-15",
      "why_it_matters": "Shows Coca-Cola's investment in AI for marketing optimization"
    }
  ],
  "tp_alignment": [
    {
      "need": "Marketing data governance",
      "suggested_solution": "Metadata governance with Claravine",
      "rationale": "Large consumer brand needs standardized marketing data"
    }
  ]
}
```

## Project Structure

```
/app
  /api/prospect/route.ts    # API endpoint for prospect analysis
  page.tsx                  # Main UI component
/lib
  apollo.ts                 # Apollo.io API integration
  openai.ts                 # OpenAI API integration
/types.ts                   # TypeScript type definitions
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## API Rate Limits & Costs

- **Apollo.io**: Check your plan limits for organization enrichment, people search, and news articles
- **OpenAI**: Costs depend on model and usage. Monitor usage in OpenAI dashboard

## Customization

### Adding New Account Map Lanes

Edit the `LANE_CONFIG` in `/app/api/prospect/route.ts`:

```typescript
const LANE_CONFIG = {
  // Add new lanes here
  "Sales": { 
    departments: ["sales"], 
    titles: ["CRO", "VP Sales", "Head of Sales"] 
  }
};
```

### Modifying Solution Alignment

Update the OpenAI prompt in `/app/api/prospect/route.ts` to include your specific solutions and use cases.

## Troubleshooting

### Common Issues

1. **"APOLLO_API_KEY environment variable is required"**
   - Ensure your `.env.local` file has the correct API key
   - Restart your development server after adding environment variables

2. **"OpenAI API error"**
   - Verify your OpenAI API key is valid and has credits
   - Check if you're hitting rate limits

3. **No contacts found**
   - Apollo.io data varies by company
   - Try using the company's exact domain name
   - Some companies may have limited public contact data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
