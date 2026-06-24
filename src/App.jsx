import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SetupPanel from './components/SetupPanel';
import ResumeUpload from './components/ResumeUpload';
import JobManager, { DEFAULT_JOBS } from './components/JobManager';
import MatchDashboard from './components/MatchDashboard';
import { 
  FileText, 
  Briefcase, 
  Settings, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [provider, setProvider] = useState(() => localStorage.getItem('provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '');
  
  const [resumeProfile, setResumeProfile] = useState(() => {
    const saved = localStorage.getItem('resumeProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('resumeText') || '');
  const [resumeEmbedding, setResumeEmbedding] = useState(() => {
    const saved = localStorage.getItem('resumeEmbedding');
    return saved ? JSON.parse(saved) : null;
  });

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('jobs');
    return saved ? JSON.parse(saved) : DEFAULT_JOBS;
  });

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (resumeProfile) {
      localStorage.setItem('resumeProfile', JSON.stringify(resumeProfile));
    } else {
      localStorage.removeItem('resumeProfile');
    }
  }, [resumeProfile]);

  useEffect(() => {
    localStorage.setItem('resumeText', resumeText);
  }, [resumeText]);

  useEffect(() => {
    if (resumeEmbedding) {
      localStorage.setItem('resumeEmbedding', JSON.stringify(resumeEmbedding));
    } else {
      localStorage.removeItem('resumeEmbedding');
    }
  }, [resumeEmbedding]);

  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  const handleSaveApiKey = (newProvider, key) => {
    setProvider(newProvider);
    setApiKey(key);
    // Clear any cached resume embeddings if provider changed (dimensions differ: Gemini is 768, OpenAI is 1536)
    const prevProvider = localStorage.getItem('provider');
    if (prevProvider !== newProvider) {
      setResumeEmbedding(null);
      // Clear jobs embeddings that are incompatible
      const clearedJobs = jobs.map(j => ({ ...j, embedding: null }));
      setJobs(clearedJobs);
      // Clear all generated match reports from storage
      jobs.forEach(j => localStorage.removeItem(`match-report-${j.id}`));
    }
  };

  const handleResumeParsed = (profile, embedding, rawText) => {
    setResumeProfile(profile);
    setResumeEmbedding(embedding);
    setResumeText(rawText);
  };

  const handleResetResume = () => {
    if (window.confirm('Are you sure you want to remove the current resume? This will also clear all match reports.')) {
      setResumeProfile(null);
      setResumeEmbedding(null);
      setResumeText('');
      jobs.forEach(j => localStorage.removeItem(`match-report-${j.id}`));
    }
  };

  // Render the dashboard statistics overview
  const renderDashboard = () => {
    const vectorizedJobsCount = jobs.filter(j => j.embedding).length;
    const missingEmbeddings = jobs.some(j => !j.embedding);

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Welcome Section */}
        <div className="glass-card neon-glow-cyan" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', opacity: 0.15 }}>
            <Sparkles size={160} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div style={{ maxWidth: '600px', position: 'relative', zIndex: 1 }}>
            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agent Workspace</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '8px', marginBottom: '12px' }}>AI Resume Analyzer + Job Match Agent</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
              Vectorize your resume and compare against active job listings. Find missing skill gaps, analyze ATS formatting compatibility, practice custom interview questions, and build tailored cover letters.
            </p>
          </div>
        </div>

        {/* Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Card 1: API Configuration */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
            <div className="sidebar-logo-icon" style={{ background: apiKey ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)', color: apiKey ? 'var(--accent-emerald)' : 'var(--accent-rose)', flexShrink: 0 }}>
              <Settings size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Credentials Status</h4>
              {apiKey ? (
                <div>
                  <div className="api-badge active" style={{ fontSize: '0.65rem' }}>Active</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '6px' }}>
                    Active provider: <strong>{provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}</strong>.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="api-badge inactive" style={{ fontSize: '0.65rem' }}>Missing API Key</div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveView('setup')}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '8px', border: 'none', background: 'rgba(255,255,255,0.03)' }}
                  >
                    Setup API Key <ArrowRight size={10} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Resume Status */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
            <div className="sidebar-logo-icon" style={{ background: resumeProfile ? 'var(--accent-cyan-dim)' : 'rgba(255,255,255,0.02)', color: resumeProfile ? 'var(--accent-cyan)' : 'var(--text-dim)', flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Resume Vector Profile</h4>
              {resumeProfile ? (
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{resumeProfile.name}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {resumeProfile.skills?.length || 0} skills vectorized.
                  </p>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveView('resume')}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '8px', border: 'none', background: 'rgba(255,255,255,0.03)' }}
                  >
                    View Resume Details <ArrowRight size={10} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No resume uploaded.</div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setActiveView('resume')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '8px' }}
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Jobs Database */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
            <div className="sidebar-logo-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)', flexShrink: 0 }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Job Descriptions</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Total positions: <strong>{jobs.length}</strong>.<br />
                Vectorized positions: <strong>{vectorizedJobsCount}</strong>.
              </p>
              {missingEmbeddings && apiKey && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setActiveView('jobs')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '8px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-purple)' }}
                >
                  Vectorize templates <ArrowRight size={10} style={{ marginLeft: '4px' }} />
                </button>
              )}
              {!apiKey && (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '6px' }}>Configure API key to vectorize jobs.</div>
              )}
            </div>
          </div>
        </div>

        {/* Main CTA */}
        {resumeProfile && vectorizedJobsCount > 0 && (
          <div 
            className="glass-card neon-glow-cyan" 
            style={{ 
              padding: '24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.05), transparent)' 
            }}
          >
            <div>
              <h4 style={{ fontWeight: 700 }}>Run Vector Similarity Matching</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Compare candidate skills against {vectorizedJobsCount} vectorized positions.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveView('matching')}>
              Compare Vectors <TrendingUp size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        provider={provider} 
        apiKey={apiKey} 
      />

      {/* Main Workspace Panel */}
      <main className="main-view">
        <div className="view-header">
          <h1 className="view-title">
            {activeView === 'dashboard' && 'Agent Console'}
            {activeView === 'resume' && 'Resume Vector Profiler'}
            {activeView === 'jobs' && 'Job Board Database'}
            {activeView === 'matching' && 'Similarity Search'}
            {activeView === 'setup' && 'Settings'}
          </h1>
          <p className="view-subtitle">
            {activeView === 'dashboard' && 'Welcome to the local agent workspace.'}
            {activeView === 'resume' && 'Extract skills and details using AI parser.'}
            {activeView === 'jobs' && 'Manage job listings and compute embeddings.'}
            {activeView === 'matching' && 'Perform cosine similarity checks and generate interview prep.'}
            {activeView === 'setup' && 'Manage your credentials, provider models, and privacy settings.'}
          </p>
        </div>

        {/* Content routing */}
        <div style={{ flex: 1 }}>
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'resume' && (
            <ResumeUpload 
              resumeProfile={resumeProfile} 
              resumeText={resumeText}
              onParsed={handleResumeParsed}
              onReset={handleResetResume}
              provider={provider} 
              apiKey={apiKey} 
            />
          )}
          {activeView === 'jobs' && (
            <JobManager 
              jobs={jobs} 
              setJobs={setJobs} 
              provider={provider} 
              apiKey={apiKey} 
            />
          )}
          {activeView === 'matching' && (
            <MatchDashboard 
              resumeProfile={resumeProfile} 
              resumeEmbedding={resumeEmbedding}
              resumeText={resumeText}
              jobs={jobs} 
              provider={provider} 
              apiKey={apiKey} 
            />
          )}
          {activeView === 'setup' && (
            <SetupPanel 
              provider={provider} 
              setProvider={setProvider} 
              apiKey={apiKey} 
              setApiKey={setApiKey}
              onSave={handleSaveApiKey} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
