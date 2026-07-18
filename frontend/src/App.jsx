import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Play, CheckCircle, HelpCircle, Star, DollarSign, Award, Bell,
  Trash2, Plus, LogOut, Shield, User, Filter, Search, ShieldCheck, ArrowRight, ArrowLeft,
  TrendingUp, Award as CertIcon, Send, MessageSquare, AlertTriangle, Check, X, Hash,
  Eye, EyeOff, Menu, Grid, LayoutDashboard, Compass, Globe, Users
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { API_BASE_URL } from '../config';

// Helper to resolve high-quality topic-related images
const getCourseImage = (course) => {
  if (course.thumbnail) {
    return course.thumbnail.startsWith('http') ? course.thumbnail : `${API_BASE_URL}${course.thumbnail}`;
  }

  const title = (course.title || '').toLowerCase();

  const pythonImages = [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60'
  ];

  const webImages = [
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60'
  ];

  const englishImages = [
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60'
  ];

  const designImages = [
    'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60'
  ];

  const idx = (course.id || 0);

  if (title.includes('python') || title.includes('django')) {
    return pythonImages[idx % pythonImages.length];
  }
  if (title.includes('mern') || title.includes('react') || title.includes('web') || title.includes('javascript') || title.includes('node') || title.includes('mongodb') || title.includes('express')) {
    return webImages[idx % webImages.length];
  }
  if (title.includes('english') || title.includes('speak') || title.includes('language') || title.includes('spoken')) {
    return englishImages[idx % englishImages.length];
  }
  if (title.includes('design') || title.includes('ui') || title.includes('ux') || title.includes('art')) {
    return designImages[idx % designImages.length];
  }

  const defaultImages = [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60'
  ];
  return defaultImages[idx % defaultImages.length];
};

