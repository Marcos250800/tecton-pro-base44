import React, { useRef, useState, useEffect } from 'react';
import { Brush, Eraser, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Hand } from 'lucide-react';

export function CanvasEditor({ currentImage, onMaskUpdate }: { currentImage: string | null, onMaskUpdate: (data: string) => void }) {
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const solidMaskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Hidden canvas for opaque mask
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'hand'>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- ZOOM & PAN STATE ---
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // --- RESIZE OBSERVER ---
  useEffect(() => {
    if (!imgRef.current || !maskCanvasRef.current) return;
    const img = imgRef.current;
    const canvas = maskCanvasRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only resize canvas if image loaded natively
        if (width > 0 && height > 0) {
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
      }
    });

    resizeObserver.observe(img);
    return () => resizeObserver.disconnect();
  }, [currentImage]);

  // --- INITIAL LOAD & RESET ---
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (maskCanvasRef.current) {
      maskCanvasRef.current.width = img.naturalWidth;
      maskCanvasRef.current.height = img.naturalHeight;
      
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
      }

      // Initialize Solid Mask Canvas
      if (!solidMaskCanvasRef.current) {
          solidMaskCanvasRef.current = document.createElement('canvas');
      }
      solidMaskCanvasRef.current.width = img.naturalWidth;
      solidMaskCanvasRef.current.height = img.naturalHeight;
      const sCtx = solidMaskCanvasRef.current.getContext('2d');
      if (sCtx) {
          sCtx.lineCap = 'round';
          sCtx.lineJoin = 'round';
      }
    }
    // Reset view on new image
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.1), 5));
  };

  // --- MOUSE WHEEL ZOOM ---
  const handleWheel = (e: React.WheelEvent) => {
    // Simple logic: Wheel = Zoom
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  // --- DRAWING / PANNING LOGIC ---
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!maskCanvasRef.current) return { x: 0, y: 0 };
    
    const rect = maskCanvasRef.current.getBoundingClientRect();
    const scaleX = maskCanvasRef.current.width / rect.width;
    const scaleY = maskCanvasRef.current.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX, // Internal Canvas X
      y: (clientY - rect.top) * scaleY   // Internal Canvas Y
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (activeTool === 'hand') {
        setIsPanning(true);
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        dragStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
        return;
    }

    // Only draw if target is the canvas (handled by pointer-events in CSS or structure)
    // Here we attach handler to parent, so check target? 
    // Actually simpler: if not hand, we attempt draw. getCoordinates relies on canvas rect.
    
    // Check if we clicked on the canvas/image area effectively
    if (!maskCanvasRef.current) return;

    // Drawing Logic
    const coords = getCoordinates(e);
    setIsDrawing(true);
    const ctx = maskCanvasRef.current?.getContext('2d');
    const sCtx = solidMaskCanvasRef.current?.getContext('2d');

    if (ctx && sCtx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      
      sCtx.beginPath();
      sCtx.moveTo(coords.x, coords.y);
      
      draw(e);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
        setIsPanning(false);
        return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    
    const ctx = maskCanvasRef.current?.getContext('2d');
    const sCtx = solidMaskCanvasRef.current?.getContext('2d');

    if (ctx && sCtx) {
      ctx.closePath();
      sCtx.closePath();
      if (solidMaskCanvasRef.current) onMaskUpdate(solidMaskCanvasRef.current.toDataURL());
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isPanning) {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        setPan({
            x: clientX - dragStartRef.current.x,
            y: clientY - dragStartRef.current.y
        });
        return;
    }

    if(isDrawing) draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !maskCanvasRef.current || !solidMaskCanvasRef.current || activeTool === 'hand') return;
    
    const { x, y } = getCoordinates(e);
    const ctx = maskCanvasRef.current.getContext('2d');
    const sCtx = solidMaskCanvasRef.current.getContext('2d');

    if (!ctx || !sCtx) return;

    ctx.lineWidth = brushSize; 
    sCtx.lineWidth = brushSize;
    
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      sCtx.globalCompositeOperation = 'destination-out';
    } else {
      // Visible Canvas (Semi-transparent)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; 
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';

      // Solid Mask Canvas (Opaque)
      sCtx.globalCompositeOperation = 'source-over';
      sCtx.fillStyle = 'rgba(255, 0, 0, 1)'; 
      sCtx.strokeStyle = 'rgba(255, 0, 0, 1)';
    }

    // Draw on Visible
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Draw on Solid
    sCtx.lineTo(x, y);
    sCtx.stroke();
    sCtx.beginPath();
    sCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.beginPath();
    sCtx.moveTo(x, y);
  };

  return (
    <div 
        className="relative w-full h-full flex items-center justify-center bg-[#111] overflow-hidden cursor-default" 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleMouseMove}
    >
      
      {currentImage ? (
        <div 
            className="relative transition-transform duration-75 ease-out origin-center"
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                cursor: activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'
            }}
        >
          {/* BASE IMAGE */}
          <img 
            ref={imgRef}
            src={currentImage} 
            alt="Render" 
            onLoad={handleImageLoad}
            className="block max-w-[80vw] max-h-[80vh] w-auto h-auto object-contain pointer-events-none select-none shadow-2xl"
            draggable={false}
          />
          
          {/* DRAWING CANVAS LAYER */}
          <canvas
            ref={maskCanvasRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 touch-none"
          />
        </div>
      ) : (
        <div className="text-gray-500 flex flex-col items-center select-none">
          <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
          <p>Waiting for render...</p>
        </div>
      )}

      {/* --- FLOATING TOOLBAR --- */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-[#222]/90 backdrop-blur-sm p-2 rounded-full border border-[#444] shadow-2xl z-40 animate-in slide-in-from-top-4 select-none">
        
        {/* Draw Tools */}
        <div className="flex gap-2 pr-2 border-r border-gray-600">
            <button 
                onClick={() => setActiveTool('brush')} 
                className={`p-2 rounded-full transition-all ${activeTool === 'brush' ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                title="Brush Tool (Draw Mask)"
            >
                <Brush size={18}/>
            </button>
            
            <button 
                onClick={() => setActiveTool('eraser')} 
                className={`p-2 rounded-full transition-all ${activeTool === 'eraser' ? 'bg-red-600 text-white scale-110 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                title="Eraser Tool"
            >
                <Eraser size={18}/>
            </button>

            <button 
                onClick={() => setActiveTool('hand')} 
                className={`p-2 rounded-full transition-all ${activeTool === 'hand' ? 'bg-tecton-accent text-white scale-110 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                title="Pan / Move Tool"
            >
                <Hand size={18}/>
            </button>
        </div>

        {/* View Controls */}
        <div className="flex gap-1 items-center pl-2">
            <button 
                onClick={() => handleZoom(-0.25)} 
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                title="Zoom Out"
            >
                <ZoomOut size={18}/>
            </button>
            
            <span className="text-[10px] font-mono w-8 text-center text-gray-400 select-none">
                {Math.round(scale * 100)}%
            </span>

            <button 
                onClick={() => handleZoom(0.25)} 
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                title="Zoom In"
            >
                <ZoomIn size={18}/>
            </button>

            <button 
                onClick={handleResetView} 
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                title="Reset View"
            >
                <Maximize size={16}/>
            </button>
        </div>
      </div>
      
      {/* Brush Size (Only show if drawing tools active) */}
      {(activeTool === 'brush' || activeTool === 'eraser') && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-[#222]/80 backdrop-blur-sm px-4 py-1 rounded-full border border-[#444] animate-in fade-in zoom-in-95 select-none">
             <input 
                type="range" min="10" max="300" 
                value={brushSize} 
                onChange={(e) => setBrushSize(Number(e.target.value))} 
                className="w-24 accent-blue-500 cursor-pointer align-middle"
                title={`Brush Size: ${brushSize}px`}
            />
        </div>
      )}

    </div>
  );
}