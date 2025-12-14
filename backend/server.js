/**
 * Nexus JS Playground Backend
 * Docker + Local Fallback Execution
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

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- CSP Header Middleware ---
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' blob:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:; " +
    "img-src 'self' data:; " +
    "connect-src 'self' ws: wss: *;"
  );
  next();
});

// --- Serve Frontend ---
const frontendPath = path.join(__dirname, 'frontend_build');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('Nexus JS Playground Backend is running!'));
}

// --- Docker Setup ---
const DOCKER_SOCKET = '/var/run/docker.sock';
const HAS_DOCKER = fs.existsSync(DOCKER_SOCKET);
let docker = null;

if (HAS_DOCKER) {
  try {
    docker = new Docker({ socketPath: DOCKER_SOCKET });
    console.log("✅ Docker detected. Using container isolation.");
  } catch {
    console.warn("⚠️ Docker init failed. Falling back to local execution.");
  }
} else {
  console.log("ℹ️ Docker not found. Using local process execution.");
}

// --- Active Sessions ---
const activeSessions = new Map();
const LOCAL_RUNTIMES = {
  node: 'node',
  python: 'python3',
  go: 'go run',
  ruby: 'ruby',
  php: 'php',
  bash: 'bash',
  sh: 'sh',
  gcc: 'g++',
  java: 'java'
};
const getLocalCommand = (image) => {
  if (image.includes('node')) return 'node';
  if (image.includes('python')) return 'python3';
  if (image.includes('golang')) return 'go run';
  if (image.includes('ruby')) return 'ruby';
  if (image.includes('php')) return 'php';
  if (image.includes('alpine') && !image.includes('gxx')) return 'sh';
  return null;
};

// --- Session Cleanup ---
const cleanupSession = async (socketId) => {
  const session = activeSessions.get(socketId);
  if (!session) return;
  if (session.type === 'docker') {
    try {
      const container = docker.getContainer(session.id);
      const data = await container.inspect();
      if (data.State.Running) await container.kill();
      try { await container.remove({ force: true }); } catch {}
    } catch {}
  } else if (session.type === 'local') {
    if (session.process && !session.process.killed) session.process.kill();
  }
  activeSessions.delete(socketId);
  console.log(`[${socketId}] Session cleaned up.`);
};

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log(`[${socket.id}] Connected`);
  socket.emit('system-status', { dockerAvailable: HAS_DOCKER && !!docker, mode: (HAS_DOCKER && !!docker) ? 'docker' : 'local' });

  // Init Session
  socket.on('init-session', async ({ language, image }) => {
    try {
      if (activeSessions.has(socket.id)) await cleanupSession(socket.id);
      if (HAS_DOCKER && docker) {
        const container = await docker.createContainer({
          Image: image,
          Cmd: ['/bin/sh', '-c', 'while true; do sleep 1000; done'],
          Tty: false,
          OpenStdin: true,
          HostConfig: { Memory: 512*1024*1024, CpuPeriod:100000, CpuQuota:50000, AutoRemove:true, NetworkMode:'none' }
        });
        await container.start();
        activeSessions.set(socket.id, { type: 'docker', id: container.id });
        socket.emit('session-ready', { containerId: container.id, mode: 'docker' });
      } else {
        const localCmd = getLocalCommand(image);
        activeSessions.set(socket.id, { type: 'local', cmd: localCmd });
        socket.emit('session-ready', { containerId: 'local-env', mode: 'local' });
      }
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Init failed: ' + err.message);
    }
  });

  // Run Code
  socket.on('run-code', async ({ code, extension, entryCommand }) => {
    const session = activeSessions.get(socket.id);
    if (!session) return socket.emit('error', 'Session expired.');
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `code_${socket.id}_${Date.now()}.${extension}`);

    if (session.type === 'docker') {
      const container = docker.getContainer(session.id);
      try {
        const b64Code = Buffer.from(code).toString('base64');
        const containerPath = `/tmp/${path.basename(filePath)}`;
        const writeCmd = `echo "${b64Code}" | base64 -d > ${containerPath}`;
        const execWrite = await container.exec({ Cmd: ['sh','-c', writeCmd] });
        await execWrite.start({});

        let finalCmd = entryCommand.includes('/tmp/code') ? entryCommand.replace(/\/tmp\/code\.\w+/, containerPath) : `${entryCommand} ${containerPath}`;
        const execRun = await container.exec({ Cmd: ['sh','-c', finalCmd], AttachStdout:true, AttachStderr:true });
        const stream = await execRun.start({});
        container.modem.demuxStream(stream, { write: c=>socket.emit('output',{stream:'stdout',data:c.toString()}) }, { write: c=>socket.emit('output',{stream:'stderr',data:c.toString()}) });

        const checkExit = setInterval(async () => {
          try {
            const inspect = await execRun.inspect();
            if (!inspect.Running) {
              clearInterval(checkExit);
              
              // Check for potential image output (e.g. from a script that wrote to /tmp/output.png)
              // This is a heuristic to support visual output from non-library code if it manages to produce a file
              const containerImgPath = '/tmp/output.png'; 
              const imgCmd = `if [ -f ${containerImgPath} ]; then base64 ${containerImgPath}; rm ${containerImgPath}; fi`;
              const imgExec = await container.exec({ Cmd: ['sh', '-c', imgCmd], AttachStdout: true });
              const imgStream = await imgExec.start();
              let imgData = '';
              container.modem.demuxStream(imgStream, { write: c => imgData += c.toString() }, { write: () => {} });
              
              if (imgData.replace(/\s/g, '').length > 20) {
                 socket.emit('output', { stream: 'stdout', data: `data:image/png;base64,${imgData.replace(/\s/g, '')}` });
              }

              socket.emit('exit', inspect.ExitCode);
              await container.exec({ Cmd:['rm',containerPath] }).then(e=>e.start({}));
            }
          } catch { clearInterval(checkExit); }
        }, 200);

      } catch (err) { socket.emit('error', 'Docker Exec Error: '+err.message); }

    } else {
      try {
        fs.writeFileSync(filePath, code);
        let cmd = session.cmd || 'node';
        let args = [filePath];
        if (entryCommand) {
          if (entryCommand.includes('/tmp/code')) {
            cmd = 'sh';
            args = ['-c', entryCommand.replace(/\/tmp\/code\.\w+/, filePath)];
          } else {
            const parts = entryCommand.split(' ');
            cmd = parts[0];
            args = [...parts.slice(1), filePath];
          }
        }
        const child = spawn(cmd, args, { cwd: tempDir, env:{...process.env, MPLBACKEND:'Agg'} });
        session.process = child;
        child.stdout.on('data', d=>socket.emit('output',{stream:'stdout',data:d.toString()}));
        child.stderr.on('data', d=>socket.emit('output',{stream:'stderr',data:d.toString()}));
        child.on('close', code=>{
          const possibleOut = path.join(tempDir,'output.png');
          if (fs.existsSync(possibleOut)) {
            const img = fs.readFileSync(possibleOut,'base64');
            socket.emit('output',{stream:'stdout',data:`data:image/png;base64,${img}`});
            fs.unlinkSync(possibleOut);
          }
          fs.unlinkSync(filePath);
          socket.emit('exit', code);
        });
        child.on('error', err=>socket.emit('error','Spawn Error: '+err.message));
      } catch(err){ socket.emit('error','Local Exec Error: '+err.message); }
    }
  });

  socket.on('stop-session', ()=>cleanupSession(socket.id));
  socket.on('disconnect', ()=>cleanupSession(socket.id));
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Mode: ${HAS_DOCKER ? 'Docker' : 'Local Fallback'}`);
});