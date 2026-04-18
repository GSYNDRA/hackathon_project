const axios = require('axios');

const BASE_URL = process.env.AI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4';
const MODEL = process.env.AI_MODEL || 'glm-4.6';
const API_KEY = process.env.AI_API_KEY;

function extractJson(text) {
  if (!text) return null;
  // Strip markdown code fences if present
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  // Find the first { ... } that parses
  const start = raw.indexOf('{');
  if (start === -1) return null;
  for (let end = raw.length; end > start; end--) {
    const slice = raw.slice(start, end);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  return null;
}

function validateQuestions(parsed) {
  if (!parsed || !Array.isArray(parsed.questions)) return null;
  const clean = [];
  for (const q of parsed.questions) {
    if (!q || typeof q.question_text !== 'string' || !q.question_text.trim()) continue;
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;
    const options = q.options.map((o) => String(o).trim());
    if (options.some((o) => !o)) continue;
    const idx = Number(q.correct_answer_idx);
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) continue;
    clean.push({
      question_text: q.question_text.trim(),
      options,
      correct_answer_idx: idx,
    });
  }
  return clean.length ? clean : null;
}

class AiController {
  async generateQuestions(req, res) {
    try {
      if (!API_KEY) {
        return res.status(500).json({ error: 'AI_API_KEY is not configured on the server' });
      }
      const { topic, count = 5, difficulty = 'medium' } = req.body || {};
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        return res.status(400).json({ error: 'topic is required' });
      }
      const n = Math.max(1, Math.min(10, parseInt(count) || 5));
      const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

      const systemPrompt =
        'You are a concise exam-question generator. Always respond with a single JSON object matching the schema requested. Never include prose, markdown, or explanations outside the JSON.';

      const userPrompt = `Generate ${n} multiple-choice questions about "${topic}" at ${diff} difficulty.
Each question must have exactly 4 options and a correct_answer_idx (integer 0-3 matching the correct option).
Keep each question concise and unambiguous, and make sure only one option is correct.

Respond with JSON exactly like:
{
  "questions": [
    { "question_text": "...", "options": ["A","B","C","D"], "correct_answer_idx": 0 }
  ]
}`;

      const response = await axios.post(
        `${BASE_URL.replace(/\/+$/, '')}/chat/completions`,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
          timeout: 60000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      const parsed = extractJson(content);
      const questions = validateQuestions(parsed);

      if (!questions) {
        return res.status(502).json({
          error: 'AI returned an invalid format',
          raw: content?.slice(0, 800),
        });
      }

      res.json({ success: true, questions, model: MODEL });
    } catch (error) {
      const apiErr = error.response?.data;
      console.error('AI generate error:', apiErr || error.message);
      res.status(500).json({
        error:
          apiErr?.error?.message ||
          apiErr?.message ||
          error.message ||
          'AI request failed',
      });
    }
  }
}

module.exports = new AiController();
