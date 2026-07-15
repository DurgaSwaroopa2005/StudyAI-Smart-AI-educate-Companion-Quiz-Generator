import React, { useState, useEffect } from 'react';
import { getDocuments, generateFlashcards, getFlashcards, updateFlashcards } from '../api';
import { Sparkles, BookOpen, Layers, Check, RefreshCw, Shuffle, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

export default function Flashcards() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [deck, setDeck] = useState(null); // { flashcardId, cards: [] }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await getDocuments();
        setDocuments(res.data);
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  // Fetch flashcards for selected document
  const handleDocChange = async (docId) => {
    setSelectedDocId(docId);
    setError('');
    setDeck(null);
    setCurrentIndex(0);
    setIsFlipped(false);

    if (!docId) return;

    try {
      const res = await getFlashcards(docId);
      setDeck(res.data);
    } catch (err) {
      // If 404, it means cards haven't been generated yet for this doc
      if (err.response?.status !== 404) {
        console.error(err);
        setError("Error fetching flashcards.");
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedDocId) return;
    setError('');
    setGenerating(true);
    setDeck(null);

    try {
      const res = await generateFlashcards(selectedDocId);
      setDeck(res.data);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "AI Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!deck || deck.cards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, currentIndex, isFlipped]);

  const handleNext = () => {
    if (!deck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (!deck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length);
    }, 150);
  };

  const handleShuffle = () => {
    if (!deck) return;
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
      setDeck({ ...deck, cards: shuffled });
      setCurrentIndex(0);
    }, 150);
  };

  const handleMarkKnown = async () => {
    if (!deck || deck.cards.length === 0) return;
    
    setSaving(true);
    const updatedCards = deck.cards.map((card, idx) => {
      if (idx === currentIndex) {
        return { ...card, isKnown: !card.isKnown };
      }
      return card;
    });

    try {
      await updateFlashcards(selectedDocId, updatedCards);
      setDeck({ ...deck, cards: updatedCards });
    } catch (err) {
      console.error(err);
      setError("Failed to sync known status to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDeck = async () => {
    if (!deck) return;
    setSaving(true);
    const reset = deck.cards.map(card => ({ ...card, isKnown: false }));
    try {
      await updateFlashcards(selectedDocId, reset);
      setDeck({ ...deck, cards: reset });
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
      setError("Failed to reset deck.");
    } finally {
      setSaving(false);
    }
  };

  // Card progress stats
  const totalCards = deck?.cards.length || 0;
  const knownCards = deck?.cards.filter(c => c.isKnown).length || 0;
  const currentCard = deck?.cards[currentIndex];
  const progressPercent = totalCards > 0 ? (knownCards / totalCards) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Flashcards</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Create study cards from your materials. Press Spacebar to flip, Arrow keys to navigate.</p>
        </div>
      </div>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Selector Dashboard Card */}
      <div className="glass-panel flashcard-selector" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <select
            className="input-control"
            value={selectedDocId}
            onChange={(e) => handleDocChange(e.target.value)}
            disabled={loadingDocs || generating}
          >
            <option value="">-- Choose Study Material --</option>
            {documents.map(doc => (
              <option key={doc.docId} value={doc.docId}>{doc.fileName}</option>
            ))}
          </select>
        </div>

        {selectedDocId && !deck && !generating && (
          <button onClick={handleGenerate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
            <Sparkles size={16} />
            Generate Flashcards
          </button>
        )}
      </div>

      {/* Main Flashcard player */}
      {generating && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', minHeight: '350px' }}>
          <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Gemini is drafting flashcards, mapping topics, and designing difficulty tags...</p>
        </div>
      )}

      {!generating && !deck && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '350px' }}>
          <Layers size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '500' }}>No flashcard deck active</h3>
          <p style={{ fontSize: '0.85rem', width: '320px', marginTop: '0.25rem' }}>Select a study document above. We'll automatically load existing cards or generate new ones.</p>
        </div>
      )}

      {!generating && deck && deck.cards.length === 0 && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '350px' }}>
          <Layers size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '500' }}>Zero cards generated</h3>
          <button onClick={handleGenerate} className="btn btn-primary" style={{ marginTop: '1rem' }}>Re-generate Cards</button>
        </div>
      )}

      {!generating && deck && deck.cards.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Deck Controls Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Card {currentIndex + 1} of {totalCards}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleShuffle} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }} title="Shuffle Deck">
                <Shuffle size={12} />
                Shuffle
              </button>
              <button onClick={handleResetDeck} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', color: 'var(--warning)' }} title="Reset Deck Progress" disabled={saving}>
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
          </div>

          {/* Flashcard container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}
          >
            <div className="flashcard-inner">
              {/* Front Side */}
              <div className="flashcard-front">
                <span className="badge badge-info" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                  {currentCard.topic}
                </span>
                <span className={`badge ${currentCard.difficulty === 'Easy' ? 'badge-success' : currentCard.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'}`} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                  {currentCard.difficulty}
                </span>

                <p style={{ fontSize: '1.25rem', fontWeight: '500', lineHeight: '1.6', color: 'white' }}>
                  {currentCard.question}
                </p>

                <span style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click card or space to flip
                </span>
                
                {currentCard.isKnown && (
                  <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.8rem', fontWeight: '600' }}>
                    <CheckCircle2 size={16} /> Known
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div className="flashcard-back">
                <p style={{ fontSize: '1.15rem', lineHeight: '1.6', color: 'white' }}>
                  {currentCard.answer}
                </p>
                <span style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click card or space to flip back
                </span>
              </div>
            </div>
          </div>

          {/* Player controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '1rem' }}>
            <button onClick={handlePrev} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
              <ArrowLeft size={20} />
            </button>

            <button 
              onClick={handleMarkKnown} 
              className={`btn ${currentCard.isKnown ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              disabled={saving}
            >
              <Check size={18} />
              {currentCard.isKnown ? 'Mark as Studying' : 'Mark as Known'}
            </button>

            <button onClick={handleNext} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Progress Tracker bar */}
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <span>Learning Progress</span>
              <span>{knownCards} of {totalCards} cards learned ({Math.round(progressPercent)}%)</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--success)', height: '100%', width: `${progressPercent}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
