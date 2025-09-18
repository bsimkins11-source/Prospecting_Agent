// Simple OpenAI Test
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('🔍 Testing OpenAI API directly...');
  
  try {
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || "" 
    });
    
    console.log('✅ OpenAI client created');
    console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello in JSON format: {\"message\": \"hello\"}" }],
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('✅ OpenAI response received');
    console.log('📝 Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

testOpenAI();