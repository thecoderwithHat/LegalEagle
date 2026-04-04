const axios = require('axios');
require('dotenv').config();
const { jsonrepair } = require('jsonrepair');
const DEFAULT_PROVIDER = 'openrouter';
const DEFAULT_OPENROUTER_MODEL = 'google/gemma-4-31b-it';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

const normalizeEnvValue = (value) => {
  if (!value) return '';
  const trimmed = value.trim();
  return trimmed.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
};

const getActiveProvider = () =>
  (process.env.AI_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();

const getActiveModel = (provider) => {
  if (provider === 'gemini') {
    return (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
  }
  return (process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL).trim();
};

exports.getActiveAiConfig = () => {
  const provider = getActiveProvider();
  return {
    provider,
    model: getActiveModel(provider)
  };
};

const buildPrompt = (documentText) => `
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
Only respond with a single top-level JSON object.

Analyze the following document:

"""
${documentText}
"""
`;

const parseModelJsonResponse = (rawReply) => {
  if (!rawReply) {
    throw new Error('No summary returned by the model');
  }

  const cleanedReply = rawReply
    .replace(/^```json\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/g, '')
    .trim();

  try {
    return JSON.parse(cleanedReply);
  } catch (parseError) {
    try {
      return JSON.parse(jsonrepair(cleanedReply));
    } catch (repairError) {
      console.error('Failed to parse/repair JSON:', repairError);
      console.error('Raw reply was:', rawReply);
      throw new Error('Model did not return valid JSON.');
    }
  }
};

const summarizeWithOpenRouter = async (prompt, model) => {
  const OPENROUTER_API_KEY = normalizeEnvValue(process.env.OPENROUTER_API_KEY);
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
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
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'LegalEagle Document Summarizer'
      }
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim();
};

const summarizeWithGemini = async (prompt, model) => {
  const GEMINI_API_KEY = normalizeEnvValue(process.env.GEMINI_API_KEY);
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const response = await axios.post(
    endpoint,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 1000
      }
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('\n')
    .trim();
};

exports.summarizeDocumentText = async (text) => {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for summarization');
  }

  const MAX_CHARS = 3000;
  const documentText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const prompt = buildPrompt(documentText);
  const { provider, model } = exports.getActiveAiConfig();

  try {
    let rawReply;
    if (provider === 'gemini') {
      rawReply = await summarizeWithGemini(prompt, model);
    } else if (provider === 'openrouter') {
      rawReply = await summarizeWithOpenRouter(prompt, model);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return parseModelJsonResponse(rawReply);

  } catch (err) {
    const providerError = err.response?.data?.error?.message || err.response?.data?.error?.status || err.message;
    if (String(providerError).includes('Rate limit exceeded')) {
      throw new Error('AI service is busy (rate limit exceeded). Please wait a minute and try again.');
    }
    console.error(`AI summarization error (${provider}):`, err.response?.data || err.message);
    throw new Error(`Document summarization failed for provider '${provider}'. Please check API key, model, or content format.`);
  }
};

// Summarize a large document by splitting into chunks and combining summaries
exports.summarizeLargeDocumentText = async (text) => {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for summarization');
  }

  const MAX_CHARS = 3000;
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHARS) {
    chunks.push(text.slice(i, i + MAX_CHARS));
  }

  const summaries = [];
  for (const chunk of chunks) {
    try {
      const result = await exports.summarizeDocumentText(chunk);
      if (result && result.plain_english_summary) {
        summaries.push(result.plain_english_summary);
      }
    } catch (err) {
      summaries.push('[Error summarizing chunk]');
    }
  }

  // Combine all chunk summaries into one
  return { summary: summaries.join('\n\n') };
};
