import React, { useState, useEffect } from 'react';
import { getDocuments, generateQuiz, evaluateQuiz } from '../api';
import { Sparkles, BookOpen, GraduationCap, Award, CheckCircle, XCircle, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';

export default function Quiz() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [quizType, setQuizType] = useState('mcq'); // mcq, tf, short
  const [numQuestions, setNumQuestions] = useState(5);
  
  // Quiz session states
  const [activeQuiz, setActiveQuiz] = useState(null); // { quizId, questions: [] }
  const [userAnswers, setUserAnswers] = useState({}); // { qId: answerText }
  const [evalResult, setEvalResult] = useState(null); // { score, correctCount, answers: [], weakTopicsIdentified: [] }
  
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await getDocuments();
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  const handleStartQuiz = async () => {
    if (!selectedDocId) {
      setError("Please select a study document.");
      return;
    }
    
    setError('');
    setGenerating(true);
    setActiveQuiz(null);
    setEvalResult(null);
    setUserAnswers({});

    try {
      const res = await generateQuiz(selectedDocId, quizType, numQuestions);
      setActiveQuiz(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "AI generation failed. Ensure your material is uploaded properly.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionSelect = (qId, optionVal) => {
    setUserAnswers({
      ...userAnswers,
      [qId]: optionVal
    });
  };

  const handleShortAnswerChange = (qId, textVal) => {
    setUserAnswers({
      ...userAnswers,
      [qId]: textVal
    });
  };

  const handleSubmitQuiz = async () => {
    // Check if answers exist
    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k].trim()).length;
    if (answeredCount < activeQuiz.questions.length) {
      if (!window.confirm("You have not answered all questions. Submit anyway?")) return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await evaluateQuiz(activeQuiz.quizId, userAnswers);
      setEvalResult(res.data);
      setActiveQuiz(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to evaluate quiz responses.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Exam Generator</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Create custom Multiple Choice, True/False, or Short Answer exams to test your knowledge.</p>
        </div>
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Quiz setup panel */}
      {!activeQuiz && !evalResult && !generating && (
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
            Configure Your Quiz
          </h3>

          <div className="form-group">
            <label className="form-label">Study Material Source</label>
            <select
              className="input-control"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={loadingDocs}
            >
              <option value="">-- Choose Study Material --</option>
              {documents.map(doc => (
                <option key={doc.docId} value={doc.docId}>{doc.fileName}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Exam Question Type</label>
              <select
                className="input-control"
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="tf">True / False</option>
                <option value="short">Short Written Answers</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Questions Count</label>
              <select
                className="input-control"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            disabled={!selectedDocId}
          >
            <Sparkles size={16} />
            Generate Custom Quiz
          </button>
        </div>
      )}

      {/* Generating/Evaluating States */}
      {generating && (
        <div className="glass-panel" style={{ padding: '5rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', minHeight: '350px' }}>
          <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Gemini is drafting questions, mapping correct options, and drafting explanations...</p>
        </div>
      )}

      {submitting && (
        <div className="glass-panel" style={{ padding: '5rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', minHeight: '350px' }}>
          <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>AI Grader is evaluating your answers, checking rubrics, and mapping performance insights...</p>
        </div>
      )}

      {/* Quiz session display */}
      {activeQuiz && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Source: <strong style={{ color: 'white' }}>{activeQuiz.fileName}</strong>
            </span>
            <span className="badge badge-info">
              {activeQuiz.quizType.toUpperCase()} Exam
            </span>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeQuiz.questions.map((q, index) => (
              <div key={q.id} className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--primary-hover)', marginRight: '0.5rem' }}>Q{index+1}.</span>
                  {q.question}
                </h4>

                {/* Multiple choice rendering */}
                {(activeQuiz.quizType === 'mcq' || activeQuiz.quizType === 'tf') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {q.options.map((opt) => {
                      const isSelected = userAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleOptionSelect(q.id, opt)}
                          style={{
                            textAlign: 'left',
                            padding: '1rem',
                            background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                            color: isSelected ? 'white' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: isSelected ? '600' : '400',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Short answer rendering
                  <div className="form-group">
                    <textarea
                      rows={3}
                      placeholder="Write your explanation here (1-3 sentences)..."
                      className="input-control"
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button onClick={handleSubmitQuiz} className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
              Submit Exam Responses
            </button>
          </div>
        </div>
      )}

      {/* Quiz Evaluation Results display */}
      {evalResult && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Results Summary Box */}
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
            <Award size={48} style={{ color: evalResult.score >= 80 ? 'var(--success)' : evalResult.score >= 50 ? 'var(--warning)' : 'var(--error)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz Performance Summary</h2>
            <div style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-display)', background: 'linear-gradient(to right, #ffffff, var(--primary-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0.5rem 0' }}>
              {evalResult.score}%
            </div>
            
            <p style={{ color: 'var(--text-secondary)' }}>
              You answered <strong>{evalResult.correctCount}</strong> out of <strong>{evalResult.totalQuestions}</strong> questions correctly.
            </p>

            {evalResult.weakTopicsIdentified.length > 0 && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                  <AlertTriangle size={14} /> Weak Topics Identified
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {evalResult.weakTopicsIdentified.map((topic, i) => (
                    <span key={i} className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{topic}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Question Review */}
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Review Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {evalResult.answers.map((ans, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '2rem', borderLeft: ans.isCorrect ? '4px solid var(--success)' : '4px solid var(--error)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                  <h4 style={{ fontSize: '1.05rem', color: 'white', lineHeight: '1.5', margin: 0 }}>
                    <span style={{ color: 'var(--primary-hover)', marginRight: '0.5rem' }}>Q{idx+1}.</span>
                    {ans.question}
                  </h4>
                  {ans.isCorrect ? (
                    <span className="badge badge-success" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                      <CheckCircle size={14} /> Correct
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                      <XCircle size={14} /> Incorrect
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Your Answer:</span>
                    <span style={{ color: ans.isCorrect ? 'white' : '#f87171', fontWeight: '500' }}>{ans.userAnswer || '[No Answer Provided]'}</span>
                  </div>

                  {!ans.isCorrect && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Expected Answer Guide:</span>
                      <span style={{ color: 'white', fontWeight: '500' }}>{ans.correctAnswer}</span>
                    </div>
                  )}
                </div>

                {ans.feedback && (
                  <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-hover)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>AI Feedback & Explanation:</span>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ans.feedback}</p>
                    {ans.explanation && ans.explanation !== ans.feedback && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                        {ans.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem' }}>
            <button onClick={() => setEvalResult(null)} className="btn btn-secondary">
              Try Another Quiz
            </button>
            <button onClick={handleStartQuiz} className="btn btn-primary">
              Retry This Quiz Config
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
