#!/bin/bash

# Prospecting Copilot Setup Script

echo "🎯 Setting up Prospecting Copilot..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from env.example..."
    cp env.example .env.local
    echo "✅ Created .env.local - please add your API keys!"
    echo ""
    echo "Required API keys:"
    echo "- APOLLO_API_KEY: Get from https://apollo.io"
    echo "- OPENAI_API_KEY: Get from https://platform.openai.com"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your API keys to .env.local"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "Happy prospecting! 🎯"
