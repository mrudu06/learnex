
import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize, Highlighter, Bookmark } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker (dup configuration, but safe)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const PDFViewer = ({ file, fileUrl, numPages, onLoadSuccess }) => {
    const [scale, setScale] = useState(1.0);
    const containerRef = useRef(null);
    const pageContainerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [highlights, setHighlights] = useState({}); // { pageNum: [ { text, rects } ] }

    // 3. Smart Reading Position (Resume Reading)
    useEffect(() => {
        if (file?.name) {
            const savedPage = localStorage.getItem(`read_pos_${file.name}`);
            if (savedPage) {
                setCurrentPage(parseInt(savedPage, 10));
            }
        }
    }, [file, numPages]);

    // Save position whenever page changes & Scroll to top
    useEffect(() => {
        if (file?.name) {
            localStorage.setItem(`read_pos_${file.name}`, currentPage);
        }
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [currentPage, file]);

    // 2. Highlighting Loading
    useEffect(() => {
        if (!file?.name) return;
        try {
            const stored = localStorage.getItem(`highlights_${file.name}`);
            let saved = stored ? JSON.parse(stored) : {};
            if (!saved || typeof saved !== 'object') saved = {};
            setHighlights(saved);
        } catch (err) {
            console.error("Failed to load highlights:", err);
            setHighlights({});
        }
    }, [file]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) return;

        const text = selection.toString().trim();
        if (!text) return;

        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();

        if (!pageContainerRef.current || rects.length === 0) return;

        const containerRect = pageContainerRef.current.getBoundingClientRect();

        const relativeRects = Array.from(rects).map(rect => ({
            top: rect.top - containerRect.top,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height
        }));

        const newHighlight = {
            id: Date.now(),
            text,
            page: currentPage,
            rects: relativeRects,
            timestamp: new Date().toISOString()
        };

        setHighlights(prev => {
            const pageHighlights = prev[currentPage] || [];
            const updated = { ...prev, [currentPage]: [...pageHighlights, newHighlight] };
            if (file?.name) {
                localStorage.setItem(`highlights_${file.name}`, JSON.stringify(updated));
            }
            return updated;
        });

        // Optional: Clear selection to show the yellow highlight clearly
        selection.removeAllRanges();
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen();
        }
    };

    const changePage = (offset) => {
        setCurrentPage(prev => {
            const newPage = prev + offset;
            return Math.max(1, Math.min(newPage, numPages || 1));
        });
    };

    return (
        <div
            className="pdf-viewer-container relative h-full flex flex-col bg-slate-100 rounded-lg overflow-hidden group"
            ref={containerRef}
            style={{ height: '100%' }}
        >
            {/* Toolbar / Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button onClick={toggleFullscreen} className="p-2 bg-slate-800 text-white rounded shadow-lg hover:bg-slate-700">
                    <Maximize size={16} />
                </button>
            </div>

            {/* Navigation Overlay (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-4 bg-slate-800/90 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
                <button
                    onClick={() => changePage(-1)}
                    disabled={currentPage <= 1}
                    className="hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                    &lt; Prev
                </button>
                <span className="text-sm font-medium whitespace-nowrap">
                    Page {currentPage} of {numPages || '--'}
                </span>
                <button
                    onClick={() => changePage(1)}
                    disabled={currentPage >= (numPages || 1)}
                    className="hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                    Next &gt;
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center items-start" onMouseUp={handleTextSelection}>
                <Document
                    file={fileUrl}
                    onLoadSuccess={props => {
                        if (onLoadSuccess) onLoadSuccess(props);
                        // Ensure rendered
                    }}
                    loading={<div className="p-8 text-slate-500">Loading PDF...</div>}
                    className="flex flex-col justify-center"
                >
                    <div className="pdf-page-container relative shadow-md" ref={pageContainerRef}>
                        <Page
                            key={`page_${currentPage}`}
                            pageNumber={currentPage}
                            width={600}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="bg-white"
                        />
                        {/* Render Highlights Overlay */}
                        {(highlights[currentPage] || []).map((highlight) => (
                            (highlight.rects || []).map((rect, idx) => (
                                <div
                                    key={`${highlight.id}-${idx}`}
                                    style={{
                                        position: 'absolute',
                                        top: rect.top,
                                        left: rect.left,
                                        width: rect.width,
                                        height: rect.height,
                                        backgroundColor: 'yellow',
                                        opacity: 0.4,
                                        zIndex: 50, // Ensure it's on top of text layer
                                        pointerEvents: 'none',
                                    }}
                                />
                            ))
                        ))}
                    </div>
                </Document>
            </div>
        </div>
    );
};

export default PDFViewer;
