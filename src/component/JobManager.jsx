import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { getGeminiEmbedding } from '../utils/gemini';
import { getOpenAIEmbedding } from '../utils/openai';

export const DEFAULT_JOBS = [
  {
    id: 'stripe-fe',
    title: 'Frontend React Engineer',
    company: 'Stripe',
    description: `We are looking for a Frontend Engineer to build beautiful, intuitive interfaces. 
Requirements:
- 3+ years experience with React and TypeScript.
- Strong knowledge of CSS/Tailwind and fluid responsive designs.
- Familiarity with state management libraries like Zustand or Redux.
- Understanding of Web Performance optimization and Core Web Vitals.
- Experience writing unit and integration tests (Jest, React Testing Library).`,
    embedding: null // Will be generated or mocked if needed
  },
  {
    id: 'openai-be',
    title: 'Python Backend & AI Engineer',
    company: 'OpenAI',
    description: `Join the team building backend systems for generative models.
Requirements:
- Strong proficiency in Python and async frameworks like FastAPI or Quart.
- Experience with PyTorch or training/fine-tuning machine learning models.
- Orchestration frameworks like LangChain, LlamaIndex, or AutoGen.
- Experience with vector databases (Pinecone, Milvus, Chroma) and SQL (PostgreSQL).
- Proficiency with Docker, Kubernetes, and cloud platforms (AWS or GCP).`,
    embedding: null
  },
  {
    id: 'netflix-data',
    title: 'Senior Data Analyst',
    company: 'Netflix',
    description: `Drive analytical insights that power our recommendation engines.
Requirements:
- 4+ years of data analysis experience in a product-focused environment.
- Advanced SQL skills and ability to query massive, complex datasets.
- Strong programming skills in Python (Pandas, NumPy) for data manipulation.
- Experience building dashboards using BI tools (Tableau, Looker, or PowerBI).
- Solid grasp of statistics, hypothesis testing, and running A/B tests.`,
    embedding: null
  },
  {
    id: 'google-pm',
    title: 'Technical Product Manager',
    company: 'Google',
    description: `Manage the lifecycle of developer-focused cloud APIs and tools.
Requirements:
- 3+ years of experience in product management or technical program management.
- Ability to write SQL queries and analyze usage metrics.
- Experience defining product roadmaps, requirements, and key metrics.
- Strong technical background: computer science degree or equivalent experience.
- Exceptional communication skills with engineers, designers, and executives.`,
    embedding: null
  }
];

export default function JobManager({ jobs, setJobs, provider, apiKey }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please configure your API Key in settings before adding new jobs.');
      return;
    }
    if (!title.trim() || !company.trim() || !description.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      // Generate embedding for the job description
      let embedding;
      const textToEmbed = `Job Title: ${title}\nCompany: ${company}\nDescription:\n${description}`;
      
      if (provider === 'gemini') {
        embedding = await getGeminiEmbedding(textToEmbed, apiKey);
      } else {
        embedding = await getOpenAIEmbedding(textToEmbed, apiKey);
      }

      const newJob = {
        id: 'job-' + Date.now(),
        title,
        company,
        description,
        embedding
      };

      setJobs([...jobs, newJob]);
      setTitle('');
      setCompany('');
      setDescription('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate embedding for job description.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteJob = (id) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const handlePopulateDefaultEmbeddings = async () => {
    if (!apiKey) {
      setError('Please configure your API Key in settings to vectorize the default templates.');
      return;
    }

    setError('');
    setIsGenerating(true);
    try {
      const updatedJobs = [];
      for (const job of jobs) {
        if (!job.embedding) {
          const textToEmbed = `Job Title: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.description}`;
          let embedding;
          if (provider === 'gemini') {
            embedding = await getGeminiEmbedding(textToEmbed, apiKey);
          } else {
            embedding = await getOpenAIEmbedding(textToEmbed, apiKey);
          }
          updatedJobs.push({ ...job, embedding });
        } else {
          updatedJobs.push(job);
        }
      }
      setJobs(updatedJobs);
    } catch (err) {
      console.error(err);
      setError('Failed to vectorize one or more default templates: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && (
        <div style={{ display: 'flex', gap: '12px', background: 'var(--accent-rose-dim)', border: '1px solid var(--accent-rose)', padding: '16px', borderRadius: '10px', color: 'var(--text-primary)', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem' }}>{error}</div>
        </div>
      )}

      {/* Header and Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Active Job Positions</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {jobs.some(j => !j.embedding) && apiKey && (
            <button 
              className="btn btn-secondary" 
              onClick={handlePopulateDefaultEmbeddings}
              disabled={isGenerating}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Sparkles size={14} style={{ marginRight: '6px' }} /> Vectorize Preloaded Templates
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isGenerating}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Plus size={14} /> Add Custom Position
          </button>
        </div>
      </div>

      {/* New Job Form */}
      {showAddForm && (
        <form onSubmit={handleAddJob} className="glass-card neon-glow-purple" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Create Job Listing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>Job Title</label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="e.g. Fullstack Engineer"
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>Company</label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="e.g. Google"
                value={company} 
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>Job Description & Requirements</label>
            <textarea 
              className="glass-input" 
              style={{ minHeight: '150px' }} 
              placeholder="Paste the core responsibilities and technical requirements..."
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="skeleton-line" style={{ animation: 'spin 2s linear infinite' }} /> Vectorizing...
                </>
              ) : 'Save & Vectorize'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} disabled={isGenerating}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading state indicator */}
      {isGenerating && !showAddForm && (
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <RefreshCw size={18} className="skeleton-line" style={{ animation: 'spin 2s linear infinite' }} />
          <span>Generating vector embeddings for default templates...</span>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="job-grid">
        {jobs.map((job) => (
          <div key={job.id} className="glass-card job-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{job.title}</h4>
                <p style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600 }}>{job.company}</p>
              </div>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', transition: 'color 0.2s' }}
                onClick={() => handleDeleteJob(job.id)}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre-line' }}>
              {job.description}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
              <span className={`api-badge ${job.embedding ? 'active' : 'inactive'}`} style={{ fontSize: '0.65rem' }}>
                {job.embedding ? 'Vectorized' : 'Raw Text Only'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {job.embedding ? (job.embedding.length + ' dimensions') : 'Needs Key'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
