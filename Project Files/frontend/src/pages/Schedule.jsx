import React, { useState, useEffect } from 'react';
import { getSchedule, generateSchedule } from '../api';
import { Calendar, Sparkles, Clock, CheckSquare, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function Schedule() {
  const [schedule, setSchedule] = useState(null); // { plan: [] }
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Track checked tasks local state to make checklist interactive
  // Key format: "dayNumber_taskIndex" -> boolean
  const [checkedTasks, setCheckedTasks] = useState({});
  const [expandedDay, setExpandedDay] = useState(1); // Default expand Day 1

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await getSchedule();
      if (res.data && res.data.plan && res.data.plan.length > 0) {
        setSchedule(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch study schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    setSchedule(null);
    setCheckedTasks({});

    try {
      const res = await generateSchedule();
      setSchedule(res.data);
      setExpandedDay(1);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to generate schedule. Ensure you have uploaded documents.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = (dayNum, taskIdx) => {
    const key = `${dayNum}_${taskIdx}`;
    setCheckedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getDayProgress = (day) => {
    const dayTasksCount = day.tasks.length;
    if (dayTasksCount === 0) return 0;
    
    let checkedCount = 0;
    for (let i = 0; i < dayTasksCount; i++) {
      if (checkedTasks[`${day.day}_${i}`]) checkedCount++;
    }
    return Math.round((checkedCount / dayTasksCount) * 100);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personalized 7-Day Plan</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>AI-crafted study cycles mapped to your study guides and target weak topics.</p>
        </div>
        {!generating && (
          <button onClick={handleGenerate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
            <Sparkles size={16} />
            {schedule ? 'Rebuild Plan' : 'Generate Plan'}
          </button>
        )}
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Loading States */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading study planner...</span>
        </div>
      )}

      {generating && (
        <div className="glass-panel" style={{ padding: '5rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', minHeight: '350px' }}>
          <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Gemini is reviewing weak topics, listing document concepts, and compiling schedules...</p>
        </div>
      )}

      {/* No Schedule Display */}
      {!loading && !generating && !schedule && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '350px' }}>
          <Calendar size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '500' }}>No active schedule found</h3>
          <p style={{ fontSize: '0.85rem', width: '320px', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            Get a tailored 7-day study plan covering your uploaded reference files and correcting weak quiz topics.
          </p>
          <button onClick={handleGenerate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
            <Sparkles size={16} />
            Generate Study Schedule
          </button>
        </div>
      )}

      {/* Schedule plan display */}
      {!loading && !generating && schedule && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }} className="schedule-layout">
          {/* Day selection side list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>Study Cycle Days</h3>
            {schedule.plan.map((day) => {
              const progress = getDayProgress(day);
              const isCurrent = expandedDay === day.day;
              return (
                <button
                  key={day.day}
                  onClick={() => setExpandedDay(day.day)}
                  style={{
                    background: isCurrent ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-glass)',
                    border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>DAY {day.day}</span>
                    {progress === 100 && <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem' }}>
                    {day.dayName}
                  </div>
                  {/* Progress sub-bar */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--primary-hover)', height: '100%', width: `${progress}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expanded Day Details panel */}
          <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {(() => {
              const activeDay = schedule.plan.find(d => d.day === expandedDay);
              if (!activeDay) return null;
              const progress = getDayProgress(activeDay);

              return (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  {/* Day Header */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-hover)', fontWeight: '600', letterSpacing: '0.05em' }}>DAY {activeDay.day} • {activeDay.dayName.toUpperCase()}</span>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginTop: '0.25rem' }}>{activeDay.topic}</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Clock size={16} />
                      <span>{activeDay.timeSlot}</span>
                    </div>
                  </div>

                  {/* Tasks Checklist */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
                      Tasks Checklist
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeDay.tasks.map((task, i) => {
                        const taskKey = `${activeDay.day}_${i}`;
                        const isChecked = !!checkedTasks[taskKey];
                        return (
                          <div
                            key={i}
                            onClick={() => handleToggleTask(activeDay.day, i)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '1rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isChecked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                              border: isChecked ? '1px solid rgba(139, 92, 246, 0.1)' : '1px solid transparent',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{
                                width: '18px',
                                height: '18px',
                                accentColor: 'var(--primary)',
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{
                              fontSize: '0.95rem',
                              color: isChecked ? 'var(--text-secondary)' : 'white',
                              textDecoration: isChecked ? 'line-through' : 'none',
                              transition: 'all var(--transition-fast)'
                            }}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Study Tips Box */}
                  {activeDay.tips && activeDay.tips.length > 0 && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--warning)', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lightbulb size={16} /> Study Tips
                      </h4>
                      <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.5' }}>
                        {activeDay.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      <style>{`
        @media (max-width: 900px) {
          .schedule-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
