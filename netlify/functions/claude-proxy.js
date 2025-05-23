const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const fetch = require('node-fetch'); // Using node-fetch

const app = express();

// Add this logging middleware
app.use((req, res, next) => {
  console.log(`Netlify Function Info: Received request - Method: ${req.method}, Path: ${req.path}, OriginalURL: ${req.originalUrl}`);
  next();
});

// CORS Configuration: In production, restrict this to your Netlify frontend URL
// For now, keeping it open for easier initial deployment, but you SHOULD restrict this.
// Example: const allowedOrigins = ['YOUR_NETLIFY_APP_URL.netlify.app'];
app.use(cors({ origin: '*' })); 
app.use(express.json({ limit: '10mb' }));

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Health check endpoint - useful for debugging the function
app.get('/api/health', (req, res) => {
  console.log('Netlify Function Info: /api/health route hit');
  res.json({ 
    status: 'OK', 
    message: 'Claude API Proxy Netlify Function is running',
    note: 'Users provide their own Claude API keys via x-claude-api-key header'
  });
});

// Claude API proxy endpoint
// The path here will be relative to the function's endpoint.
// With the netlify.toml rewrite from /api/* to /.netlify/functions/claude-proxy/:splat
// a request to /api/claude/chat on your site will be routed to /api/claude/chat here.
app.post('/api/claude/chat', async (req, res) => {
  console.log('Netlify Function Info: /api/claude/chat route hit');
  try {
    console.log('Netlify Function: Received request to /api/claude/chat');
    
    // Get API key from request headers (user provides their own)
    const apiKey = req.headers['x-claude-api-key'];
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Missing API key. Please provide x-claude-api-key header.' 
      });
    }

    const { messages, system, model = 'claude-3-sonnet-20240229', max_tokens = 4000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request. Messages array is required.' 
      });
    }

    console.log(`Netlify Function: Making request to Claude API with ${messages.length} messages`);

    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Use the API key from request header
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system,
        messages
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Netlify Function: Claude API error:', claudeResponse.status, errorText);
      return res.status(claudeResponse.status).json({ 
        error: `Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}`,
        details: errorText
      });
    }

    const data = await claudeResponse.json();
    console.log('Netlify Function: Successfully received response from Claude API');
    res.json(data);

  } catch (error) {
    console.error('Netlify Function: Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error in Netlify function', 
      message: error.message 
    });
  }
});

// Error handling middleware for the Express app wrapped by serverless-http
app.use((error, req, res, next) => {
  console.error('Netlify Function: Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error in Netlify function',
    message: error.message 
  });
});

// Export the handler for Netlify
module.exports.handler = serverless(app); 