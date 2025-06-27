const axios = require('axios');
require('dotenv').config();
const { jsonrepair } = require('jsonrepair');
const rateLimit = require('express-rate-limit');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = 'qwen/qwen3-8b:free';

exports.summarizeDocumentText = async (text) => {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for summarization');
  }

  const MAX_CHARS = 3000;
  const documentText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

const prompt = `
You are a professional legal assistant trained to analyze legal documents. 
Respond ONLY in valid JSON format with this structure:

{
  "document_type": "<Type of document, e.g., Legal Contract, NDA, Resume, etc.>",
  "identified_risks": ["<Risk 1>", "..."] or ["None found"],
  "fraud_indicators": ["<Indicator 1>", "..."] or ["None found"],
  "grammatical_issues": ["<Issue 1>", "..."] or ["None found"],
  "plain_english_summary": "<Summary of the document in plain English>"
}

Ensure all fields are filled. If nothing is found, use "None found" or ["None found"] appropriately.
Only respond with a single top-level JSON object with a 'summary' key — no nested summary inside summary.

Analyze the following document:

"""
${documentText}
"""
`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a helpful legal assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.4,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost', // Optional: set your app domain here
          'X-Title': 'LegalEagle Document Summarizer' // Optional: set a title for your app
        }
      }
    );

    const rawReply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!rawReply) throw new Error('No summary returned by the model');

    // Remove code block markers if present
    let cleanedReply = rawReply.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/g, '').trim();

    let parsedJson;
    try {
      parsedJson = JSON.parse(cleanedReply);
    } catch (parseError) {
      try {
        // Try to repair the JSON
        parsedJson = JSON.parse(jsonrepair(cleanedReply));
      } catch (repairError) {
        console.error('Failed to parse/repair JSON:', repairError);
        console.error('Raw reply was:', rawReply);
        throw new Error('Model did not return valid JSON.');
      }
    }

    return parsedJson;

  } catch (err) {
    if (err.response?.data?.error?.message?.includes('Rate limit exceeded')) {
      throw new Error('AI service is busy (rate limit exceeded). Please wait a minute and try again.');
    }
    console.error('OpenRouter summarization error:', err.response?.data || err.message);
    throw new Error('Document summarization failed. Please check the API key, model, or content format.');
  }
};
