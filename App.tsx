import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { CanvasEditor } from './components/CanvasEditor';
import { MaterialLibrary } from './components/MaterialLibrary';
import { RenderHistory } from './components/RenderHistory';
import { ChatMessage, ProjectContext, Material, RenderVersion, ChatAttachment, RenderMode, AspectRatio, Project } from './types';
import { generateArchitecturalViz, editArchitecturalViz, generatePerspectiveShift } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { Download, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';

const INITIAL_CONTEXT: ProjectContext = {
    location: "Kyoto, Japan",
    weather: "🎲 Random / Auto",
    style: "🎲 Random / Auto",
    timeOfDay: "🎲 Random / Auto",
    biome: "" 
};

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  // API Key is handled by env, so we assume it's present.
  const [apiKey, setApiKey] = useState('');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [renderHistory, setRenderHistory] = useState<RenderVersion[]>([]);
  const [projectContext, setProjectContext] = useState<ProjectContext>(INITIAL_CONTEXT);
  const [maskData, setMaskData] = useState<string | null>(null); 

  // --- APP STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  
  const [renderMode, setRenderMode] = useState<RenderMode>('realistic');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [generateVariations, setGenerateVariations] = useState(false);
  const [variationCandidates, setVariationCandidates] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [creativityLevel, setCreativityLevel] = useState<number>(30);
  const [inputMode, setInputMode] = useState<'sketch' | '3d'>('sketch');

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<[string | null, string | null]>([null, null]);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // --- INITIALIZATION ---
  useEffect(() => {
     // Always start with a fresh project on load/reload
     handleNewProject();
  }, []);

  // --- PROJECT ACTIONS ---
  const handleNewProject = () => {
    const newId = uuidv4();
    const newProject: Project = {
        id: newId,
        name: `Project ${projects.length + 1}`,
        lastModified: new Date(),
        context: INITIAL_CONTEXT,
        chatHistory: [],
        currentImage: null,
        renderHistory: []
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newId);
    setChatHistory([]);
    setCurrentImage(null);
    setProjectContext(INITIAL_CONTEXT);
    setRenderHistory([]);
    setVariationCandidates([]);
    setMaskData(null);
  };

  const handleSwitchProject = (id: string) => {
    const targetProject = projects.find(p => p.id === id);
    if (!targetProject) return;

    setActiveProjectId(id);
    setChatHistory(targetProject.chatHistory);
    setCurrentImage(targetProject.currentImage || null);
    setProjectContext(targetProject.context);
    setRenderHistory(targetProject.renderHistory);
    setVariationCandidates([]);
    setMaskData(null);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
        if (!window.confirm("This is the only project. Deleting it will reset to a new empty project. Continue?")) return;
    } else {
        if (!window.confirm("Are you sure you want to delete this project permanently?")) return;
    }

    let newProjects = projects.filter(p => p.id !== id);

    if (newProjects.length === 0) {
        const newId = uuidv4();
        const freshProject: Project = {
            id: newId,
            name: "New Project",
            lastModified: new Date(),
            context: INITIAL_CONTEXT,
            chatHistory: [],
            currentImage: null,
            renderHistory: []
        };
        newProjects = [freshProject];
    }

    let newActiveId = activeProjectId;
    let shouldSwitch = false;

    if (id === activeProjectId) {
        newActiveId = newProjects[0].id;
        shouldSwitch = true;
    }

    setProjects(newProjects);

    if (shouldSwitch) {
        setActiveProjectId(newActiveId);
        const p = newProjects[0];
        setChatHistory(p.chatHistory);
        setCurrentImage(p.currentImage || null);
        setProjectContext(p.context);
        setRenderHistory(p.renderHistory);
        setVariationCandidates([]);
        setMaskData(null);
    }
  };

  const handleRenameProject = (id: string, newName: string) => {
     if (!newName.trim()) return;
     setProjects(prev => {
         const updated = prev.map(p => p.id === id ? { ...p, name: newName } : p);
         return updated;
     });
  };

  const handleFactoryReset = () => {
      if(window.confirm("Reset app state? This will clear current session data.")) {
          window.location.reload();
      }
  };

  const addToHistory = (imageUrl: string, prompt: string) => {
    const newVersion: RenderVersion = {
      id: uuidv4(),
      imageUrl,
      timestamp: new Date(),
      prompt,
      thumbnail: imageUrl 
    };
    setRenderHistory(prev => [newVersion, ...prev]);
    setCurrentVersionId(newVersion.id);
  };

  // --- GENERATION LOGIC ---
  const processImageGeneration = async (
    prompt: string, 
    useMask: boolean = false, 
    overrideBaseImage?: string, 
    referenceImages: string[] = [], 
    styleBase64?: string
  ) => {
    setIsProcessing(true);
    setVariationCandidates([]); 
    try {
      const isRandom = (val: string) => val.includes("Random");
      const getRandomAwareValue = (val: string, label: string) => 
        isRandom(val) ? `[AI DECISION: Choose the most fitting and dramatic ${label} for the scene]` : val;

      // Base Fidelity text (optional for user context)
      let fidelityInstruction = "";
      if (creativityLevel < 30) {
        fidelityInstruction = "STRICT MODE: Follow the geometry EXACTLY.";
      } else if (creativityLevel > 70) {
        fidelityInstruction = "CREATIVE MODE: Interpret loosely.";
      } else {
        fidelityInstruction = "BALANCED MODE.";
      }

      // Use the raw image directly (No Sobel/Canvas processing)
      const activeBaseImage = overrideBaseImage || currentImage;

      // --- DYNAMIC CONTEXT CONSTRUCTION ---
      const buildContextLine = (label: string, value: string, desc: string) => {
          if (!value) return ''; 
          const finalValue = isRandom(value)
              ? `[AI DECISION: Choose ${desc}]`
              : value;
          return `- ${label}: ${finalValue}`;
      };

      const contextLines = [
          projectContext.location ? `- Location: ${projectContext.location}` : '',
          buildContextLine('Weather', projectContext.weather, 'weather'),
          buildContextLine('Style', projectContext.style, 'architectural style'),
          buildContextLine('Time of Day', projectContext.timeOfDay, 'time/lighting'),
          projectContext.biome ? `- Biome: ${projectContext.biome}` : ''
      ].filter(Boolean).join('\n');

      let contextBlock = `\n${contextLines}\n[FIDELITY]: ${fidelityInstruction}`;

      const makeCall = async () => {
          if (activeBaseImage) {
            // Edit / Inpaint / Transform Mode
            return await editArchitecturalViz(
                activeBaseImage, 
                prompt, 
                contextBlock, 
                useMask ? maskData || undefined : undefined,
                referenceImages,
                renderMode,
                negativePrompt,
                aspectRatio,
                styleBase64,
                inputMode, // Pass the mode ('sketch' or '3d') directly
                apiKey
            );
          } else {
            // Text-to-Image Mode
            return await generateArchitecturalViz(prompt, contextBlock, renderMode, negativePrompt, aspectRatio, apiKey);
          }
      };

      let resultImage: string | null = null;

      if (generateVariations) {
          const results = await Promise.all([makeCall(), makeCall()]);
          const validResults = results.filter(r => r !== null) as string[];
          
          if (validResults.length > 0) {
              setVariationCandidates(validResults);
              return validResults[0]; 
          }
      } else {
          resultImage = await makeCall();
          if (resultImage) {
            setCurrentImage(resultImage);
            setMaskData(null);
            addToHistory(resultImage, prompt);
            return resultImage;
          }
      }

      if (!resultImage && variationCandidates.length === 0) throw new Error("No image returned");
      return null;

    } catch (error: any) {
      const msg = error.message || '';
      console.warn("API Error:", error);
      alert(`Generation failed: ${msg}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectVariation = (url: string) => {
    setCurrentImage(url);
    addToHistory(url, "Variation Selection");
    setVariationCandidates([]);
    setMaskData(null);
  };

  // --- CHAT HANDLER ---
  const handleSendMessage = async (text: string, attachments: ChatAttachment[] = []) => {
    let finalPrompt = text;
    let baseSketch: ChatAttachment | undefined;
    const referenceAttachments: ChatAttachment[] = [];
    let styleTransferImage: string | undefined;

    if (attachments.length > 0) {
        const explicitSketch = attachments.find(a => a.role === 'sketch');
        const explicitStyle = attachments.find(a => a.role === 'style');

        if (explicitSketch) {
            baseSketch = explicitSketch;
        } else if (!currentImage && !explicitStyle) {
            const first = attachments[0];
            if (first.role !== 'style') baseSketch = first;
        }
        
        if (explicitStyle) {
          styleTransferImage = explicitStyle.url;
        }
        
        attachments.forEach(a => {
            if (a !== baseSketch && a.role !== 'style') referenceAttachments.push(a);
        });

        if (referenceAttachments.length > 0) {
            const refDescriptions = referenceAttachments.map((ref, idx) => 
                `[Ref Image ${idx + 1}: Use as ${ref.role.toUpperCase()} source]`
            ).join(' ');
            finalPrompt = `${refDescriptions} ${finalPrompt}`;
        }
    }

    if (selectedMaterial) {
      finalPrompt = `[MATERIAL REFERENCE: Apply ${selectedMaterial.name} (${selectedMaterial.category}) texture/material] ${finalPrompt}`;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      attachments: attachments 
    };
    setChatHistory(prev => [...prev, userMsg]);
    
    if (selectedMaterial) setSelectedMaterial(null);
    
    if (baseSketch) {
        setCurrentImage(baseSketch.url);
        addToHistory(baseSketch.url, "Base Sketch Upload");
    }

    setIsProcessing(true);
    try {
        const refImageStrings = referenceAttachments.map(a => a.url);
        const activeBase = baseSketch ? baseSketch.url : currentImage;
        const hasMask = !!maskData; 

        await processImageGeneration(finalPrompt, hasMask, activeBase || undefined, refImageStrings, styleTransferImage);

        const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: generateVariations ? "Generated variations." : "Visualization generated.",
              timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMsg]);
        
    } catch (e) {
        console.error("Chat Error", e);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleHistorySelection = (version: RenderVersion) => {
    if (isCompareMode) {
      if (!compareSelection[0]) {
        setCompareSelection([version.id, null]);
        if(version.imageUrl) setCurrentImage(version.imageUrl); 
      } else if (!compareSelection[1]) {
        setCompareSelection([compareSelection[0], version.id]);
      } else {
        setCompareSelection([version.id, null]);
        if(version.imageUrl) setCurrentImage(version.imageUrl);
      }
    } else {
      if(version.imageUrl) setCurrentImage(version.imageUrl);
      setCurrentVersionId(version.id);
    }
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
  };

  const handlePerspectiveShift = async (azimuth: number, elevation: number) => {
    if (!currentImage) return;
    setIsProcessing(true);
    try {
        const newImage = await generatePerspectiveShift(currentImage, azimuth, elevation, apiKey);
        setCurrentImage(newImage);
        addToHistory(newImage, `Perspective Shift: Azimuth ${azimuth}°, Elevation ${elevation}°`);
    } catch (e: any) {
        console.error("Perspective Shift Error", e);
        alert(`Perspective Shift Failed: ${e.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `TectonPro_Render_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen w-screen bg-tecton-bg text-tecton-text overflow-hidden font-sans">
      <Sidebar 
        apiKey={apiKey}
        setApiKey={setApiKey}
        chatHistory={chatHistory} 
        onSendMessage={handleSendMessage} 
        isProcessing={isProcessing}
        projectContext={projectContext}
        onUpdateContext={setProjectContext}
        selectedMaterial={selectedMaterial}
        onClearMaterial={() => setSelectedMaterial(null)}
        negativePrompt={negativePrompt}
        onUpdateNegativePrompt={setNegativePrompt}
        projects={projects}
        activeProjectId={activeProjectId}
        onNewProject={handleNewProject}
        onSwitchProject={handleSwitchProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onFactoryReset={handleFactoryReset}
        inputMode={inputMode}
        setInputMode={setInputMode}
        onPerspectiveShift={handlePerspectiveShift}
      />
      
      <main className="flex-grow h-full relative flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#1A1A1A] bg-[#090909] shrink-0 z-50">
           <div className="flex items-center">
              <span className="text-tecton-blue font-bold tracking-wider">TECTON</span>
              <span className="ml-1 font-light text-gray-400">PRO</span>
           </div>

           {/* CENTER CONTROLS: CREATIVITY & RATIO */}
           <div className="flex items-center gap-4">
              {/* Aspect Ratio Selector */}
              <div className="hidden lg:flex items-center bg-[#111] rounded-lg border border-[#333] p-1 h-8">
                {(['1:1', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
                    <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 h-full text-[10px] font-mono rounded flex items-center gap-1 transition-colors ${aspectRatio === ratio ? 'bg-tecton-accent text-white' : 'text-gray-500 hover:text-white'}`}
                    title={`Aspect Ratio ${ratio}`}
                    >
                    {ratio === '1:1' && <Square size={12}/>}
                    {ratio === '16:9' && <RectangleHorizontal size={12}/>}
                    {ratio === '9:16' && <RectangleVertical size={12}/>}
                    {ratio}
                    </button>
                ))}
              </div>

              {/* Creativity Slider */}
              <div className="hidden md:flex items-center gap-3 bg-[#111] px-4 py-1.5 rounded-full border border-[#333]">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Fidelity</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={creativityLevel} 
                    onChange={(e) => setCreativityLevel(Number(e.target.value))}
                    className="w-24 lg:w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tecton-accent"
                    title={`Creativity Level: ${creativityLevel}%`}
                  />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Creative</span>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
             <button 
               onClick={handleDownload}
               disabled={!currentImage}
               className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors ${currentImage ? 'bg-tecton-accent hover:bg-tecton-accentHover text-white' : 'bg-[#1A1A1A] text-gray-600 cursor-not-allowed'}`}
             >
                <Download size={14} /> EXPORT
             </button>

             <button 
               onClick={() => setIsLibraryOpen(!isLibraryOpen)}
               className={`p-1.5 rounded border border-tecton-border hover:bg-tecton-surface transition-colors ${isLibraryOpen ? 'bg-tecton-surface text-white' : 'text-gray-400'}`}
               title="Toggle Material Library"
             >
                <MaterialLibraryIconSwitch isOpen={isLibraryOpen} />
             </button>
           </div>
        </header>

        <div className="flex-grow relative min-h-0 overflow-hidden bg-[#050505]">
          <CanvasEditor 
            currentImage={currentImage}
            onMaskUpdate={(data) => setMaskData(data)} 
          />
          
          {/* FAIL-SAFE LARGE DOWNLOAD BUTTON (Floating in Canvas Area) */}
          {currentImage && (
            <button
                onClick={handleDownload}
                className="absolute bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold tracking-wide transition-transform hover:scale-105"
                title="Download High-Resolution Render"
            >
                <Download size={20} />
                DOWNLOAD HD
            </button>
          )}
          
          {/* Variation Selector Overlay */}
          {variationCandidates.length > 0 && (
             <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-10 animate-in fade-in">
                <h3 className="text-white font-mono mb-4 text-xl">Select Variation</h3>
                <div className="flex gap-4">
                   {variationCandidates.map((v, i) => (
                      <button key={i} onClick={() => handleSelectVariation(v)} className="group relative border-2 border-transparent hover:border-tecton-accent rounded-lg overflow-hidden transition-all">
                         {v ? (
                             <img src={v} className="max-h-[60vh] object-contain" alt={`Variation ${i}`} />
                         ) : (
                             <div className="w-64 h-64 flex items-center justify-center bg-gray-800 text-gray-500">No Image</div>
                         )}
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                   ))}
                </div>
             </div>
          )}
        </div>

        <RenderHistory 
          history={renderHistory}
          currentVersionId={currentVersionId}
          onSelectVersion={handleHistorySelection}
          isCompareMode={isCompareMode}
          compareSelection={compareSelection}
        />

        {/* Floating Toolbars */}
        {isLibraryOpen && (
          <div className="absolute top-0 right-0 h-full z-40">
            <MaterialLibrary 
              isOpen={isLibraryOpen} 
              onClose={() => setIsLibraryOpen(false)}
              onSelectMaterial={handleSelectMaterial}
            />
          </div>
        )}
      </main>
    </div>
  );
};

const MaterialLibraryIconSwitch = ({isOpen}: {isOpen: boolean}) => {
    return isOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-9"/></svg>
    )
}

export default App;