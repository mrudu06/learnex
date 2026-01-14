import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { Send, Upload, Loader } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const Study = () => {
  // PDF State
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [extractedText, setExtractedText] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Upload a PDF to start studying! I can answer questions based on its content.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
          context: extractedText
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that request." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Error connecting to AI service." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '20px' }}>
      
      {/* Left Panel: PDF Viewer */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}
      >
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Document Viewer</h3>
          <div className="file-input-wrapper">
             <label htmlFor="file-upload" className="btn btn-primary" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Upload size={16} /> Upload PDF
             </label>
             <input id="file-upload" type="file" accept=".pdf" onChange={onFileChange} style={{display:'none'}} />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}>
          {fileUrl ? (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div style={{padding: '2rem'}}>Loading PDF...</div>}
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

      {/* Right Panel: Chat */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card" 
        style={{ width: '400px', display: 'flex', flexDirection: 'column', padding: '1rem' }}
      >
        <h3>AI Tutor</h3>
        
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? '#4F46E5' : '#F3F4F6',
                color: msg.role === 'user' ? 'white' : 'black',
                padding: '0.75rem',
                borderRadius: '12px',
                maxWidth: '85%'
              }}
            >
              {msg.content}
            </div>
          ))}
          {isProcessing && <div style={{ alignSelf: 'flex-start', color: '#666' }}>Thinking...</div>}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: '1px solid #ddd',
              outline: 'none'
            }}
            disabled={!extractedText && input.length === 0}
          />
          <button 
            onClick={sendMessage}
            className="btn btn-primary"
            disabled={isProcessing || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Study;
