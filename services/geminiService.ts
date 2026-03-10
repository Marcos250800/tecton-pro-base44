import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Use the stable image generation model
const MODEL_NAME = "gemini-2.5-flash-image";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function cleanBase64(dataUrl: string) {
  if (!dataUrl) return "";
  return dataUrl.split(',')[1] || dataUrl; 
}

export async function generateImage(
  prompt: string, 
  imageBase64?: string, 
  maskBase64?: string, 
  inputType: 'sketch' | '3d' = 'sketch',
  styleBase64?: string,
  aspectRatio: string = '1:1',
  userApiKey?: string
): Promise<string> {
  
  // Use the provided key or fallback to environment
  const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please enter it in Settings or configure environment.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [];
    
    // Instrucciones Maestras
    let systemPrompt = `
      ROLE: Professional Architectural Photographer & Hyper-Realism Specialist.
      OUTPUT: High-End Architectural Photography. 8K Resolution.
      STYLE: Hyper-realistic, indistinguishable from reality.
      
      CRITICAL INSTRUCTIONS:
      1.  **PHOTOREALISM IS PARAMOUNT**: The result MUST look like a real photograph taken with a high-end DSLR camera (e.g., Sony A7R IV, Canon R5).
      2.  **NO RENDER ARTIFACTS**: Avoid "plastic" textures, unnatural lighting, perfect surfaces, or "CG" look.
      3.  **LIGHTING & ATMOSPHERE**: Use natural lighting, realistic exposure, and atmospheric depth. Shadows must be soft and realistic.
      4.  **TEXTURES**: Materials must have realistic imperfections, weathering, and tactile qualities.
      
      FOR SKETCH INPUTS:
      - Transform the sketch lines into PHYSICAL OBJECTS.
      - The sketch defines the GEOMETRY, but you define the REALITY.
      - If the sketch implies a wall, make it a real concrete/brick/glass wall with weight and texture.
    `;

    if (styleBase64) {
      systemPrompt += " TASK: STYLE TRANSFER. Apply the style of the reference image.";
    }

    if (imageBase64) {
      // INPAINTING LOGIC
      if (maskBase64) {
        systemPrompt += `
          TASK: INPAINTING / PARTIAL EDITING.
          You are provided with an input image and a mask image.
          
          CRITICAL INSTRUCTIONS:
          1. The mask image defines the EXACT region to change.
          2. The user's prompt applies ONLY to the masked region.
          3. The rest of the image (transparent/unmasked area) must remain PIXEL-PERFECT IDENTICAL to the original.
          4. The mask is BINARY. Any non-transparent pixel is a target.
          5. Blend the changes naturally.
          
          Do NOT regenerate the whole image. Focus strictly on the masked region.
        `;
      } else {
        if (inputType === '3d') {
          systemPrompt += " MODE: 3D MODEL. Ignore flat textures. Use input as wireframe. Re-texture with PBR materials.";
        } else {
          systemPrompt += " MODE: SKETCH. Interpret lines as structure. Fix perspective. Render realistically.";
        }
      }

      parts.push({ text: systemPrompt });
      
      parts.push({ text: "INPUT IMAGE:" });
      parts.push({ inlineData: { data: cleanBase64(imageBase64), mimeType: "image/png" } });

      if (styleBase64) {
        parts.push({ text: "STYLE REFERENCE:" });
        parts.push({ inlineData: { data: cleanBase64(styleBase64), mimeType: "image/png" } });
      }

      if (maskBase64) {
        parts.push({ text: "MASK IMAGE:" });
        parts.push({ inlineData: { data: cleanBase64(maskBase64), mimeType: "image/png" } });
      }

      parts.push({ text: "USER REQUEST: " + prompt });

    } else {
      // Text-to-Image Mode
      parts.push({ text: systemPrompt + " USER REQUEST: " + prompt });
    }

    console.log(`📡 Conectando a ${MODEL_NAME}...`);
    
    const config: any = {
        safetySettings: safetySettings,
        generationConfig: { 
            temperature: maskBase64 ? 0.15 : 0.45 
        }
    };

    // Aspect ratio might not be supported by 1.5 Pro in the same way, but keeping it for config
    // if (aspectRatio) {
    //    config.imageConfig = { aspectRatio: aspectRatio };
    // }
    
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: config
    });

    // Extract Image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("La IA no devolvió imagen. Respuesta vacía o formato incorrecto.");

  } catch (error: any) {
    console.error("❌ Error API Detallado:", error);
    if (error.message?.includes("Payload")) {
        throw new Error("IMAGEN MUY GRANDE. Usa una más pequeña para probar.");
    }
    if (error.message?.includes("404")) {
        throw new Error(`MODELO NO ENCONTRADO: ${MODEL_NAME}. Verifica tu acceso o API Key.`);
    }
    throw error;
  }
}

