import React, { useState, useMemo } from 'react';
import { Search, X, Box, Layers, Grid, Database } from 'lucide-react';
import { Material } from '../types';

interface MaterialLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (material: Material) => void;
}

const MOCK_MATERIALS: Material[] = [
  // Concretes
  { id: 'c1', name: 'Fair-Faced Concrete', category: 'concrete', colorCode: '#8c8c8c' },
  { id: 'c2', name: 'Board-Formed Concrete', category: 'concrete', colorCode: '#757575' },
  { id: 'c3', name: 'Polished Concrete', category: 'concrete', colorCode: '#a3a3a3' },
  // Woods
  { id: 'w1', name: 'White Oak', category: 'wood', colorCode: '#d4b595' },
  { id: 'w2', name: 'Charred Cedar (Shou Sugi)', category: 'wood', colorCode: '#2a2624' },
  { id: 'w3', name: 'Warm Walnut', category: 'wood', colorCode: '#6d4c41' },
  // Metals
  { id: 'm1', name: 'Brushed Aluminum', category: 'metal', colorCode: '#cfd8dc' },
  { id: 'm2', name: 'Corten Steel', category: 'metal', colorCode: '#8d6e63' },
  { id: 'm3', name: 'Anodized Bronze', category: 'metal', colorCode: '#5d4037' },
  // Glass
  { id: 'g1', name: 'Low-E Clear Glass', category: 'glass', colorCode: '#e0f7fa' },
  { id: 'g2', name: 'Frosted Glass', category: 'glass', colorCode: '#ffffff' },
  // Stone
  { id: 's1', name: 'Travertine', category: 'stone', colorCode: '#efebe9' },
  { id: 's2', name: 'Black Basalt', category: 'stone', colorCode: '#212121' },
];

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ isOpen, onClose, onSelectMaterial }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', 'concrete', 'wood', 'metal', 'glass', 'stone'];

  const filteredMaterials = useMemo(() => {
    return MOCK_MATERIALS.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filter === 'all' || mat.category === filter;
      return matchesSearch && matchesCategory;
    });
  }, [search, filter]);

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-tecton-bg border-l border-tecton-border flex flex-col shadow-2xl z-20 animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-tecton-border flex items-center justify-between px-4 shrink-0 bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-tecton-accent" />
          <h2 className="font-mono text-sm font-bold tracking-wide">ARCHIVIST LIB</h2>
        </div>
        <button onClick={onClose} className="text-tecton-muted hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-tecton-border">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-3 text-tecton-muted group-focus-within:text-tecton-accent" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-tecton-surface border border-tecton-border rounded px-3 pl-9 py-2 text-sm focus:border-tecton-accent outline-none text-white font-mono placeholder-tecton-muted/50 transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto p-2 gap-2 scrollbar-hide border-b border-tecton-border">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-tecton-accent text-white' 
                : 'bg-tecton-surface text-tecton-muted hover:text-tecton-text hover:bg-tecton-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredMaterials.map(material => (
            <button
              key={material.id}
              onClick={() => onSelectMaterial(material)}
              className="group relative flex flex-col border border-tecton-border rounded-lg overflow-hidden bg-tecton-surface hover:border-tecton-accent transition-all text-left"
            >
              {/* Texture Preview Placeholder */}
              <div 
                className="h-24 w-full relative"
                style={{ backgroundColor: material.colorCode }}
              >
                {/* Technical Overlay Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-tecton-accent text-white text-[10px] px-2 py-1 rounded font-bold">LOAD</span>
                </div>
              </div>
              
              <div className="p-2">
                <div className="text-xs font-medium text-tecton-text group-hover:text-tecton-accent truncate">
                  {material.name}
                </div>
                <div className="text-[10px] text-tecton-muted uppercase mt-0.5 font-mono">
                  {material.category}
                </div>
              </div>
            </button>
          ))}
          
          {filteredMaterials.length === 0 && (
            <div className="col-span-2 text-center py-10 opacity-50">
              <Box size={32} className="mx-auto mb-2" />
              <p className="text-xs font-mono">No assets found</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 border-t border-tecton-border text-[10px] text-center text-tecton-muted font-mono">
        TECTON PRO ASSET DATABASE V1.0
      </div>
    </div>
  );
};