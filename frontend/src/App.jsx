import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import Quiz from './pages/Quiz'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import PreviousQuizzes from './pages/PreviousQuizzes'
import QuizDetails from './pages/QuizDetails'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/study" element={
          <PrivateRoute>
            <Study />
          </PrivateRoute>
        } />
        <Route path="/quiz" element={
          <PrivateRoute>
            <Quiz />
          </PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute>
            <PreviousQuizzes />
          </PrivateRoute>
        } />
        <Route path="/history/:id" element={
          <PrivateRoute>
            <QuizDetails />
          </PrivateRoute>
        } />
        <Route path="/leaderboard" element={
          <PrivateRoute>
            <Leaderboard />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App