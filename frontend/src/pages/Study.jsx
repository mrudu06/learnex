import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { Send, Upload, Loader, MessageSquare, Clock, StickyNote, Save, Trash2, ArrowLeft, Plus, Brain, Video, ExternalLink } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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
  // Global Study State
  const {
    file, setFile,
    fileUrl, setFileUrl,
    numPages, setNumPages,
    extractedText, setExtractedText,
    messages, setMessages
  } = useStudy();

  // Local UI State
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiMode, setAiMode] = useState('partner'); // 'partner', 'quiz', 'summary'

  // Tools Panel State
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
          setMessages(prev => [...prev, { role: 'ai', content: `Processed ${selectedFile.name}. content extracted! Ask me anything about it.` }]);
          // Start fresh chat for new file if wanted, or keep current?
          // Usually new file = new context = new chat.
          setCurrentSessionId(null);
        } else {
          console.error("Extraction failed:", data.message);
        }
      } catch (error) {
        console.error("Upload error:", error);
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
          mode: aiMode
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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '1rem' }}>

      {/* Column 1: PDF Viewer (Fluid Width) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden', minWidth: '400px' }}
      >
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Document Viewer</h3>
          <div className="file-input-wrapper">
            <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} /> Upload PDF
            </label>
            <input id="file-upload" type="file" accept=".pdf" onChange={onFileChange} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}>
          {fileUrl ? (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div style={{ padding: '2rem' }}>Loading PDF...</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={500}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="pdf-page"
                />
              ))}
            </Document>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              No PDF uploaded
            </div>
          )}
        </div>
      </motion.div>

      {/* Column 2: Chat (Fixed Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '1rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>AI Tutor</h3>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.25rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <ModeButton mode="partner" currentMode={aiMode} setMode={setAiMode} label="Chat" icon={MessageSquare} />
          <button
            onClick={() => {
              if (!extractedText) {
                alert("Please upload a PDF first to generate a quiz.");
                return;
              }
              navigate('/quiz', { state: { context: extractedText, topic: 'Document Study' } });
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <Brain size={14} />
            Quiz
          </button>
          <ModeButton mode="summary" currentMode={aiMode} setMode={setAiMode} label="Summary" icon={StickyNote} />
        </div>

        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            placeholder={aiMode === 'summary' ? "Type 'Go' to summarize..." : "Ask a question..."}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              outline: 'none',
              fontSize: '0.9rem'
            }}
            disabled={isProcessing}
          />
          <button
            onClick={sendMessage}
            className="btn btn-primary"
            style={{ padding: '0.75rem' }}
            disabled={isProcessing || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </motion.div>

      {/* Column 3: Tools Panel (Chats/Notes) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{ width: '250px', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'chats' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('chats')}
          >
            Chats
          </button>
          <button
            className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
          <button
            className={`btn ${activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('videos')}
          >
            Videos
          </button>
        </div>

        {activeTab === 'chats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
            {chatSessions.length === 0 && <div style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '1rem' }}>No history yet.</div>}
            {chatSessions.map((chat) => (
              <div
                key={chat.id}
                onClick={() => loadChatSession(chat.id)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: currentSessionId === chat.id ? '#e0e7ff' : 'var(--bg-secondary)',
                  border: currentSessionId === chat.id ? '1px solid #6366f1' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                className="group"
              >
                <button
                  onClick={(e) => deleteChatSession(e, chat.id)}
                  style={{ position: 'absolute', top: '5px', right: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.9rem', paddingRight: '15px' }}>
                  <MessageSquare size={14} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.25rem', paddingLeft: '22px' }}>
                  {chat.last_message}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  <Clock size={12} />
                  <span>{new Date(chat.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            <button onClick={startNewChat} className="btn btn-secondary" style={{ marginTop: 'auto', fontSize: '0.85rem' }}>
              + New Chat
            </button>
          </div>
        )}

        {activeTab === 'notes' && !editingNote && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
            <button onClick={startNewNote} className="btn btn-secondary" style={{ marginBottom: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Plus size={14} /> New Note
            </button>
            {notes.length === 0 && <div style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '1rem' }}>No notes yet.</div>}
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid transparent'
                }}
              >
                <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <StickyNote size={14} /> {note.title || 'Untitled'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {note.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && editingNote && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.5rem' }}>
            <button onClick={() => setEditingNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#666', fontSize: '0.85rem', alignSelf: 'flex-start', padding: 0 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <input
              type="text"
              placeholder="Title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
            />
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note here..."
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', resize: 'none', fontSize: '0.85rem', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSaveNote} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>
                <Save size={14} /> Save
              </button>
              {!editingNote.new && (
                <button onClick={() => handleDeleteNote(editingNote.id)} className="btn" style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.5rem', fontSize: '0.85rem' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isFetchingVideos && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Loader className="spin" size={24} />
                <span>Curating videos...</span>
              </div>
            )}

            {!isFetchingVideos && videos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p style={{ marginBottom: '1rem' }}>No videos found yet.</p>
                <button onClick={fetchVideos} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Find Related Videos
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {videos.map(video => (
                <a
                  key={video.id}
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                // className="video-card-link"
                >
                  <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden', border: '1px solid transparent', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ position: 'relative', paddingBottom: '56.25%', backgroundColor: '#000' }}>
                      {video.thumbnail && <img src={video.thumbnail} alt={video.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px' }}>
                        {video.duration}
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                        {video.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{video.channel}</span>
                        <span>{video.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {!isFetchingVideos && videos.length > 0 && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button onClick={fetchVideos} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  Refresh Recommendations
                </button>
              </div>
            )}
          </div>
        )}

      </motion.div>

    </div>
  );
};

export default Study;
