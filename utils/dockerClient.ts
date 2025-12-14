import { io, Socket } from "socket.io-client";
import { LogType } from "../types";

// Dynamic Backend URL based on environment
// Falls back to localhost for local development
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:3001";

class DockerClient {
  private socket: Socket | null = null;
  private onLog: ((type: LogType, messages: any[]) => void) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;

  constructor() {}

  public connect(
    language: string, 
    image: string, 
    onLog: (type: LogType, messages: any[]) => void,
    onStatusChange: (status: string) => void
  ) {
    this.disconnect(); // Ensure clean state before new connection
    
    this.onLog = onLog;
    this.onStatusChange = onStatusChange;

    this.onStatusChange('Connecting to Environment...');

    this.socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      this.onStatusChange?.('Booting Container...');
      // Request session creation
      this.socket?.emit("init-session", { language, image });
    });

    this.socket.on("session-ready", (data) => {
      this.onStatusChange?.(`Ready (${data.containerId.substring(0, 8)})`);
      this.onLog?.(LogType.SYSTEM, [`Environment ready: ${image}`]);
    });

    this.socket.on("output", (data) => {
      // stream: 'stdout' | 'stderr'
      const type = data.stream === 'stderr' ? LogType.ERROR : LogType.INFO;
      // Clean up raw output slightly (remove null bytes)
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
      this.onLog?.(LogType.ERROR, [`System Error: ${err}`]);
      this.onStatusChange?.('Connection Error');
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err);
      this.onStatusChange?.('Connection Failed');
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
      // Explicitly tell backend to stop the session (kill container)
      // purely as a courtesy, the disconnect event will also handle it.
      if (this.socket.connected) {
        this.socket.emit('stop-session');
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const dockerClient = new DockerClient();