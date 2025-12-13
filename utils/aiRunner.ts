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
    
    onLog(LogType.INFO, [`[${languageName}] Compiling and executing via remote environment...`]);

    const prompt = `
    You are a universal code execution engine. 
    User provided code in language: ${languageName}.
    
    Your task:
    1. Act as the compiler/interpreter for this language.
    2. Simulate the execution of the code provided below with 100% accuracy.
    3. Return the standard output (stdout) of the code.
    4. CRITICAL: If the code's purpose is to generate a plot, a diagram, a UI, or any visual artifact (e.g., Python Matplotlib, HTML, SVG generation), you MUST output the raw HTML or SVG code that represents that visual.
    5. If there is a compilation or runtime error, return the error message exactly as the interpreter would.
    6. Do NOT include any markdown formatting (no \`\`\` wrappers), no introductory text, just the raw output.
    
    Code to execute:
    ${code}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let output = response.text || '';
    
    // Clean up markdown code blocks if the model accidentally adds them despite instructions
    output = output.replace(/^```(html|xml|svg|text)?/, '').replace(/```$/, '').trim();

    if (output) {
      // Heuristic to detect Visual Output (HTML or SVG) vs Text Output
      const lowerOut = output.toLowerCase();
      
      // Check for Visual Content
      if (
        (lowerOut.startsWith('<') && lowerOut.endsWith('>')) || 
        lowerOut.includes('<!doctype html>') || 
        lowerOut.includes('<svg') ||
        lowerOut.includes('<html')
      ) {
         if (onVisual) {
            onVisual(output);
            onLog(LogType.SUCCESS, ['Visual output generated. Switch to "Preview" tab to view.']);
         } else {
             // Fallback if no visual handler
             onLog(LogType.SUCCESS, ['(Visual Output Detected)']);
             onLog(LogType.INFO, [output]);
         }
      } 
      // Check for Errors
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