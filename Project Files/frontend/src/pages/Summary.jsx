import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDocuments, generateSummary, getSummaries } from '../api';
import { FileText, Sparkles, BookOpen, Layers, HelpCircle, ListTodo, History, CheckCircle } from 'lucide-react';

export default function Summary() {
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [activeSummary, setActiveSummary] = useState(null);
  
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, concepts, definitions, notes

  // Fetch materials and history on load
  const loadInitialData = async () => {
    setLoadingDocs(true);
    try {
      const [docsRes, sumRes] = await Promise.all([getDocuments(), getSummaries()]);
      setDocuments(docsRes.data);
      setSummaries(sumRes.data);
      
      // Auto-select document if redirected from Materials page
      if (location.state?.selectedDocId) {
        setSelectedDocId(location.state.selectedDocId);
        // If there's an existing summary for this doc, load it
        const existing = sumRes.data.find(s => s.docId === location.state.selectedDocId);
        if (existing) setActiveSummary(existing);
      } else if (sumRes.data.length > 0) {
        setActiveSummary(sumRes.data[0]);
        setSelectedDocId(sumRes.data[0].docId);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load initial summaries context.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [location]);

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setError("Please select a document from your library.");
      return;
    }

    setError('');
    setGenerating(true);
    setActiveSummary(null);

    try {
      const res = await generateSummary(selectedDocId);
      setActiveSummary(res.data);
      
      // Refresh summaries list
      const sumRes = await getSummaries();
      setSummaries(sumRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "AI generation failed. Ensure your Gemini API key is valid.");
    } finally {
      setGenerating(false);
    }
  };

  const handleHistorySelect = (sum) => {
    setActiveSummary(sum);
    setSelectedDocId(sum.docId);
    setError('');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Topic Summarizer</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Extract topic overviews, key concepts, definitions, and revision notes instantly.</p>
        </div>
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr', gap: '2rem' }} className="summaries-grid">
        
        {/* Left Column: Selector & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Selector Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} style={{ color: 'var(--primary)' }} />
              Select Material
            </h3>
            
            <div className="form-group">
              <select
                className="input-control"
                value={selectedDocId}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  const existing = summaries.find(s => s.docId === e.target.value);
                  if (existing) setActiveSummary(existing);
                  else setActiveSummary(null);
                  setError('');
                }}
                disabled={loadingDocs || generating}
              >
                <option value="">-- Choose from Library --</option>
                {documents.map(doc => (
                  <option key={doc.docId} value={doc.docId}>{doc.fileName}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              disabled={generating || !selectedDocId}
            >
              <Sparkles size={16} />
              {generating ? 'Generating AI Guide...' : 'Generate Summary'}
            </button>
          </div>

          {/* History Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} style={{ color: 'var(--secondary)' }} />
              Summary Logs
            </h3>

            {loadingDocs ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading summary history...</p>
            ) : summaries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto 0' }}>No history logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '300px' }}>
                {summaries.map((sum) => (
                  <button
                    key={sum.summaryId}
                    onClick={() => handleHistorySelect(sum)}
                    style={{
                      background: activeSummary?.summaryId === sum.summaryId ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { if (activeSummary?.summaryId !== sum.summaryId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { if (activeSummary?.summaryId !== sum.summaryId) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FileText size={14} style={{ color: 'var(--primary-hover)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sum.fileName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summaries Rendering */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          {generating ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Gemini is dissecting the material and writing summaries...</p>
            </div>
          ) : !activeSummary ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <FileText size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '500' }}>No summary active</h3>
              <p style={{ fontSize: '0.85rem', width: '300px', marginTop: '0.25rem' }}>Select a document from your library and click "Generate" or view logs.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Summary Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '600' }}>{activeSummary.fileName}</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Generated on {new Date(activeSummary.createdAt).toLocaleString()}</span>
              </div>

              {/* Tab Navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', gap: '1rem', overflowX: 'auto' }}>
                {[
                  { id: 'overview', label: 'Topic Overview', icon: BookOpen },
                  { id: 'concepts', label: 'Key Concepts', icon: Layers },
                  { id: 'definitions', label: 'Definitions & Principles', icon: HelpCircle },
                  { id: 'notes', label: 'Revision Notes', icon: ListTodo }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        border: 'none',
                        borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                        background: 'transparent',
                        color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: activeTab === tab.id ? '600' : '400',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels */}
              <div style={{ flex: 1, animation: 'fadeIn 0.3s ease' }}>
                {activeTab === 'overview' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Overview</h3>
                    <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '1rem' }}>
                      {activeSummary.topicOverview}
                    </p>
                  </div>
                )}

                {activeTab === 'concepts' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Key Concepts</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="concepts-grid">
                      {activeSummary.keyConcepts.map((concept, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                          <h4 style={{ color: 'var(--primary-hover)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>{concept.concept}</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{concept.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'definitions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Definitions */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Definitions</h3>
                      {activeSummary.definitions.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No specific definitions identified.</p>
                      ) : (
                        <table className="custom-table" style={{ marginTop: '0' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '30%' }}>Term</th>
                              <th>Meaning / Context</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeSummary.definitions.map((def, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: '600', color: 'white' }}>{def.term}</td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{def.meaning}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Principles */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Principles & Laws</h3>
                      {activeSummary.principles.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No core principles or formulas listed.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {activeSummary.principles.map((pr, i) => (
                            <div key={i} style={{ padding: '1rem', borderLeft: '3px solid var(--secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white' }}>{pr.name}</h4>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{pr.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Revision Bullet Points</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeSummary.revisionNotes.map((note, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <CheckCircle size={18} style={{ color: 'var(--success)', marginTop: '0.2rem', flexShrink: 0 }} />
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .summaries-grid {
            grid-template-columns: 1fr !important;
          }
          .concepts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
