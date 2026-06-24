import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, RefreshCw, CheckCircle, Briefcase, GraduationCap } from 'lucide-react';
import { extractTextFromFile } from '../utils/pdfParser';
import { extractResumeData as extractGemini, getGeminiEmbedding } from '../utils/gemini';
import { extractResumeData as extractOpenAI, getOpenAIEmbedding } from '../utils/openai';

export default function ResumeUpload({ 
  resumeProfile, 
  resumeText,
  onParsed, 
  onReset,
  provider, 
  apiKey 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null); // 'reading' | 'extracting' | 'embedding' | null
  const [error, setError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!apiKey) {
      setError('Please configure your API Key in the settings before uploading a resume.');
      return;
    }
    setError('');
    setLoadingStep('reading');

    try {
      // 1. Read/Extract text from file
      const rawText = await extractTextFromFile(file);
      await processRawText(rawText);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to read the file.');
      setLoadingStep(null);
    }
  };

  const processRawText = async (rawText) => {
    if (!rawText.trim()) {
      throw new Error('The file content is empty.');
    }

    try {
      // 2. Extract profile using AI
      setLoadingStep('extracting');
      let profile;
      if (provider === 'gemini') {
        profile = await extractGemini(rawText, apiKey);
      } else {
        profile = await extractOpenAI(rawText, apiKey);
      }

      // 3. Generate embedding
      setLoadingStep('embedding');
      let embedding;
      if (provider === 'gemini') {
        embedding = await getGeminiEmbedding(rawText, apiKey);
      } else {
        embedding = await getOpenAIEmbedding(rawText, apiKey);
      }

      // Complete
      onParsed(profile, embedding, rawText);
      setLoadingStep(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error processing resume text via AI.');
      setLoadingStep(null);
    }
  };

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please configure your API Key in the settings before processing.');
      return;
    }
    if (!pasteText.trim()) {
      setError('Please paste some text first.');
      return;
    }
    setError('');
    setLoadingStep('extracting');
    try {
      await processRawText(pasteText);
    } catch (err) {
      setError(err.message);
      setLoadingStep(null);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* State 1: Loading State */}
      {loadingStep && (
        <div className="glass-card neon-glow-cyan" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <RefreshCw className="skeleton-line" size={48} style={{ color: 'var(--accent-cyan)', animation: 'spin 2s linear infinite' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              {loadingStep === 'reading' && '📂 Extracting text from file...'}
              {loadingStep === 'extracting' && '🧠 Analyzing profile with MatchAgent LLM...'}
              {loadingStep === 'embedding' && '⚡ Synthesizing vector embeddings...'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This can take a few seconds depending on network latency.</p>
          </div>
          <div style={{ width: '100%', maxWidth: '300px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                width: loadingStep === 'reading' ? '33%' : loadingStep === 'extracting' ? '66%' : '100%',
                transition: 'width 0.5s ease'
              }} 
            />
          </div>
        </div>
      )}

      {/* State 2: Upload Dropzone (No resume uploaded yet) */}
      {!loadingStep && !resumeProfile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div style={{ display: 'flex', gap: '12px', background: 'var(--accent-rose-dim)', border: '1px solid var(--accent-rose)', padding: '16px', borderRadius: '10px', color: 'var(--text-primary)', alignItems: 'center' }}>
              <AlertCircle size={20} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.9rem' }}>{error}</div>
            </div>
          )}

          {!showPaste ? (
            <div 
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".pdf,.docx,.txt"
                onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
              />
              <div className="dropzone-icon">
                <UploadCloud size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Upload Candidate Resume</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Drag and drop your file here, or click to browse</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Supports PDF, DOCX, or TXT formats</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Paste Resume Text</h3>
              <textarea 
                className="glass-input" 
                style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem' }} 
                placeholder="Paste the full, raw text of the resume here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Process Text
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaste(false)}>
                  Back to File Upload
                </button>
              </div>
            </form>
          )}

          {!showPaste && (
            <button 
              className="btn btn-secondary" 
              style={{ alignSelf: 'center' }} 
              onClick={() => setShowPaste(true)}
            >
              Or Paste Text Directly
            </button>
          )}
        </div>
      )}

      {/* State 3: Display Extracted Profile */}
      {!loadingStep && resumeProfile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header Card */}
          <div className="glass-card neon-glow-cyan" style={{ padding: '32px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{resumeProfile.name}</h2>
                  <span className="api-badge active" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle size={10} style={{ marginRight: '4px' }} /> Vectorized
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '650px' }}>{resumeProfile.summary}</p>
              </div>
              <button className="btn btn-secondary" onClick={onReset} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Upload New Resume
              </button>
            </div>

            {/* Skills Tags */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Extracted Skills</h3>
              <div className="tags-container">
                {resumeProfile.skills?.map((skill, index) => (
                  <span key={index} className="tag cyan">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Details splits: Exp & Edu */}
          <div className="split-view">
            {/* Experience Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Briefcase size={20} style={{ color: 'var(--accent-purple)' }} />
                <h3 style={{ fontSize: '1.15rem' }}>Experience</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {resumeProfile.experience?.length ? (
                  resumeProfile.experience.map((exp, index) => (
                    <div key={index} style={{ borderLeft: '2px solid var(--border-light)', paddingLeft: '16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-5px', top: '6px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.role}</div>
                      <div style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>{exp.company}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{exp.duration}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>{exp.description}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No formal experience details extracted.</div>
                )}
              </div>
            </div>

            {/* Education Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <GraduationCap size={20} style={{ color: 'var(--accent-emerald)' }} />
                <h3 style={{ fontSize: '1.15rem' }}>Education & Credentials</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {resumeProfile.education?.length ? (
                  resumeProfile.education.map((edu, index) => (
                    <div key={index} style={{ borderLeft: '2px solid var(--border-light)', paddingLeft: '16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-5px', top: '6px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{edu.degree}</div>
                      <div style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>{edu.school}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{edu.year}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No formal education details extracted.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
