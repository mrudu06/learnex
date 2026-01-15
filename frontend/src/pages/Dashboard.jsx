import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Activity, Clock, Trophy, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    quizzesTaken: 0,
    averageScore: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('http://localhost:5000/api/history', { headers });
        if (res.ok) {
          const history = await res.json();
          const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
          setStats({
            quizzesTaken: history.length,
            averageScore: history.length > 0 ? Math.round(totalScore / history.length) : 0,
            recentActivity: history.slice(0, 3)
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}
    >
      <motion.div variants={item} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Welcome back, <span className="highlight">{user?.name}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ready to continue learning?</p>
      </motion.div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard
          icon={<Activity size={24} color="#6366F1" />}
          label="Quizzes Taken"
          value={stats.quizzesTaken}
          loading={loading}
        />
        <StatCard
          icon={<Trophy size={24} color="#F59E0B" />}
          label="Avg. Score"
          value={`${stats.averageScore}%`}
          loading={loading}
        />
        <StatCard
          icon={<Clock size={24} color="#10B981" />}
          label="Last Active"
          value={stats.recentActivity[0] ? new Date(stats.recentActivity[0].timestamp).toLocaleDateString() : 'Never'}
          loading={loading}
        />
      </div>

      <motion.h2 variants={item} style={{ marginBottom: '1.5rem' }}>Quick Actions</motion.h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {/* Study Card */}
        <motion.div
          variants={item}
          className="card"
          whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', border: '1px solid transparent' }}
          onClick={() => navigate('/study')}
        >
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: 'fit-content', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <BookOpen size={32} color="#4F46E5" />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Study Center</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', flex: 1 }}>
            Upload PDFs, extract insights, and chat with your AI tutor. Take notes as you learn.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#4F46E5', fontWeight: 'bold' }}>
            Go to Study <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </div>
        </motion.div>

        {/* Quiz Card */}
        <motion.div
          variants={item}
          className="card"
          whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', border: '1px solid transparent' }}
          onClick={() => navigate('/quiz', { state: { timeLimit: 10, level: 'Moderate' } })} // Default to Moderate for quick start
        >
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: 'fit-content', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <Brain size={32} color="#F59E0B" />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Quiz Zone</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', flex: 1 }}>
            Test your knowledge with AI-generated quizzes. Challenge yourself and track progress.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#F59E0B', fontWeight: 'bold' }}>
            Quick Start Quiz <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Mini-Section */}
      <motion.div variants={item}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>
            Recent Activity
          </h2>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}>
            View All
          </button>
        </div>
        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : stats.recentActivity.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No activity yet. Start studying!</div>
          ) : (
            stats.recentActivity.map((activity, index) => (
              <div key={index} style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: index < stats.recentActivity.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <Brain size={16} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: '500' }}>{activity.level} Quiz</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 'bold', color: activity.score >= 50 ? 'var(--success)' : 'var(--error)' }}>
                    {activity.score} pts
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

    </motion.div>
  );
};

const StatCard = ({ icon, label, value, loading }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    className="card"
    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}
  >
    <div style={{
      padding: '1rem',
      borderRadius: '1rem',
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        {loading ? '-' : value}
      </p>
    </div>
  </motion.div>
);

export default Dashboard;
