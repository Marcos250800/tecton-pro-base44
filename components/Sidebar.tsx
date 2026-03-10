import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, Settings, Trash2, Edit2, X, FolderOpen, ChevronUp, ChevronDown, MapPin, Cloud, Layout, Clock, TreePine, Search, PenTool, Layers, Box, Folder, Sparkles, Paperclip, AlertCircle, Save, Palette, Image as ImageIcon, RefreshCw, Key, Rotate3d
} from 'lucide-react';
import { Project, ChatMessage, ProjectContext, Material, ChatAttachment, ImageRole } from '../types';
import { enhanceArchitecturalPrompt } from '../services/geminiService';
import { CameraGizmo } from './CameraGizmo';

// --- CITY DATABASE FOR AUTOCOMPLETE ---
interface CityData {
  name: string;
  biome: string;
  defaultWeather: string;
  defaultStyle: string;
}

const CITIES_DB: CityData[] = [
  // NEUTRAL OPTION
  { name: "⚡ None (Use Chat)", biome: "", defaultWeather: "", defaultStyle: "" },

  // North America
  { name: "New York, USA", biome: "Urban deciduous, concrete jungle, central park greenery", defaultWeather: "Overcast", defaultStyle: "Modern Steel & Glass" },
  { name: "Los Angeles, USA", biome: "Semi-arid, palm trees, succulents, warm smog", defaultWeather: "Golden Hour", defaultStyle: "Mid-Century Modern" },
  { name: "Chicago, USA", biome: "Continental urban, riverwalk, steel bridges", defaultWeather: "Windy Clear", defaultStyle: "Miesian Steel" },
  { name: "San Francisco, USA", biome: "Coastal fog, hilly terrain, victorian houses", defaultWeather: "Foggy", defaultStyle: "Bay Window Classic" },
  { name: "Miami, USA", biome: "Tropical coastal, lush palms, art deco colors", defaultWeather: "Bright Sun", defaultStyle: "White Stucco" },
  { name: "Seattle, USA", biome: "Pacific Northwest, evergreens, wet ferns", defaultWeather: "Drizzle", defaultStyle: "Timber & Glass" },
  { name: "Vancouver, Canada", biome: "Coastal rainforest, mountains, douglas fir", defaultWeather: "Rainy", defaultStyle: "Glass & Cedar" },
  { name: "Toronto, Canada", biome: "Urban continental, maple trees, lakefront", defaultWeather: "Cold Clear", defaultStyle: "Modern High-rise" },
  { name: "Mexico City, Mexico", biome: "Highland plateau, jacaranda trees, tropical urban", defaultWeather: "Warm Afternoon", defaultStyle: "Brutalist Color" },
  
  // South America
  { name: "Sao Paulo, Brazil", biome: "Tropical urban, atlantic forest remnants, concrete", defaultWeather: "Humid Overcast", defaultStyle: "Raw Brutalist" },
  { name: "Rio de Janeiro, Brazil", biome: "Tropical coastal, mountains, lush rainforest", defaultWeather: "Bright Sun", defaultStyle: "Modernist Concrete" },
  { name: "Buenos Aires, Argentina", biome: "Temperate estuary, jacaranda trees, flat terrain", defaultWeather: "Sunny", defaultStyle: "Beaux-Arts & Modern" },
  { name: "Santiago, Chile", biome: "Mediterranean, andes mountains backdrop", defaultWeather: "Dry Haze", defaultStyle: "Contemporary Glass" },
  { name: "Bogota, Colombia", biome: "High altitude andean, cool lush vegetation", defaultWeather: "Cloudy", defaultStyle: "Brick & Concrete" },
  { name: "Lima, Peru", biome: "Coastal desert, grey sky, cliffs", defaultWeather: "Grey Overcast", defaultStyle: "Coastal Concrete" },

  // Europe
  { name: "London, UK", biome: "Temperate maritime, wet pavement, plane trees", defaultWeather: "Rainy & Foggy", defaultStyle: "Brick & Portland Stone" },
  { name: "Paris, France", biome: "Temperate, manicured gardens, limestone", defaultWeather: "Soft White Sky", defaultStyle: "Haussmann Classic" },
  { name: "Berlin, Germany", biome: "Continental temperate, linden trees, urban grit", defaultWeather: "Grey Overcast", defaultStyle: "Industrial Bauhaus" },
  { name: "Madrid, Spain", biome: "Dry continental, clear light, pine trees", defaultWeather: "Bright Blue Sky", defaultStyle: "Brick & Stone" },
  { name: "Barcelona, Spain", biome: "Mediterranean, mediterranean pines, warm stone", defaultWeather: "Sunny", defaultStyle: "Warm Stone & Tile" },
  { name: "Rome, Italy", biome: "Mediterranean, umbrella pines, ancient ruins", defaultWeather: "Warm Golden", defaultStyle: "Classical Travertine" },
  { name: "Milan, Italy", biome: "Urban industrial, vertical forests, fog", defaultWeather: "Hazy", defaultStyle: "Modern Italian" },
  { name: "Venice, Italy", biome: "Lagoon, water canals, no vegetation", defaultWeather: "Mist", defaultStyle: "Gothic & Byzantine" },
  { name: "Amsterdam, Netherlands", biome: "Maritime, canals, elm trees, brick", defaultWeather: "Variable Cloud", defaultStyle: "Brick Expressionism" },
  { name: "Copenhagen, Denmark", biome: "Nordic coastal, flat light, minimal vegetation", defaultWeather: "Cool Overcast", defaultStyle: "Brick & Wood" },
  { name: "Oslo, Norway", biome: "Fjord coastal, pine forests, rocky", defaultWeather: "Cold Blue", defaultStyle: "Contemporary Timber" },
  { name: "Stockholm, Sweden", biome: "Archipelago, birch trees, water", defaultWeather: "Clear Crisp", defaultStyle: "Nordic Classicism" },
  { name: "Reykjavik, Iceland", biome: "Subarctic, volcanic rock, moss, no tall trees", defaultWeather: "Cold Blue Sky", defaultStyle: "Minimal Nordic" },
  { name: "Zurich, Switzerland", biome: "Alpine foothills, lake, clean streets", defaultWeather: "Fresh", defaultStyle: "Precision Concrete" },
  { name: "Vienna, Austria", biome: "Continental, parks, imperial scale", defaultWeather: "Soft Sun", defaultStyle: "Secessionist" },
  { name: "Athens, Greece", biome: "Mediterranean dry, olive trees, marble dust", defaultWeather: "Harsh Sun", defaultStyle: "Neoclassical & Concrete" },
  { name: "Istanbul, Turkey", biome: "Bosphorus hills, cypress trees, minarets", defaultWeather: "Hazy Gold", defaultStyle: "Byzantine & Modern" },
  { name: "Moscow, Russia", biome: "Continental taiga, wide avenues, snow", defaultWeather: "Winter Grey", defaultStyle: "Stalinist Empire" },

  // Asia / Middle East
  { name: "Tokyo, Japan", biome: "Dense urban, cherry blossoms, gingko trees", defaultWeather: "Hazy Sun", defaultStyle: "Contemporary Concrete" },
  { name: "Kyoto, Japan", biome: "Mountainous temperate, moss, japanese maple, bamboo", defaultWeather: "Soft Overcast", defaultStyle: "Traditional Timber & Concrete" },
  { name: "Osaka, Japan", biome: "Urban mercantile, neon reflections, rivers", defaultWeather: "Night", defaultStyle: "Metabolic" },
  { name: "Seoul, South Korea", biome: "Mountainous urban, granite, pine", defaultWeather: "Clear", defaultStyle: "High-tech Glass" },
  { name: "Beijing, China", biome: "Continental, willow trees, smog/haze", defaultWeather: "Hazy", defaultStyle: "Monumental" },
  { name: "Shanghai, China", biome: "River delta, humidity, plane trees", defaultWeather: "Humid", defaultStyle: "Futuristic Skyline" },
  { name: "Hong Kong", biome: "Subtropical steep hills, banyan trees, dense", defaultWeather: "Humid Mist", defaultStyle: "Vertical Concrete" },
  { name: "Singapore", biome: "Tropical rainforest, lush vertical gardens, humidity", defaultWeather: "Monsoon Clouds", defaultStyle: "Green Architecture" },
  { name: "Bangkok, Thailand", biome: "Tropical river plains, humid, palms", defaultWeather: "Hot Haze", defaultStyle: "Tropical Modern" },
  { name: "Mumbai, India", biome: "Coastal tropical, humidity, art deco", defaultWeather: "Monsoon", defaultStyle: "Indo-Saracenic" },
  { name: "New Delhi, India", biome: "Semi-arid plains, neem trees, dust", defaultWeather: "Hazy Sun", defaultStyle: "Lutyens Red Sandstone" },
  { name: "Dubai, UAE", biome: "Arid desert, palm trees, sand dust atmosphere", defaultWeather: "Harsh Sun", defaultStyle: "Futuristic Glass" },
  { name: "Riyadh, Saudi Arabia", biome: "Desert plateau, wadis, date palms", defaultWeather: "Clear Hot", defaultStyle: "Modern Najdi" },
  { name: "Tel Aviv, Israel", biome: "Mediterranean coastal, bauhaus white city", defaultWeather: "Bright Sun", defaultStyle: "Bauhaus White" },

  // Africa
  { name: "Cairo, Egypt", biome: "Desert river valley, dust, palms", defaultWeather: "Warm Haze", defaultStyle: "Islamic & Modern" },
  { name: "Marrakech, Morocco", biome: "Semi-arid, olive trees, terracotta earth", defaultWeather: "Warm Sun", defaultStyle: "Earth Tones & Plaster" },
  { name: "Cape Town, South Africa", biome: "Fynbos shrubland, coastal mountains", defaultWeather: "Windy Clear", defaultStyle: "Cape Modern" },
  { name: "Lagos, Nigeria", biome: "Tropical lagoon, humidity, density", defaultWeather: "Humid", defaultStyle: "Tropical Concrete" },
  { name: "Nairobi, Kenya", biome: "Highland savannah, acacia, red earth", defaultWeather: "Pleasant Sun", defaultStyle: "Afro-Modernism" },

  // Oceania
  { name: "Sydney, Australia", biome: "Coastal temperate, eucalyptus, bright sun", defaultWeather: "Clear Blue Sky", defaultStyle: "Coastal Modern" },
  { name: "Melbourne, Australia", biome: "Temperate variable, plane trees, bluestone", defaultWeather: "Variable", defaultStyle: "Victorian & Modern" },
];

