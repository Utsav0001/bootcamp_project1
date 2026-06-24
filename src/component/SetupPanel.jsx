import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle2, AlertTriangle, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function SetupPanel({ provider, setProvider, apiKey, setApiKey, onSave }) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setValidationStatus('error');
      setErrorMessage('Please enter a valid API Key.');
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);
    setErrorMessage('');

    try {
      // Direct API check to validate the key
      if (provider === 'gemini') {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyInput}`;
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
        });
        if (!response.ok) throw new Error('Invalid Gemini API Key or access issues.');
      } else {
        const testUrl = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyInput}`
          },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 })
        });
        if (!response.ok) throw new Error('Invalid OpenAI API Key or access issues.');
      }

      // If validation passes
      setValidationStatus('success');
      onSave(provider, keyInput);
    } catch (err) {
      console.error(err);
      setValidationStatus('error');
      setErrorMessage(err.message || 'Key validation failed. Please check the key and your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setKeyInput('');
    setValidationStatus(null);
    onSave(provider, '');
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
      <div className="glass-card neon-glow-cyan" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div className="sidebar-logo-icon" style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}>
            <Key size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>API Configuration</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure your LLM provider credentials securely in local storage.</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '0.95rem' }}>
              Select LLM & Embedding Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${provider === 'gemini' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: '48px' }}
                onClick={() => {
                  setProvider('gemini');
                  setKeyInput(provider === 'gemini' ? keyInput : '');
                  setValidationStatus(null);
                }}
              >
                Google Gemini
              </button>
              <button
                type="button"
                className={`btn ${provider === 'openai' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: '48px' }}
                onClick={() => {
                  setProvider('openai');
                  setKeyInput(provider === 'openai' ? keyInput : '');
                  setValidationStatus(null);
                }}
              >
                OpenAI (GPT-4o)
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>API Key</label>
              <a 
                href={provider === 'gemini' ? 'https://aistudio.google.com/' : 'https://platform.openai.com/api-keys'} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Get {provider === 'gemini' ? 'Gemini' : 'OpenAI'} Key <Sparkles size={12} />
              </a>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="glass-input"
                style={{ paddingRight: '48px' }}
                placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={isValidating}
            >
              {isValidating ? 'Validating API Key...' : 'Save & Validate Key'}
            </button>
            {apiKey && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClear}
              >
                Remove Key
              </button>
            )}
          </div>
        </form>

        {validationStatus === 'success' && (
          <div style={{ display: 'flex', gap: '12px', background: 'var(--accent-emerald-dim)', border: '1px solid var(--accent-emerald)', padding: '16px', borderRadius: '10px', marginTop: '24px', color: 'var(--text-primary)', alignItems: 'center' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>API Key Validated Successfully!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Your match agent is now online and ready to build embeddings.</div>
            </div>
          </div>
        )}

        {validationStatus === 'error' && (
          <div style={{ display: 'flex', gap: '12px', background: 'var(--accent-rose-dim)', border: '1px solid var(--accent-rose)', padding: '16px', borderRadius: '10px', marginTop: '24px', color: 'var(--text-primary)', alignItems: 'center' }}>
            <AlertTriangle size={24} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>Validation Failed</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{errorMessage}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '10px', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Privacy & Security Sandbox</div>
            Your API credentials are stored 100% locally in your web browser's <code>localStorage</code> database. They are never transmitted to any secondary servers or stored externally. All network calls are made directly to the artificial intelligence providers.
          </div>
        </div>
      </div>
    </div>
  );
}
