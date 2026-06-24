import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { cosineSimilarity } from '../utils/vector';
import MatchDetails from './MatchDetails';

export default function MatchDashboard({ resumeProfile, resumeEmbedding, resumeText, jobs, provider, apiKey }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  
  // Calculate similarity rankings when resume embedding or jobs list changes
  useEffect(() => {
    if (!resumeEmbedding || !jobs || jobs.length === 0) {
      setRankings([]);
      return;
    }

    const calculated = jobs.map(job => {
      let score = 0;
      let status = 'ready';

      if (!job.embedding) {
        status = 'no_embedding';
      } else if (job.embedding.length !== resumeEmbedding.length) {
        status = 'dimension_mismatch'; // e.g. OpenAI vs Gemini keys mixed
      } else {
        score = cosineSimilarity(resumeEmbedding, job.embedding);
      }

      return {
        ...job,
        score,
        status
      };
    });

    // Sort by score descending (only positions that are active)
    calculated.sort((a, b) => b.score - a.score);
    setRankings(calculated);
  }, [resumeEmbedding, jobs]);

  // Handle case where resume is missing
  if (!resumeProfile) {
    return (
      <div style={{ maxWidth: '650px', margin: '48px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div className="sidebar-logo-icon" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
          <FileText size={32} />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Resume Profile Missing</h3>
        <p style={{ color: 'var(--text-secondary)' }}>You must upload and parse a candidate resume before similarity matching can be performed.</p>
      </div>
    );
  }

  // Helper to color code similarity score borders and text
  const getScoreColor = (score) => {
    if (score >= 0.75) return 'var(--accent-emerald)';
    if (score >= 0.55) return 'var(--accent-cyan)';
    return 'var(--accent-purple)';
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Similarity Search Matches</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Vectors compared: <strong>{resumeProfile.name}'s Resume</strong> vs <strong>{jobs.length} Job Listings</strong> using Cosine Similarity.
        </p>
      </div>

      <div className="split-view">
        {/* Left Side: Ranked Job List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rankings.map((job, index) => {
            const isSelected = selectedJob?.id === job.id;
            const scorePercent = (job.score * 100).toFixed(0);
            
            return (
              <div 
                key={job.id} 
                className={`glass-card job-card ${isSelected ? 'selected' : ''}`}
                style={{ padding: '20px' }}
                onClick={() => job.status === 'ready' && setSelectedJob(job)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 }}>#{index + 1}</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.title}</h4>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{job.company}</p>
                  </div>

                  {job.status === 'ready' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Score Badge */}
                      <div 
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: `1px solid ${getScoreColor(job.score)}`,
                          color: getScoreColor(job.score),
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          minWidth: '70px'
                        }}
                      >
                        {scorePercent}%
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
                      <AlertCircle size={14} />
                      <span>
                        {job.status === 'no_embedding' ? 'Not Vectorized' : 'Dimension Mismatch'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {rankings.length === 0 && (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '24px' }}>
              No job positions defined. Go to the Job Descriptions page to add positions.
            </div>
          )}
        </div>

        {/* Right Side: Similarity Analysis Pane */}
        <div style={{ minHeight: '400px' }}>
          {selectedJob ? (
            <MatchDetails 
              job={selectedJob} 
              resumeProfile={resumeProfile} 
              resumeText={resumeText}
              provider={provider} 
              apiKey={apiKey} 
            />
          ) : (
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
              <Sparkles size={32} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '4px' }}>Deep Match Analysis</h4>
                <p style={{ fontSize: '0.85rem' }}>Select a vectorized job position on the left to run LLM skill gap analysis, view ATS scores, and generate custom documents.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
