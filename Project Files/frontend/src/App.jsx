import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Summary from './pages/Summary';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <div className="app-container">
      {/* Render sidebar navigation for authenticated sessions only */}
      {currentUser && <Navbar />}
      
      <main className="main-content" style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public Auth pages */}
          <Route path="/auth" element={!currentUser ? <Auth /> : <Navigate to="/" replace />} />
          
          {/* Protected Dashboard pages */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/summaries" element={<ProtectedRoute><Summary /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          
          {/* Fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
