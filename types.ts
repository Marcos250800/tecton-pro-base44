

export interface ProjectContext {
  location: string;
  weather: string;
  style: string;
  timeOfDay: string;
  biome?: string; // New field for landscape context
}

export type ImageRole = 'sketch' | 'material' | 'object' | 'style';

export interface ChatAttachment {
  id: string;
  url: string; // Base64
  role: ImageRole;
  file?: File; // Keep reference if needed for upload
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  attachments?: ChatAttachment[]; 
}

export enum ToolMode {
  VIEW = 'VIEW', // Pan and Zoom
  MASK = 'MASK', // Draw Mask
  ERASER = 'ERASER', // Draw Red Mask for removal
  COMPARE = 'COMPARE', // Slider comparison
}

export type RenderMode = 'realistic' | 'clay' | 'sketch';
export type AspectRatio = '1:1' | '16:9' | '9:16';

export type EntourageType = 'person' | 'vegetation' | 'vehicle';

export type LightingPreset = 'golden' | 'nordic' | 'rainy' | 'night';

export interface Material {
  id: string;
  name: string;
  category: 'concrete' | 'wood' | 'metal' | 'glass' | 'stone';
  colorCode: string; // CSS hex or gradient for preview
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface RenderVersion {
  id: string;
  imageUrl: string;
  timestamp: Date;
  prompt: string;
  thumbnail?: string; // Could be same as imageUrl for this demo
}

export interface GenerationConfig {
  prompt: string;
  maskData?: string; // Base64 of the mask
  baseImage?: string; // Base64 of the current canvas image
}

export interface Project {
  id: string;
  name: string;
  lastModified: Date;
  context: ProjectContext;
  chatHistory: ChatMessage[];
  currentImage: string | null;
  renderHistory: RenderVersion[];
}