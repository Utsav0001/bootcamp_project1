import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import { generateJobMatchAnalysis as analyzeGemini } from '../utils/gemini';
import { generateJobMatchAnalysis as analyzeOpenAI } from '../utils/openai';

export default function MatchDetails({ job, resumeProfile, resumeText, provider, apiKey }) {
  const [activeTab, setActiveTab] = useState('skills');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAccordions, setOpenAccordions] = useState({});
  const [copied, setCopied] = useState(false);

  // Load report from cache or reset when job changes
  useEffect(() => {
    setError('');
    // Try to load cached report from localStorage
    const cached = localStorage.getItem(`match-report-${job.id}`);
    if (cached) {
      try {
        setReport(JSON.parse(cached));
      } catch (e) {
        setReport(null);
      }
    } else {
      setReport(null);
    }
  }, [job]);

  const triggerAnalysis = async () => {
    if (!apiKey) {
      setError('Please configure your API key first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let analysisResult;
      if (provider === 'gemini') {
        analysisResult = await analyzeGemini(
          resumeText,
          job.title,
          job.company,
          job.description,
          apiKey
        );
      } else {
        analysisResult = await analyzeOpenAI(
          resumeText,
          job.title,
          job.company,
          job.description,
          apiKey
        );
      }

      setReport(analysisResult);
      // Cache it in localStorage
      localStorage.setItem(`match-report-${job.id}`, JSON.stringify(analysisResult));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLetter = () => {
    if (!report?.coverLetter) return;
    navigator.clipboard.writeText(report.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLetter = () => {
    if (!report?.coverLetter) return;
    const element = document.createElement('a');
    const file = new Blob([report.coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${resumeProfile.name.replace(/\s+/g, '_')}_Cover_Letter_${job.company}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleAccordion = (index) => {
    setOpenAccordions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="glass-card neon-glow-cyan" style={{ padding: '48px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <RefreshCw className="skeleton-line" size={40} style={{ color: 'var(--accent-cyan)', animation: 'spin 2s linear infinite' }} />
        <div>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Recruitment Agent Analyzing Match...</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Comparing skill vectors, grading ATS compatibility, drafting interview questions, and composing custom cover letter.</p>
        </div>
      </div>
    );
  }

  // State 2: No Report Generated Yet
  if (!report) {
    return (
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <Sparkles size={40} style={{ color: 'var(--accent-cyan)' }} />
        <div>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Deep Match Analysis Available</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '350px', margin: '0 auto 16px' }}>
            Run the recruitment agent to extract skill gaps and formulate tailored materials for <strong>{job.title}</strong> at <strong>{job.company}</strong>.
          </p>
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</div>}
          <button className="btn btn-primary" onClick={triggerAnalysis}>
            Trigger Match Agent
          </button>
        </div>
      </div>
    );
  }

  // State 3: Show Report Tabs
  return (
    <div className="glass-card neon-glow-cyan" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      {/* Title block */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{job.title} Analysis</h3>
        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600 }}>{job.company}</p>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skill Gap
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ats' ? 'active' : ''}`}
          onClick={() => setActiveTab('ats')}
        >
          ATS Score
        </button>
        <button 
          className={`tab-btn ${activeTab === 'interview' ? 'active' : ''}`}
          onClick={() => setActiveTab('interview')}
        >
          Interview Prep
        </button>
        <button 
          className={`tab-btn ${activeTab === 'letter' ? 'active' : ''}`}
          onClick={() => setActiveTab('letter')}
        >
          Cover Letter
        </button>
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '450px', paddingRight: '4px' }}>
        {/* Tab 1: Skill Gap */}
        {activeTab === 'skills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Matched Skills ({report.matchedSkills?.length || 0})
              </h4>
              <div className="tags-container">
                {report.matchedSkills?.length ? (
                  report.matchedSkills.map((s, i) => <span key={i} className="tag emerald">{s}</span>)
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No direct keyword skills matched.</span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                <XCircle size={16} /> Missing Skills Gap ({report.missingSkills?.length || 0})
              </h4>
              <div className="tags-container">
                {report.missingSkills?.length ? (
                  report.missingSkills.map((s, i) => <span key={i} className="tag rose">{s}</span>)
                ) : (
                  <span style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>Perfect skill alignment! No gaps identified.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ATS Score */}
        {activeTab === 'ats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Radial gauge representation */}
              <div 
                className="match-score-radial" 
                style={{ 
                  border: `3px solid ${report.atsScore >= 75 ? 'var(--accent-emerald)' : report.atsScore >= 55 ? 'var(--accent-cyan)' : 'var(--accent-purple)'}`,
                  color: report.atsScore >= 75 ? 'var(--accent-emerald)' : report.atsScore >= 55 ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                  boxShadow: 'inset 0 0 12px rgba(255,255,255,0.02)'
                }}
              >
                {report.atsScore}%
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ATS Compatibility Index</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                  Estimates how well standard applicant tracking systems will read and rank your profile for this specific role.
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>Recruiter Feedback</h5>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.atsFeedback?.map((feedback, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feedback}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Interview Prep */}
        {activeTab === 'interview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.interviewQuestions?.map((item, index) => {
              const isOpen = !!openAccordions[index];
              return (
                <div key={index} className="accordion">
                  <div className="accordion-header" onClick={() => toggleAccordion(index)}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', paddingRight: '12px' }}>
                      {index + 1}. {item.question}
                    </span>
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--accent-cyan)' }} /> : <ChevronDown size={16} />}
                  </div>
                  {isOpen && (
                    <div className="accordion-body">
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Suggested Answer Strategy</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{item.answerOutline}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Cover Letter */}
        {activeTab === 'letter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleCopyLetter} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Copy size={12} /> {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadLetter} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Download size={12} /> Download .txt
              </button>
            </div>
            <div 
              style={{ 
                background: 'var(--bg-input)', 
                border: '1px solid var(--border-light)', 
                borderRadius: '10px', 
                padding: '20px', 
                fontSize: '0.85rem', 
                color: 'var(--text-secondary)', 
                whiteSpace: 'pre-line',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}
            >
              {report.coverLetter}
            </div>
          </div>
        )}
      </div>
      
      {/* Regeneration triggers */}
      <button 
        className="btn btn-secondary" 
        onClick={triggerAnalysis}
        style={{ fontSize: '0.8rem', padding: '6px 12px', border: 'none', background: 'transparent', alignSelf: 'center', opacity: '0.5' }}
      >
        Regenerate Report
      </button>
    </div>
  );
}
