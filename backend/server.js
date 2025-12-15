/**
 * Nexus JS Playground Backend
 * Docker + Local Fallback Execution
 */
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Docker = require('dockerode');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
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
  } catch (e) {
    console.warn("⚠️ Docker init failed. Falling back to local execution.", e);
  }
} else {
  console.log("ℹ️ Docker not found. Using local process execution.");
}

// --- Active Sessions ---
const activeSessions = new Map();

const getLocalCommand = (image) => {
  if (image.includes('node')) return 'node';
  if (image.includes('python')) return 'python';
  if (image.includes('golang')) return 'go run';
  if (image.includes('ruby')) return 'ruby';
  if (image.includes('php')) return 'php';
  if (image.includes('alpine') && !image.includes('gxx')) return 'sh';
  return null;
};

// --- Helper: Check for Output Files (Images, HTML, JSON) ---
const checkAndEmitOutputs = (socket, dir, cleanupFiles = []) => {
    const outputs = [
        { file: 'output.png', mime: 'image/png', isBinary: true },
        { file: 'output.jpg', mime: 'image/jpeg', isBinary: true },
        { file: 'output.jpeg', mime: 'image/jpeg', isBinary: true },
        { file: 'output.svg', mime: 'image/svg+xml', isBinary: false },
        { file: 'output.html', mime: 'text/html', isBinary: false },
        { file: 'output.json', mime: 'application/json', isBinary: false },
        { file: 'output.txt', mime: 'text/plain', isBinary: false }
    ];

    outputs.forEach(out => {
        const p = path.join(dir, out.file);
        if (fs.existsSync(p)) {
            try {
                if (out.isBinary) {
                    const b64 = fs.readFileSync(p, 'base64');
                    socket.emit('output', { stream: 'stdout', data: `data:${out.mime};base64,${b64}` });
                } else {
                    const content = fs.readFileSync(p, 'utf8');
                    socket.emit('output', { stream: 'stdout', data: content });
                }
                fs.unlinkSync(p);
            } catch (e) {
                console.error(`Error processing output file ${out.file}:`, e);
            }
        }
    });

    // Cleanup source files
    cleanupFiles.forEach(f => {
        if (fs.existsSync(f)) {
            try { fs.unlinkSync(f); } catch(e){}
        }
    });
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
          Cmd: ['/bin/sh', '-c', 'mkdir -p /workspace && while true; do sleep 1000; done'],
          Tty: false,
          OpenStdin: true,
          WorkingDir: '/workspace', // Dedicated workspace
          HostConfig: { Memory: 512*1024*1024, CpuPeriod:100000, CpuQuota:50000, AutoRemove:true, NetworkMode:'bridge' } // Allow network for installations
        });
        await container.start();
        activeSessions.set(socket.id, { type: 'docker', id: container.id });
        socket.emit('session-ready', { containerId: container.id, mode: 'docker' });
      } else {
        socket.emit('output', { stream: 'stdout', data: `[System] Docker not available. Using local host shell execution.\n` });
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
  socket.on('run-code', async ({ code, extension, entryCommand, files }) => {
    const session = activeSessions.get(socket.id);
    if (!session) return socket.emit('error', 'Session expired.');
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `code_${socket.id}_${Date.now()}.${extension}`);

    // If files are provided, we prepare them
    // files: [{ name, content (base64) }]
    const userFiles = files || [];

    if (session.type === 'docker') {
      const container = docker.getContainer(session.id);
      try {
        // 1. Write User Files to Container
        for (const file of userFiles) {
             const safeName = path.basename(file.name); // Basic sanitization
             // Write using shell redirect.
             // Warning: Large files via shell echo is risky, but suitable for playground snippets.
             const writeCmd = `echo "${file.content}" | base64 -d > /workspace/${safeName}`;
             const execFile = await container.exec({ Cmd: ['sh', '-c', writeCmd] });
             await execFile.start({});
        }

        // 2. Write Code File
        const b64Code = Buffer.from(code).toString('base64');
        const containerPath = `/workspace/code.${extension}`; 
        const writeCodeCmd = `echo "${b64Code}" | base64 -d > ${containerPath}`;
        const execWrite = await container.exec({ Cmd: ['sh','-c', writeCodeCmd] });
        await execWrite.start({});

        // 3. Construct Run Command
        let finalCmd = entryCommand;
        
        // Handle file path injection
        if (finalCmd.includes('/tmp/code')) {
            finalCmd = finalCmd.replace(/\/tmp\/code\.\w+/, containerPath);
        } else {
             finalCmd = `${finalCmd} ${containerPath}`;
        }

        // 4. Execute
        const execRun = await container.exec({ 
            Cmd: ['sh','-c', finalCmd], 
            AttachStdout:true, 
            AttachStderr:true,
            WorkingDir: '/workspace'
        });
        const stream = await execRun.start({});
        container.modem.demuxStream(stream, { write: c=>socket.emit('output',{stream:'stdout',data:c.toString()}) }, { write: c=>socket.emit('output',{stream:'stderr',data:c.toString()}) });

        // 5. Monitor & Extract Outputs
        const checkExit = setInterval(async () => {
          try {
            const inspect = await execRun.inspect();
            if (!inspect.Running) {
              clearInterval(checkExit);
              
              // Extract Outputs using cat + base64 inside container
              const outputScript = `
                for f in /workspace/output.png /workspace/output.jpg /workspace/output.svg /workspace/output.html /workspace/output.json /workspace/output.txt; do
                  if [ -f "$f" ]; then
                    echo "---START-$f---"
                    cat "$f" | base64
                    echo "---END-$f---"
                    rm "$f"
                  fi
                done
              `;
              
              const outExec = await container.exec({ Cmd: ['sh', '-c', outputScript], AttachStdout: true });
              const outStream = await outExec.start();
              let outData = '';
              container.modem.demuxStream(outStream, { write: c => outData += c.toString() }, { write: () => {} });
              
              const regex = /---START-(.*?)---([\s\S]*?)---END-.*?---/g;
              let match;
              while ((match = regex.exec(outData)) !== null) {
                  const filename = match[1];
                  const contentB64 = match[2].trim();
                  let mime = 'text/plain';
                  if (filename.endsWith('.png')) mime = 'image/png';
                  if (filename.endsWith('.jpg')) mime = 'image/jpeg';
                  if (filename.endsWith('.svg')) mime = 'image/svg+xml';
                  if (filename.endsWith('.html')) mime = 'text/html';
                  if (filename.endsWith('.json')) mime = 'application/json';

                  if (mime.startsWith('image/')) {
                      socket.emit('output', { stream: 'stdout', data: `data:${mime};base64,${contentB64}` });
                  } else {
                      const text = Buffer.from(contentB64, 'base64').toString('utf-8');
                      socket.emit('output', { stream: 'stdout', data: text });
                  }
              }

              socket.emit('exit', inspect.ExitCode);
            }
          } catch (e) { 
              clearInterval(checkExit); 
              console.error("Docker Check Error", e);
          }
        }, 200);

      } catch (err) { socket.emit('error', 'Docker Exec Error: '+err.message); }

    } else {
      // Local Execution Fallback
      try {
        // --- DEBUG DIAGNOSTICS START ---
        const debugEnv = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            cwd: process.cwd(),
            path: process.env.PATH || '',
            user: process.env.USER || process.env.USERNAME || 'unknown',
            tempDir: tempDir,
            hasPython: false,
            hasPython3: false,
            hasNode: false
        };

        // Simple check for binaries
        try { execSync('python --version', { stdio: 'ignore' }); debugEnv.hasPython = true; } catch(e){}
        try { execSync('python3 --version', { stdio: 'ignore' }); debugEnv.hasPython3 = true; } catch(e){}
        try { execSync('node --version', { stdio: 'ignore' }); debugEnv.hasNode = true; } catch(e){}

        const debugMessage = `
[DEBUG DIAGNOSTICS]
----------------------------------------
System: ${debugEnv.platform} (${debugEnv.arch})
Node Runtime: ${debugEnv.nodeVersion}
User: ${debugEnv.user}
WorkDir: ${debugEnv.cwd}
TempDir: ${debugEnv.tempDir}
PATH:
${debugEnv.path.split(path.delimiter).map(p => `  - ${p}`).join('\n')}

Binaries:
- python: ${debugEnv.hasPython ? 'FOUND' : 'MISSING'}
- python3: ${debugEnv.hasPython3 ? 'FOUND' : 'MISSING'}
- node: ${debugEnv.hasNode ? 'FOUND' : 'MISSING'}

Execution:
- Entry Command: ${entryCommand}
- Target File: ${filePath}
----------------------------------------
`;
        socket.emit('output', { stream: 'stdout', data: debugMessage });
        // --- DEBUG DIAGNOSTICS END ---

        fs.writeFileSync(filePath, code);
        
        // Write user files to temp dir
        for (const file of userFiles) {
            const fileBuf = Buffer.from(file.content, 'base64');
            fs.writeFileSync(path.join(tempDir, path.basename(file.name)), fileBuf);
        }

        let cmd = session.cmd || 'node';
        let args = [filePath];
        
        if (entryCommand) {
          if (entryCommand.includes('/tmp/code')) {
            cmd = 'sh';
            args = ['-c', entryCommand.replace(/\/tmp\/code\.\w+/, filePath)];
          } else {
            cmd = 'sh';
            args = ['-c', `${entryCommand} ${filePath}`];
          }
        }
        
        const child = spawn(cmd, args, { cwd: tempDir, env:{...process.env, MPLBACKEND:'Agg'} });
        session.process = child;
        child.stdout.on('data', d=>socket.emit('output',{stream:'stdout',data:d.toString()}));
        child.stderr.on('data', d=>socket.emit('output',{stream:'stderr',data:d.toString()}));
        child.on('close', code=>{
          checkAndEmitOutputs(socket, tempDir, [filePath]); // This will clean up the code file
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
