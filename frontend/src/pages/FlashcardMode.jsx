import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const FlashcardMode = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { flashcards: initialCards, deckId, title, context } = location.state || {}; // Accept context

    const [flashcards, setFlashcards] = useState(initialCards || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(!initialCards && !!context);

    useEffect(() => {
        if (!initialCards && context) {
            const generateCards = async () => {
                try {
                    const token = JSON.parse(localStorage.getItem('user'))?.token;
                    const response = await fetch('http://localhost:5000/api/flashcards/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ context, count: 10 })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setFlashcards(data.flashcards);
                    } else {
                        alert("Failed to generate flashcards.");
                        navigate('/study');
                    }
                } catch (error) {
                    console.error("Error generating flashcards:", error);
                    alert("Error generating flashcards.");
                    navigate('/study');
                } finally {
                    setLoading(false);
                }
            };
            generateCards();
        }
    }, [context, initialCards, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Generating Flashcards...</p>
            </div>
        );
    }

    if (!flashcards || flashcards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <p className="text-slate-500 mb-4">No flashcards loaded.</p>
                <button onClick={() => navigate('/study')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go to Study</button>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];

    const handleNext = (difficulty) => {
        // Here we could call API to update next_review
        setIsFlipped(false);
        if (currentIndex < flashcards.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300); // Delay for flip back? Better to flip back immediately
        } else {
            setFinished(true);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-100">
            <div className="p-4 bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/study')} className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-semibold text-slate-800">{title || 'Flashcards'}</h2>
                </div>
                <span className="text-sm font-medium text-slate-500">{currentIndex + 1} / {flashcards.length}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                {!finished ? (
                    <>
                        <div
                            className="relative w-full max-w-2xl aspect-video cursor-pointer perspective-1000"
                            onClick={() => setIsFlipped(!isFlipped)}
                            style={{ perspective: '1000px' }}
                        >
                            <motion.div
                                className="w-full h-full relative preserve-3d transition-all duration-500"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-xl flex items-center justify-center p-12 text-center border-2 border-slate-100"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <h3 className="text-2xl font-medium text-slate-800">{currentCard.front}</h3>
                                    <p className="absolute bottom-4 text-xs text-slate-400 uppercase tracking-widest text-indigo-500 font-semibold">Tap to flip</p>
                                </div>

                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-xl flex items-center justify-center p-12 text-center border-2 border-indigo-100 bg-indigo-50/10"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <p className="text-xl text-slate-700 leading-relaxed">{currentCard.back}</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Controls */}
                        <div className={`flex gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <button onClick={(e) => { e.stopPropagation(); handleNext('hard'); }} className="px-6 py-2 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors">Hard</button>
                            <button onClick={(e) => { e.stopPropagation(); handleNext('medium'); }} className="px-6 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-medium hover:bg-yellow-200 transition-colors">Medium</button>
                            <button onClick={(e) => { e.stopPropagation(); handleNext('easy'); }} className="px-6 py-2 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors">Easy</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h2>
                        <p className="text-slate-600 mb-6">You've reviewed all cards in this deck.</p>
                        <button onClick={() => navigate('/study')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Back to Study</button>
                    </div>
                )}
            </div>
        </div>
    )
}
export default FlashcardMode;
