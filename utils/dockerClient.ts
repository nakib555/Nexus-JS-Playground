import { io, Socket } from "socket.io-client";
import { LogType } from "../types";

// Default to env var or localhost
const DEFAULT_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:3001";

class DockerClient {
  private socket: Socket | null = null;
  private onLog: ((type: LogType, messages: any[]) => void) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;
  private backendUrl: string = DEFAULT_URL;

  constructor() {
    // Restore from storage if available
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('nexus-backend-url');
        if (saved) this.backendUrl = saved;
    }
  }

  public setBackendUrl(url: string) {
    // Remove trailing slash
    this.backendUrl = url.replace(/\/$/, "");
    localStorage.setItem('nexus-backend-url', this.backendUrl);
  }

  public getBackendUrl() {
    return this.backendUrl;
  }

  public connect(
    language: string, 
    image: string, 
    onLog: (type: LogType, messages: any[]) => void,
    onStatusChange: (status: string) => void
  ) {
    this.disconnect(); 
    
    this.onLog = onLog;
    this.onStatusChange = onStatusChange;

    this.onStatusChange('Connecting...');

    console.log(`[DockerClient] Connecting to ${this.backendUrl}`);

    this.socket = io(this.backendUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    this.socket.on("connect", () => {
      this.onStatusChange?.('Booting...');
      this.socket?.emit("init-session", { language, image });
    });

    this.socket.on("session-ready", (data) => {
      const mode = data.mode === 'local' ? 'Local' : 'Container';
      this.onStatusChange?.(`Ready (${mode})`);
      this.onLog?.(LogType.SYSTEM, [`Environment ready: ${image} [Mode: ${mode}]`]);
    });

    this.socket.on("output", (data) => {
      const type = data.stream === 'stderr' ? LogType.ERROR : LogType.INFO;
      const text = data.data.replace(/\u0000/g, ''); 
      if (text) {
        this.onLog?.(type, [text]);
      }
    });

    this.socket.on("exit", (code) => {
      this.onLog?.(LogType.SYSTEM, [`Process exited with code ${code}`]);
      this.onStatusChange?.('Ready');
    });

    this.socket.on("error", (err) => {
      // Use string checking as err might be an object
      const msg = typeof err === 'string' ? err : err.message || 'Unknown Error';
      this.onLog?.(LogType.ERROR, [`System Error: ${msg}`]);
      this.onStatusChange?.('Error');
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err);
      this.onStatusChange?.('Connection Failed');
      this.onLog?.(LogType.ERROR, [`Failed to connect to backend at ${this.backendUrl}. Check Settings.`]);
    });
  }

  public runCode(code: string, extension: string, entryCommand: string) {
    if (this.socket && this.socket.connected) {
      this.onStatusChange?.('Running...');
      this.socket.emit("run-code", { code, extension, entryCommand });
    } else {
      this.onLog?.(LogType.ERROR, ["Not connected to execution environment."]);
    }
  }

  public disconnect() {
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('stop-session');
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const dockerClient = new DockerClient();