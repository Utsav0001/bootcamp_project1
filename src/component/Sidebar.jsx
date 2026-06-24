import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  Sparkles, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, provider, apiKey }) {
  const isApiConfigured = !!apiKey;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', name: 'Resume Profile', icon: FileText },
    { id: 'jobs', name: 'Job Descriptions', icon: Briefcase },
    { id: 'matching', name: 'Similarity Match', icon: TrendingUp },
    { id: 'setup', name: 'API Configuration', icon: Settings }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Sparkles size={20} />
        </div>
        <span className="sidebar-logo-text">MatchAgent AI</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item btn-secondary ${activeView === item.id ? 'active' : ''}`}
              style={{ border: 'none', justifyContent: 'flex-start', background: 'transparent' }}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Provider Status
        </div>
        {isApiConfigured ? (
          <div className="api-badge active">
            <CheckCircle2 size={12} />
            <span>{provider === 'gemini' ? 'Gemini Active' : 'OpenAI Active'}</span>
          </div>
        ) : (
          <div className="api-badge inactive">
            <XCircle size={12} />
            <span>API Key Missing</span>
          </div>
        )}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px' }}>
          v1.0.0 (Local Sandbox)
        </div>
      </div>
    </aside>
  );
}
