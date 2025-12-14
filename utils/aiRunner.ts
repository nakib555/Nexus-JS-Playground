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
    
    onLog(LogType.INFO, [`[${languageName}] Initializing AI Simulator...`]);

    const prompt = `
    You are an advanced universal code execution engine designed to act as a flawless interpreter for any programming language.
    
    CONTEXT:
    - User Language: ${languageName}
    - Environment: AI Simulation (${interpreter.name})
    
    TASK:
    1. Simulate the execution of the provided code with 100% logical accuracy.
    2. Support standard libraries and non-library based logic (algorithms, math, string manipulation) natively.
    3. If the code implies visualization (charts, graphs, GUI windows, images, DOM manipulation), you MUST generate the Output as HTML/SVG/Canvas.
    
    OUTPUT MODES:
    - MODE A (Text Only): If the code only prints text, return the raw stdout.
    - MODE B (Visual Only): If the code produces a plot/chart/image (e.g., matplotlib.show(), Swing JFrame, Turtle graphics), return a COMPLETE, self-contained HTML/SVG string representing that result.
    - MODE C (Mixed): If code produces text AND visuals, format as:
      [Text Output Here]
      @@@NEXUS_VISUAL_BREAK@@@
      [HTML/SVG Output Here]
    
    RULES:
    - Do NOT wrap output in markdown (\`\`\`) unless the program itself prints markdown.
    - Do NOT explain the code. EXECUTE it.
    - If there is a syntax error, simulate the compiler error message exactly.
    - For plotting (Python matplotlib, R, etc.), generate an SVG of the plot.
    - For UI code (Java Swing, C++ Qt), generate an HTML representation of the window.
    
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