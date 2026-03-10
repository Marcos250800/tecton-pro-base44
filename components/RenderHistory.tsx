import React from 'react';
import { Clock, CheckCircle2, GitCompare, History } from 'lucide-react';
import { RenderVersion } from '../types';

interface RenderHistoryProps {
  history: RenderVersion[];
  currentVersionId: string | null;
  onSelectVersion: (version: RenderVersion) => void;
  isCompareMode: boolean;
  compareSelection: [string | null, string | null];
}

export const RenderHistory: React.FC<RenderHistoryProps> = ({
  history,
  currentVersionId,
  onSelectVersion,
  isCompareMode,
  compareSelection
}) => {
  if (history.length === 0) return null;

  return (
    <div className="h-28 bg-[#1e1e1e] border-t border-tecton-border flex flex-col shrink-0">
      <div className="h-8 px-4 flex items-center justify-between border-b border-tecton-border bg-tecton-bg">
        <div className="flex items-center gap-2 text-tecton-muted">
          <History size={14} />
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Timeline / Version Control</span>
        </div>
        {isCompareMode && (
          <div className="flex items-center gap-2 text-tecton-accent animate-pulse">
            <GitCompare size={14} />
            <span className="text-[10px] font-mono">SELECT 2 VERSIONS TO COMPARE</span>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-x-auto flex items-center px-4 gap-3 py-2 custom-scrollbar">
        {history.map((version, index) => {
          const isSelected = currentVersionId === version.id;
          const isCompareA = compareSelection[0] === version.id;
          const isCompareB = compareSelection[1] === version.id;

          let borderClass = 'border-tecton-border opacity-60 hover:opacity-100';
          if (isCompareMode) {
             if (isCompareA) borderClass = 'border-tecton-accent ring-2 ring-tecton-accent ring-opacity-50 opacity-100';
             else if (isCompareB) borderClass = 'border-white ring-2 ring-white ring-opacity-50 opacity-100';
             else borderClass = 'border-tecton-border opacity-40 hover:opacity-80';
          } else if (isSelected) {
            borderClass = 'border-tecton-accent ring-1 ring-tecton-accent opacity-100';
          }

          return (
            <button
              key={version.id}
              onClick={() => onSelectVersion(version)}
              className={`relative group flex-shrink-0 h-16 w-24 rounded overflow-hidden border-2 transition-all ${borderClass}`}
            >
              {version.imageUrl ? (
                <img 
                  src={version.imageUrl} 
                  alt={`Version ${index}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-tecton-bg flex items-center justify-center text-tecton-muted text-[8px] italic p-1 text-center">
                  Expired
                </div>
              )}
              
              {/* Overlay Info */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                 <span className="text-[8px] text-white font-mono text-center leading-tight line-clamp-2">
                   {version.prompt}
                 </span>
              </div>

              {/* Timestamp Badge */}
              <div className="absolute bottom-0 right-0 bg-black/80 px-1 py-0.5 rounded-tl">
                <span className="text-[8px] font-mono text-white">
                  {version.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Selection Badges */}
              {isCompareMode && isCompareA && (
                <div className="absolute top-0 left-0 bg-tecton-accent text-white px-1.5 py-0.5 text-[10px] font-bold">A</div>
              )}
              {isCompareMode && isCompareB && (
                <div className="absolute top-0 right-0 bg-white text-black px-1.5 py-0.5 text-[10px] font-bold">B</div>
              )}
            </button>
          );
        })}
        <div className="w-4 flex-shrink-0" />
      </div>
    </div>
  );
};