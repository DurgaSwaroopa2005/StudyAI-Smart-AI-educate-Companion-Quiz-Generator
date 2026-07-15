import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../api';
import { BarChart3, GraduationCap, Award, AlertTriangle, Calendar, ClipboardList } from 'lucide-react';

// Custom SVG Line Chart Component - lightweight, responsive, styling-integrated, and zero external packages
const LineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', color: 'var(--text-secondary)' }}>
        No quiz history recorded yet. Complete a quiz to view charts.
      </div>
    );
  }
  
  const width = 600;
  const height = 220;
  const padding = 35;
  
  // Map points
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (item.score / 100) * (height - 2 * padding);
    return { x, y, score: item.score, date: item.date };
  });
  
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

  return (
    <div style={{ width: '100%', overflowX: 'auto', marginTop: '1rem' }}>
      <div style={{ minWidth: '500px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />
          
          {/* Y Axis Labels */}
          <text x={padding - 8} y={padding + 3} fill="var(--text-secondary)" fontSize="9" textAnchor="end">100%</text>
          <text x={padding - 8} y={(height) / 2 + 3} fill="var(--text-secondary)" fontSize="9" textAnchor="end">50%</text>
          <text x={padding - 8} y={height - padding + 3} fill="var(--text-secondary)" fontSize="9" textAnchor="end">0%</text>

          {/* Area Fill */}
          {data.length > 1 && <polygon points={areaPoints} fill="url(#chartGrad)" />}

          {/* Line Connecting Points */}
          {data.length > 1 ? (
            <polyline points={polylinePoints} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <circle cx={points[0].x} cy={points[0].y} r="6" fill="var(--primary)" />
          )}

          {/* Glowing Circles and labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="var(--primary)" strokeWidth="2.5" />
              {/* Score label above circle */}
              <text x={p.x} y={p.y - 12} fill="white" fontSize="9" fontWeight="700" textAnchor="middle">{p.score}%</text>
              {/* Date label at bottom */}
              <text x={p.x} y={height - padding + 16} fill="var(--text-secondary)" fontSize="8.5" textAnchor="middle">{p.date}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getAnalytics();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError("Could not load analytics. Make sure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Compiling analytics metrics...</span>
      </div>
    );
  }

  const performanceCards = [
    { title: 'Quizzes Taken', value: stats.totalQuizzes, icon: GraduationCap, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'Average Score', value: `${stats.averageScore}%`, icon: Award, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
    { title: 'Weak Areas Count', value: stats.weakTopics.length, icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Visualize score trends, identify curriculum vulnerabilities, and track study logs.</p>
        </div>
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {performanceCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel metric-card" style={{ padding: '1.5rem' }}>
              <div className="metric-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                <Icon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{card.title}</span>
                <div className="metric-value" style={{ fontSize: '2rem' }}>{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Chart and Topic Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', marginBottom: '2rem' }} className="analytics-grid">
        {/* Chart Column */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-hover)' }} />
            <h3 style={{ fontSize: '1.25rem' }}>Quiz Score Tracker</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Plots your performance percentage over consecutive quiz completions.</p>
          
          <LineChart data={stats.quizHistory} />
        </div>

        {/* Weak Topics list */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: '1.25rem' }}>Weak Focus Topics</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Aggregated mistakes in quizzes highlight which modules need focus.</p>

          {stats.weakTopics.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No weak topics identified yet. Complete quizzes to populate insights.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.weakTopics.map((topic, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: '600' }}>{topic.topicName}</span>
                    <span className="badge badge-warning">{topic.count} errors</span>
                  </div>
                  {/* Visual micro-bar of severity */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--warning)', height: '100%', width: `${Math.min(topic.count * 15, 100)}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz History table list */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ClipboardList size={18} style={{ color: 'var(--secondary)' }} />
          <h3 style={{ fontSize: '1.25rem' }}>Study & Quiz History Log</h3>
        </div>

        {stats.quizHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No quizzes completed yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source Material</th>
                  <th>Exam Type</th>
                  <th>Score Obtained</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.quizHistory.map((item, index) => {
                  const pass = item.score >= 60;
                  return (
                    <tr key={index}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {item.date}
                      </td>
                      <td style={{ fontWeight: '500', color: 'white' }}>
                        {item.fileName}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {item.quizType}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: pass ? 'var(--success)' : 'var(--error)' }}>
                        {item.score}%
                      </td>
                      <td>
                        <span className={`badge ${pass ? 'badge-success' : 'badge-danger'}`}>
                          {pass ? 'Pass' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          .analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
