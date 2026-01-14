import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, CheckCircle, XCircle, Circle } from 'lucide-react';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const answersRef = useRef([]);
  const { timeLimit = 10, level = 'Moderate' } = location.state || {};
  const { user, updateXP } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState(Date.now());
  const [previousXP, setPreviousXP] = useState(0);
  const [showCoins, setShowCoins] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  console.log("Quiz Render State:", { loading, questionsLength: questions.length, currentQuestionIndex, isFinished, score });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;

        if (!token) {
          console.error("No token found, redirecting to login");
          navigate('/login');
          return;
        }
        
        // Generate new questions based on topic/difficulty
        // Defaulting to General Knowledge as requested
        const generateRes = await fetch('http://localhost:5000/api/quiz/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                topic: 'General Knowledge',
                count: 5,
                difficulty: location.state?.level || 'Medium'
            })
        });

        if (!generateRes.ok) {
            console.error("Failed to generate quiz");
        }

        // Now fetch the generated questions
        const response = await fetch('http://localhost:5000/api/quiz', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }); 
        
        if (response.ok) {
          const data = await response.json();
          const formattedQuestions = data.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.answer
          }));
          setQuestions(formattedQuestions);
        } else if (response.status === 401 || response.status === 422) {
          console.error('Session expired or invalid token');
          localStorage.removeItem('user'); // Clear invalid session
          navigate('/login');
        } else {
          console.error('Failed to fetch questions');
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [navigate]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (isFinished || loading || !currentQuestion) return;
    
    setTimeLeft(timeLimit);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQuestionIndex, isFinished, timeLimit, loading, currentQuestion]);

  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    handleAnswer(null);
  };

  const handleAnswer = (option) => {
    if (isAnswered || !currentQuestion) return;
    
    clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option === currentQuestion.correctAnswer;
    let points = isCorrect ? 5 : -1;
    
    const newScore = score + points;
    setScore(newScore);

    // Record answer
    const newAnswer = {
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        user_answer: option,
        correct_answer: currentQuestion.correctAnswer,
        is_correct: isCorrect
    };
    answersRef.current.push(newAnswer);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setIsAnswered(false);
        setSelectedOption(null);
      } else {
        finishQuiz(newScore);
      }
    }, 1500);
  };

  const finishQuiz = async (finalScore) => {
    setPreviousXP(user?.xp || 0);
    setIsFinished(true);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    if (finalScore > 0) {
        updateXP(finalScore);
        setTimeout(() => setShowCoins(true), 500);
    }

    // Submit to backend
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        await fetch('http://localhost:5000/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                score: finalScore,
                total_questions: questions.length,
                time_taken: totalTime,
                level: level,
                answers: answersRef.current
            })
        });
    } catch (error) {
        console.error("Failed to submit quiz:", error);
    }

    const leaderboardEntry = {
        score: finalScore,
        time: totalTime,
        date: new Date().toISOString()
    };
    const existingHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    localStorage.setItem('quizHistory', JSON.stringify([...existingHistory, leaderboardEntry]));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>No questions available. Please load data via the backend.</div>;
  }

  if (isFinished) {
    const currentLevelXP = previousXP % 100;
    const gainedXP = score > 0 ? score : 0;
    const finalLevelXP = Math.min(currentLevelXP + gainedXP, 100);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
        style={{ textAlign: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}
      >
        {showCoins && Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
            animate={{ 
              opacity: [1, 1, 0],
              x: (Math.random() - 0.5) * 200, 
              y: 150,
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              delay: i * 0.1,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <Circle size={24} color="#F59E0B" fill="#F59E0B" />
          </motion.div>
        ))}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
        </motion.div>
        <h2>Quiz Finished!</h2>
        <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Your Score: <span className="highlight">{score}</span></p>
        
        {/* XP Bar Animation */}
        <div style={{ maxWidth: '300px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Level {Math.floor(previousXP / 100) + 1}</span>
                <span>{gainedXP} XP Gained</span>
            </div>
            <div className="xp-bar-container" style={{ height: '12px' }}>
                <motion.div 
                    className="xp-bar-fill" 
                    initial={{ width: `${currentLevelXP}%` }}
                    animate={{ width: `${finalLevelXP}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button onClick={() => navigate('/')} className="btn btn-secondary">Back to Dashboard</button>
          <button onClick={() => navigate('/leaderboard')} className="btn">View Leaderboard</button>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>Error: Question not found.</div>;  
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Question {currentQuestionIndex + 1}/{questions.length}</span>
        <span style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          padding: '0.25rem 0.75rem', 
          borderRadius: '1rem', 
          fontSize: '0.875rem',
          border: '1px solid var(--border-color)'
        }}>
            {level} Mode
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
          <span>Score: {score}</span>
        </div>
      </div>
      
      <motion.div 
        key={currentQuestionIndex}
        initial={{ x: 0, opacity: 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        className="card"
        style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', minHeight: '200px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Timer size={24} color={timeLeft <= 3 ? 'var(--error)' : 'var(--warning)'} style={{ marginRight: '0.5rem' }} />
            <span className="timer" style={{ margin: 0, fontSize: '1.5rem', color: timeLeft <= 3 ? 'var(--error)' : 'var(--warning)' }}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', textAlign: 'center' }}>{currentQuestion.question}</h3>
        
        <div className="quiz-options" style={{ display: 'grid', gap: '1rem' }}>
          {currentQuestion.options && currentQuestion.options.map((option, index) => {
            let className = "option-btn";
            let icon = null;
            
            if (isAnswered) {
              if (option === currentQuestion.correctAnswer) {
                className += " correct";
                icon = <CheckCircle size={20} />;
              } else if (option === selectedOption) {
                className += " wrong";
                icon = <XCircle size={20} />;
              }
            }
            
            return (
              <motion.button 
                key={option} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={className}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                <span style={{ flex: 1 }}>{option}</span>
                {icon && <span style={{ marginLeft: '0.5rem' }}>{icon}</span>}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Quiz;
