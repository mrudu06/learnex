import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // Correct import for Fabric v6+
const { Canvas, Rect, Circle } = fabric;
import { Pen, Eraser, Square, Circle as LoaderCircle, Download, Trash2, Undo } from 'lucide-react';

const Whiteboard = ({ activeTool, setActiveTool }) => {
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    // const [activeTool, setActiveTool] = useState('pen'); // specific state lifted up
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(2);

    // Initialize Canvas
    useEffect(() => {
        if (canvasRef.current) {
            console.log("Initializing Fabric Canvas...");
            const canvas = new Canvas(canvasRef.current, {
                isDrawingMode: true,
                width: 500,
                height: 500,
                backgroundColor: '#ffffff',
            });

            // Set initial brush
            const brush = new fabric.PencilBrush(canvas);
            brush.width = brushSize;
            brush.color = color;
            canvas.freeDrawingBrush = brush;

            setFabricCanvas(canvas);

            // Resize handler
            const resizeCanvas = () => {
                const container = canvasRef.current?.parentElement;
                if (container && container.clientWidth > 0) {
                    console.log("Resizing canvas to:", container.clientWidth, container.clientHeight);
                    canvas.setDimensions({ width: container.clientWidth, height: container.clientHeight });
                    canvas.renderAll();
                }
            };

            const resizeObserver = new ResizeObserver(() => resizeCanvas());
            if (canvasRef.current.parentElement) {
                resizeObserver.observe(canvasRef.current.parentElement);
            }

            // Trigger once
            setTimeout(resizeCanvas, 100);

            return () => {
                resizeObserver.disconnect();
                canvas.dispose();
            };
        }
    }, []);

    // Tool Logic
    useEffect(() => {
        if (!fabricCanvas) return;

        fabricCanvas.freeDrawingBrush.color = color;
        fabricCanvas.freeDrawingBrush.width = brushSize;

        if (activeTool === 'pen') {
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = brushSize;
            fabricCanvas.freeDrawingBrush.color = color;
        } else if (activeTool === 'highlighter') {
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = 20; // Thicker for highlighting
            // Create a semi-transparent version of the color (defaulting to yellow if black is selected)
            const highlightColor = color === '#000000' ? 'rgba(255, 255, 0, 0.5)' : color.replace(')', ', 0.5)').replace('rgb', 'rgba');
            // Simple approach: just use fixed yellow 0.5 for now to be safe, or Hex to RGBA conversion
            fabricCanvas.freeDrawingBrush.color = 'rgba(255, 235, 59, 0.4)'; // Material Yellow 500 equivalent with opacity
        } else if (activeTool === 'eraser') {
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.color = '#ffffff'; // Simple eraser
            fabricCanvas.freeDrawingBrush.width = 20;
        } else {
            fabricCanvas.isDrawingMode = false;
        }
    }, [activeTool, color, brushSize, fabricCanvas]);

    const addShape = (shapeType) => {
        if (!fabricCanvas) return;
        setActiveTool(shapeType);
        let shape;

        if (shapeType === 'rectangle') {
            shape = new Rect({
                left: 100, top: 100, fill: 'transparent', stroke: color, strokeWidth: 2, width: 100, height: 100
            });
        } else if (shapeType === 'circle') {
            shape = new Circle({
                left: 100, top: 100, fill: 'transparent', stroke: color, strokeWidth: 2, radius: 50
            });
        }

        if (shape) {
            fabricCanvas.add(shape);
            fabricCanvas.setActiveObject(shape);
        }
    };

    const clearCanvas = () => {
        if (fabricCanvas) {
            fabricCanvas.clear();
            fabricCanvas.setBackgroundColor('#ffffff', fabricCanvas.renderAll.bind(fabricCanvas));
        }
    };

    const saveDrawing = () => {
        if (fabricCanvas) {
            const dataURL = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1
            });
            const link = document.createElement('a');
            link.download = `whiteboard-${Date.now()}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
            {/* Toolbar */}
            <div className="p-2 bg-white border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTool('pen')}
                        className={`p-2 rounded hover:bg-slate-100 ${activeTool === 'pen' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
                        title="Pen"
                    >
                        <Pen size={18} />
                    </button>
                    <button
                        onClick={() => setActiveTool('highlighter')}
                        className={`p-2 rounded hover:bg-slate-100 ${activeTool === 'highlighter' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
                        title="Highlighter"
                    >
                        <Pen size={18} className="opacity-50" />
                    </button>
                    <button
                        onClick={() => setActiveTool('eraser')}
                        className={`p-2 rounded hover:bg-slate-100 ${activeTool === 'eraser' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
                        title="Eraser"
                    >
                        <Eraser size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button
                        onClick={() => addShape('rectangle')}
                        className={`p-2 rounded hover:bg-slate-100 ${activeTool === 'rectangle' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
                        title="Rectangle"
                    >
                        <Square size={18} />
                    </button>
                    <button
                        onClick={() => addShape('circle')}
                        className={`p-2 rounded hover:bg-slate-100 ${activeTool === 'circle' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
                        title="Circle"
                    >
                        <LoaderCircle size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-none"
                    />
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={clearCanvas} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Clear All">
                        <Trash2 size={18} />
                    </button>
                    <button onClick={saveDrawing} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Save Image">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden relative touch-none bg-white">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default Whiteboard;
