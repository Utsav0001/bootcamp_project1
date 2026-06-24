/**
 * Utility functions for Google Gemini API integration
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Helper to make API post request
 */
async function fetchGemini(model, action, apiKey, payload) {
  const url = `${BASE_URL}/${model}:${action}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    throw new Error(errorDetails.error?.message || `HTTP ${response.status} Error`);
  }

  return response.json();
}

/**
 * Extract structured profile and skills from resume text
 */
export async function extractResumeData(resumeText, apiKey) {
  const prompt = `You are an expert recruitment parser AI. Analyze the following resume text and extract the candidate profile in JSON format.
You must strictly return valid JSON that conforms to this schema:
{
  "name": "Full Name (defaults to 'Candidate' if not found)",
  "summary": "Professional summary (2-3 sentences)",
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "duration": "Duration (e.g. 2021 - Present)",
      "description": "Short description of duties"
    }
  ],
  "education": [
    {
      "degree": "Degree / Certification",
      "school": "University or Institution",
      "year": "Graduation Year"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Do not wrap in markdown tags like \`\`\`json. Return ONLY the raw JSON string.

Resume text:
${resumeText}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const data = await fetchGemini('gemini-2.5-flash', 'generateContent', apiKey, payload);
  try {
    const textResponse = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output', err);
    throw new Error('LLM did not return structured JSON. Please try again.');
  }
}

/**
 * Generate embedding for text (returns 768-dim array) with robust fallback
 */
export async function getGeminiEmbedding(text, apiKey) {
  try {
    const payload = {
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text: text }]
      }
    };
    const data = await fetchGemini('text-embedding-004', 'embedContent', apiKey, payload);
    if (!data.embedding?.values) {
      throw new Error('No embedding values returned');
    }
    return data.embedding.values;
  } catch (err) {
    console.warn('text-embedding-004 failed, trying fallback model gemini-embedding-001...', err);
    try {
      const fallbackPayload = {
        model: 'models/gemini-embedding-001',
        content: {
          parts: [{ text: text }]
        }
      };
      const data = await fetchGemini('gemini-embedding-001', 'embedContent', apiKey, fallbackPayload);
      if (!data.embedding?.values) {
        throw new Error('No embedding values returned from fallback');
      }
      return data.embedding.values;
    } catch (fallbackErr) {
      console.error('Gemini embedding failed for all models:', fallbackErr);
      throw new Error(fallbackErr.message || 'Failed to retrieve vector embedding from Gemini API');
    }
  }
}

/**
 * Analyze candidate profile against job description
 */
export async function generateJobMatchAnalysis(resumeText, jobTitle, jobCompany, jobDescriptionText, apiKey) {
  const prompt = `You are a Senior Technical Recruiter and Career Coach. 
Analyze this candidate's resume relative to the following Job Description (Job Title: "${jobTitle}" at "${jobCompany}").

You must return a structured JSON response matching the following schema:
{
  "atsScore": 85, // Estimate an ATS match percentage (0 to 100) based on relevance, key skills, and experience
  "atsFeedback": [
    "Critique of formatting or keyword matches",
    "Suggestions for improvement"
  ],
  "matchedSkills": ["Skills present in both resume and job requirements"],
  "missingSkills": ["Key skills required in job description but missing/weak in resume"],
  "interviewQuestions": [
    {
      "question": "A tailored technical or behavioral interview question for this candidate.",
      "answerOutline": "Detailed advice on what the candidate should highlight in their answer, showing how their experience fits."
    }
  ], // Provide exactly 5 high-quality interview questions
  "coverLetter": "Write a professional, highly-tailored, and compelling cover letter (around 250-350 words) from the candidate to the hiring team for this specific job."
}

Do not include any markdown format tags like \`\`\`json. Return ONLY the raw JSON string.

Candidate Resume Text:
${resumeText}

---
Job Title: ${jobTitle}
Company: ${jobCompany}
Job Description:
${jobDescriptionText}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const data = await fetchGemini('gemini-2.5-flash', 'generateContent', apiKey, payload);
  try {
    const textResponse = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse);
  } catch (err) {
    console.error('Failed to parse match analysis JSON', err);
    throw new Error('Failed to generate match insights. Please try again.');
  }
}
