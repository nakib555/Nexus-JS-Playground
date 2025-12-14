/**
 * Dynamic Code Execution Backend
 * Supports both Docker-based isolation and Local Process fallback.
 */
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Docker = require('dockerode');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);

// Allow CORS for all origins to enable Cloudflare -> Render connection
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// --- Execution Engine Setup ---
const DOCKER_SOCKET = '/var/run/docker.sock';
const HAS_DOCKER = fs.existsSync(DOCKER_SOCKET);
let docker = null;

if (HAS_DOCKER) {
  try {
    docker = new Docker({ socketPath: DOCKER_SOCKET });
    console.log("✅ Docker Socket found. Using Container Isolation Mode.");
  } catch (e) {
    console.warn("⚠️ Docker init failed. Falling back to Local Process Mode.");
  }
} else {
  console.log("ℹ️ No Docker Socket. Using Local Process Mode (Standard Execution).");
}

// Active Sessions
const activeSessions = new Map();

// Local Command Mapping (Fallback)
const LOCAL_RUNTIMES = {
  'node': 'node',
  'python': 'python3', // or python
  'go': 'go run',
  'ruby': 'ruby',
  'php': 'php',
  'bash': 'bash',
  'sh': 'sh',
  'gcc': 'g++', // needs compilation logic usually, simplified here
  'java': 'java'
};

// Helper to map Docker Image to Local Command
const getLocalCommand = (image) => {
  if (image.includes('node')) return 'node';
  if (image.includes('python')) return 'python3';
  if (image.includes('golang')) return 'go run';
  if (image.includes('ruby')) return 'ruby';
  if (image.includes('php')) return 'php';
  if (image.includes('alpine') && !image.includes('gxx')) return 'sh';
  return null;
};

// --- Container/Process Cleanup ---
const cleanupSession = async (socketId) => {
  const session = activeSessions.get(socketId);
  if (!session) return;

  if (session.type === 'docker') {
    try {
      const container = docker.getContainer(session.id);
      const data = await container.inspect();
      if (data.State.Running) {
        await container.kill();
      }
      try { await container.remove({ force: true }); } catch (e) {}
    } catch (e) { /* Ignore */ }
  } else if (session.type === 'local') {
    // Kill local process if running (usually handled by run logic, but good for cleanup)
    if (session.process && !session.process.killed) {
        session.process.kill();
    }
  }
  
  activeSessions.delete(socketId);
  console.log(`[${socketId}] Session cleaned up.`);
};

