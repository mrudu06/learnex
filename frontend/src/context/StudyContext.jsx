import { createContext, useContext, useState } from 'react';

const StudyContext = createContext();

export const useStudy = () => useContext(StudyContext);

export const StudyProvider = ({ children }) => {
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [extractedPages, setExtractedPages] = useState([]); // Array of strings (one per page)
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Upload a PDF to start studying! I can answer questions based on its content.' }
    ]);

    const value = {
        file,
        setFile,
        fileUrl,
        setFileUrl,
        numPages,
        setNumPages,
        extractedText,
        setExtractedText,
        extractedPages,
        setExtractedPages,
        messages,
        setMessages
    };

    return (
        <StudyContext.Provider value={value}>
            {children}
        </StudyContext.Provider>
    );
};