// --- SHARED HEADER & LAYOUT COMPONENT ---
const getNotificationTypeConfig = (type) => {
  switch (type) {
    case 'ENROLLMENT':
      return {
        icon: <BookOpen size={14} color="var(--primary)" />,
        badgeText: 'Enrollment',
        badgeStyle: { background: 'rgba(29, 78, 216, 0.06)', color: 'var(--primary)', border: '1px solid rgba(29, 78, 216, 0.1)' }
      };
    case 'LESSON':
      return {
        icon: <Play size={14} color="var(--accent-emerald)" />,
        badgeText: 'New Lesson',
        badgeStyle: { background: 'rgba(5, 150, 105, 0.06)', color: 'var(--accent-emerald)', border: '1px solid rgba(5, 150, 105, 0.1)' }
      };
    case 'QA':
      return {
        icon: <MessageSquare size={14} color="var(--accent-cyan)" />,
        badgeText: 'Q&A Chat',
        badgeStyle: { background: 'rgba(2, 132, 199, 0.06)', color: 'var(--accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.1)' }
      };
    case 'REFUND':
      return {
        icon: <DollarSign size={14} color="var(--accent-rose)" />,
        badgeText: 'Refund',
        badgeStyle: { background: 'rgba(220, 38, 38, 0.06)', color: 'var(--accent-rose)', border: '1px solid rgba(220, 38, 38, 0.1)' }
      };
    case 'ANNOUNCEMENT':
    default:
      return {
        icon: <Bell size={14} color="var(--accent-amber)" />,
        badgeText: 'Announcement',
        badgeStyle: { background: 'rgba(217, 119, 6, 0.06)', color: 'var(--accent-amber)', border: '1px solid rgba(217, 119, 6, 0.1)' }
      };
  }
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationRead } = useSocket();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavLinkClick = () => {
    // If screen width is less than 768px (mobile), auto-collapse
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="app-container">
      {/* Global animated background liquid flow blob */}
      <div className="fluid-dashboard-blob" />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 1.5rem',
          height: '70px',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: '1.5rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {!isCollapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={24} color="#fff" />
                </div>
                <span className="brand-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  EDUKA
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem',
                  borderRadius: '6px',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Menu size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: '6px',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {user ? (
            <>
              {user.role === 'STUDENT' && (
                <>
                  <NavLink to="/dashboard" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <LayoutDashboard size={18} /> <span className="nav-text">Dashboard</span>
                  </NavLink>
                  <NavLink to="/explore" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <Search size={18} /> <span className="nav-text">Courses</span>
                  </NavLink>
                  <NavLink to="/my-enrollments" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <BookOpen size={18} /> <span className="nav-text">My Learning</span>
                  </NavLink>
                  <NavLink to="/certificates" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <Award size={18} /> <span className="nav-text">Certificates</span>
                  </NavLink>
                </>
              )}

              {user.role === 'MENTOR' && (
                <>
                  <NavLink to="/mentor/dashboard" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <LayoutDashboard size={18} /> <span className="nav-text">Dashboard</span>
                  </NavLink>
                  <NavLink to="/mentor/courses" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <BookOpen size={18} /> <span className="nav-text">My Courses</span>
                  </NavLink>
                  <NavLink to="/explore" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <Search size={18} /> <span className="nav-text">Explore Courses</span>
                  </NavLink>
                  <NavLink to="/mentor/builder" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <Plus size={18} /> <span className="nav-text">Create Course</span>
                  </NavLink>
                  <NavLink to="/mentor/analytics" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <TrendingUp size={18} /> <span className="nav-text">Analytics</span>
                  </NavLink>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <NavLink to="/admin/dashboard" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}>
                    <Shield size={18} /> <span className="nav-text">Admin Console</span>
                  </NavLink>
                </>
              )}

              {user.role === 'STUDENT' ? (
                <>
                  <NavLink to="/profile" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', marginTop: 'auto' }}>
                    <User size={18} /> <span className="nav-text">Profile</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary student-logout-btn"
                    style={{
                      justifyContent: 'flex-start',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <LogOut size={18} /> <span className="nav-text">Logout</span>
                  </button>
                </>
              ) : (
                <NavLink to="/profile" onClick={handleNavLinkClick} className={({ isActive }) => `btn btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', marginTop: 'auto' }}>
                  <User size={18} /> <span className="nav-text">My Profile</span>
                </NavLink>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary" style={{ borderRadius: '10px' }}>Log In</Link>
              <Link to="/register" className="btn btn-secondary" style={{ borderRadius: '10px' }}>Sign Up</Link>
            </>
          )}
        </nav>
      </aside>

      {/* Mobile Sidebar Backdrop Overlay */}
      {!isCollapsed && window.innerWidth < 768 && (
        <div
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* Main Content Pane */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <header style={{ height: '70px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <button
                className="mobile-menu-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  borderRadius: '6px'
                }}
              >
                <Menu size={20} />
              </button>
            )}
            {user && (
              <span className="badge badge-intermediate" style={{ fontWeight: 600, background: 'rgba(29, 78, 216, 0.05)', color: 'var(--primary)', border: '1px solid rgba(29, 78, 216, 0.1)' }}>
                {user.role} Account
              </span>
            )}
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '50%', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--accent-rose)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '48px', right: '0', width: '340px', zIndex: 1000, padding: '1.25rem', maxHeight: '420px', overflowY: 'auto', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>Notifications</span>
                    {unreadCount > 0 && <span className="badge badge-advanced" style={{ fontSize: '0.7rem' }}>{unreadCount} Unread</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No new alerts
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {notifications.map((n) => {
                        const config = getNotificationTypeConfig(n.notification_type);
                        return (
                          <div key={n.id} style={{
                            fontSize: '0.85rem',
                            padding: '0.85rem',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            transition: 'var(--transition-smooth)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {config.icon}
                                <span className="badge" style={{ ...config.badgeStyle, fontSize: '0.65rem', padding: '0.15rem 0.45rem', fontWeight: 600 }}>
                                  {config.badgeText}
                                </span>
                              </div>
                              <button
                                onClick={() => markNotificationRead(n.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                Dismiss
                              </button>
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textAlign: 'left' }}>
                              {n.title}
                            </h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4', fontSize: '0.8rem', margin: 0, textAlign: 'left' }}>
                              {n.message}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.35rem 0.75rem', background: 'var(--bg-primary)', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
                <div style={{ textAlign: 'right', paddingLeft: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.first_name || user.username}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.45rem', border: 'none', borderRadius: '50%', background: 'var(--bg-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          )}
        </header>

        <main className="main-content" style={{ overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// --- AUTHENTICATION PAGES ---
const AuthHero = () => {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    {
      title: "Master High-Demand Skills",
      desc: "Learn Python, Web Development, and Graphic Design from industry experts at your own pace."
    },
    {
      title: "Track Your Milestones",
      desc: "Follow structured module players, test your knowledge with quizzes, and earn verified completion certificates."
    },
    {
      title: "Collaborate in Real-Time",
      desc: "Interact with peer students, share code snippets, ask questions, and chat directly in active community channels."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auth-hero-text-container">
      {/* Top Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 2 }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '0.65rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={32} color="#fff" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.25rem', letterSpacing: '-0.04em', color: '#fff' }}>
          EDUKA
        </span>
      </div>

      {/* Main Slideshow content */}
      <div style={{ zIndex: 2, margin: 'auto 0', maxWidth: '480px' }}>
        <div key={slideIndex} className="animate-fade-in" style={{ minHeight: '180px' }}>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: '#fff' }}>
            {slides[slideIndex].title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {slides[slideIndex].desc}
          </p>
        </div>

        {/* Carousel indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {slides.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setSlideIndex(idx)}
                style={{
                  width: idx === slideIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === slideIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tagline bottom */}
      <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
        <span>Professional Academy Program</span>
        <span>© 2026 eduka</span>
      </div>
    </div>
  );
};

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Reset password wizard states
  const [view, setView] = useState('login'); // 'login', 'request_reset', 'confirm_reset', 'reset_success'
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = await login(email.trim(), password);
      if (u.role === 'STUDENT') navigate('/dashboard');
      else if (u.role === 'MENTOR') navigate('/mentor/dashboard');
      else if (u.role === 'ADMIN') navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/password-reset/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setView('confirm_reset');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/password-reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setResetMsg(data.detail);
      setView('reset_success');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'request_reset') {
    return (
      <div className="auth-grid">
        {/* Organic fluid background blob */}
        <div className="fluid-hero-blob" />

        {/* Left panel educational carousel */}
        <AuthHero />

        {/* Right panel login form column */}
        <div className="auth-form-column">
          {/* Orbital background outline & floating icons */}
          <div className="orbit-wrapper">
            <div className="orbit-icon-item" style={{ top: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(-45deg)' }}><Compass size={22} /></div>
            <div className="orbit-icon-item" style={{ top: '100px', right: '40px', transform: 'rotate(15deg)' }}><BookOpen size={20} /></div>
            <div className="orbit-icon-item" style={{ bottom: '100px', right: '40px', transform: 'rotate(75deg)' }}><Globe size={20} /></div>
            <div className="orbit-icon-item" style={{ bottom: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(135deg)' }}><Award size={22} /></div>
            <div className="orbit-icon-item" style={{ bottom: '100px', left: '40px', transform: 'rotate(195deg)' }}><Users size={20} /></div>
            <div className="orbit-icon-item" style={{ top: '100px', left: '40px', transform: 'rotate(255deg)' }}><MessageSquare size={20} /></div>
          </div>

          <div className="glass-auth-card animate-slide-up">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.03em', fontWeight: 800 }}>Reset Password</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', marginBottom: '2.25rem' }}>Enter your email address to receive a 6-digit verification code.</p>

            {resetError && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.08)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleRequestReset}>
              <div className="form-group" style={{ marginBottom: '2.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Email Address</label>
                <input
                  type="email"
                  className="form-input-premium"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-pill-gradient">
                {loading ? 'Sending...' : 'Send Reset Code'} <ArrowRight size={18} />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setView('login')}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.85rem 1.5rem', borderRadius: '50px' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (view === 'confirm_reset') {
    return (
      <div className="auth-grid">
        {/* Organic fluid background blob */}
        <div className="fluid-hero-blob" />

        {/* Left panel educational carousel */}
        <AuthHero />

        {/* Right panel login form column */}
        <div className="auth-form-column">
          {/* Orbital background outline & floating icons */}
          <div className="orbit-wrapper">
            <div className="orbit-icon-item" style={{ top: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(-45deg)' }}><Compass size={22} /></div>
            <div className="orbit-icon-item" style={{ top: '100px', right: '40px', transform: 'rotate(15deg)' }}><BookOpen size={20} /></div>
            <div className="orbit-icon-item" style={{ bottom: '100px', right: '40px', transform: 'rotate(75deg)' }}><Globe size={20} /></div>
            <div className="orbit-icon-item" style={{ bottom: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(135deg)' }}><Award size={22} /></div>
            <div className="orbit-icon-item" style={{ bottom: '100px', left: '40px', transform: 'rotate(195deg)' }}><Users size={20} /></div>
            <div className="orbit-icon-item" style={{ top: '100px', left: '40px', transform: 'rotate(255deg)' }}><MessageSquare size={20} /></div>
          </div>

          <div className="glass-auth-card animate-slide-up">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.03em', fontWeight: 800 }}>Verify Code</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2.25rem', lineHeight: '1.4' }}>We sent a 6-digit code to <strong>{resetEmail}</strong>. Enter it below with your new password.</p>

            {resetError && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.08)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReset}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>6-Digit Verification Code</label>
                <input
                  type="text"
                  className="form-input-premium"
                  maxLength="6"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>New Password</label>
                <input
                  type="password"
                  className="form-input-premium"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-pill-gradient">
                {loading ? 'Resetting...' : 'Reset Password'} <Check size={18} />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setView('request_reset')}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.85rem 1.5rem', borderRadius: '50px' }}
            >
              Back / Resend Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reset_success') {
    return (
      <div className="auth-grid">
        {/* Organic fluid background blob */}
        <div className="fluid-hero-blob" />

        {/* Left panel educational carousel */}
        <AuthHero />

        {/* Right panel login form column */}
        <div className="auth-form-column">
          {/* Orbital background outline & floating icons */}
          <div className="orbit-wrapper">
            <div className="orbit-icon-item" style={{ top: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(-45deg)' }}><Compass size={22} /></div>
            <div className="orbit-icon-item" style={{ top: '100px', right: '40px', transform: 'rotate(15deg)' }}><BookOpen size={20} /></div>
            <div className="orbit-icon-item" style={{ bottom: '100px', right: '40px', transform: 'rotate(75deg)' }}><Globe size={20} /></div>
            <div className="orbit-icon-item" style={{ bottom: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(135deg)' }}><Award size={22} /></div>
            <div className="orbit-icon-item" style={{ bottom: '100px', left: '40px', transform: 'rotate(195deg)' }}><Users size={20} /></div>
            <div className="orbit-icon-item" style={{ top: '100px', left: '40px', transform: 'rotate(255deg)' }}><MessageSquare size={20} /></div>
          </div>

          <div className="glass-auth-card animate-slide-up" style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={36} color="var(--accent-emerald)" />
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Success!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              {resetMsg || 'Your password has been reset successfully. You can now log in using your new password.'}
            </p>

            <button
              type="button"
              onClick={() => { setView('login'); setEmail(resetEmail); }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem 1.5rem', borderRadius: '50px' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-grid">
      {/* Organic fluid background blob */}
      <div className="fluid-hero-blob" />

      {/* Left panel educational carousel */}
      <AuthHero />

      {/* Right panel login form column */}
      <div className="auth-form-column">
        {/* Orbital background outline & floating icons */}
        <div className="orbit-wrapper">
          <div className="orbit-icon-item" style={{ top: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(-45deg)' }}><Compass size={22} /></div>
          <div className="orbit-icon-item" style={{ top: '100px', right: '40px', transform: 'rotate(15deg)' }}><BookOpen size={20} /></div>
          <div className="orbit-icon-item" style={{ bottom: '100px', right: '40px', transform: 'rotate(75deg)' }}><Globe size={20} /></div>
          <div className="orbit-icon-item" style={{ bottom: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(135deg)' }}><Award size={22} /></div>
          <div className="orbit-icon-item" style={{ bottom: '100px', left: '40px', transform: 'rotate(195deg)' }}><Users size={20} /></div>
          <div className="orbit-icon-item" style={{ top: '100px', left: '40px', transform: 'rotate(255deg)' }}><MessageSquare size={20} /></div>
        </div>

        <div className="glass-auth-card animate-slide-up">
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.03em', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', marginBottom: '2.25rem' }}>Follow structured module players to login.</p>

          {error && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.08)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Fake inputs to fool browser autofill */}
            <input type="text" name="prevent_autofill_username" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
            <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex="-1" autoComplete="new-password" />

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Email or Username</label>
              <input
                id="login_email_username"
                type="text"
                className="form-input-premium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email user@gmail.com"
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input-premium"
                  style={{ paddingRight: '2.75rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-pill-gradient" style={{ marginTop: '0.5rem' }}>
              Log In <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
            <span>
              Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>Sign up</Link>
            </span>
            <button
              type="button"
              onClick={() => { setView('request_reset'); setError(''); setResetError(''); setResetEmail(email); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, padding: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Forgot Password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ email: '', username: '', password: '', first_name: '', last_name: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-grid">
      {/* Organic fluid background blob */}
      <div className="fluid-hero-blob" />

      {/* Left panel educational carousel */}
      <AuthHero />

      {/* Right panel signup form column */}
      <div className="auth-form-column" style={{ overflowY: 'auto' }}>
        {/* Orbital background outline & floating icons */}
        <div className="orbit-wrapper">
          <div className="orbit-icon-item" style={{ top: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(-45deg)' }}><Compass size={22} /></div>
          <div className="orbit-icon-item" style={{ top: '100px', right: '40px', transform: 'rotate(15deg)' }}><BookOpen size={20} /></div>
          <div className="orbit-icon-item" style={{ bottom: '100px', right: '40px', transform: 'rotate(75deg)' }}><Globe size={20} /></div>
          <div className="orbit-icon-item" style={{ bottom: '-21px', left: 'calc(50% - 21px)', transform: 'rotate(135deg)' }}><Award size={22} /></div>
          <div className="orbit-icon-item" style={{ bottom: '100px', left: '40px', transform: 'rotate(195deg)' }}><Users size={20} /></div>
          <div className="orbit-icon-item" style={{ top: '100px', left: '40px', transform: 'rotate(255deg)' }}><MessageSquare size={20} /></div>
        </div>

        <div className="glass-auth-card animate-slide-up" style={{ maxWidth: '480px', margin: 'auto 0' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.03em', fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', marginBottom: '2rem' }}>Choose your role and start learning or mentoring.</p>

          {error && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.08)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-emerald)', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} />
              <span>Account created successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>First Name</label>
                <input
                  type="text"
                  className="form-input-premium"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Last Name</label>
                <input
                  type="text"
                  className="form-input-premium"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Username</label>
              <input
                type="text"
                className="form-input-premium"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe12"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Email</label>
              <input
                type="email"
                className="form-input-premium"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Password</label>
              <input
                type="password"
                className="form-input-premium"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>I want to register as a:</label>
              <select
                className="form-input-premium"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ background: 'var(--bg-secondary)' }}
              >
                <option value="STUDENT">Student (Browse, Enroll, Watch)</option>
                <option value="MENTOR">Mentor (Create Courses, Sell, Moderation)</option>
              </select>
            </div>

            <button type="submit" className="btn-pill-gradient">
              Sign Up <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1.75rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- PROFILE VIEW ---
const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({ first_name: '', last_name: '', bio: '' });
  const [mentorData, setMentorData] = useState({ specialization: '', hourly_rate: 0.00, qualifications: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
      });
      if (user.role === 'MENTOR' && user.mentor_profile) {
        setMentorData({
          specialization: user.mentor_profile.specialization || '',
          hourly_rate: user.mentor_profile.hourly_rate || 0.00,
          qualifications: user.mentor_profile.qualifications || '',
        });
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const updatePayload = { ...formData };
      if (user.role === 'MENTOR') {
        updatePayload.mentor_profile = mentorData;
      }
      await updateProfile(updatePayload);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Error updating profile: ' + err.message);
    }
  };

  if (!user) return <div>Please log in</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Profile Details</h2>

        {message && (
          <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio (Brief Summary)</label>
            <textarea
              className="form-input"
              rows="3"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          </div>

          {user.role === 'MENTOR' && (
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingOver: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Mentor Credentials</h3>

              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  value={mentorData.specialization}
                  onChange={(e) => setMentorData({ ...mentorData, specialization: e.target.value })}
                  placeholder="e.g. Django, System Architecture"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hourly Rate (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={mentorData.hourly_rate}
                  onChange={(e) => setMentorData({ ...mentorData, hourly_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Qualifications</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={mentorData.qualifications}
                  onChange={(e) => setMentorData({ ...mentorData, qualifications: e.target.value })}
                  placeholder="e.g. Master of Software Engineering, 8 years teaching experience"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STUDENT VIEW: BROWSE COURSES ---
const ExploreCourses = () => {
  const { fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({ level: '', price_type: '', min_rating: 0, min_duration: '', max_duration: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        let queryParams = [];
        if (search) queryParams.push(`search=${search}`);
        if (filters.level) queryParams.push(`level=${filters.level}`);
        if (filters.price_type) queryParams.push(`price_type=${filters.price_type}`);
        if (filters.min_rating) queryParams.push(`min_rating=${filters.min_rating}`);
        if (filters.min_duration) queryParams.push(`min_duration=${filters.min_duration}`);
        if (filters.max_duration) queryParams.push(`max_duration=${filters.max_duration}`);

        const url = `${API_BASE_URL}/api/courses/?${queryParams.join('&')}`;
        const res = await fetch(url);
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadCourses, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [search, filters]);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/autocomplete/?q=${search}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const getGradientByLevel = (level) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER': return 'linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(5, 150, 105, 0.02) 100%)';
      case 'INTERMEDIATE': return 'linear-gradient(135deg, rgba(29, 78, 216, 0.12) 0%, rgba(29, 78, 216, 0.02) 100%)';
      case 'ADVANCED': return 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.02) 100%)';
      default: return 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-primary) 100%)';
    }
  };

  const getIconColorByLevel = (level) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER': return 'var(--accent-emerald)';
      case 'INTERMEDIATE': return 'var(--primary)';
      case 'ADVANCED': return 'var(--accent-purple)';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Explore Curriculums</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Find courses curated by verified industry mentors.</p>
      </div>

      {/* Advanced Filters */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            className="form-input-premium"
            style={{ paddingLeft: '2.75rem', borderRadius: '12px' }}
            placeholder="Search keywords, titles, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                marginTop: '0.5rem',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(16px)',
                padding: '0.5rem'
              }}
            >
              {suggestions.map((suggestion) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => {
                    setSearch(suggestion.text);
                    setShowSuggestions(false);
                  }}
                  style={{
                    padding: '0.8rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: '8px',
                    transition: 'var(--transition-smooth)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-primary)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {suggestion.type === 'course' && <BookOpen size={16} color="var(--primary)" />}
                  {suggestion.type === 'tag' && <Hash size={16} color="var(--accent-cyan)" />}
                  {suggestion.type === 'mentor' && <User size={16} color="var(--accent-emerald)" />}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{suggestion.text}</span>
                  <span className="badge" style={{ fontSize: '0.65rem', marginLeft: 'auto', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                    {suggestion.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-input-premium"
            style={{ width: '150px', background: 'var(--bg-secondary)', borderRadius: '12px' }}
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
          >
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          <select
            className="form-input-premium"
            style={{ width: '150px', background: 'var(--bg-secondary)', borderRadius: '12px' }}
            value={filters.price_type}
            onChange={(e) => setFilters({ ...filters, price_type: e.target.value })}
          >
            <option value="">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          <select
            className="form-input-premium"
            style={{ width: '150px', background: 'var(--bg-secondary)', borderRadius: '12px' }}
            value={filters.min_rating}
            onChange={(e) => setFilters({ ...filters, min_rating: parseInt(e.target.value) || 0 })}
          >
            <option value="0">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.2rem 0.5rem', border: '1px solid var(--glass-border)' }}>
            <input
              type="number"
              placeholder="Min Hrs"
              className="form-input-premium"
              style={{ width: '90px', border: 'none', background: 'transparent', padding: '0.6rem 0.5rem', boxShadow: 'none' }}
              value={filters.min_duration}
              onChange={(e) => setFilters({ ...filters, min_duration: e.target.value })}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
            <input
              type="number"
              placeholder="Max Hrs"
              className="form-input-premium"
              style={{ width: '90px', border: 'none', background: 'transparent', padding: '0.6rem 0.5rem', boxShadow: 'none' }}
              value={filters.max_duration}
              onChange={(e) => setFilters({ ...filters, max_duration: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--primary-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span>Loading Courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel animate-slide-up" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.5)' }}>
          <BookOpen size={48} style={{ marginBottom: '1.5rem', opacity: 0.5, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Courses Found</h3>
          <p>Try modifying your search query or adjusting your filters.</p>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <div key={course.id} className="glass-panel course-card animate-slide-up" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
              <div style={{ height: '160px', background: getGradientByLevel(course.level), display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                <img
                  src={getCourseImage(course)}
                  alt={course.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0
                  }}
                />
              </div>
              <div className="course-card-content" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} /> {course.mentor_name || 'Verified Mentor'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                    <Star size={14} fill="var(--accent-amber)" color="var(--accent-amber)" />
                    {course.average_rating ? Number(course.average_rating).toFixed(1) : 'New'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: 800, letterSpacing: '-0.02em' }}>{course.title}</h3>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className={`badge badge-${course.level.toLowerCase()}`}>{course.level}</span>
                </div>

                {/* Course Tags Pills */}
                {course.tags && course.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {course.tags.map(t => (
                      <span
                        key={t.id}
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(29, 78, 216, 0.05)',
                          color: 'var(--primary)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '50px',
                          border: '1px solid rgba(29, 78, 216, 0.08)',
                          fontWeight: 600
                        }}
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  {course.description.length > 95 ? course.description.slice(0, 95) + '...' : course.description}
                </p>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem', color: course.price > 0 ? 'var(--primary)' : 'var(--accent-emerald)' }}>
                    {course.price > 0 ? `Rs ${course.price}` : 'Free'}
                  </span>
                  <Link to={`/course/${course.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem', borderRadius: '10px', boxShadow: 'none' }}>
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- STUDENT DASHBOARD ---
const StudentDashboard = () => {
  const { fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/`);
        if (res.ok) {
          const list = await res.json();
          setCourses(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const enrolledCourses = courses.filter(c => c.is_enrolled);
  const completedCourses = enrolledCourses.filter(c => parseFloat(c.enrollment_progress || 0) >= 100.0);
  const certificatesCount = completedCourses.length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Learner Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Track your learning progress, enrolled courses and certificates.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dashboard statistics...</div>
      ) : (
        <>
          {/* Metrics row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', flex: 1 }}>
              {/* Enrolled Courses Card */}
              <div className="stat-card animate-slide-up">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Enrolled Courses</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.75rem' }}>{enrolledCourses.length}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Courses currently assigned to you</span>
              </div>

              {/* Completed Card */}
              <div className="stat-card stat-card-cyan animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Completed</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.75rem' }}>{completedCourses.length}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Courses successfully completed</span>
              </div>

              {/* Certificates Card */}
              <div className="stat-card stat-card-emerald animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Certificates</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.75rem' }}>{certificatesCount}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Certificates earned from completed courses</span>
              </div>
            </div>

            {window.innerWidth > 1024 && (
              <div style={{
                background: 'var(--primary)',
                color: '#ffffff',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
                flexShrink: 0,
                transition: 'var(--transition-smooth)'
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => {
                  navigate('/explore');
                }}
                title="Explore Courses"
              >
                <ArrowRight size={20} />
              </div>
            )}
          </div>

          {/* Continue Learning Section */}
          <div className="glass-panel animate-slide-up" style={{ padding: '2rem', borderRadius: '16px', animationDelay: '0.3s' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Continue Learning</h3>
            {enrolledCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                You are not enrolled in any courses yet. <Link to="/explore" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Find a course</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="student-table">
                  <thead>
                    <tr>
                      <th style={{ width: '55%' }}>Course</th>
                      <th style={{ width: '25%' }}>Status</th>
                      <th style={{ width: '20%', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledCourses.map((course) => {
                      const isCompleted = parseFloat(course.enrollment_progress || 0) >= 100;
                      return (
                        <tr key={course.id} className="student-table-row">
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: isCompleted ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                              fontWeight: 600,
                              fontSize: '0.9rem'
                            }}>
                              {isCompleted ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/course/${course.id}`}
                              className="btn btn-primary"
                              style={{
                                borderRadius: '8px',
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-block',
                                transition: 'var(--transition-smooth)'
                              }}
                            >
                              Continue
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- STUDENT CERTIFICATES ---
const StudentCertificates = () => {
  const { fetchWithAuth, user } = useAuth();
  const [completedEnrollments, setCompletedEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/`);
        if (res.ok) {
          const courses = await res.json();
          const completed = courses.filter(c => c.is_enrolled && parseFloat(c.enrollment_progress || 0) >= 100);
          setCompletedEnrollments(completed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCertificates();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>My Certificates</h2>
        <p style={{ color: 'var(--text-secondary)' }}>View and print certificates for completed courses.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading certificates...</div>
      ) : completedEnrollments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          You haven't completed any courses yet to earn certificates.
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/explore" className="btn btn-primary" style={{ textDecoration: 'none', borderRadius: '10px' }}>Browse Courses</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {completedEnrollments.map((course) => {
            const certId = `CERT-${String(user.id).padStart(4, '0')}-${String(course.id).padStart(4, '0')}`;
            return (
              <div key={course.id} className="glass-panel animate-slide-up" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '5px solid var(--accent-emerald)', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Certificate</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>{course.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Credential ID: {certId}</p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => navigate(`/verify/${certId}`)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                  >
                    <Award size={16} /> View Certificate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- STUDENT ENROLLMENTS ---
const MyEnrollments = () => {
  const { fetchWithAuth } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        // Enrolled courses list
        const res = await fetchWithAuth('/api/courses/');
        if (res.ok) {
          const courses = await res.json();
          // Filter to just show courses we have is_enrolled true
          setEnrollments(courses.filter(c => c.is_enrolled));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEnrollments();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Subscriptions</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Track your progress and get your certificates.</p>
      </div>

      {loading ? (
        <div>Loading enrollments...</div>
      ) : enrollments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          You aren't enrolled in any courses yet. <Link to="/explore" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Find a course</Link>
        </div>
      ) : (
        <div className="course-grid">
          {enrollments.map((course) => (
            <div key={course.id} className="glass-panel course-card">
              <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={getCourseImage(course)}
                  alt={course.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0
                  }}
                />
              </div>
              <div className="course-card-content">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span className={`badge badge-${(course.level || 'BEGINNER').toLowerCase()}`}>{course.level || 'Beginner'}</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <span>Curriculum Completed</span>
                    <span style={{ fontWeight: 'bold' }}>{course.enrollment_progress || 0}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.enrollment_progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)' }} />
                  </div>
                </div>

                <Link to={`/course/${course.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  Resume Lesson
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- CORE COMPONENT: COURSE VIEWER & PLAYER ---
const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchWithAuth } = useAuth();
  const { connectToChat } = useSocket();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  // Real-time chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeThreadParent, setActiveThreadParent] = useState(null);
  const chatSocketRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Review reporting state
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  // Creator panel states
  const [showAddModule, setShowAddModule] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [addingLessonToModuleId, setAddingLessonToModuleId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: '', content_type: 'VIDEO', video_url: '', document_content: '', duration_minutes: 10 });
  const [addingQuizToLessonId, setAddingQuizToLessonId] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: 'Lesson Quiz', passing_score: 70, questions: [{ text: '', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }] });

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/modules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: moduleTitle, course: course.id, order: course.modules.length + 1 }),
      });
      if (res.ok) {
        setModuleTitle('');
        setShowAddModule(false);
        loadCourseData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuizFormQuestionChange = (qIndex, value) => {
    const newQs = [...quizForm.questions];
    newQs[qIndex].text = value;
    setQuizForm({ ...quizForm, questions: newQs });
  };

  const handleQuizFormAnswerChange = (qIndex, aIndex, field, value) => {
    const newQs = [...quizForm.questions];
    newQs[qIndex].answers[aIndex][field] = value;
    if (field === 'is_correct' && value === true) {
      newQs[qIndex].answers.forEach((ans, idx) => {
        if (idx !== aIndex) ans.is_correct = false;
      });
    }
    setQuizForm({ ...quizForm, questions: newQs });
  };

  const addQuizFormQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [
        ...quizForm.questions,
        { text: '', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }
      ]
    });
  };

  const removeQuizFormQuestion = (qIndex) => {
    const newQs = quizForm.questions.filter((_, idx) => idx !== qIndex);
    setQuizForm({ ...quizForm, questions: newQs });
  };

  const addQuizFormAnswer = (qIndex) => {
    const newQs = [...quizForm.questions];
    newQs[qIndex].answers.push({ text: '', is_correct: false });
    setQuizForm({ ...quizForm, questions: newQs });
  };

  const removeQuizFormAnswer = (qIndex, aIndex) => {
    const newQs = [...quizForm.questions];
    newQs[qIndex].answers = newQs[qIndex].answers.filter((_, idx) => idx !== aIndex);
    setQuizForm({ ...quizForm, questions: newQs });
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;
    try {
      const targetModule = course.modules.find(m => m.id === addingLessonToModuleId);
      const order = (targetModule?.lessons?.length || 0) + 1;

      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('content_type', lessonForm.content_type);
      formData.append('duration_minutes', lessonForm.duration_minutes);
      formData.append('module', addingLessonToModuleId);
      formData.append('order', order);

      if (lessonForm.content_type === 'VIDEO') {
        formData.append('video_url', lessonForm.video_url);
      } else if (lessonForm.content_type === 'DOCUMENT') {
        formData.append('document_content', lessonForm.document_content);
      } else if (lessonForm.content_type === 'PDF' && lessonForm.pdf_file) {
        formData.append('pdf_file', lessonForm.pdf_file);
      }

      const res = await fetchWithAuth(`${API_BASE_URL}/api/lessons/`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setLessonForm({ title: '', content_type: 'VIDEO', video_url: '', document_content: '', pdf_file: null, duration_minutes: 10 });
        setAddingLessonToModuleId(null);
        loadCourseData();
      } else {
        const err = await res.json();
        alert('Failed to create lesson: ' + JSON.stringify(err));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/lessons/${addingQuizToLessonId}/create_quiz/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: quizForm }),
      });
      if (res.ok) {
        setAddingQuizToLessonId(null);
        setQuizForm({ title: 'Lesson Quiz', passing_score: 70, questions: [{ text: '', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }] });
        loadCourseData();
      } else {
        const err = await res.json();
        alert('Failed to create quiz: ' + JSON.stringify(err));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourseData = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        // Load reviews
        const reviewRes = await fetch(`${API_BASE_URL}/api/courses/${id}/reviews/`);
        if (reviewRes.ok) {
          const revs = await reviewRes.json();
          setReviews(revs);
        }

        // Set default active lesson if enrolled/mentor/admin and has lessons
        const isMentor = user && user.role === 'MENTOR' && data.mentor?.id === user.id;
        const isAdmin = user && user.role === 'ADMIN';
        if ((data.is_enrolled || isMentor || isAdmin) && data.modules.length > 0 && data.modules[0].lessons.length > 0) {
          setActiveLesson(data.modules[0].lessons[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id]);

  // Set up WebSocket Chat connection once lesson loads and user is enrolled/mentor/admin
  useEffect(() => {
    const isMentor = user && user.role === 'MENTOR' && course?.mentor?.id === user.id;
    const isAdmin = user && user.role === 'ADMIN';
    if ((course?.is_enrolled || isMentor || isAdmin) && activeLesson) {
      // Connect to WebSocket Chat
      setChatMessages([]);
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
      }

      const connection = connectToChat(
        id,
        (newMsg) => {
          setChatMessages((prev) => [...prev, newMsg]);
          if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        },
        (moderatedId) => {
          // Remove or flag moderated message
          setChatMessages((prev) =>
            prev.map(m => m.id === moderatedId ? { ...m, is_moderated: true, content: "[This message was moderated by a mentor]" } : m)
          );
        }
      );
      chatSocketRef.current = connection;

      // Load persistent historical messages
      fetchWithAuth(`${API_BASE_URL}/api/courses/${id}/qa/`).then(res => {
        if (res.ok) res.json().then(msgs => setChatMessages(msgs));
      });

      return () => {
        if (chatSocketRef.current) {
          chatSocketRef.current.close();
        }
      };
    }
  }, [course, activeLesson, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    try {
      if (course.price > 0) {
        // Stripe checkout session creation
        const res = await fetchWithAuth(`${API_BASE_URL}/api/payments/stripe/create-checkout-session/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: course.id }),
        });
        const payData = await res.json();
        if (res.ok && payData.url) {
          window.location.href = payData.url; // redirect to checkout page
        } else {
          alert(payData.error || 'Payment initiation failed.');
        }
      } else {
        // Free enrollment
        const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/${course.id}/enroll/`, {
          method: 'POST',
        });
        if (res.ok) {
          loadCourseData();
        } else {
          const err = await res.json();
          alert(err.error || 'Enrollment failed.');
        }
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonToggle = async (lessonId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/lessons/${lessonId}/progress/`, {
        method: 'POST',
      });
      if (res.ok) {
        const progressData = await res.json();
        // Update active lesson local status
        if (activeLesson?.id === lessonId) {
          setActiveLesson({ ...activeLesson, is_completed: progressData.is_completed });
        }
        // Update course progress caching
        setCourse({
          ...course,
          enrollment_progress: progressData.progress_percentage
        });
        // Reload course curriculum progress
        loadCourseData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setQuizResult(null);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/lessons/${activeLesson.id}/quiz/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuizResult(data);
        if (data.passed) {
          loadCourseData();
        }
      } else {
        alert(data.error || 'Quiz evaluation error.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatSocketRef.current) return;
    chatSocketRef.current.sendMessage(chatInput, activeThreadParent?.id);
    setChatInput('');
    setActiveThreadParent(null);
  };

  const handleModerateMessage = (msgId) => {
    if (chatSocketRef.current) {
      chatSocketRef.current.moderateMessage(msgId);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/${course.id}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });
      if (res.ok) {
        setReviewMsg('Review posted successfully!');
        setNewReview({ rating: 5, comment: '' });
        // Reload reviews
        const reviewRes = await fetch(`${API_BASE_URL}/api/courses/${course.id}/reviews/`);
        if (reviewRes.ok) {
          const revs = await reviewRes.json();
          setReviews(revs);
        }
      } else {
        const err = await res.json();
        setReviewMsg(err.error || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewMsg(err.message);
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!reportReason.trim()) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/reviews/${reviewId}/report/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (res.ok) {
        alert('Review reported for abuse.');
        setReportingReviewId(null);
        setReportReason('');
        // Reload reviews list
        const reviewRes = await fetch(`${API_BASE_URL}/api/courses/${course.id}/reviews/`);
        if (reviewRes.ok) {
          const revs = await reviewRes.json();
          setReviews(revs);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to report review.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadCertificate = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/${course.id}/certificate/`);
      if (res.ok) {
        const cert = await res.json();
        // Redirect to printable window certificate
        navigate(`/verify/${cert.certificate_id}`);
      } else {
        alert('Course progress must be 100% complete to generate a certificate.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading course...</div>;
  if (!course) return <div>Course not found.</div>;

  const isMentorOwner = user && user.role === 'MENTOR' && course.mentor?.id === user.id;
  const isAdmin = user && user.role === 'ADMIN';
  const canAccessPlayer = course.is_enrolled || isMentorOwner || isAdmin;

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate('/explore');
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0',
          fontSize: '0.95rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          transition: 'var(--transition-smooth)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-4px)';
          e.currentTarget.style.color = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <ArrowLeft size={16} /> Back to Courses
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: canAccessPlayer ? '1fr 320px' : '1fr', gap: '2rem' }}>

        {/* Course Curriculum & Viewer Area */}
        <div>
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className={`badge badge-${course.level.toLowerCase()}`} style={{ marginBottom: '0.5rem' }}>{course.level}</span>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{course.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Created by {course.mentor?.first_name || course.mentor?.username} • Language: {course.language}</p>
            </div>

            {!course.is_enrolled ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
                  {course.price > 0 ? `Rs ${course.price}` : 'Free'}
                </p>
                {isMentorOwner ? (
                  <span className="badge badge-beginner" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>You Are The Instructor</span>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                    {enrolling ? 'Enrolling...' : course.price > 0 ? 'Buy Course' : 'Enroll Now'}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Progress: {course.enrollment_progress}%</span>
                  {course.enrollment_progress >= 100 && (
                    <button onClick={downloadCertificate} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                      <Award size={14} /> Certificate
                    </button>
                  )}
                </div>
                <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', overflow: 'hidden' }}>
                  <div style={{ width: `${course.enrollment_progress}%`, height: '100%', background: 'var(--accent-cyan)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Learning Player (if enrolled/mentor and activeLesson selected) */}
          {canAccessPlayer && activeLesson ? (
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>{activeLesson.title}</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {activeLesson.quiz && (
                    <button
                      onClick={() => { setActiveQuiz(activeLesson.quiz); setQuizResult(null); setSelectedAnswers({}); }}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Take Lesson Quiz
                    </button>
                  )}
                  {!isMentorOwner && (
                    <button
                      onClick={() => handleLessonToggle(activeLesson.id)}
                      className={`btn ${activeLesson.is_completed ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      {activeLesson.is_completed ? 'Mark Incomplete' : 'Complete Lesson'}
                    </button>
                  )}
                </div>
              </div>

              {/* Video content display */}
              {activeLesson.content_type === 'VIDEO' && (
                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeLesson.video_url ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={activeLesson.video_url.replace('watch?v=', 'embed/')}
                      title="Lesson Video"
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : (
                    <Play size={64} color="var(--text-secondary)" />
                  )}
                </div>
              )}

              {/* Document/PDF content display */}
              {activeLesson.content_type === 'DOCUMENT' && (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '8px', minHeight: '200px' }}>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text-primary)' }}>{activeLesson.document_content || 'No document content provided.'}</p>
                </div>
              )}

              {activeLesson.content_type === 'PDF' && (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
                  <Award size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                  <p style={{ marginBottom: '1.5rem' }}>This lesson contains a PDF attachment.</p>
                  {activeLesson.pdf_file ? (
                    <a href={activeLesson.pdf_file} target="_blank" rel="noreferrer" className="btn btn-primary">
                      Open PDF File
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No file attached.</span>
                  )}
                </div>
              )}

              {/* Quiz panel overlay */}
              {activeQuiz && (
                <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem' }}>{activeQuiz.title}</h4>
                    <button onClick={() => setActiveQuiz(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}>Close</button>
                  </div>

                  {quizResult ? (
                    <div style={{ padding: '1rem', borderRadius: '8px', background: quizResult.passed ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: quizResult.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)', border: quizResult.passed ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(244,63,94,0.2)' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{quizResult.passed ? 'PASSED' : 'FAILED'}</p>
                      <p>Your Score: {quizResult.score}% (Passing score: {quizResult.passing_score}%)</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Correct answers: {quizResult.correct_count} of {quizResult.total_questions}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleQuizSubmit}>
                      {activeQuiz.questions.map((q, qidx) => (
                        <div key={q.id} style={{ marginBottom: '1.5rem' }}>
                          <p style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.75rem' }}>{qidx + 1}. {q.question_text || q.text}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.answers.map((ans) => (
                              <label key={ans.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={ans.id}
                                  checked={selectedAnswers[q.id] === ans.id || selectedAnswers[q.id] === String(ans.id)}
                                  onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: ans.id })}
                                />
                                <span>{ans.text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Quiz</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <BookOpen size={48} color="var(--text-muted)" />
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Curriculum Details</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {canAccessPlayer ? 'Select a lesson from the outline to start learning.' : 'Enroll in this course to access videos, documents, quizzes, and certificates.'}
                </p>
              </div>
            </div>
          )}

          {/* Modules & Lessons Curriculum Hierarchy */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Course Curriculum</h3>
              {isMentorOwner && (
                <button
                  onClick={() => {
                    setShowAddModule(!showAddModule);
                    setAddingLessonToModuleId(null);
                    setAddingQuizToLessonId(null);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Add Module
                </button>
              )}
            </div>

            {showAddModule && (
              <form onSubmit={handleCreateModule} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Create New Module</h4>
                <div className="form-group">
                  <label className="form-label">Module Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Introduction to Framework"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Save Module</button>
                  <button type="button" onClick={() => setShowAddModule(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {course.modules.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No modules created for this course yet.</div>
              ) : (
                course.modules.map((mod) => (
                  <div key={mod.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>
                        {mod.title}
                      </h4>
                      {isMentorOwner && (
                        <button
                          onClick={() => {
                            setAddingLessonToModuleId(addingLessonToModuleId === mod.id ? null : mod.id);
                            setAddingQuizToLessonId(null);
                          }}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <Plus size={14} /> Add Lesson
                        </button>
                      )}
                    </div>

                    {addingLessonToModuleId === mod.id && (
                      <form onSubmit={handleCreateLesson} className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                        <h5 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>New Lesson Details</h5>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Lesson Title</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            placeholder="e.g. Understanding State & Props"
                            required
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Content Type</label>
                            <select
                              className="form-input"
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-primary)' }}
                              value={lessonForm.content_type}
                              onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                            >
                              <option value="VIDEO">Video (YouTube embed)</option>
                              <option value="DOCUMENT">Document Text (Markdown)</option>
                              <option value="PDF">PDF Attachment</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Duration (minutes)</label>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                              value={lessonForm.duration_minutes}
                              onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        {lessonForm.content_type === 'VIDEO' && (
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>YouTube Video URL</label>
                            <input
                              type="url"
                              className="form-input"
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                              value={lessonForm.video_url || ''}
                              onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                              placeholder="https://www.youtube.com/watch?v=..."
                              required
                            />
                          </div>
                        )}

                        {lessonForm.content_type === 'DOCUMENT' && (
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Document Content</label>
                            <textarea
                              className="form-input"
                              rows="4"
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                              value={lessonForm.document_content || ''}
                              onChange={(e) => setLessonForm({ ...lessonForm, document_content: e.target.value })}
                              placeholder="Lesson notes, code examples, description..."
                              required
                            />
                          </div>
                        )}

                        {lessonForm.content_type === 'PDF' && (
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>PDF File Upload</label>
                            <input
                              type="file"
                              accept="application/pdf"
                              className="form-input"
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                              onChange={(e) => setLessonForm({ ...lessonForm, pdf_file: e.target.files[0] })}
                              required
                            />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Save Lesson</button>
                          <button type="button" onClick={() => setAddingLessonToModuleId(null)} className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                      </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {mod.lessons.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem' }}>No lessons in this module.</div>
                      ) : (
                        mod.lessons.map((les) => (
                          <div key={les.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div
                              onClick={() => canAccessPlayer && setActiveLesson(les)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: activeLesson?.id === les.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)', borderRadius: '8px', cursor: canAccessPlayer ? 'pointer' : 'default', border: activeLesson?.id === les.id ? '1px solid var(--primary)' : '1px solid transparent' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {les.is_completed ? <CheckCircle size={18} color="var(--accent-emerald)" /> : <Play size={18} color="var(--text-muted)" />}
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{les.title}</span>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{les.content_type}</span>
                                {les.quiz && <span className="badge badge-beginner" style={{ fontSize: '0.7rem' }}>Quiz</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{les.duration_minutes} min</span>
                                {isMentorOwner && (
                                  <button
                                    onClick={() => {
                                      setAddingQuizToLessonId(addingQuizToLessonId === les.id ? null : les.id);
                                      setAddingLessonToModuleId(null);
                                      // Prepopulate quiz structure if edit
                                      if (les.quiz) {
                                        setQuizForm({
                                          title: les.quiz.title || 'Lesson Quiz',
                                          passing_score: les.quiz.passing_score || 70,
                                          questions: les.quiz.questions && les.quiz.questions.length > 0
                                            ? les.quiz.questions.map(q => ({
                                              text: q.text || q.question_text || '',
                                              answers: q.answers && q.answers.length > 0
                                                ? q.answers.map(ans => ({ text: ans.text, is_correct: ans.is_correct || false }))
                                                : [{ text: '', is_correct: true }, { text: '', is_correct: false }]
                                            }))
                                            : [{ text: '', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }]
                                        });
                                      } else {
                                        setQuizForm({ title: 'Lesson Quiz', passing_score: 70, questions: [{ text: '', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }] });
                                      }
                                    }}
                                    className="btn btn-secondary animate-hover"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                  >
                                    {les.quiz ? 'Edit Quiz' : '+ Add Quiz'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {addingQuizToLessonId === les.id && (
                              <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--primary-glow)' }}>
                                <h5 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Quiz Builder</h5>
                                <form onSubmit={handleCreateQuiz}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Quiz Title</label>
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                        value={quizForm.title}
                                        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Passing Score %</label>
                                      <input
                                        type="number"
                                        className="form-input"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                        value={quizForm.passing_score}
                                        onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 70 })}
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {quizForm.questions.map((q, qIndex) => (
                                      <div key={qIndex} style={{ border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Question {qIndex + 1}</span>
                                          {quizForm.questions.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => removeQuizFormQuestion(qIndex)}
                                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="text"
                                          className="form-input"
                                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}
                                          placeholder="Enter question text..."
                                          value={q.text}
                                          onChange={(e) => handleQuizFormQuestionChange(qIndex, e.target.value)}
                                          required
                                        />

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginLeft: '1rem' }}>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Answer Choices (Select correct choice)</span>
                                          {q.answers.map((ans, aIndex) => (
                                            <div key={aIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                              <input
                                                type="radio"
                                                name={`quiz-correct-${qIndex}`}
                                                checked={ans.is_correct}
                                                onChange={(e) => handleQuizFormAnswerChange(qIndex, aIndex, 'is_correct', e.target.checked)}
                                              />
                                              <input
                                                type="text"
                                                className="form-input"
                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', flex: 1 }}
                                                placeholder={`Choice ${aIndex + 1}`}
                                                value={ans.text}
                                                onChange={(e) => handleQuizFormAnswerChange(qIndex, aIndex, 'text', e.target.value)}
                                                required
                                              />
                                              {q.answers.length > 2 && (
                                                <button
                                                  type="button"
                                                  onClick={() => removeQuizFormAnswer(qIndex, aIndex)}
                                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                >
                                                  <X size={14} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() => addQuizFormAnswer(qIndex)}
                                            className="btn btn-secondary"
                                            style={{ alignSelf: 'flex-start', padding: '0.2rem 0.5rem', fontSize: '0.7rem', marginTop: '0.25rem' }}
                                          >
                                            + Add Choice
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={addQuizFormQuestion}
                                      className="btn btn-secondary"
                                      style={{ alignSelf: 'flex-start', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                    >
                                      + Add Question
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Save Quiz</button>
                                    <button type="button" onClick={() => setAddingQuizToLessonId(null)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Cancel</button>
                                  </div>
                                </form>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Student Reviews</h3>

            {course.is_enrolled && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Write a Review</h4>
                {reviewMsg && <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1rem' }}>{reviewMsg}</p>}
                <form onSubmit={submitReview}>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <select
                      className="form-input"
                      style={{ width: '120px', background: 'var(--bg-primary)' }}
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    >
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      placeholder="Provide your experience on modules, structure, support..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Post Review</button>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews posted for this course.</div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{r.student_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                          <Star size={14} fill="var(--accent-amber)" /> {r.rating}/5
                        </span>
                        {user && user.role === 'STUDENT' && r.student !== user.id && (
                          r.has_reported ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flagged</span>
                          ) : (
                            <button
                              onClick={() => { setReportingReviewId(reportingReviewId === r.id ? null : r.id); setReportReason(''); }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                            >
                              Report Abuse
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.comment}</p>

                    {reportingReviewId === r.id && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Reason (e.g. spam, offensive)..."
                          className="form-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', flex: 1 }}
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                        />
                        <button
                          onClick={() => handleReportReview(r.id)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Submit Report
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Real-time Q&A Chat Sidebar Panel (if enrolled/mentor) */}
        {canAccessPlayer && (
          <aside className="glass-panel" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', padding: '1rem 0' }}>
            <div style={{ padding: '0 1rem 0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} color="var(--primary)" /> Q&A Chat Room
              </span>
            </div>

            {/* Messages list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
                  Ask a question. Your mentor and other students are here to help!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', borderLeft: msg.sender?.role === 'MENTOR' ? '3px solid var(--primary)' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 'bold' }}>{msg.sender?.username || msg.sender?.email}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Thread reply marker */}
                    {msg.parent_id && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Replying to a thread...</span>
                    )}

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {msg.is_moderated ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>[Moderated Content]</span> : msg.content}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <button
                        onClick={() => setActiveThreadParent(msg)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
                      >
                        Reply
                      </button>
                      {(user.role === 'MENTOR' || user.role === 'ADMIN') && !msg.is_moderated && (
                        <button
                          onClick={() => handleModerateMessage(msg.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
                        >
                          Moderate
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Active Reply Banner */}
            {activeThreadParent && (
              <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Replying to {activeThreadParent.sender?.username}</span>
                <button onClick={() => setActiveThreadParent(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}><X size={12} /></button>
              </div>
            )}

            {/* Entry Form */}
            <form onSubmit={handleSendChatMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder={activeThreadParent ? "Write reply..." : "Ask in room..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
                <Send size={14} />
              </button>
            </form>
          </aside>
        )}

      </div>
    </div>
  );
};

// --- MENTOR COURSES VIEW ---
const MentorCourses = () => {
  const { fetchWithAuth, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/`);
        if (res.ok) {
          const list = await res.json();
          setCourses(list.filter(c => c.mentor && c.mentor.id === user.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [user.id]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>My Courses</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your created courses, check status, and edit curriculum.</p>
        </div>
        <Link to="/mentor/builder" className="btn btn-primary" style={{ borderRadius: '10px' }}>
          <Plus size={16} /> Create Course
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          You have not created any courses yet. <Link to="/mentor/builder" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Create course</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => (
            <div key={c.id} className="glass-panel course-card animate-slide-up" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
              <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={getCourseImage(c)}
                  alt={c.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0
                  }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1 }}>
                  <span className={`badge ${c.is_approved ? 'badge-beginner' : 'badge-advanced'}`}>
                    {c.is_approved ? 'Live' : 'Pending Verification'}
                  </span>
                </div>
              </div>
              <div className="course-card-content" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.01em' }}>{c.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                  <span className={`badge badge-${c.level.toLowerCase()}`}>{c.level}</span>
                  <span className="price-display" style={{ fontWeight: 800, fontSize: '1.1rem', color: c.price > 0 ? 'var(--primary)' : 'var(--accent-emerald)' }}>
                    {c.price > 0 ? `Rs ${c.price}` : 'Free'}
                  </span>
                </div>
                <Link to={`/course/${c.id}`} className="btn btn-primary" style={{ width: '100%', borderRadius: '10px', padding: '0.6rem' }}>
                  Manage Curriculum
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MENTOR ANALYTICS VIEW ---
const MentorAnalytics = () => {
  const { fetchWithAuth, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({ total_students: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/`);
        if (res.ok) {
          const list = await res.json();
          setCourses(list.filter(c => c.mentor && c.mentor.id === user.id));
        }

        const analyticsRes = await fetchWithAuth(`${API_BASE_URL}/api/mentor/analytics/`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [user.id]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Analytics & Reports</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Track sales performance, student enrollments, and revenue metrics.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading analytics...</div>
      ) : (
        <>
          {/* Detailed stats widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div className="stat-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Courses Created</span>
              <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.75rem' }}>{courses.length}</p>
            </div>
            <div className="stat-card stat-card-cyan">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Enrolled Students</span>
              <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.75rem' }}>{analytics.total_students}</p>
            </div>
            <div className="stat-card stat-card-emerald">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Total Earnings</span>
              <p className="price-display" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.75rem' }}>Rs {analytics.total_sales.toFixed(2)}</p>
            </div>
          </div>

          {/* Performance Table */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Course Performance Report</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="student-table-row">
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</td>
                      <td style={{ fontWeight: 600 }}>{course.price > 0 ? `Rs ${course.price}` : 'Free'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: course.is_approved ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {course.is_approved ? 'Live' : 'Pending Verification'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- MENTOR CONSOLE ---
const MentorDashboard = () => {
  const { fetchWithAuth, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({ total_students: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMentorData = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/`);
        if (res.ok) {
          const coursesList = await res.json();
          // Filter to only courses created by this mentor
          setCourses(coursesList.filter(c => c.mentor && c.mentor.id === user.id));
        }

        // Fetch real database analytics
        const analyticsRes = await fetchWithAuth(`${API_BASE_URL}/api/mentor/analytics/`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics({
            total_students: analyticsData.total_students,
            total_sales: analyticsData.total_sales
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMentorData();
  }, [user.id]);

  const totalCoursesCount = courses.length;
  const publishedCoursesCount = courses.filter(c => c.is_approved).length;
  const draftCoursesCount = courses.filter(c => !c.is_approved).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Tutor Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage your courses, track learner progress and view course performance</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dashboard statistics...</div>
      ) : (
        <>
          {/* Analytics widgets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', flex: 1 }}>
              <div className="stat-card">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Total Courses</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.75rem' }}>{totalCoursesCount}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Courses created by you</span>
              </div>
              <div className="stat-card stat-card-cyan">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Published</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.75rem' }}>{publishedCoursesCount}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Courses live for learners</span>
              </div>
              <div className="stat-card stat-card-purple">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Drafts</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.75rem' }}>{draftCoursesCount}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Courses still being edited</span>
              </div>
              <div className="stat-card stat-card-emerald">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Enrollments</span>
                <p className="mono-data" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.75rem' }}>{analytics.total_students}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Total learner enrollments</span>
              </div>
            </div>

            {window.innerWidth > 1024 && (
              <div style={{
                background: 'var(--primary)',
                color: '#ffffff',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
                flexShrink: 0,
                transition: 'var(--transition-smooth)'
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => {
                  navigate('/mentor/analytics');
                }}
                title="View Advanced Analytics"
              >
                <ArrowRight size={20} />
              </div>
            )}
          </div>

          {/* Recent Courses List */}
          <div className="glass-panel animate-slide-up" style={{ padding: '2rem', borderRadius: '16px', animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>Recent Courses</h3>
              <Link to="/mentor/builder" className="btn btn-primary" style={{ borderRadius: '8px', padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                Create Course
              </Link>
            </div>
            {courses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                You have not created any courses yet. <Link to="/mentor/builder" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Create course</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="student-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Course</th>
                      <th style={{ width: '20%' }}>Status</th>
                      <th style={{ width: '15%' }}>Students</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 5).map((course) => {
                      return (
                        <tr key={course.id} className="student-table-row">
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: course.is_approved ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                              fontWeight: 600,
                              fontSize: '0.9rem'
                            }}>
                              {course.is_approved ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {/* We can compute enrolled students count from database payments or display a general stat, let's keep it simple and clean */}
                            {analytics.total_students > 0 ? Math.round(analytics.total_students / courses.length) : 0}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/course/${course.id}`}
                              className="btn btn-primary"
                              style={{
                                borderRadius: '8px',
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-block',
                                transition: 'var(--transition-smooth)'
                              }}
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
const CourseBuilder = () => {
  const { fetchWithAuth } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.00');
  const [level, setLevel] = useState('BEGINNER');
  const [language, setLanguage] = useState('English');
  const [durationHours, setDurationHours] = useState('10');
  const [tagsInput, setTagsInput] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/courses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price) || 0,
          level,
          language,
          duration_hours: parseInt(durationHours) || 0,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        }),
      });
      if (res.ok) {
        setMessage('Course created successfully! Awaiting Admin Approval.');
        setTitle('');
        setDescription('');
        setPrice('0.00');
        setTagsInput('');
        setDurationHours('10');
      } else {
        const err = await res.json();
        setMessage('Error: ' + JSON.stringify(err));
      }
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-premium)' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Create Course Outline</h2>

        {message && (
          <div style={{ padding: '1rem', borderRadius: '12px', background: message.startsWith('Error') ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)', color: message.startsWith('Error') ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontSize: '0.9rem', marginBottom: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Course Title</label>
            <input type="text" className="form-input-premium" placeholder="e.g. Master React & Web Technologies" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Description</label>
            <textarea className="form-input-premium" rows="4" placeholder="Briefly introduce course objectives, key features, and projects." value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Price (Rs)</label>
              <input type="number" step="0.01" className="form-input-premium" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Language</label>
              <input type="text" className="form-input-premium" placeholder="English" value={language} onChange={(e) => setLanguage(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Duration (Hours)</label>
              <input type="number" className="form-input-premium" placeholder="10" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Tags (comma-separated)</label>
            <input
              type="text"
              className="form-input-premium"
              placeholder="e.g. python, django, programming"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>Target Level</label>
            <select className="form-input-premium" value={level} onChange={(e) => setLevel(e.target.value)} style={{ background: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem 1.5rem', borderRadius: '12px', fontSize: '0.95rem' }}>
            Submit Course For Verification
          </button>
        </form>
      </div>
    </div>
  );
};

// --- ADMIN PORTAL ---
const AdminDashboard = () => {
  const { fetchWithAuth } = useAuth();
  const [pendingMentors, setPendingMentors] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [report, setReport] = useState({ total_revenue: 0, student_count: 0, mentor_count: 0, course_count: 0, enrollment_count: 0 });
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const paymentsPerPage = 10;
  const totalPages = Math.ceil(payments.length / paymentsPerPage);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const loadData = async () => {
    try {
      // Load pending mentors
      const mRes = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/mentors/?is_approved=false`);
      if (mRes.ok) setPendingMentors(await mRes.json());

      // Load pending courses
      const cRes = await fetchWithAuth(`${API_BASE_URL}/api/admin/courses/pending/`);
      if (cRes.ok) setPendingCourses(await cRes.json());

      // Load payments
      const pRes = await fetchWithAuth(`${API_BASE_URL}/api/payments/admin/all/`);
      if (pRes.ok) setPayments(await pRes.json());

      // Load all users
      const uRes = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/users/`);
      if (uRes.ok) setUsers(await uRes.json());

      // Load all reviews
      const rRes = await fetchWithAuth(`${API_BASE_URL}/api/admin/reviews/`);
      if (rRes.ok) setReviews(await rRes.json());

      // Load system report summary
      const repRes = await fetchWithAuth(`${API_BASE_URL}/api/payments/admin/reports/system/`);
      if (repRes.ok) setReport(await repRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveMentor = async (profileId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/mentors/${profileId}/approve/`, { method: 'POST' });
      if (res.ok) {
        setMessage('Mentor approved successfully.');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const approveCourse = async (courseId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/courses/${courseId}/approve/`, { method: 'POST' });
      if (res.ok) {
        setMessage('Course approved successfully.');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processRefund = async (paymentId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/payments/admin/refund/${paymentId}/`, { method: 'POST' });
      if (res.ok) {
        setMessage('Refund processed and enrollment access revoked.');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const simulateDispute = async (transactionId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/stripe/webhook/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_mock_trigger: true,
          transaction_id: transactionId,
          action: 'disputed'
        })
      });
      if (res.ok) {
        setMessage('Dispute simulation triggered. Course access and enrollment revoked.');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to simulate dispute.');
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering dispute simulation.');
    }
  };

  const toggleUserActive = async (userId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/users/${userId}/toggle/`, { method: 'POST' });
      if (res.ok) {
        setMessage('User active status updated.');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user status.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleReviewModeration = async (reviewId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/reviews/${reviewId}/toggle/`, { method: 'POST' });
      if (res.ok) {
        setMessage('Review visibility moderated.');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportPaymentsReport = () => {
    fetchWithAuth(`${API_BASE_URL}/api/payments/admin/reports/export/`).then(async (res) => {
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "payments_report.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Admin Control Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>System moderation, database governance, and payment ledgers.</p>
        </div>
        <button onClick={exportPaymentsReport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}>
          <DollarSign size={16} /> Export Payments Ledger (CSV)
        </button>
      </div>

      {message && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(29, 78, 216, 0.05)', color: 'var(--primary)', fontSize: '0.9rem', border: '1px solid rgba(29, 78, 216, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* System Statistics Report */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card stat-card-emerald">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Gross Revenue</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.5rem' }}>Rs {report.total_revenue.toFixed(2)}</p>
        </div>
        <div className="stat-card stat-card-cyan">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Students</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.5rem' }}>{report.student_count}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Mentors</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.5rem' }}>{report.mentor_count}</p>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Courses Outline</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{report.course_count}</p>
        </div>
        <div className="stat-card stat-card-amber">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Total Enrollments</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>{report.enrollment_count}</p>
        </div>
      </div>

      {/* Grid of Approvals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

        {/* Mentor approval widget */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>Mentor Verification Requests</h3>
          {pendingMentors.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No pending mentors.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingMentors.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.specialization || 'General Mentor'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate: Rs {m.hourly_rate}/hr</p>
                  </div>
                  <button onClick={() => approveMentor(m.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px', boxShadow: 'none' }}>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course approval widget */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>Course Approval Requests</h3>
          {pendingCourses.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No pending courses.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingCourses.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.mentor?.email}</p>
                  </div>
                  <button onClick={() => approveCourse(c.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px', boxShadow: 'none' }}>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* User Administration Panel */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>User Accounts Management</h3>
        {users.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No users in system.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 0.75rem' }}>Name</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Email</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Role</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{u.first_name || u.username} {u.last_name || ''}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-intermediate" style={{ background: 'rgba(29, 78, 216, 0.05)', color: 'var(--primary)', border: '1px solid rgba(29, 78, 216, 0.1)' }}>{u.role}</span></td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span className={`badge ${u.is_active !== false ? 'badge-beginner' : 'badge-advanced'}`} style={{ fontWeight: 600 }}>
                        {u.is_active !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserActive(u.id)}
                          className={`btn ${u.is_active !== false ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px', boxShadow: 'none' }}
                        >
                          {u.is_active !== false ? 'Suspend User' : 'Activate User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Content Moderation (Student Reviews) Panel */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--accent-rose)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>Content Moderation (Course Reviews)</h3>
        {reviews.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No student reviews submitted.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 0.75rem' }}>Student</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Comment</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Rating</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Reports</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rev.student_email}</td>
                    <td style={{ padding: '1rem 0.75rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>{rev.comment}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--accent-amber)', fontWeight: 'bold' }}>{rev.rating} ★</td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      {rev.reports_count > 0 ? (
                        <span
                          style={{ color: 'var(--accent-rose)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Reported by students"
                        >
                          <AlertTriangle size={14} /> {rev.reports_count} reports
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span className={`badge ${rev.is_moderated ? 'badge-advanced' : 'badge-beginner'}`} style={{ fontWeight: 600 }}>
                        {rev.is_moderated ? 'Moderated' : 'Visible'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <button
                        onClick={() => toggleReviewModeration(rev.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        {rev.is_moderated ? 'Restore' : 'Moderate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction & Refunds panel */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>Financial Ledger & Refund Administration</h3>
        {payments.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No payment records logged in system.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 0.75rem' }}>Student</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Course</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Gateway</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Amount</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice((activePage - 1) * paymentsPerPage, activePage * paymentsPerPage).map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.student_email}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{p.course_title}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}><span className="badge" style={{ background: 'var(--bg-primary)', textTransform: 'uppercase', fontSize: '0.7rem' }}>{p.gateway}</span></td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rs {p.amount}</td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span className={`badge ${p.status === 'COMPLETED' ? 'badge-beginner' : p.status === 'REFUNDED' ? 'badge-advanced' : p.status === 'DISPUTED' ? 'badge-advanced' : 'badge-intermediate'}`} style={{ fontWeight: 600 }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {p.status === 'COMPLETED' && (
                          <>
                            <button onClick={() => processRefund(p.id)} className="btn btn-danger" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                              Refund
                            </button>
                            <button onClick={() => simulateDispute(p.transaction_id)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                              Simulate Dispute
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--glass-border)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{((activePage - 1) * paymentsPerPage) + 1}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{Math.min(activePage * paymentsPerPage, payments.length)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{payments.length}</strong> transactions
                </span>

                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      opacity: activePage === 1 ? 0.5 : 1,
                      cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: 'none'
                    }}
                  >
                    « First
                  </button>
                  <button
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      opacity: activePage === 1 ? 0.5 : 1,
                      cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: 'none'
                    }}
                  >
                    <ArrowLeft size={12} /> Prev
                  </button>

                  {/* Dynamic Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - activePage) <= 1)
                    .map((page, idx, arr) => {
                      const elements = [];
                      if (idx > 0 && page - arr[idx - 1] > 1) {
                        elements.push(
                          <span key={`ellipsis-${page}`} style={{ color: 'var(--text-muted)', margin: '0 0.25rem', fontSize: '0.85rem' }}>...</span>
                        );
                      }
                      elements.push(
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={activePage === page ? "btn btn-primary" : "btn btn-secondary"}
                          style={{
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            minWidth: '2.25rem',
                            height: '2.25rem',
                            boxShadow: activePage === page ? 'none' : undefined,
                            background: activePage === page ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: activePage === page ? '#fff' : 'var(--text-primary)',
                            border: activePage === page ? 'none' : '1px solid var(--glass-border)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                          }}
                        >
                          {page}
                        </button>
                      );
                      return elements;
                    })}

                  <button
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      opacity: activePage === totalPages ? 0.5 : 1,
                      cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: 'none'
                    }}
                  >
                    Next <ArrowRight size={12} />
                  </button>
                  <button
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      opacity: activePage === totalPages ? 0.5 : 1,
                      cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: 'none'
                    }}
                  >
                    Last »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MOCK STRIPE CHECKOUT LANDING VIEW ---
const MockStripeCheckout = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course_id');
  const transactionId = searchParams.get('transaction_id');
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const submitMockPayment = async (success) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/stripe/webhook/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_mock_trigger: true,
          transaction_id: transactionId,
          success: success
        })
      });
      if (res.ok) {
        setStatusMsg(success ? 'Payment Successful! Redirecting...' : 'Payment cancelled.');
        setTimeout(() => {
          window.location.href = success
            ? `/payment/success?session_id=${transactionId}`
            : '/payment/cancel';
        }, 1500);
      } else {
        setStatusMsg('Error processing payment callback.');
      }
    } catch (e) {
      console.error(e);
      setStatusMsg('Error communicating with backend server.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '400px', padding: '2.5rem', textAlign: 'center' }}>
        <DollarSign size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Stripe Sandbox Payment</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>This is a simulated secure sandbox environment. No actual currency is billed.</p>

        {statusMsg && (
          <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {statusMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={() => submitMockPayment(true)} disabled={processing} className="btn btn-primary" style={{ width: '100%' }}>
            {processing ? 'Processing...' : 'Simulate Success (Complete Checkout)'}
          </button>
          <button onClick={() => submitMockPayment(false)} disabled={processing} className="btn btn-secondary" style={{ width: '100%' }}>
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CERTIFICATE DISPLAY LANDING VIEW ---
const CertificateValidation = () => {
  const { cert_id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/certificate/verify/${cert_id}/`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setCertData(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Invalid or non-existent certificate.');
        }
      })
      .catch((e) => {
        console.error(e);
        setError('Error connecting to verification server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cert_id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        Loading certificate verification...
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--bg-primary)' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '450px', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
          <AlertTriangle size={48} color="var(--accent-rose)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Verification Failure</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {error || 'This certificate credentials do not match any completed enrollment on our platform.'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Certificate ID: {cert_id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="certificate-container">
        <div className="certificate-border-inner">
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Certificate of Completion
          </h1>
          <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>This is proudly presented to</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1rem 0', color: '#121829', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {certData.student_name}
          </h2>
          <p style={{ width: '80%', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            for successfully satisfying all module requirements, completing the quizzes, and executing projects for the curriculum:
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0', color: 'var(--primary)' }}>
            {certData.course_title}
          </h3>
          <div style={{ width: '60px', height: '2px', background: 'var(--glass-border)', margin: '1.5rem auto' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div>
              <p style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem' }}>{certData.mentor_name}</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Verified Instructor</p>
            </div>

            {/* Gold Medal Emblem */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <svg width="70" height="85" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>
                {/* Ribbon left */}
                <path d="M25 45L12 92L28 82L38 48L25 45Z" fill="#B91C1C" />
                <path d="M12 92L28 82L32 92H12Z" fill="#991B1B" />
                <path d="M28 46L20 84L28 82V46Z" fill="#1D4ED8" />

                {/* Ribbon right */}
                <path d="M55 45L68 92L52 82L42 48L55 45Z" fill="#B91C1C" />
                <path d="M68 92L52 82L48 92H68Z" fill="#991B1B" />
                <path d="M52 46L60 84L52 82V46Z" fill="#1D4ED8" />

                {/* Gold Medal Circle Outer */}
                <circle cx="40" cy="40" r="30" fill="url(#goldGradient)" stroke="#EAB308" strokeWidth="2" />

                {/* Gold Medal Circle Inner */}
                <circle cx="40" cy="40" r="24" fill="url(#goldGradientInner)" stroke="#CA8A04" strokeWidth="1" />

                {/* Star inside Medal */}
                <path d="M40 23L45.3 33.7L57.1 35.4L48.5 43.8L50.6 55.6L40 50L29.4 55.6L31.5 43.8L22.9 35.4L34.7 33.7L40 23Z" fill="#FFFFFF" opacity="0.95" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="goldGradient" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="35%" stopColor="#FACC15" />
                    <stop offset="70%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#CA8A04" />
                  </linearGradient>
                  <linearGradient id="goldGradientInner" x1="17" y1="17" x2="63" y2="63" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FACC15" />
                    <stop offset="50%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#A16207" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div>
              <p style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem' }}>{certData.completion_date}</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Date Completed</p>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Verification ID: {certData.certificate_id}
          </div>
        </div>
      </div>
      <button onClick={() => window.print()} className="btn btn-primary" style={{ marginTop: '2.5rem' }}>
        Print Certificate
      </button>
    </div>
  );
};

// --- PAYMENT SUCCESS VIEW ---
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const session_id = searchParams.get('session_id');
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!session_id) {
      setError('Missing session ID. Cannot verify payment status.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let pollInterval = null;

    const verifyPayment = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/payments/stripe/status/?session_id=${session_id}`);
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'COMPLETED') {
            setPayment(data);
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          } else {
            // Still pending, increment retry count
            setRetryCount(prev => {
              if (prev >= 6) { // 6 retries total
                setError('Payment verification is taking longer than expected. Please check your Dashboard or Enrollments.');
                setLoading(false);
                if (pollInterval) clearInterval(pollInterval);
              }
              return prev + 1;
            });
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Failed to verify payment status.');
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (e) {
        if (!isMounted) return;
        console.error(e);
        setError('Network error occurred during payment verification.');
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    // Initial check
    verifyPayment();

    // Setup polling every 1.5s
    pollInterval = setInterval(verifyPayment, 1500);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [session_id, fetchWithAuth]);

  // Countdown timer for automatic redirect
  useEffect(() => {
    if (!loading && payment && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!loading && payment && countdown === 0) {
      navigate(`/course/${payment.course_id}`);
    }
  }, [loading, payment, countdown, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '450px', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <div className="spinner-glow" style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '4px solid rgba(139, 92, 246, 0.1)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 1.2s linear infinite',
            margin: '0 auto 2rem'
          }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Verifying Payment</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We are securing your enrollment with Stripe. Please do not close or refresh this page.</p>
          {retryCount > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Checking status... (attempt {retryCount}/6)</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '450px', padding: '3rem', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)' }}>
          <AlertTriangle size={56} color="var(--accent-rose)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.2))' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>Verification Status</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1 }}>
              Go to Dashboard
            </button>
            <button onClick={() => navigate('/explore')} className="btn btn-secondary" style={{ flex: 1 }}>
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '500px',
        padding: '3rem',
        textAlign: 'center',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        background: 'linear-gradient(to bottom, var(--bg-secondary), rgba(16, 185, 129, 0.02))',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3), 0 0 50px -10px rgba(16, 185, 129, 0.05)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle size={40} color="var(--accent-emerald)" />
        </div>

        <h2 style={{
          fontSize: '1.8rem',
          marginBottom: '0.5rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Payment Successful!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Your payment was processed successfully. You now have full lifetime access.
        </p>

        {/* Payment details card */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'left',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Course</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', maxWidth: '70%', textAlign: 'right' }}>
              {payment.course_title}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount Paid</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.9rem' }}>
              Rs {payment.amount}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</span>
            <span className="badge badge-beginner" style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Enrolled
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={() => navigate(`/course/${payment.course_id}`)} className="btn btn-primary" style={{ width: '100%' }}>
            Start Learning Now
          </button>

          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: '100%' }}>
            Go to My Dashboard
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          Redirecting to course player in <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{countdown}</span> seconds...
        </p>
      </div>
    </div>
  );
};

// --- PAYMENT CANCEL VIEW ---
const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '450px',
        padding: '3rem',
        textAlign: 'center',
        border: '1px solid rgba(244, 63, 94, 0.1)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <AlertTriangle size={40} color="var(--accent-rose)" />
        </div>

        <h2 style={{
          fontSize: '1.75rem',
          marginBottom: '0.5rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent-rose), #BE123C)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Checkout Cancelled
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          Your payment transaction was cancelled. No charges were made to your account.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/explore')} className="btn btn-primary" style={{ flex: 1 }}>
            Explore Courses
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ flex: 1 }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP ROUTING BOOTSTRAP ---
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>Loading App state...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Validation Link */}
        <Route path="/verify/:cert_id" element={<CertificateValidation />} />

        {/* Private Views mapped in Shared Layout */}
        <Route path="/*" element={
          user ? (
            <Layout>
              <Routes>
                {/* Role Specific home routes */}
                <Route path="/" element={
                  user.role === 'STUDENT' ? <StudentDashboard /> :
                    user.role === 'MENTOR' ? <MentorDashboard /> : <AdminDashboard />
                } />

                {/* Student routes */}
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/explore" element={<ExploreCourses />} />
                <Route path="/my-enrollments" element={<MyEnrollments />} />
                <Route path="/course/:id" element={<CoursePlayer />} />
                <Route path="/certificates" element={<StudentCertificates />} />

                {/* Payments */}
                <Route path="/payment/mock-stripe-checkout" element={<MockStripeCheckout />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />

                {/* Mentor routes */}
                <Route path="/mentor/dashboard" element={<MentorDashboard />} />
                <Route path="/mentor/courses" element={<MentorCourses />} />
                <Route path="/mentor/builder" element={<CourseBuilder />} />
                <Route path="/mentor/analytics" element={<MentorAnalytics />} />

                {/* Admin routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Common */}
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Layout>
          ) : (
            <Login />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
