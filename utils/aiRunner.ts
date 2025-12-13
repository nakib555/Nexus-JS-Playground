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
    
    // Using Pro model for complex reasoning and code simulation
    const model = 'gemini-3-pro-preview';
    
    onLog(LogType.INFO, [`[${languageName}] Initializing remote execution environment...`]);

    const prompt = `
    You are an advanced universal code execution engine. 
    User provided code in language: ${languageName}.
    
    Your task:
    1. Act as the compiler/interpreter for this language.
    2. Simulate the execution of the code provided below with 100% accuracy.
    3. Return the standard output (stdout) of the code.
    
    CAPABILITIES:
    - You handle ANY language (Python, Javascript, C++, Java, Go, Rust, Pseudocode, etc.).
    - You simulate standard libraries.
    - IMPORTANT: If the user code attempts to use popular external libraries (like matplotlib, numpy, pandas, three.js, react, etc.) you MUST simulate their behavior and output as if they were installed and working perfectly.
    
    OUTPUT FORMATTING:
    - Text Output: Return the raw text stdout.
    - Visual Output: If the code creates a plot, image, UI, diagram, or GUI, return the raw HTML/SVG representation of that output.
    - Mixed Output: If code produces BOTH text and visual:
      1. Text Output
      2. "@@@NEXUS_VISUAL_BREAK@@@"
      3. Visual Output (HTML/SVG)
    
    ERROR HANDLING:
    - If there is a syntax or runtime error, return the error message exactly as the interpreter would.

    RULES:
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