// --- PRESET DEFINITIONS ---
const NONE_OPTION = { value: "", label: "⚡ None (Use Chat)", desc: "Ignore this setting, use chat prompt only" };
const RANDOM_OPTION = { value: "🎲 Random / Auto", label: "🎲 Random / Auto", desc: "Let AI decide based on prompt" };

const WEATHER_PRESETS = [
  NONE_OPTION,
  RANDOM_OPTION,
  { value: "Clear Sunny", label: "Clear Sunny", desc: "Hard shadows, high contrast" },
  { value: "Overcast & Soft", label: "Overcast & Soft", desc: "Museum light, diffuse, ideal for materials" },
  { value: "Rainy & Reflective", label: "Rainy & Reflective", desc: "Wet ground, dramatic reflections" },
  { value: "Snowy Winter", label: "Snowy Winter", desc: "Cold white light, white environment" },
  { value: "Foggy/Misty", label: "Foggy/Misty", desc: "Atmospheric depth, mysterious" }
];

const STYLE_PRESETS = [
  NONE_OPTION,
  RANDOM_OPTION,
  { value: "Minimalist Contemporary", label: "Minimalist Contemporary", desc: "White, glass, clean lines" },
  { value: "Brutalist Concrete", label: "Brutalist Concrete", desc: "Raw concrete, heavy, monumental" },
  { value: "Japandi / Zen", label: "Japandi / Zen", desc: "Light wood, plants, balanced" },
  { value: "Biophilic Design", label: "Biophilic Design", desc: "Integrated vegetation, organic forms" },
  { value: "Industrial Loft", label: "Industrial Loft", desc: "Exposed brick, black metal" },
  { value: "Parametric / Zaha Style", label: "Parametric / Zaha Style", desc: "Fluid curves, futuristic" }
];

