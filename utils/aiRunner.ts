import { GoogleGenAI } from "@google/genai";
import { LogType } from "../types";
import { Interpreter } from "../types";

export const executeWithAI = async (
  code: string,
  languageName: string,
  interpreter: Interpreter,
  onLog: (type: LogType, messages: any[]) => void,
  onVisual?: (htmlContent: string) => void,
  signal?: AbortSignal
) => {
  try {
    if (signal?.aborted) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using Pro model for complex reasoning and code simulation
    const model = 'gemini-3-pro-preview';
    
    // Phase 1: Implicit Analysis
    onLog(LogType.SYSTEM, [`[Runtime] Initializing ${languageName} environment...`]);

    const prompt = `
    You are an advanced "Smart Runtime" execution engine. Your goal is to execute user code in ${languageName}.

    CRITICAL INSTRUCTION - LIBRARY DETECTION:
    1.  Scan the user's code for external libraries/imports (e.g., 'import pandas', 'require("lodash")', '#include <vector>').
    2.  If libraries are found, you MUST generate "System Logs" before the actual output, simulating the installation/loading process.
        - Format: [System] Resolving dependencies...
        - Format: [System] Installing package: <library_name>...
        - Format: [System] Package installed successfully.
    3.  If NO libraries are found, skip the installation logs and run immediately.

    EXECUTION INSTRUCTIONS:
    1.  **Universal Execution**: Execute the code assuming all detected libraries are successfully installed and available in the environment.
    2.  **Visual Output**: If the code generates plots, charts, UI elements, images, or interactive components, you MUST generate a high-quality HTML/SVG/Canvas representation.
    3.  **Console Output**: Capture standard output (stdout) and errors (stderr) accurately.
    4.  **Mixed Mode**: You can produce BOTH text output and visual output simultaneously.

    OUTPUT FORMAT RULES:
    1.  **Structured Data**: If the code outputs a list, dictionary, object, or dataframe, output it as a VALID JSON STRING in the text output so the UI can render it interactively.
    2.  **Text Split**: Use the separator below to distinguish between console text/JSON and visual HTML.
    
    [System Logs (if any)]
    [Raw Text/JSON Output Here]
    @@@NEXUS_VISUAL_BREAK@@@
    [HTML/SVG/Visual Output Here]

    VISUALIZATION RULES:
    - **Plots/Charts**: Convert them to robust SVGs or use a CDN-based library (like Chart.js) in a self-contained HTML snippet.
    - **Data Visualization**: If the code outputs structured data (tables, lists, graphs) that is better viewed visually, generate a visual representation (HTML Table, Chart) in addition to the text output.
    - **UI/GUI**: If the user writes UI code (e.g., Swing, Tkinter, React), render the equivalent modern HTML/CSS interface.
    - **Images**: If the code processes images, output the result as an <img> tag with a data URI.

    CODE TO EXECUTE:
    ${code}
    `;

    // Check before API call
    if (signal?.aborted) return;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // Check after API call
    if (signal?.aborted) return;

    let output = response.text || '';
    
    // Clean up outer markdown blocks if they exist (common model behavior)
    if (output.startsWith('```') && output.endsWith('```')) {
         output = output.replace(/^```(html|xml|svg|text|json)?/, '').replace(/```$/, '').trim();
    }

    if (output) {
      // Check for Explicit Split
      if (output.includes('@@@NEXUS_VISUAL_BREAK@@@')) {
          const [textPart, visualPart] = output.split('@@@NEXUS_VISUAL_BREAK@@@');
          
          if (textPart.trim()) {
            // Split text part by newlines to handle system logs separately
            const lines = textPart.trim().split('\n');
            lines.forEach(line => {
                if (line.includes('[System]')) {
                    onLog(LogType.SYSTEM, [line.trim()]);
                } else {
                    onLog(LogType.SUCCESS, [line.trim()]);
                }
            });
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
        lowerOut.trim().startsWith('<html')
      );

      if (isVisual) {
         if (onVisual) {
            onVisual(output);
         } else {
             onLog(LogType.SUCCESS, ['(Visual Output Generated)']);
             // Still log partial text if it looks mixed
             if (output.length < 500) onLog(LogType.INFO, [output]);
         }
      } 
      // Check for Error patterns
      else if (lowerOut.includes('error:') || lowerOut.includes('exception') || lowerOut.includes('traceback') || lowerOut.includes('fatal error')) {
         onLog(LogType.ERROR, [output]);
      } 
      // Standard Text Output
      else {
         // Process lines to detect system logs
         const lines = output.split('\n');
         lines.forEach(line => {
             if (line.includes('[System]')) {
                 onLog(LogType.SYSTEM, [line.trim()]);
             } else {
                 onLog(LogType.SUCCESS, [line.trim()]);
             }
         });
      }
    } else {
      onLog(LogType.INFO, ['Program completed with no output.']);
    }

  } catch (error: any) {
    if (signal?.aborted) return;
    onLog(LogType.ERROR, [`System Error: ${error.message}`]);
  }
};