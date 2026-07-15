import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, uploadMaterial, deleteDocument } from '../api';
import { Upload, FileText, Trash2, BookOpen, FileCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function Materials() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [activeTab, setActiveTab] = useState('file'); // file, paste

  const navigate = useNavigate();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await getDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("Failed to load documents list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    
    if (activeTab === 'file') {
      if (!file) {
        setError('Please select a file to upload.');
        setUploading(false);
        return;
      }
      formData.append('file', file);
      formData.append('fileName', file.name);
    } else {
      if (!pastedText.trim()) {
        setError('Please enter some text content.');
        setUploading(false);
        return;
      }
      const title = textTitle.trim() || `Pasted_Text_${new Date().toLocaleDateString()}.txt`;
      formData.append('text', pastedText);
      formData.append('fileName', title.endsWith('.txt') ? title : `${title}.txt`);
    }

    try {
      await uploadMaterial(formData);
      setSuccess('Material uploaded and parsed successfully!');
      setFile(null);
      setPastedText('');
      setTextTitle('');
      fetchDocs();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.error || 'Upload failed. Ensure the backend size limit is not exceeded.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    try {
      await deleteDocument(docId);
      setSuccess('Document deleted.');
      fetchDocs();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete study material.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Materials</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Upload files or paste textbook text to feed your StudyAI companion.</p>
        </div>
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge-success" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }} className="materials-layout">
        {/* Upload Column */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} style={{ color: 'var(--primary)' }} />
            Add Materials
          </h3>

          {/* Toggle Tab */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('file')}
              style={{
                flex: 1,
                background: activeTab === 'file' ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '0.5rem',
                cursor: 'pointer',
                borderRadius: '4px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all var(--transition-fast)'
              }}
            >
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              style={{
                flex: 1,
                background: activeTab === 'paste' ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '0.5rem',
                cursor: 'pointer',
                borderRadius: '4px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all var(--transition-fast)'
              }}
            >
              Paste Raw Text
            </button>
          </div>

          <form onSubmit={handleUpload}>
            {activeTab === 'file' ? (
              <div className="form-group" style={{ textAlign: 'center' }}>
                <div style={{
                  border: '2px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2.5rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all var(--transition-normal)'
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  if (e.dataTransfer.files.length > 0) {
                    setFile(e.dataTransfer.files[0]);
                  }
                }}
                >
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    onChange={handleFileChange}
                  />
                  <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {file ? file.name : 'Select or drag file here'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Supports PDF, DOCX, TXT (Max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Material Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 4: Mitochondria Structure"
                    className="input-control"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Text Content</label>
                  <textarea
                    rows={8}
                    placeholder="Paste your study notes, essay, or book contents here..."
                    className="input-control"
                    style={{ resize: 'vertical' }}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={uploading}>
              {uploading ? 'Processing & Extracting...' : 'Upload & Analyze Material'}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--secondary)' }} />
            Your Library
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>Loading library...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto' }} />
              <p style={{ fontWeight: '500' }}>Your library is empty</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload notes to generate AI study materials.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {documents.map((doc) => (
                <div key={doc.docId} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileCheck size={18} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.fileName}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {doc.fileType.toUpperCase()} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => navigate('/summaries', { state: { selectedDocId: doc.docId } })}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                      title="Generate Summary"
                    >
                      <Sparkles size={12} />
                      Study
                    </button>
                    <button
                      onClick={() => handleDelete(doc.docId)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem', border: 'none', color: '#ef4444' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .materials-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
