import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Layers, 
  GraduationCap, 
  Calendar, 
  BarChart2, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Study Materials', path: '/materials', icon: BookOpen },
    { name: 'Summaries', path: '/summaries', icon: FileText },
    { name: 'Flashcards', path: '/flashcards', icon: Layers },
    { name: 'Quizzes', path: '/quizzes', icon: GraduationCap },
    { name: 'Study Schedule', path: '/schedule', icon: Calendar },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          color: 'white',
          padding: '0.5rem',
          borderRadius: 'var(--radius-sm)',
          display: 'none', // Shown in CSS media queries
          cursor: 'pointer'
        }}
        className="mobile-toggle"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside 
        className={`glass-panel ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1rem',
          borderRadius: '0',
          borderRight: '1px solid var(--border-glass)',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          transition: 'transform var(--transition-normal)'
        }}
      >
        {/* Logo/Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-glow)'
          }}>
            S
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', margin: 0 }}>StudyAI</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>AI STUDY ASSISTANT</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all var(--transition-fast)'
                })}
                className="nav-link"
              >
                <Icon size={20} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        {currentUser && (
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '1rem',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-hover)',
                border: '1px solid var(--border-glass)'
              }}>
                <User size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser.displayName || 'Student'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: '500',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </aside>
      
      {/* Mobile styles patch in React (inline injection) */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle {
            display: block !important;
          }
          aside {
            position: fixed !important;
            height: 100vh !important;
            transform: translateX(-100%);
          }
          aside.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