io.on('connection', (socket) => {
  console.log(`[${socket.id}] Client connected`);

  // Emit capabilities immediately
  socket.emit('system-status', { 
    dockerAvailable: HAS_DOCKER && !!docker, 
    mode: (HAS_DOCKER && !!docker) ? 'docker' : 'local' 
  });

  // 1. Initialize Session
  socket.on('init-session', async ({ language, image }) => {
    try {
      if (activeSessions.has(socket.id)) {
        await cleanupSession(socket.id);
      }

      // MODE: DOCKER
      if (HAS_DOCKER && docker) {
        console.log(`[${socket.id}] Spawning Docker: ${image}`);
        const container = await docker.createContainer({
          Image: image,
          Cmd: ['/bin/sh', '-c', 'while true; do sleep 1000; done'], 
          Tty: false,
          OpenStdin: true,
          HostConfig: {
              Memory: 512 * 1024 * 1024,
              CpuPeriod: 100000, 
              CpuQuota: 50000,
              AutoRemove: true,
              NetworkMode: 'none'
          }
        });
        await container.start();
        activeSessions.set(socket.id, { type: 'docker', id: container.id });
        socket.emit('session-ready', { containerId: container.id, mode: 'docker' });
      } 
      // MODE: LOCAL
      else {
        const localCmd = getLocalCommand(image);
        console.log(`[${socket.id}] Init Local: ${localCmd || 'Unknown'}`);
        // We don't spawn a persistent process for local, we just mark readiness
        // The process is spawned on 'run-code'
        activeSessions.set(socket.id, { type: 'local', cmd: localCmd });
        socket.emit('session-ready', { containerId: 'local-env', mode: 'local' });
      }

    } catch (err) {
      console.error(`[${socket.id}] Init Error:`, err);
      socket.emit('error', 'Init failed: ' + err.message);
    }
  });

  // 2. Run Code
  socket.on('run-code', async ({ code, extension, entryCommand }) => {
    const session = activeSessions.get(socket.id);
    if (!session) return socket.emit('error', 'Session expired.');

    const tempDir = os.tmpdir();
    const fileName = `code_${socket.id}_${Date.now()}.${extension}`;
    const filePath = path.join(tempDir, fileName);
    const outputImgPath = path.join(tempDir, `output_${socket.id}.png`);

    // DOCKER EXECUTION
    if (session.type === 'docker') {
      const container = docker.getContainer(session.id);
      try {
        const b64Code = Buffer.from(code).toString('base64');
        const containerPath = `/tmp/${fileName}`;
        const containerImgPath = `/tmp/output.png`;
        
        // Write File
        const writeCmd = `echo "${b64Code}" | base64 -d > ${containerPath}`;
        const execWrite = await container.exec({ Cmd: ['sh', '-c', writeCmd] });
        await execWrite.start({}); 

        // Adjust Command
        let finalCmd = entryCommand;
        if (finalCmd.includes('/tmp/code')) {
            finalCmd = finalCmd.replace(/\/tmp\/code\.\w+/, containerPath);
        } else {
            finalCmd = `${entryCommand} ${containerPath}`;
        }
        
        // Run
        const exec = await container.exec({
          Cmd: ['sh', '-c', finalCmd],
          AttachStdout: true,
          AttachStderr: true
        });
        const stream = await exec.start({});
        
        container.modem.demuxStream(stream, {
          write: (chunk) => socket.emit('output', { stream: 'stdout', data: chunk.toString() })
        }, {
          write: (chunk) => socket.emit('output', { stream: 'stderr', data: chunk.toString() })
        });

        // Monitor Exit & Images
        const checkExit = setInterval(async () => {
             try {
                const inspect = await exec.inspect();
                if (!inspect.Running) {
                    clearInterval(checkExit);
                    
                    // Check for image output
                    const imgCmd = `if [ -f ${containerImgPath} ]; then base64 ${containerImgPath}; rm ${containerImgPath}; fi`;
                    const imgExec = await container.exec({ Cmd: ['sh', '-c', imgCmd], AttachStdout: true });
                    const imgStream = await imgExec.start();
                    let imgData = '';
                    container.modem.demuxStream(imgStream, { write: c => imgData += c.toString() }, { write: () => {} });
                    
                    await new Promise(r => setTimeout(r, 500));
                    if (imgData.replace(/\s/g, '').length > 20) {
                        socket.emit('output', { stream: 'stdout', data: `data:image/png;base64,${imgData.replace(/\s/g, '')}` });
                    }

                    // Cleanup code file
                    await container.exec({ Cmd: ['rm', containerPath] }).then(e => e.start({}));
                    
                    socket.emit('exit', inspect.ExitCode);
                }
             } catch(e) { clearInterval(checkExit); }
        }, 200);

      } catch (err) {
        socket.emit('error', 'Docker Exec Error: ' + err.message);
      }
    } 
    // LOCAL EXECUTION
    else if (session.type === 'local') {
      try {
        // Write File Locally
        fs.writeFileSync(filePath, code);

        // Adjust Command
        let cmd = session.cmd || 'node'; // Default fallback
        let args = [filePath];
        
        // Handle custom entry commands like "go run"
        if (entryCommand) {
            // E.g. "python3" or "go run"
            // If entryCommand expects a file path arg, strictly it's "cmd file"
            // We do a naive split
            const parts = entryCommand.split(' ');
            cmd = parts[0];
            
            // Re-construct args. 
            // If the command template was "g++ -o app /tmp/code.cpp", we need to replace path
            if (entryCommand.includes('/tmp/code')) {
                // Complex command (C++, Rust script)
                // We run this in a shell for simplicity
                cmd = 'sh';
                args = ['-c', entryCommand.replace(/\/tmp\/code\.\w+/, filePath).replace(/\/tmp\/output\.png/, outputImgPath)];
            } else {
                // Simple command "python3"
                if (parts.length > 1) {
                    args = [...parts.slice(1), filePath];
                } else {
                    args = [filePath];
                }
            }
        }

        console.log(`[${socket.id}] Local Run: ${cmd} ${args.join(' ')}`);

        const child = spawn(cmd, args, { 
            cwd: tempDir,
            env: { ...process.env, MPLBACKEND: 'Agg' } // Python Matplotlib non-interactive
        });
        
        // Attach to session for potential kill
        session.process = child;

        child.stdout.on('data', (data) => socket.emit('output', { stream: 'stdout', data: data.toString() }));
        child.stderr.on('data', (data) => socket.emit('output', { stream: 'stderr', data: data.toString() }));

        child.on('close', (code) => {
            // Check for image output (e.g. matplotlib savefig)
            // We assume the user code might save to 'output.png' in cwd
            const possibleOut = path.join(tempDir, 'output.png'); // Python default often
            if (fs.existsSync(possibleOut)) {
                const img = fs.readFileSync(possibleOut, 'base64');
                socket.emit('output', { stream: 'stdout', data: `data:image/png;base64,${img}` });
                fs.unlinkSync(possibleOut);
            }
            
            // Clean up code
            try { fs.unlinkSync(filePath); } catch(e){}
            
            socket.emit('exit', code);
        });

        child.on('error', (err) => {
            socket.emit('error', 'Spawn Error: ' + err.message);
        });

      } catch (err) {
        socket.emit('error', 'Local Exec Error: ' + err.message);
      }
    }
  });

  socket.on('stop-session', () => cleanupSession(socket.id));
  socket.on('disconnect', () => cleanupSession(socket.id));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Mode: ${HAS_DOCKER ? 'Docker (High Isolation)' : 'Local (Process Fallback)'}`);
});