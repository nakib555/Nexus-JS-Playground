import { GoogleGenAI } from "@google/genai";
import { LogType } from "../types";

export const executeWithAI = async (
  code: string,
  languageName: string,
  onLog: (type: LogType, messages: any[]) => void,
  onVisual?: (htmlContent: string) => void
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using flash for speed
    const model = 'gemini-2.5-flash';
    
    onLog(LogType.INFO, [`[${languageName}] Initializing remote execution environment...`]);

    const prompt = `
    You are an advanced universal code execution engine. 
    User provided code in language: ${languageName}.
    
    Your task:
    1. Act as the compiler/interpreter for this language.
    2. Simulate the execution of the code provided below with 100% accuracy.
    3. Return the standard output (stdout) of the code.
    
    HANDLING VISUALS & LIBRARIES:
    - You must simulate standard libraries and common external libraries (e.g., NumPy, Pandas, Matplotlib, Three.js, React) if used.
    - If the code generates a plot, chart, diagram, image, or UI (e.g., Python Matplotlib plot, JS Canvas, ASCII art), you MUST generate the raw HTML/SVG representation of it.
    - If the code output is purely visual (e.g. an HTML file), output the HTML.
    
    MIXED OUTPUT FORMAT:
    - If the code produces BOTH text stdout AND a visual artifact:
      1. Output the text stdout first.
      2. Output this exact delimiter line: "@@@NEXUS_VISUAL_BREAK@@@"
      3. Output the HTML/SVG code.
    - If only text: Output text.
    - If only visual: Output visual HTML/SVG.

    ERROR HANDLING:
    - If there is a syntax or runtime error, return the error message exactly as the interpreter would.

    FORMATTING RULES:
    - Do NOT wrap output in markdown code blocks (no \`\`\` wrappers).
    - Do NOT add conversational filler ("Here is the output...").
    - Just the raw execution result.
    
    Code to execute:
    ${code}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let output = response.text || '';
    
    // Clean up markdown code blocks if the model accidentally adds them
    output = output.replace(/^```(html|xml|svg|text)?/, '').replace(/```$/, '').trim();

    if (output) {
      // Check for Explicit Split
      if (output.includes('@@@NEXUS_VISUAL_BREAK@@@')) {
          const [textPart, visualPart] = output.split('@@@NEXUS_VISUAL_BREAK@@@');
          
          if (textPart.trim()) {
            onLog(LogType.SUCCESS, [textPart.trim()]);
          }
          
          if (visualPart.trim() && onVisual) {
            onVisual(visualPart.trim());
            // Optional: Log a subtle message indicating visual was updated
            // onLog(LogType.INFO, ['Visual output updated.']);
          }
          return;
      }

      // Heuristic detection if no split found
      const lowerOut = output.toLowerCase();
      const isVisual = (
        (lowerOut.startsWith('<') && lowerOut.endsWith('>')) || 
        lowerOut.includes('<!doctype html>') || 
        lowerOut.includes('<svg') ||
        lowerOut.includes('<html')
      );

      if (isVisual) {
         if (onVisual) {
            onVisual(output);
            onLog(LogType.SUCCESS, ['Visual output generated.']);
         } else {
             onLog(LogType.SUCCESS, ['(Visual Output Detected)']);
             onLog(LogType.INFO, [output]);
         }
      } 
      // Check for Error patterns
      else if (lowerOut.includes('error:') || lowerOut.includes('exception') || lowerOut.includes('traceback') || lowerOut.includes('fatal error')) {
         onLog(LogType.ERROR, [output]);
      } 
      // Standard Text Output
      else {
         onLog(LogType.SUCCESS, [output]);
      }
    } else {
      onLog(LogType.INFO, ['Program completed with no output.']);
    }

  } catch (error: any) {
    onLog(LogType.ERROR, [`System Error: ${error.message}`]);
  }
};