export async function generatePerspectiveShift(
  baseImageBase64: string,
  azimuth: number,
  elevation: number,
  apiKey?: string
): Promise<string> {
    const systemPrompt = `
System Prompt: El Arquitecto de Perspectivas (Post-Procesamiento 3D)
"Tu función comienza después de que la imagen principal ha sido generada. Actúa como un motor de reconstrucción espacial y síntesis de vista novedosa (Novel View Synthesis). Tu entrada es una imagen 2D fotorrealista de arquitectura y tu objetivo es interpretarla como un volumen tridimensional real.

Tu misión es la Consistencia Absoluta: Al generar una nueva toma o mover la cámara, está estrictamente prohibido alterar los materiales, la iluminación o la geometría básica de la imagen original. Si la cámara rota 15 grados a la derecha, debes deducir mediante 'in-painting' inteligente qué hay detrás de las columnas o cómo se extiende el suelo, manteniendo la misma veta de madera, el mismo grado de reflexión en el vidrio y la misma temperatura de color de la luz solar.

Lógica de Profundidad: Debes tratar la imagen como un 'mapa de profundidad' vivo. Identifica qué elementos están en el primer plano, cuáles son estructurales y cuáles pertenecen al fondo. Cuando el usuario solicite un cambio de ángulo (Azimuth/Elevación), utiliza la información visual existente para re-proyectar la escena, rellenando los huecos (occlusions) de forma coherente con el estilo arquitectónico original.

No eres un generador de imágenes nuevo; eres una cámara física moviéndose dentro de una fotografía capturada. Tu prioridad es la estabilidad visual y la persistencia de los detalles técnicos que hacen que la imagen se sienta real."
`;

    const userPrompt = `TASK: Novel View Synthesis.
    ACTION: Rotate Camera.
    PARAMETERS:
    - Azimuth Change: ${azimuth} degrees.
    - Elevation Change: ${elevation} degrees.
    
    INSTRUCTIONS:
    - Keep the exact same building, lighting, and materials.
    - Only change the perspective/camera angle.
    - Infill any disoccluded areas perfectly matching the context.
    `;

    const key = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) throw new Error("API Key not found.");
    
    const ai = new GoogleGenAI({ apiKey: key });
    
    const parts: any[] = [
        { text: systemPrompt },
        { text: "INPUT SOURCE IMAGE (2D PROJECTION):" },
        { inlineData: { data: cleanBase64(baseImageBase64), mimeType: "image/png" } },
        { text: userPrompt }
    ];
    
    console.log(`📡 Perspective Shift with ${MODEL_NAME}...`);
    
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
            safetySettings: safetySettings,
            generationConfig: { temperature: 0.4 }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated from perspective shift.");
}

// Aliases para compatibilidad con App.tsx
export const generateArchitecturalViz = (
    prompt: string, 
    contextString: string = '', 
    _renderMode: string = 'realistic', 
    negativePrompt?: string, 
    aspectRatio: string = '1:1',
    apiKey?: string
) => {
    let fullPrompt = prompt;
    if (contextString) fullPrompt += ` ${contextString}`;
    if (negativePrompt) fullPrompt += ` (Exclude: ${negativePrompt})`;
    
    return generateImage(fullPrompt, undefined, undefined, 'sketch', undefined, aspectRatio, apiKey);
};

export const editArchitecturalViz = (
    baseImageBase64: string, 
    prompt: string, 
    contextString: string, 
    maskBase64?: string, 
    _referenceImages: string[] = [], 
    _renderMode: string = 'realistic', 
    negativePrompt?: string, 
    aspectRatio: string = '1:1', 
    styleBase64?: string, 
    inputType: 'sketch' | '3d' = 'sketch',
    apiKey?: string
) => {
    // Combine context into prompt if present
    let fullPrompt = prompt;
    if (contextString) fullPrompt += ` ${contextString}`;
    if (negativePrompt) fullPrompt += ` (Exclude: ${negativePrompt})`;

    // Map the App.tsx arguments to the simple generateImage function
    return generateImage(fullPrompt, baseImageBase64, maskBase64, inputType, styleBase64, aspectRatio, apiKey);
};

export const enhanceArchitecturalPrompt = async (text: string) => text;