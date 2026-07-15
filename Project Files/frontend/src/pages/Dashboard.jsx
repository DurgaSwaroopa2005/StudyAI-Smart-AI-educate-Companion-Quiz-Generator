import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../api';
import { 
  BookOpen, 
  FileText, 
  Award, 
  GraduationCap, 
  ChevronRight, 
  Activity,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalSummaries: 0,
    totalQuizzes: 0,
    averageScore: 0,
    weakTopics: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAnalytics();
        setStats(res.data);
      } catch (err) {
        console.error("Error loading analytics:", err);
        setError("Failed to load dashboard metrics. Ensure backend server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Study Materials', value: stats.totalMaterials, icon: BookOpen, color: 'var(--primary)', bg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'AI Summaries', value: stats.totalSummaries, icon: FileText, color: 'var(--secondary)', bg: 'rgba(236, 72, 153, 0.1)' },
    { title: 'Quizzes Taken', value: stats.totalQuizzes, icon: GraduationCap, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'Average Score', value: `${stats.averageScore}%`, icon: Award, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Here is a summary of your study progress and metrics.</p>
        </div>
        <Link to="/materials" className="btn btn-primary">
          <Sparkles size={16} />
          Upload Material
        </Link>
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel metric-card">
              <div className="metric-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                <Icon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{card.title}</span>
                <div className="metric-value">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }} className="dashboard-grid">
        {/* Left Side: Recent Activity */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Activity size={20} style={{ color: 'var(--primary-hover)' }} />
            <h3 style={{ fontSize: '1.25rem' }}>Recent Study Activity</h3>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p>No recent activity log found.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload materials or complete quizzes to see logs.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {stats.recentActivity.map((act) => (
                <div key={act.activityId} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <Clock size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{act.message}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Weak Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              <h3 style={{ fontSize: '1.1rem' }}>Weak Topics</h3>
            </div>

            {stats.weakTopics.length === 0 ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p>No weak topics logged yet.</p>
                <p style={{ marginTop: '0.25rem' }}>Great job! Complete quizzes to evaluate weaknesses.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.weakTopics.map((topic, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{topic.topicName}</span>
                    <span className="badge badge-warning">
                      {topic.count} errors
                    </span>
                  </div>
                ))}
                <Link to="/schedule" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: 'var(--primary-hover)', textDecoration: 'none', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '500' }}>
                  Generate Study Schedule
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Tools Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Study Tools</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/summaries" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                <span>Revision Notes</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/flashcards" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                <span>Flashcard Decks</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/quizzes" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                <span>Practice Exams</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