const TIME_PRESETS = [
  NONE_OPTION,
  RANDOM_OPTION,
  { value: "High Noon", label: "High Noon", desc: "12:00 PM - Strong zenith light" },
  { value: "Golden Hour", label: "Golden Hour", desc: "Sunset, warm long shadows" },
  { value: "Blue Hour", label: "Blue Hour", desc: "Post-sunset, artificial lights glow" },
  { value: "Midnight", label: "Midnight", desc: "Darkness, artificial lighting only" }
];


// --- REUSABLE SMART COMBOBOX COMPONENT ---
interface SmartComboboxProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string, label: string, desc: string }[];
  placeholder?: string;
  icon?: any;
}

const SmartCombobox: React.FC<SmartComboboxProps> = ({ label, value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(value.toLowerCase()) || 
    opt.desc.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-xs text-tecton-muted uppercase font-mono">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className={`w-full bg-tecton-surface border rounded px-3 py-2 text-sm outline-none pl-8 font-medium placeholder-tecton-muted/50 transition-colors ${value.includes('Random') ? 'text-yellow-400 border-yellow-400/30' : value === '' ? 'border-tecton-border italic text-tecton-muted' : 'text-white border-tecton-border focus:border-tecton-accent'}`}
          placeholder={placeholder || "Select or type..."}
        />
        {Icon && <Icon size={14} className="absolute left-2.5 top-2.5 text-tecton-muted" />}
        <ChevronDown size={12} className={`absolute right-3 top-3 text-tecton-muted transition-transform ${isOpen ? 'rotate-180' : ''} pointer-events-none`} />
        
        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-tecton-surface border border-tecton-border rounded shadow-xl max-h-56 overflow-y-auto z-[60] animate-in fade-in zoom-in-95">
             {/* Custom Option if no exact match */}
             {value && !options.some(opt => opt.value.toLowerCase() === value.toLowerCase()) && (
               <button
                 onClick={() => { onChange(value); setIsOpen(false); }}
                 className="w-full text-left px-3 py-2 hover:bg-tecton-accent hover:text-white transition-colors group border-b border-white/5 bg-tecton-accent/10"
               >
                 <div className="text-sm font-medium flex items-center gap-2">
                   <PenTool size={12} /> Use custom: "{value}"
                 </div>
               </button>
             )}

             {filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-tecton-accent hover:text-white transition-colors group border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${opt.value.includes('Random') ? 'text-yellow-400' : opt.value === '' ? 'text-tecton-muted italic' : 'text-tecton-text'}`}>{opt.label}</span>
                    {/* {value === opt.value && <Check size={12} className="text-tecton-accent group-hover:text-white" />} */}
                  </div>
                  <div className="text-[10px] text-tecton-muted group-hover:text-blue-100 italic">
                    {opt.desc}
                  </div>
                </button>
             ))}

             {filteredOptions.length === 0 && !value && (
               <div className="p-3 text-[10px] text-tecton-muted text-center italic">Start typing to create custom...</div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

interface SidebarProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, attachments: ChatAttachment[]) => void;
  isProcessing: boolean;
  projectContext: ProjectContext;
  onUpdateContext: (ctx: ProjectContext) => void;
  selectedMaterial: Material | null;
  onClearMaterial: () => void;
  negativePrompt: string;
  onUpdateNegativePrompt: (text: string) => void;
  projects: Project[];
  activeProjectId: string;
  onNewProject: () => void;
  onSwitchProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onFactoryReset: () => void;
  inputMode: 'sketch' | '3d';
  setInputMode: (mode: 'sketch' | '3d') => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onPerspectiveShift: (azimuth: number, elevation: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  chatHistory, 
  onSendMessage, 
  isProcessing,
  projectContext,
  onUpdateContext,
  selectedMaterial,
  onClearMaterial,
  negativePrompt,
  onUpdateNegativePrompt,
  projects,
  activeProjectId,
  onNewProject,
  onSwitchProject,
  onDeleteProject,
  onRenameProject,
  onFactoryReset,
  inputMode,
  setInputMode,
  apiKey,
  setApiKey,
  onPerspectiveShift
}) => {
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isInputModeOpen, setIsInputModeOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  // Perspective Shift State
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState(false);
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(0);
  
  // Style Transfer State
  const [styleAttachment, setStyleAttachment] = useState<ChatAttachment | null>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  
  // Context Edit State
  const [tempContext, setTempContext] = useState<ProjectContext>(projectContext);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Project Rename State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Auto-grow Textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  useEffect(() => {
    setTempContext(projectContext);
    setLocationSearch(projectContext.location);
  }, [projectContext, isContextModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || pendingAttachments.length > 0 || styleAttachment) && !isProcessing) {
      // Merge normal attachments with the specialized Style Transfer attachment
      const allAttachments = [...pendingAttachments];
      if (styleAttachment) {
        allAttachments.push(styleAttachment);
      }
      
      onSendMessage(input, allAttachments);
      
      setInput('');
      setPendingAttachments([]);
      setStyleAttachment(null);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim()) return;
    setIsEnhancing(true);
    const enhanced = await enhanceArchitecturalPrompt(input);
    setInput(enhanced);
    setIsEnhancing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            const isFirst = pendingAttachments.length === 0 && i === 0;
            const defaultRole: ImageRole = isFirst ? 'sketch' : 'material';

            const newAttachment: ChatAttachment = {
              id: Date.now().toString() + Math.random().toString(),
              url: ev.target.result as string,
              role: defaultRole,
              file: file
            };
            setPendingAttachments(prev => [...prev, newAttachment]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleStyleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newAttachment: ChatAttachment = {
            id: 'style-' + Date.now(),
            url: ev.target.result as string,
            role: 'style', // Explicit Role
            file: file
          };
          setStyleAttachment(newAttachment);
        }
      };
      reader.readAsDataURL(file);
    }
    if (styleInputRef.current) styleInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const updateAttachmentRole = (id: string, newRole: ImageRole) => {
    setPendingAttachments(prev => prev.map(a => a.id === id ? { ...a, role: newRole } : a));
  };

  const handleSaveContext = () => {
    const finalContext = { ...tempContext, location: locationSearch };
    onUpdateContext(finalContext);
    setIsContextModalOpen(false);
  };

  const handleCitySelect = (city: CityData) => {
    // If "None" is selected, clear everything
    if (city.name.includes("None (Use Chat)")) {
        setLocationSearch("");
        setTempContext({ ...tempContext, location: "", biome: "" });
        setShowLocationDropdown(false);
        return;
    }

    setLocationSearch(city.name);
    
    // Auto-fill logic
    const newContext = { ...tempContext, location: city.name, biome: city.biome };
    
    if (!tempContext.weather || tempContext.weather.includes("Random") || tempContext.weather === "Overcast") {
      newContext.weather = city.defaultWeather;
    }
    if (!tempContext.style || tempContext.style.includes("Random") || tempContext.style === "Modern") {
      newContext.style = city.defaultStyle;
    }

    setTempContext(newContext);
    setShowLocationDropdown(false);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationSearch(val);
    setShowLocationDropdown(true);

    const match = CITIES_DB.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (match) {
        setTempContext(prev => ({ ...prev, biome: match.biome }));
    } else {
        setTempContext(prev => ({ ...prev, biome: '' }));
    }
  };

  const filteredCities = CITIES_DB.filter(c => 
    c.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const getRoleBadge = (role: ImageRole) => {
    switch (role) {
      case 'sketch': return { color: 'bg-blue-500/20 text-blue-300 border-blue-500/50', label: 'SKETCH', icon: PenTool };
      case 'material': return { color: 'bg-orange-500/20 text-orange-300 border-orange-500/50', label: 'MATERIAL', icon: Layers };
      case 'object': return { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', label: 'OBJECT', icon: Box };
      case 'style': return { color: 'bg-purple-500/20 text-purple-300 border-purple-500/50', label: 'STYLE', icon: Palette };
    }
  };

  const activeProjectName = projects.find(p => p.id === activeProjectId)?.name || "Untitled Project";

  // --- DELETE HANDLER (MOUSEDOWN FIX) ---
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteProject(id);
  };

  return (
    <div className="w-96 bg-tecton-bg border-r border-tecton-border flex flex-col h-full z-20 relative shrink-0 shadow-2xl">
      
      {/* Header */}
      <div className="h-16 border-b border-tecton-border flex items-center px-6 shrink-0 justify-between bg-[#1e1e1e]">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-tecton-accent rounded-sm mr-3"></div>
          <h1 className="font-sans font-bold text-lg tracking-tight">TECTON <span className="text-tecton-accent">PRO</span></h1>
        </div>
        <div className="flex items-center gap-3">

            <button 
              onClick={() => setIsKeyModalOpen(true)}
              className={`transition-colors ${apiKey ? 'text-tecton-accent' : 'text-tecton-muted hover:text-white'}`}
              title="Set API Key"
            >
              <Key size={18} />
            </button>
            <button 
              onClick={onFactoryReset}
              className="text-tecton-muted hover:text-white transition-colors"
              title="Reset App State"
            >
              <RefreshCw size={18} />
            </button>
        </div>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="absolute inset-0 z-[60] bg-tecton-bg/95 backdrop-blur-sm p-6 animate-in fade-in duration-200 flex flex-col justify-center items-center">
            <div className="w-full max-w-xs bg-[#1e1e1e] border border-tecton-border rounded-lg p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                        <Key size={14} className="text-tecton-accent"/> API KEY
                    </h3>
                    <button onClick={() => setIsKeyModalOpen(false)}><X size={16} className="text-tecton-muted hover:text-white" /></button>
                </div>
                <p className="text-xs text-tecton-muted mb-4 leading-relaxed">
                    Enter your Gemini API Key. If left empty, the app will try to use the environment variable.
                </p>
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-black border border-tecton-border rounded px-3 py-2 text-xs text-white focus:border-tecton-accent outline-none mb-4 font-mono"
                />
                <button 
                    onClick={() => setIsKeyModalOpen(false)}
                    className="w-full bg-tecton-accent hover:bg-tecton-accentHover text-white py-2 rounded text-xs font-bold transition-colors"
                >
                    SAVE KEY
                </button>
            </div>
        </div>
      )}

      {/* Project Management Section */}
      <div className="border-b border-tecton-border shrink-0 bg-[#191919]">
         <div 
           className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-tecton-surface transition-colors"
           onClick={() => setIsProjectsOpen(!isProjectsOpen)}
         >
            <div className="flex items-center gap-2 overflow-hidden">
               <FolderOpen size={14} className="text-tecton-accent" />
               <span className="font-mono text-sm font-bold truncate max-w-[160px]">{activeProjectName}</span>
            </div>
            <div className="flex items-center gap-2">
               {isProjectsOpen ? <ChevronUp size={14} className="text-tecton-muted" /> : <ChevronDown size={14} className="text-tecton-muted" />}
            </div>
         </div>

         {isProjectsOpen && (
           <div className="border-t border-tecton-border bg-[#151515] animate-in slide-in-from-top-2">
             <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {projects.map(project => (
                  <div 
                    key={project.id} 
                    className={`group flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${project.id === activeProjectId ? 'bg-tecton-accent/10 border border-tecton-accent/30' : 'hover:bg-tecton-surface border border-transparent'}`}
                  >
                     <div 
                       className="flex items-center gap-3 flex-grow cursor-pointer overflow-hidden mr-2"
                       onClick={() => onSwitchProject(project.id)}
                     >
                       <Folder size={12} className={project.id === activeProjectId ? 'text-tecton-accent' : 'text-tecton-muted'} />
                       {editingProjectId === project.id ? (
                          <input 
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => { onRenameProject(project.id, editingName); setEditingProjectId(null); }}
                            onKeyDown={(e) => { if(e.key === 'Enter') { onRenameProject(project.id, editingName); setEditingProjectId(null); } }}
                            className="bg-black text-white px-1 w-full outline-none border border-tecton-accent/50 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                       ) : (
                          <span 
                            className={`font-mono truncate ${project.id === activeProjectId ? 'text-white font-bold' : 'text-tecton-muted group-hover:text-tecton-text'}`}
                            onDoubleClick={() => { setEditingProjectId(project.id); setEditingName(project.name); }}
                            title="Double click to rename"
                          >
                            {project.name}
                          </span>
                       )}
                     </div>

                     {editingProjectId !== project.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setEditingProjectId(project.id); 
                                    setEditingName(project.name); 
                                }}
                                className="p-1 hover:bg-white/10 text-tecton-muted hover:text-white rounded transition-colors"
                                title="Rename"
                            >
                                <Edit2 size={12} />
                            </button>
                            {/* DELETE BUTTON FIXED */}
                            <button 
                                onClick={(e) => handleDeleteClick(e, project.id)}
                                className="p-1 hover:bg-red-900/30 text-tecton-muted hover:text-red-400 rounded transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                     )}
                  </div>
                ))}
             </div>
             <button 
               onClick={onNewProject}
               className="w-full flex items-center justify-center gap-2 py-3 border-t border-tecton-border text-xs text-tecton-accent hover:bg-tecton-accent/10 transition-colors font-bold font-mono"
             >
                <Plus size={14} /> NEW PROJECT
             </button>
           </div>
         )}
      </div>

      {/* Project Context */}
      <div className="p-6 border-b border-tecton-border shrink-0 bg-[#1e1e1e]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-tecton-muted uppercase tracking-wider">Context Settings</h2>
          <button onClick={() => setIsContextModalOpen(true)} className="text-tecton-muted hover:text-tecton-accent" title="Edit Context">
            <Settings size={14} />
          </button>
        </div>
        <div className="space-y-3 opacity-90">
          <div className="flex items-center text-sm text-tecton-text"><MapPin size={14} className="mr-3 text-tecton-accent opacity-70" /><span className="truncate">{projectContext.location || <span className="text-tecton-muted italic">Use Chat</span>}</span></div>
          <div className="flex items-center text-sm text-tecton-text"><Cloud size={14} className="mr-3 text-tecton-accent opacity-70" /><span className="truncate">{projectContext.weather || <span className="text-tecton-muted italic">Use Chat</span>}</span></div>
          <div className="flex items-center text-sm text-tecton-text"><Layout size={14} className="mr-3 text-tecton-accent opacity-70" /><span className="truncate">{projectContext.style || <span className="text-tecton-muted italic">Use Chat</span>}</span></div>
          <div className="flex items-center text-sm text-tecton-text"><Clock size={14} className="mr-3 text-tecton-accent opacity-70" /><span className="truncate">{projectContext.timeOfDay || <span className="text-tecton-muted italic">Use Chat</span>}</span></div>
          {projectContext.biome && (
             <div className="flex items-center text-xs text-tecton-muted italic"><TreePine size={12} className="mr-3 opacity-50" /><span className="truncate">{projectContext.biome}</span></div>
          )}
        </div>
      </div>

      {/* Perspective Shift Tool */}
      <div className="border-b border-tecton-border shrink-0 bg-[#191919]">
         <div 
           className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-tecton-surface transition-colors"
           onClick={() => setIsPerspectiveOpen(!isPerspectiveOpen)}
         >
            <div className="flex items-center gap-2">
               <Rotate3d size={14} className="text-tecton-accent" />
               <span className="font-mono text-sm font-bold">3D RE-PROJECTION</span>
            </div>
            <div className="flex items-center gap-2">
               {isPerspectiveOpen ? <ChevronUp size={14} className="text-tecton-muted" /> : <ChevronDown size={14} className="text-tecton-muted" />}
            </div>
         </div>

         {isPerspectiveOpen && (
           <div className="px-6 py-4 border-t border-tecton-border bg-[#151515] animate-in slide-in-from-top-2 space-y-4">
              <p className="text-[10px] text-tecton-muted leading-relaxed">
                  Simulate a 3D camera move within the generated image. Maintains geometry and lighting consistency.
              </p>
              
              <CameraGizmo 
                azimuth={azimuth} 
                elevation={elevation} 
                onChange={(az, el) => {
                    setAzimuth(az);
                    setElevation(el);
                }} 
              />

              <button 
                onClick={() => onPerspectiveShift(azimuth, elevation)}
                disabled={isProcessing}
                className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors ${isProcessing ? 'bg-tecton-surface text-tecton-muted cursor-wait' : 'bg-tecton-accent hover:bg-tecton-accentHover text-white'}`}
              >
                 {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Rotate3d size={14} />}
                 GENERAR VISTA
              </button>
           </div>
         )}
      </div>

      {/* Context Modal */}
      {isContextModalOpen && (
        <div className="absolute inset-0 z-50 bg-tecton-bg/95 backdrop-blur-sm p-6 animate-in fade-in duration-200 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-tecton-border pb-4 shrink-0">
            <h3 className="font-mono text-sm font-bold text-white">EDIT CONTEXT</h3>
            <button onClick={() => setIsContextModalOpen(false)}><X size={18} className="text-tecton-muted" /></button>
          </div>
          
          <div className="space-y-4 flex-grow overflow-y-auto pr-1">
            
            {/* Smart Location Input */}
            <div className="space-y-1 relative">
                <label className="text-xs text-tecton-muted uppercase font-mono">Location (City)</label>
                <div className="relative">
                   <input 
                      type="text" 
                      value={locationSearch}
                      onChange={handleLocationChange}
                      onFocus={() => setShowLocationDropdown(true)}
                      className="w-full bg-tecton-surface border border-tecton-border rounded px-3 py-2 text-sm focus:border-tecton-accent outline-none text-white pl-8 font-medium"
                      placeholder="Search city or type custom..."
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-tecton-muted" />
                    
                    {showLocationDropdown && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-tecton-surface border border-tecton-border rounded shadow-xl max-h-48 overflow-y-auto z-[70]">
                         {locationSearch && !filteredCities.some(c => c.name.toLowerCase() === locationSearch.toLowerCase()) && (
                             <button
                               onClick={() => {
                                  setTempContext({ ...tempContext, location: locationSearch, biome: '' });
                                  setShowLocationDropdown(false);
                               }}
                               className="w-full text-left px-3 py-2 hover:bg-tecton-accent hover:text-white transition-colors group border-b border-white/5 bg-tecton-accent/10"
                             >
                               <div className="text-sm font-medium flex items-center gap-2">
                                 <MapPin size={12} /> Use custom: "{locationSearch}"
                               </div>
                               <div className="text-[10px] text-tecton-muted group-hover:text-blue-100 flex items-center gap-1 italic">
                                 <Sparkles size={10} /> AI will infer biome/weather automatically
                               </div>
                             </button>
                         )}

                        {filteredCities.map((city) => (
                          <button
                            key={city.name}
                            onClick={() => handleCitySelect(city)}
                            className="w-full text-left px-3 py-2 hover:bg-tecton-accent hover:text-white transition-colors group border-b border-white/5 last:border-0"
                          >
                            <div className={`text-sm font-medium ${city.name.includes("None") ? "italic text-tecton-muted" : ""}`}>{city.name}</div>
                            {city.biome && (
                                <div className="text-[10px] text-tecton-muted group-hover:text-blue-100 flex items-center gap-1">
                                <TreePine size={10} /> {city.biome}
                                </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
            </div>

            <SmartCombobox 
              label="Weather / Atmosphere"
              value={tempContext.weather}
              onChange={(val) => setTempContext(prev => ({ ...prev, weather: val }))}
              options={WEATHER_PRESETS}
              icon={Cloud}
              placeholder="e.g. Overcast, Rainy..."
            />

            <SmartCombobox 
              label="Architectural Style"
              value={tempContext.style}
              onChange={(val) => setTempContext(prev => ({ ...prev, style: val }))}
              options={STYLE_PRESETS}
              icon={Layout}
              placeholder="e.g. Brutalist, Minimalist..."
            />

            <SmartCombobox 
              label="Time of Day"
              value={tempContext.timeOfDay}
              onChange={(val) => setTempContext(prev => ({ ...prev, timeOfDay: val }))}
              options={TIME_PRESETS}
              icon={Clock}
              placeholder="e.g. Golden Hour..."
            />
            
             <div className="space-y-1">
                <label className="text-xs text-tecton-muted uppercase font-mono">Landscape / Biome</label>
                <div className={`w-full border border-tecton-border rounded px-3 py-2 text-xs flex items-center gap-2 ${!tempContext.biome ? 'bg-tecton-accent/10 text-tecton-accent border-tecton-accent/30' : 'bg-black/20 text-tecton-muted'}`}>
                  {!tempContext.biome ? <Sparkles size={12} /> : null}
                  {tempContext.biome || "Auto-Infer from Location"}
                </div>
             </div>

          </div>
          <button onClick={handleSaveContext} className="w-full mt-6 bg-tecton-accent hover:bg-tecton-accentHover text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-medium shrink-0">
            <Save size={16} /> APPLY CHANGES
          </button>
        </div>
      )}

      {/* Settings Modal Removed */}

      {/* Chat Area */}
      <div className="flex-grow flex flex-col overflow-hidden relative">
        <div className="flex-grow overflow-y-auto p-4 space-y-6" ref={scrollRef}>
          {chatHistory.length === 0 && (
            <div className="text-center mt-10 px-4 opacity-50">
              <p className="text-tecton-muted text-sm italic">"Design is intelligence made visible."</p>
            </div>
          )}
          
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Attachments Grid */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`mb-2 grid gap-2 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-[85%]`}>
                  {msg.attachments.map((att) => {
                    if (!att.url) return null;
                    const badge = getRoleBadge(att.role);
                    const Icon = badge.icon;
                    return (
                      <div key={att.id} className="relative group rounded-lg overflow-hidden border border-tecton-border">
                         <img src={att.url} alt={att.role} className="w-full h-auto object-cover max-h-40" />
                         <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 backdrop-blur-md ${badge.color}`}>
                           <Icon size={10} /> {badge.label}
                         </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text Bubble */}
              {msg.text && (
                 <div 
                  className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-tecton-accent text-white rounded-br-none' 
                      : 'bg-tecton-surface text-tecton-text border border-tecton-border rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
             <div className="flex justify-start animate-pulse">
               <div className="bg-tecton-surface border border-tecton-border px-4 py-3 rounded-lg flex items-center gap-2">
                 <span className="text-xs font-mono text-tecton-muted">GENERATING</span>
                 <div className="flex gap-1"><div className="w-1 h-1 bg-tecton-accent rounded-full animate-bounce"></div><div className="w-1 h-1 bg-tecton-accent rounded-full animate-bounce delay-75"></div></div>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-tecton-border bg-tecton-surface z-20">
          
          {/* Material Chip */}
          {selectedMaterial && (
            <div className="mb-2 flex animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 bg-tecton-bg border border-tecton-accent/50 rounded-full px-3 py-1 pr-1">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: selectedMaterial.colorCode }} />
                <span className="text-xs font-mono text-tecton-accent font-medium">{selectedMaterial.name}</span>
                <button onClick={onClearMaterial} className="p-1 hover:bg-white/10 rounded-full ml-1"><X size={12} className="text-tecton-muted" /></button>
              </div>
            </div>
          )}

          {/* Staging Tray (Pending Attachments) */}
          {pendingAttachments.length > 0 && (
            <div className="mb-3 flex overflow-x-auto gap-3 pb-2 scrollbar-hide animate-in slide-in-from-bottom-2">
              {pendingAttachments.map((att) => (
                <div key={att.id} className="relative flex-shrink-0 w-24 flex flex-col gap-1">
                  <div className="h-24 w-24 rounded border border-tecton-border bg-tecton-bg overflow-hidden relative group">
                    {att.url ? (
                        <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-[10px]">No Preview</div>
                    )}
                    <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 rounded-full p-1 text-white transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  
                  <div className="relative">
                    <select 
                      value={att.role}
                      onChange={(e) => updateAttachmentRole(att.id, e.target.value as ImageRole)}
                      className="w-full bg-[#151515] text-[10px] text-tecton-muted border border-tecton-border rounded px-1 py-1 appearance-none focus:border-tecton-accent focus:text-white uppercase font-mono cursor-pointer"
                    >
                      <option value="sketch">Sketch</option>
                      <option value="material">Material</option>
                      <option value="object">Object</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-1 top-1.5 text-tecton-muted pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative group flex flex-col gap-2">
            
            {/* Input Mode Toggle (Collapsible) */}
            <div className="mb-2">
              <button 
                type="button"
                onClick={() => setIsInputModeOpen(!isInputModeOpen)}
                className="flex items-center gap-1 text-[10px] font-bold text-tecton-muted hover:text-tecton-accent mb-2 uppercase tracking-wide transition-colors"
              >
                Input Mode: {inputMode === 'sketch' ? 'HAND SKETCH' : '3D MODEL'}
                {isInputModeOpen ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
              </button>

              {isInputModeOpen && (
                <div className="flex gap-2 mb-1 animate-in slide-in-from-top-1">
                  <button
                    type="button"
                    onClick={() => setInputMode('sketch')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded border transition-all ${
                      inputMode === 'sketch'
                        ? 'bg-[#222] text-white border-tecton-accent shadow-sm'
                        : 'bg-black text-gray-600 border-[#333] hover:border-gray-500'
                    }`}
                    title="Optimize for hand drawings"
                  >
                    <PenTool size={12} /> SKETCH
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('3d')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded border transition-all ${
                      inputMode === '3d'
                        ? 'bg-[#222] text-white border-tecton-accent shadow-sm'
                        : 'bg-black text-gray-600 border-[#333] hover:border-gray-500'
                    }`}
                    title="Optimize for 3D model screenshots"
                  >
                    <Box size={12} /> 3D MODEL
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-end gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-[#151515] text-tecton-muted hover:text-tecton-accent border border-tecton-border rounded-lg transition-colors flex-shrink-0 relative"
                  title="Attach Images"
                >
                  <Paperclip size={18} />
                  {pendingAttachments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-tecton-accent text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                      {pendingAttachments.length}
                    </span>
                  )}
                </button>

                <div className="relative flex-grow">
                  <textarea 
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={pendingAttachments.length > 0 || styleAttachment ? "Describe how to use these images..." : "Describe architecture or changes..."}
                    disabled={isProcessing || isEnhancing}
                    rows={1}
                    className="w-full bg-[#151515] text-tecton-text border border-tecton-border rounded-lg pl-4 pr-20 py-3 text-sm focus:outline-none focus:border-tecton-accent transition-colors font-mono disabled:opacity-50 resize-none overflow-hidden min-h-[50px] max-h-[240px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  
                  <div className="absolute right-2 bottom-2.5 flex gap-1">
                     <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        disabled={!input.trim() || isProcessing || isEnhancing}
                        className={`p-1.5 rounded-md transition-all ${isEnhancing ? 'text-yellow-400 animate-spin' : 'text-tecton-muted hover:text-yellow-400 hover:bg-white/5'}`}
                        title="Enhance Prompt with AI"
                     >
                       <Sparkles size={16} />
                     </button>
                    
                    <button 
                      type="submit" 
                      disabled={(!input.trim() && pendingAttachments.length === 0 && !styleAttachment) || isProcessing}
                      className="p-1.5 bg-tecton-accent text-white rounded-md hover:bg-tecton-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <button
                     type="button"
                     onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                     className="text-[10px] text-tecton-muted hover:text-tecton-accent flex items-center gap-1 font-mono uppercase tracking-wide"
                   >
                     Advanced Controls {isAdvancedOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                   </button>
                </div>
                
                {isAdvancedOpen && (
                  <div className="space-y-3 bg-[#151515] border border-tecton-border rounded p-3 animate-in fade-in slide-in-from-top-1">
                    
                    {/* Style Transfer Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-purple-400/80">
                         <Palette size={10} />
                         <span className="text-[10px] font-bold uppercase">Style Transfer</span>
                      </div>
                      
                      {!styleAttachment ? (
                         <button 
                           type="button"
                           onClick={() => styleInputRef.current?.click()}
                           className="w-full py-2 border border-dashed border-tecton-border hover:border-purple-500/50 rounded text-[10px] text-tecton-muted hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                         >
                            <Plus size={12} /> 🎨 Add Style Reference
                         </button>
                      ) : (
                        <div className="relative group rounded overflow-hidden border border-purple-500/30">
                           {styleAttachment.url ? (
                               <img src={styleAttachment.url} alt="Style Ref" className="w-full h-20 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                           ) : (
                               <div className="w-full h-20 bg-gray-800 flex items-center justify-center text-gray-500 text-[10px]">No Preview</div>
                           )}
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white bg-purple-600/80 px-2 py-0.5 rounded backdrop-blur-sm">STYLE ACTIVE</span>
                           </div>
                           <button 
                             onClick={() => setStyleAttachment(null)}
                             className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                           >
                              <X size={10} />
                           </button>
                        </div>
                      )}
                      <input type="file" ref={styleInputRef} onChange={handleStyleFileSelect} accept="image/*" className="hidden" />
                    </div>

                    <div className="h-px bg-white/5 w-full"></div>

                    {/* Negative Prompt */}
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-red-400/80">
                          <AlertCircle size={10} />
                          <span className="text-[10px] font-bold uppercase">Negative Prompt (Exclude)</span>
                        </div>
                        <textarea 
                          value={negativePrompt}
                          onChange={(e) => onUpdateNegativePrompt(e.target.value)}
                          placeholder="e.g. people, cars, blur, text, watermark..."
                          className="w-full bg-tecton-bg border border-tecton-border rounded text-xs text-tecton-text p-2 focus:border-red-500/50 outline-none h-16 resize-none"
                        />
                    </div>
                  </div>
                )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};