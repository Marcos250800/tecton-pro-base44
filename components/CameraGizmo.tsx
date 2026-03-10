import React, { useState, useEffect, useRef } from 'react';
import { Video } from 'lucide-react';

interface CameraGizmoProps {
  azimuth: number;
  elevation: number;
  onChange: (azimuth: number, elevation: number) => void;
}

export const CameraGizmo: React.FC<CameraGizmoProps> = ({ azimuth, elevation, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startValues, setStartValues] = useState({ az: 0, el: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      // Sensitivity: 1 pixel = 0.5 degrees
      const newAz = Math.max(-45, Math.min(45, Math.round(startValues.az + deltaX * 0.5)));
      const newEl = Math.max(-30, Math.min(30, Math.round(startValues.el - deltaY * 0.5)));
      
      onChange(newAz, newEl);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, startValues, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartValues({ az: azimuth, el: elevation });
  };

  return (
    <div className="bg-[#151515] p-4 rounded-lg select-none">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">AI Camera & Scene</span>
      </div>
      
      <div 
        ref={ref}
        onMouseDown={handleMouseDown}
        className="relative w-full aspect-square bg-[#0a0a0a] rounded-lg border border-white/5 cursor-move flex items-center justify-center overflow-hidden group"
      >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />

        {/* 3D Gizmo Container - Rotates with values */}
        <div 
            className="relative w-40 h-40 transition-transform duration-75 ease-out"
            style={{ 
                transform: `perspective(600px) rotateX(${-elevation}deg) rotateY(${azimuth}deg)` 
            }}
        >
            {/* Z-Axis (Green, Up) */}
            <div className="absolute top-1/2 left-1/2 w-0.5 h-20 bg-green-500 origin-bottom -translate-x-1/2 -translate-y-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-green-500 text-[10px] font-bold">Z</div>

            {/* X-Axis (Red, Right) */}
            <div className="absolute top-1/2 left-1/2 w-20 h-0.5 bg-red-500 origin-left -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 translate-x-full -translate-y-1/2 text-red-500 text-[10px] font-bold">Y</div>

            {/* Y-Axis (Blue, Depth) - Visualized as coming towards camera */}
            <div className="absolute top-1/2 left-1/2 w-0.5 h-20 bg-blue-500 origin-top -translate-x-1/2" style={{ transform: 'rotateX(90deg)' }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-blue-500 text-[10px] font-bold" style={{ transform: 'translateZ(100px)' }}>X</div>

            {/* Rings */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-blue-500/30 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ transform: 'rotateX(90deg)' }} />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-red-500/30 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ transform: 'rotateY(90deg)' }} />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-green-500/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

            {/* Camera Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#222] p-1.5 rounded border border-white/20 shadow-lg z-10" style={{ transform: `rotateY(${-azimuth}deg) rotateX(${elevation}deg)` }}>
                <Video size={16} className="text-white" />
            </div>
        </div>

        {/* Hover Hint */}
        <div className="absolute bottom-2 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Drag to Rotate
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-[#222] border border-white/10 rounded p-2">
            <div className="text-[10px] text-gray-500 mb-1">Azimuth</div>
            <div className="text-lg font-mono text-white">{azimuth}°</div>
        </div>
        <div className="bg-[#222] border border-white/10 rounded p-2">
            <div className="text-[10px] text-gray-500 mb-1">Elevation</div>
            <div className="text-lg font-mono text-white">{elevation}°</div>
        </div>
      </div>
    </div>
  );
};
