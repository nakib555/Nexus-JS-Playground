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
    - Environment: Virtual Simulation (No Installation Required)
    
    CAPABILITIES:
    1. **Universal Execution**: You can execute any valid code. If standard libraries are missing, simulate their output perfectly.
    2. **Visual Output**: If the code generates plots, charts, UI elements, images, or interactive components, you MUST generate a high-quality HTML/SVG/Canvas representation.
    3. **Console Output**: Capture standard output (stdout) and errors (stderr) accurately.
    4. **Mixed Mode**: You can produce BOTH text output and visual output simultaneously.

    OUTPUT FORMAT RULES:
    1. **Structured Data**: If the code outputs a list, dictionary, object, or dataframe, output it as a VALID JSON STRING in the text output so the UI can render it interactively.
    2. **Text Split**: Use the separator below to distinguish between console text/JSON and visual HTML.
    
    [Raw Text/JSON Output Here]
    @@@NEXUS_VISUAL_BREAK@@@
    [HTML/SVG/Visual Output Here]

    VISUALIZATION RULES:
    - **Plots/Charts**: Convert them to robust SVGs or use a CDN-based library (like Chart.js) in a self-contained HTML snippet.
    - **Data Visualization**: If the code outputs structured data (tables, lists, graphs) that is better viewed visually, generate a visual representation (HTML Table, Chart) in addition to the text output.
    - **UI/GUI**: If the user writes UI code (e.g., Swing, Tkinter, React), render the equivalent modern HTML/CSS interface.
    - **Images**: If the code processes images, output the result as an <img> tag with a data URI.

    EXECUTION RULES:
    - Do NOT explain the code. EXECUTE it.
    - Do NOT wrap the text output in markdown blocks unless the program itself prints markdown.
    - If there is a syntax error, simulate the compiler/interpreter error message exactly.
    - If the code calculates a value but doesn't print it (e.g., just an expression), print the result implicitly like a REPL.

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