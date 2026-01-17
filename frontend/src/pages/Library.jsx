import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Filter, ExternalLink, BookOpen, Search } from 'lucide-react';
import { libraryBooks } from '../data/books';

const Library = () => {
    const navigate = useNavigate();
    const [activeGenre, setActiveGenre] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const genres = ['All', 'Python', 'Algorithms', 'OS', 'Mathematics', 'Tools'];

    const filteredBooks = libraryBooks.filter(book => {
        const matchesGenre = activeGenre === 'All' || book.genre === activeGenre;
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesGenre && matchesSearch;
    });

    const handleRead = (book) => {
        navigate('/study', {
            state: {
                pdfUrl: book.url,
                title: book.title
            }
        });
    };

    return (
        <div className="p-8 h-full bg-slate-50 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Book className="text-indigo-600" /> Open Source Library
                    </h1>
                    <p className="text-slate-500 mt-2">Curated collection of free educational resources.</p>
                </div>
            </div>

            {/* Genre Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {genres.map(genre => (
                    <button
                        key={genre}
                        onClick={() => setActiveGenre(genre)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeGenre === genre
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map(book => (
                    <div key={book.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="h-48 bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden group">
                            {/* Blurred Background */}
                            <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-50" style={{ backgroundImage: `url(${book.cover})` }}></div>
                            <img src={book.cover} alt={book.title} className="h-full w-auto shadow-lg z-10 transition-transform group-hover:scale-105" />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex-1">
                                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">{book.genre}</span>
                                <h3 className="text-lg font-bold text-slate-800 mt-1 mb-1 leading-tight">{book.title}</h3>
                                <p className="text-sm text-slate-500 mb-3">by {book.author}</p>
                                <p className="text-sm text-slate-600 line-clamp-3">{book.description}</p>
                            </div>

                            <button
                                onClick={() => handleRead(book)}
                                className="mt-4 w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                Study Now <BookOpen size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Library;
