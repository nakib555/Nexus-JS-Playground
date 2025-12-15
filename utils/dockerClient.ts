import { io, Socket } from "socket.io-client";
import { LogType, VirtualFile } from "../types";

// Default to env var or localhost
const DEFAULT_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:3001";

class DockerClient {
  private socket: Socket | null = null;
  private onLog: ((type: LogType, messages: any[]) => void) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;
  private onRunFinished: (() => void) | null = null;
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

  public async verifyConnection(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const sanitizedUrl = url.replace(/\/$/, "");
      console.log(`[DockerClient] Verifying connection to ${sanitizedUrl}...`);
      
      const tempSocket = io(sanitizedUrl, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
        forceNew: true,
      });

      let resolved = false;

      const cleanup = () => {
        if (tempSocket) {
            tempSocket.disconnect();
            tempSocket.removeAllListeners();
        }
      };

      tempSocket.on("connect", () => {
        if (!resolved) {
          resolved = true;
          console.log("[DockerClient] Verification successful");
          cleanup();
          resolve(true);
        }
      });

      tempSocket.on("connect_error", (err) => {
        if (!resolved) {
          resolved = true;
          console.warn("[DockerClient] Verification failed:", err);
          cleanup();
          resolve(false);
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn("[DockerClient] Verification timed out");
          cleanup();
          resolve(false);
        }
      }, 5000);
    });
  }

  public connect(
    language: string, 
    image: string, 
    onLog: (type: LogType, messages: any[]) => void,
    onStatusChange: (status: string) => void,
    onRunFinished: () => void
  ) {
    this.disconnect(); 
    
    this.onLog = onLog;
    this.onStatusChange = onStatusChange;
    this.onRunFinished = onRunFinished;

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
      let msg = `Process exited with code ${code}`;
      if (code === 127) msg += " (Command not found. Ensure the language runtime (e.g. 'python', 'node', 'go') is installed and available in your system PATH)";
      if (code === 137) msg += " (Process killed - Memory Limit Exceeded)";
      
      this.onLog?.(LogType.SYSTEM, [msg]);
      this.onStatusChange?.('Ready');
      this.onRunFinished?.();
    });

    this.socket.on("error", (err) => {
      // Use string checking as err might be an object
      const msg = typeof err === 'string' ? err : err.message || 'Unknown Error';
      this.onLog?.(LogType.ERROR, [`System Error: ${msg}`]);
      this.onStatusChange?.('Error');
      this.onRunFinished?.();
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err);
      this.onStatusChange?.('Connection Failed');
      this.onLog?.(LogType.ERROR, [`Failed to connect to backend at ${this.backendUrl}. Check Settings.`]);
      this.onRunFinished?.();
    });

    this.socket.on("disconnect", (reason) => {
       console.warn("Socket Disconnected:", reason);
       this.onStatusChange?.('Disconnected');
       if (reason === 'io server disconnect' || reason === 'transport close') {
           this.onLog?.(LogType.ERROR, [`Connection lost: ${reason}`]);
       }
       this.onRunFinished?.();
    });
  }

  public runCode(code: string, extension: string, entryCommand: string, files: VirtualFile[] = []) {
    if (this.socket && this.socket.connected) {
      this.onStatusChange?.('Running...');
      // Extract only necessary data to send to backend (name and content)
      const transferableFiles = files.map(f => ({ name: f.name, content: f.content }));
      this.socket.emit("run-code", { code, extension, entryCommand, files: transferableFiles });
    } else {
      this.onLog?.(LogType.ERROR, ["Not connected to execution environment."]);
      this.onRunFinished?.();
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