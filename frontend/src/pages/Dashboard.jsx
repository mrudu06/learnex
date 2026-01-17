import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Activity, Clock, Trophy, ArrowRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_study_minutes: 0,
    quizzes_taken: 0,
    avg_score: 0,
    activity_chart: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('http://localhost:5000/api/analytics', { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
        <p style={{ color: 'var(--text-secondary)' }}>Here's your study progress for the week.</p>
      </motion.div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard
          icon={<Clock size={24} color="#6366F1" />}
          label="Total Study Time"
          value={`${stats.total_study_minutes} min`}
          loading={loading}
        />
        <StatCard
          icon={<Activity size={24} color="#10B981" />}
          label="Quizzes Taken"
          value={stats.quizzes_taken}
          loading={loading}
        />
        <StatCard
          icon={<Trophy size={24} color="#F59E0B" />}
          label="Avg. Score"
          value={`${stats.avg_score}%`}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <motion.div variants={item} style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} /> Learning Activity
        </h2>
        <div className="card" style={{ height: '300px', padding: '1.5rem' }}>
          {loading ? (
            <div className="flex-center h-full text-secondary">Loading Chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activity_chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar dataKey="minutes" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

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
            Upload PDFs, extract insights, and chat with your AI tutor.
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
          onClick={() => navigate('/quiz', { state: { timeLimit: 10, level: 'Moderate' } })}
        >
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: 'fit-content', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <Brain size={32} color="#F59E0B" />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Take a Quiz</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', flex: 1 }}>
            Test your knowledge with AI-generated quizzes.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#F59E0B', fontWeight: 'bold' }}>
            Start Quiz <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </div>
        </motion.div>
      </div>
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
