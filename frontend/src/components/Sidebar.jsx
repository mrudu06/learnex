import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Trophy, User, LogOut, PlayCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/study', icon: <PlayCircle size={20} />, label: 'Study' },
    { path: '/quiz', icon: <PlayCircle size={20} />, label: 'Practice' },
    { path: '/history', icon: <History size={20} />, label: 'History' },
    { path: '/leaderboard', icon: <Trophy size={20} />, label: 'Leaderboard' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <motion.div 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="sidebar"
    >
      <div className="sidebar-header">
        <h2>Learn<span className="highlight">Ex</span></h2>
        <p className="user-greeting">Hello, {user?.name?.split(' ')[0]}</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {location.pathname === item.path && (
              <motion.div 
                layoutId="active-nav" 
                className="active-indicator"
              />
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;