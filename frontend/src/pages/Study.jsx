import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Upload, Loader, MessageSquare, Clock, StickyNote, Save, Trash2, ArrowLeft, Plus, Brain, Video, ExternalLink, X, ChevronDown, ChevronRight, Zap, Maximize, Minimize, Pen } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import PDFViewer from '../components/PDFViewer';
import Whiteboard from '../components/Whiteboard';


// PDF configuration moved to PDFViewer component


const ModeButton = ({ mode, currentMode, setMode, label, icon: Icon }) => (
  <button
    onClick={() => setMode(mode)}
    style={{
      flex: 1,
      padding: '0.5rem',
      fontSize: '0.8rem',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: currentMode === mode ? '#4F46E5' : '#f3f4f6',
      color: currentMode === mode ? 'white' : '#666',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.3rem'
    }}
  >
    {Icon && <Icon size={14} />}
    {label}
  </button>
);

const Study = () => {
  const containerRef = useRef(null);
  const location = useLocation();
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [showDeepPrompt, setShowDeepPrompt] = useState(true);

  // Global Study State
  const {
    file, setFile,
    fileUrl, setFileUrl,
    numPages, setNumPages,
    extractedText, setExtractedText,
    extractedPages, setExtractedPages,
    messages, setMessages
  } = useStudy();

  // Local UI State
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiMode, setAiMode] = useState('partner'); // 'partner', 'quiz', 'summary'

  // Quiz Scope State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [generationMode, setGenerationMode] = useState('quiz'); // 'quiz' or 'flashcards'
  const [quizScope, setQuizScope] = useState({ type: 'full', start: 1, end: 1 });

  // Tools Panel State
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'notes'
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null); // null means new/unsaved session

  // Notes State
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');

  // Videos State
  const [videos, setVideos] = useState([]);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);

  // Whiteboard State
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState('pen');

  // Analytics State
  const [studySessionId, setStudySessionId] = useState(null);

  // Heartbeat Effect
  useEffect(() => {
    let heartbeatInterval;

    const startSession = async () => {
      if (!file) return;
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const res = await fetch('http://localhost:5000/api/study/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ file_name: file.name })
        });
        if (res.ok) {
          const data = await res.json();
          setStudySessionId(data.id);
        }
      } catch (e) { console.error("Session start error", e); }
    };

    if (file && !studySessionId) {
      startSession();
    }

    if (studySessionId) {
      heartbeatInterval = setInterval(async () => {
        try {
          const token = JSON.parse(localStorage.getItem('user'))?.token;
          await fetch(`http://localhost:5000/api/study/session/heartbeat/${studySessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ duration_inc: 60, pages_read: 1 }) // Hardcoded pages increment mostly time for now
          });
        } catch (e) {
          console.error("Heartbeat failed", e);
        }
      }, 60000); // 1 minute
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [file, studySessionId]);

  // Fetch Chat Sessions
  const fetchChatSessions = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await fetch('http://localhost:5000/api/chat/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    }
  };

  const loadChatSession = async (sessionId) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await fetch(`http://localhost:5000/api/chat/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.id);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const deleteChatSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat history?")) return;
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await fetch(`http://localhost:5000/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchChatSessions();
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  // Fetch Notes
  const fetchNotes = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await fetch('http://localhost:5000/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  // Fetch Videos
  const fetchVideos = async () => {
    if (!extractedText && !file) {
      // Maybe just fetch general topic videos if no file?
      // For now, require file for context.
      return;
    }
    setIsFetchingVideos(true);
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await fetch('http://localhost:5000/api/videos/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ context: extractedText, topic: 'Document Study' })
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsFetchingVideos(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notes') {
      fetchNotes();
    } else if (activeTab === 'chats') {
      fetchChatSessions();
    } else if (activeTab === 'videos' && videos.length === 0) {
      fetchVideos();
    }
  }, [activeTab]);

  // Handle Note Operations
  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      alert("Note content cannot be empty.");
      return;
    }

    const token = JSON.parse(localStorage.getItem('user'))?.token;
    const isNew = !editingNote?.id;
    const url = isNew
      ? 'http://localhost:5000/api/notes'
      : `http://localhost:5000/api/notes/${editingNote.id}`;

    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: noteTitle, content: noteContent })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchNotes();
        setEditingNote(null); // Return to list
        setNoteTitle('');
        setNoteContent('');
      } else {
        alert(`Failed to save note: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note. Please try again.");
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await fetch(url = `http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotes();
      if (editingNote?.id === id) {
        setEditingNote(null);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const startNewNote = () => {
    setEditingNote({ new: true });
    setNoteTitle('');
    setNoteContent('');
  };

  const openNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content);
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { role: 'ai', content: file ? 'Ask me anything about the document.' : 'Upload a PDF to start studying! I can answer questions based on its content.' }
    ]);
  };

  // Handle File Upload
  const onFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setIsUploading(true);

      // Upload to backend for text extraction
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const response = await fetch('http://localhost:5000/api/pdf/extract', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setExtractedText(data.text);
          setExtractedPages(data.pages || []); // Store pages
          setMessages(prev => [...prev, { role: 'ai', content: `Processed ${selectedFile.name}. content extracted! Ask me anything about it.` }]);
          // Start fresh chat for new file if wanted, or keep current?
          // Usually new file = new context = new chat.
          setCurrentSessionId(null);
        } else {
          console.error("Extraction failed:", data.message);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload PDF. Please ensure the backend server is running.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Handle Chat
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);

    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userMsg,
          context: extractedText,
          session_id: currentSessionId || 'new',
          mode: aiMode,
          gemini_api_key: JSON.parse(localStorage.getItem('user'))?.geminiKey
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
          if (activeTab === 'chats') fetchChatSessions(); // Refresh list to show new title
        }
      } else if (response.status === 401) {
        alert("Session expired. Please log in again.");
        window.location.href = '/login';
      } else {
        const errorMsg = data?.message || "Sorry, I couldn't process that request.";
        setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting to the AI. It might be busy thinking!" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Deep Mode Handlers
  const enterDeepMode = () => {
    setIsDeepMode(true);
    setShowDeepPrompt(false);
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) { /* Safari */
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) { /* IE11 */
        containerRef.current.msRequestFullscreen();
      }
    }
  };

  const exitDeepMode = () => {
    setIsDeepMode(false);
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsDeepMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Loading Book from Library (URL)
  useEffect(() => {
    const loadFromLibrary = async () => {
      if (location.state?.pdfUrl && !file) {
        const { pdfUrl, title } = location.state;
        try {
          // Use Backend Proxy to avoid CORS
          const proxyUrl = `http://localhost:5000/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`;

          // UI feedback
          // setFile({ name: title || "Library Book" }); // Placeholder

          // Since our proxy returns a stream with CORS headers now, we can fetch it
          const response = await fetch(proxyUrl);

          if (!response.ok) throw new Error("Failed to fetch book via proxy");
          const blob = await response.blob();
          const loadedFile = new File([blob], title || "Library Book.pdf", { type: "application/pdf" });

          // Call existing onFileChange logic manually or refactor it
          // onFileChange expects an event { target: { files: [file] } }
          onFileChange({ target: { files: [loadedFile] } });

          // Clear state so we don't reload on refresh loop
          window.history.replaceState({}, document.title);
        } catch (err) {
          console.error("Error loading library book:", err);
          alert("Failed to load book via proxy. Opening in new tab.");
          window.open(location.state.pdfUrl, '_blank');
        }
      }
    };
    loadFromLibrary();
  }, [location.state]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        height: '100%',
        gap: '1rem',
        overflow: 'hidden',
        backgroundColor: isDeepMode ? '#0f172a' : 'transparent', // Darker bg for focus
        padding: isDeepMode ? '1rem' : '0'
      }}>


      {/* Column 1: PDF Viewer (Fluid Main Content) */}
      <motion.div layout
        className="card"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minWidth: '400px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
      >
        {!fileUrl ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ padding: '2rem', backgroundColor: '#f1f5f9', borderRadius: '1rem', border: '2px dashed #cbd5e1' }}>
              <Upload size={48} color="#94a3b8" />
            </div>
            <h3 style={{ margin: 0, color: '#475569' }}>Upload a PDF to Start Learning</h3>
            <div className="file-input-wrapper">
              <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                <Upload size={18} /> Select PDF
              </label>
              <input id="file-upload" type="file" accept=".pdf" onChange={onFileChange} style={{ display: 'none' }} />
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {file?.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Highlighter Paused for now
                {!isWhiteboardOpen && (
                  <button
                    onClick={() => {
                      setIsWhiteboardOpen(true);
                      setWhiteboardTool('highlighter');
                    }}
                    className="btn btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#eab308' }}
                    title="Open Highlighter"
                  >
                    <Pen size={18} className="opacity-50" /> Highlight
                  </button>
                )}
                */}
                <button
                  onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
                  className={`btn ${isWhiteboardOpen ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Pen size={18} /> {isWhiteboardOpen ? 'Close Board' : 'Whiteboard'}
                </button>
                <button
                  onClick={enterDeepMode}
                  className="btn btn-ghost"
                  title="Deep Study Mode"
                >
                  <Maximize size={18} />
                </button>

                <div className="file-input-wrapper">
                  <label htmlFor="file-upload-change" style={{ cursor: 'pointer', color: '#6366f1', fontSize: '0.9rem', fontWeight: 500 }}>
                    Change File
                  </label>
                  <input id="file-upload-change" type="file" accept=".pdf" onChange={onFileChange} style={{ display: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
              <div style={{ flex: 1, overflow: 'hidden', borderRight: isWhiteboardOpen ? '1px solid #e2e8f0' : 'none' }}>
                <PDFViewer
                  file={file}
                  fileUrl={fileUrl}
                  numPages={numPages}
                  onLoadSuccess={onDocumentLoadSuccess}
                />
              </div>

              {isWhiteboardOpen && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Whiteboard activeTool={whiteboardTool} setActiveTool={setWhiteboardTool} />
                </div>
              )}
            </div>
          </div>
        )}

      </motion.div >

      {/* Column 2: Right Panel (Tools & AI) */}
      <div style={{ width: '360px', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>

        {/* Tools Section (Collapsible) */}
        <motion.div layout
          className="card"
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
          animate={{ height: isToolsExpanded ? '40%' : 'auto' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            style={{ padding: '1rem', borderBottom: isToolsExpanded ? '1px solid #eee' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Tools</h3>
            <span style={{ color: '#94a3b8' }}>{isToolsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
          </div>

          {
            isToolsExpanded && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <button className={`btn ${activeTab === 'chats' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('chats')}>Chats</button>
                  <button className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('notes')}>Notes</button>
                  <button className={`btn ${activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('videos')}>Videos</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {activeTab === 'chats' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {chatSessions.map((chat) => (
                        <div key={chat.id} onClick={() => loadChatSession(chat.id)} style={{ padding: '0.5rem', backgroundColor: currentSessionId === chat.id ? '#e0e7ff' : '#f8fafc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{chat.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(chat.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                      <button onClick={startNewChat} className="btn btn-secondary" style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.8rem' }}>+ New Chat</button>
                    </div>
                  )}
                  {activeTab === 'notes' && !editingNote && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button onClick={startNewNote} className="btn btn-secondary" style={{ marginBottom: '0.5rem', fontSize: '0.8rem', width: '100%' }}>+ New Note</button>
                      {notes.length === 0 && <div style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '1rem' }}>No notes yet.</div>}
                      {notes.map(note => (
                        <div key={note.id} onClick={() => openNote(note)} style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{note.title || 'Untitled'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'notes' && editingNote && (
                    // Simplified Note Editor
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button onClick={() => setEditingNote(null)} style={{ fontSize: '0.8rem' }}>&larr; Back</button>
                        <button onClick={handleSaveNote} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Save</button>
                      </div>
                      <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }} />
                      <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', resize: 'none' }} placeholder="Note content..." />
                    </div>
                  )}
                  {activeTab === 'videos' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {isFetchingVideos && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <Loader className="spin" size={20} />
                          <span>Curating videos...</span>
                        </div>
                      )}
                      {!isFetchingVideos && videos.length === 0 && <button onClick={fetchVideos} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Find Videos</button>}
                      {videos.map(video => (
                        <a key={video.id} href={video.link} target="_blank" style={{ display: 'block', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{video.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{video.channel}</div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}


        </motion.div >

        {/* AI Tutor Section (Collapsible - Fills remaining space) */}
        <motion.div layout
          className="card"
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }
          }
          animate={{ flex: isAIExpanded ? 1 : 0, height: isAIExpanded ? 'auto' : 'auto' }}
        >
          <div
            onClick={() => setIsAIExpanded(!isAIExpanded)}
            style={{ padding: '1rem', borderBottom: isToolsExpanded ? '1px solid #eee' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>AI Tutor</h3>
            <span style={{ color: '#94a3b8' }}>{isAIExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
          </div>

          {
            isAIExpanded && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', paddingTop: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.25rem', backgroundColor: '#f9fafb', borderRadius: '8px', flexShrink: 0 }}>
                  <ModeButton mode="partner" currentMode={aiMode} setMode={setAiMode} label="Chat" icon={MessageSquare} />
                  <button
                    onClick={() => {
                      if (!extractedText) {
                        alert("Please upload a PDF first to generate content.");
                        return;
                      }
                      setGenerationMode('quiz');
                      setShowQuizModal(true);
                    }}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', backgroundColor: '#f3f4f6', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <Brain size={14} /> Quiz
                  </button>
                  <button
                    onClick={() => {
                      if (!extractedText) {
                        alert("Please upload a PDF first to generate content.");
                        return;
                      }
                      setGenerationMode('flashcards');
                      setShowQuizModal(true);
                    }}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', backgroundColor: '#f3f4f6', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <Zap size={14} /> Cards
                  </button>
                  <ModeButton mode="summary" currentMode={aiMode} setMode={setAiMode} label="Summary" icon={StickyNote} />
                </div>

                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.role === 'user' ? '#4F46E5' : '#F3F4F6',
                        color: msg.role === 'user' ? 'white' : 'black',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        maxWidth: '90%',
                        fontSize: '0.9rem'
                      }}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isProcessing && <div style={{ alignSelf: 'flex-start', color: '#666', fontSize: '0.85rem' }}>Thinking...</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={aiMode === 'summary' ? "Type 'Go'..." : "Ask..."}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '0.9rem' }}
                    disabled={isProcessing}
                  />
                  <button onClick={sendMessage} className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={isProcessing || !input.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )
          }
        </motion.div >
      </div >

      {/* Quiz Setup Modal */}
      {
        showQuizModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '400px', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>{generationMode === 'quiz' ? 'Generate Quiz' : 'Generate Flashcards'}</h3>
                <button onClick={() => setShowQuizModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Scope</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setQuizScope({ ...quizScope, type: 'full' })} className={`btn ${quizScope.type === 'full' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>Whole Document</button>
                  <button onClick={() => setQuizScope({ ...quizScope, type: 'selected' })} className={`btn ${quizScope.type === 'selected' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>Selected Pages</button>
                </div>
              </div>

              {quizScope.type === 'selected' && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Page</label>
                    <input type="number" min="1" max={numPages} value={quizScope.start} onChange={(e) => setQuizScope({ ...quizScope, start: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Page</label>
                    <input type="number" min="1" max={numPages} value={quizScope.end} onChange={(e) => setQuizScope({ ...quizScope, end: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  let contextToSend = extractedText;
                  if (quizScope.type === 'selected') {
                    if (!extractedPages || extractedPages.length === 0) {
                      alert("Page data not available. Please re-upload the PDF.");
                      return;
                    }
                    const s = Math.max(1, quizScope.start);
                    const e = Math.min(numPages || extractedPages.length, quizScope.end);

                    if (e < s) {
                      alert("End page must be greater than start page.");
                      return;
                    }
                    contextToSend = extractedPages.slice(s - 1, e).join("\n");
                  }

                  if (!contextToSend) { alert("No content."); return; }
                  setShowQuizModal(false);

                  if (generationMode === 'flashcards') {
                    navigate('/flashcards', { state: { context: contextToSend, topic: 'Document Study' } });
                  } else {
                    navigate('/quiz', { state: { context: contextToSend, topic: 'Document Study' } });
                  }
                }}
                className="btn btn-primary" style={{ width: '100%' }}
              >
                Generate Quiz
              </button>
            </div>
          </div>
        )}
      {/* Deep Mode Prompt Modal */}
      {
        showDeepPrompt && !isDeepMode && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            >
              <div style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: '#EEF2FF' }}>
                <Maximize size={32} className="text-indigo-600" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>Deep Study Mode</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Enable Deep Mode to hide distractions, silence notifications, and focus entirely on your material.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowDeepPrompt(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
                  Maybe Later
                </button>
                <button onClick={enterDeepMode} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#4F46E5', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Maximize size={16} /> Focus Now
                </button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Floating Exit Deep Mode Button */}
      {
        isDeepMode && (
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={exitDeepMode}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 9999,
              color: '#1e293b',
              fontWeight: 600
            }}
          >
            <Minimize size={18} /> Exit Deep Mode
          </motion.button>
        )
      }


    </div >
  );

};

export default Study;
