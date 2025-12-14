import { io, Socket } from "socket.io-client";
import { LogType } from "../types";

const BACKEND_URL = "http://localhost:3001"; // Assumes backend runs locally

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
    this.disconnect(); // Ensure clean state
    this.onLog = onLog;
    this.onStatusChange = onStatusChange;

    this.onStatusChange('Connecting to Docker Backend...');

    this.socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 3
    });

    this.socket.on("connect", () => {
      this.onStatusChange?.('Initializing Container...');
      // Request session creation
      this.socket?.emit("init-session", { language, image });
    });

    this.socket.on("session-ready", (data) => {
      this.onStatusChange?.(`Container Ready (${data.containerId.substring(0, 8)})`);
      this.onLog?.(LogType.SYSTEM, [`Container started: ${image}`]);
    });

    this.socket.on("output", (data) => {
      // stream: 'stdout' | 'stderr'
      const type = data.stream === 'stderr' ? LogType.ERROR : LogType.INFO;
      // Clean up raw output slightly
      const text = data.data.replace(/\u0000/g, ''); 
      if (text.trim()) {
        this.onLog?.(type, [text]);
      }
    });

    this.socket.on("exit", (code) => {
      this.onLog?.(LogType.SYSTEM, [`Process exited with code ${code}`]);
      this.onStatusChange?.('Ready');
    });

    this.socket.on("error", (err) => {
      this.onLog?.(LogType.ERROR, [`Backend Error: ${err}`]);
      this.onStatusChange?.('Connection Error');
    });

    this.socket.on("connect_error", (err) => {
      this.onLog?.(LogType.ERROR, [`Failed to connect to backend at ${BACKEND_URL}. Is it running?`]);
      this.onStatusChange?.('Connection Failed');
    });
  }

  public runCode(code: string, extension: string, entryCommand: string) {
    if (this.socket && this.socket.connected) {
      this.onStatusChange?.('Running...');
      this.socket.emit("run-code", { code, extension, entryCommand });
    } else {
      this.onLog?.(LogType.ERROR, ["Not connected to backend execution environment."]);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const dockerClient = new DockerClient();
