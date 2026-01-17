import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Trophy, User, LogOut, PlayCircle, History,
  ChevronLeft, ChevronRight, MessageSquare, StickyNote, Video,
  ChevronDown, ChevronUp, Bot, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(true);

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/study', icon: <PlayCircle size={20} />, label: 'Study' },
    { path: '/library', icon: <Book size={20} />, label: 'Library' },
    { path: '/quiz', icon: <PlayCircle size={20} />, label: 'Practice' },
    { path: '/history', icon: <History size={20} />, label: 'History' },
    { path: '/leaderboard', icon: <Trophy size={20} />, label: 'Leaderboard' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const toolsItems = [
    { path: '/ai-modes', icon: <Bot size={20} />, label: 'AI Modes' },
    { path: '/chats', icon: <MessageSquare size={20} />, label: 'Chats' },
    { path: '/notes', icon: <StickyNote size={20} />, label: 'Notes' },
    { path: '/videos', icon: <Video size={20} />, label: 'Videos' },
  ];

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 }
  };

  return (
    <motion.div
      variants={sidebarVariants}
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{ padding: 0 }} // Override default padding
    >
      <div className="sidebar-header" style={{ padding: '1.5rem', marginBottom: '1rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo-container">
          {!isCollapsed ? (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ margin: 0 }}
            >
              Learn<span className="highlight">Ex</span>
            </motion.h2>
          ) : (
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)', margin: '0 auto' }}>LE</span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-btn"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="sidebar-scroll-content">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="user-greeting"
              style={{ padding: '0 1.5rem', marginBottom: '1rem' }}
            >
              Hello, {user?.name?.split(' ')[0]}
            </motion.p>
          )}
        </AnimatePresence>

        <nav className="sidebar-nav" style={{ padding: '0 1rem' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${isCollapsed ? 'centered' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <div className="icon-wrapper">{item.icon}</div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          ))}
        </nav>

        <div className="divider"></div>

        <div className="tools-section" style={{ padding: '0 1rem' }}>
          {!isCollapsed && (
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="tools-header"
            >
              <span>TOOLS</span>
              {isToolsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          <AnimatePresence>
            {(isToolsOpen || isCollapsed) && (
              <motion.div
                initial={!isCollapsed ? { height: 0, opacity: 0 } : false}
                animate={!isCollapsed ? { height: 'auto', opacity: 1 } : false}
                exit={!isCollapsed ? { height: 0, opacity: 0 } : false}
                className="tools-list"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                {toolsItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${isCollapsed ? 'centered' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="icon-wrapper">{item.icon}</div>
                    {!isCollapsed && (
                      <span className="nav-label">
                        {item.label}
                      </span>
                    )}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="sidebar-footer" style={{ padding: '1rem' }}>
        <button onClick={logout} className={`logout-btn ${isCollapsed ? 'centered' : ''}`}>
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;