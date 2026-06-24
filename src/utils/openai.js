/**
 * Utility functions for OpenAI API integration
 */

const BASE_URL = 'https://api.openai.com/v1';

/**
 * Helper to make API post request
 */
async function fetchOpenAI(endpoint, apiKey, payload) {
  const url = `${BASE_URL}/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
You must return valid JSON that conforms to this schema:
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

Return ONLY the raw JSON string.

Resume text:
${resumeText}`;

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  };

  const data = await fetchOpenAI('chat/completions', apiKey, payload);
  try {
    const textResponse = data.choices[0].message.content;
    return JSON.parse(textResponse);
  } catch (err) {
    console.error('Failed to parse OpenAI JSON output', err);
    throw new Error('LLM did not return structured JSON. Please try again.');
  }
}

/**
 * Generate embedding for text (returns 1536-dim array)
 */
export async function getOpenAIEmbedding(text, apiKey) {
  const payload = {
    model: 'text-embedding-3-small',
    input: text
  };

  const data = await fetchOpenAI('embeddings', apiKey, payload);
  if (!data.data?.[0]?.embedding) {
    throw new Error('Failed to retrieve vector embedding from OpenAI API');
  }
  return data.data[0].embedding;
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

Return ONLY the raw JSON string.

Candidate Resume Text:
${resumeText}

---
Job Title: ${jobTitle}
Company: ${jobCompany}
Job Description:
${jobDescriptionText}`;

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  };

  const data = await fetchOpenAI('chat/completions', apiKey, payload);
  try {
    const textResponse = data.choices[0].message.content;
    return JSON.parse(textResponse);
  } catch (err) {
    console.error('Failed to parse match analysis JSON', err);
    throw new Error('Failed to generate match insights. Please try again.');
  }
}
