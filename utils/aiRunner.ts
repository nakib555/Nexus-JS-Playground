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
    
    onLog(LogType.INFO, [`[${languageName}] Initializing AI Universal Executor...`]);

    const prompt = `
    You are an advanced, universal code execution engine. Your purpose is to execute ANY code provided by the user, regardless of language or complexity, and produce the EXACT expected output.

    CONTEXT:
    - Language: ${languageName}
    - Environment: Virtual Simulation
    
    CAPABILITIES:
    1. **Library Simulation**: You must simulate the behavior of ALL standard libraries and common external libraries (e.g., Python's pandas/matplotlib/numpy, Node's fs/http, C++ STL) as if they are perfectly installed.
    2. **Visual Output**: If the code generates plots, charts, UI elements, images, or interactive components, you MUST generate a high-quality HTML/SVG/Canvas representation.
    3. **Console Output**: Capture standard output (stdout) and errors (stderr) accurately.
    4. **Mixed Mode**: You can produce BOTH text output and visual output simultaneously.

    OUTPUT FORMAT:
    You must strictly structure your response. If the code produces both text and visuals, use the separator below.
    
    [Raw Text Output Here]
    @@@NEXUS_VISUAL_BREAK@@@
    [HTML/SVG/Visual Output Here]

    VISUALIZATION RULES:
    - **Plots/Charts**: Convert them to robust SVGs or use a CDN-based library (like Chart.js) in a self-contained HTML snippet.
    - **Data Visualization**: If the code outputs structured data (tables, lists, graphs) that is better viewed visually, generate a visual representation (HTML Table, Chart) in addition to the text output.
    - **UI/GUI**: If the user writes UI code (e.g., Swing, Tkinter, React), render the equivalent modern HTML/CSS interface.
    - **Audio**: If the code produces sound, generate an HTML <audio> element with a data URI or valid source.
    - **Images**: If the code processes images, output the result as an <img> tag with a data URI.
    - **Styling**: Make any visual output look modern and beautiful by default (use system fonts, clean layouts).

    EXECUTION RULES:
    - Do NOT explain the code. EXECUTE it.
    - Do NOT wrap the text output in markdown blocks unless the program itself prints markdown.
    - If there is a syntax error, simulate the compiler/interpreter error message exactly.
    - If the code uses \`input()\`, assume a sensible default value or mock the interaction in the logs.
    - If the code is simple "non-library" code (e.g. vanilla loops, math), execute it precisely.

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
         onLog(LogType.SUCCESS, [output]);
      }
    } else {
      onLog(LogType.INFO, ['Program completed with no output.']);
    }

  } catch (error: any) {
    if (signal?.aborted) return;
    onLog(LogType.ERROR, [`System Error: ${error.message}`]);
  }
};