/**
 * Dynamic Code Execution Backend
 * Uses Dockerode to spawn isolated containers for each user session.
 */
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Docker = require('dockerode');

const app = express();
const server = http.createServer(app);

// Allow specific origins in production, or * for dev
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Connect to Docker Daemon (socket file)
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Health check for Render
app.get('/', (req, res) => {
  res.send('Nexus Backend Active');
});

// Store active containers: Map<SocketID, ContainerID>
const activeContainers = new Map();

// Helper to safely clean up a container
const cleanupContainer = async (socketId) => {
  const containerId = activeContainers.get(socketId);
  if (!containerId) return;

  try {
    const container = docker.getContainer(containerId);
    const data = await container.inspect();
    
    if (data.State.Running) {
      console.log(`[${socketId}] Killing container ${containerId.substring(0, 8)}...`);
      await container.kill(); // Kill is faster than stop
    }
    
    // AutoRemove is set on creation, but we double check or try removal just in case
    try {
      await container.remove({ force: true });
    } catch (e) { 
      // Ignore 404 if it's already gone due to AutoRemove
      if (e.statusCode !== 404) console.error(`[${socketId}] Remove Error:`, e.message);
    }
    
    console.log(`[${socketId}] Container cleaned up.`);
  } catch (err) {
    if (err.statusCode !== 404) {
      console.error(`[${socketId}] Cleanup failed:`, err.message);
    }
  } finally {
    activeContainers.delete(socketId);
  }
};

io.on('connection', (socket) => {
  console.log(`[${socket.id}] Client connected`);

  // 1. Initialize Session: Create a container
  socket.on('init-session', async ({ language, image }) => {
    try {
      // Security measure: Cleanup any existing session for this socket first
      if (activeContainers.has(socket.id)) {
        await cleanupContainer(socket.id);
      }

      console.log(`[${socket.id}] Spawning ${language} (${image})...`);

      // Create sibling container
      const container = await docker.createContainer({
        Image: image,
        // Keep container alive with a minimal footprint
        Cmd: ['/bin/sh', '-c', 'while true; do sleep 1000; done'], 
        Tty: false,
        OpenStdin: true, // Keep stdin open for streaming input if needed
        HostConfig: {
            Memory: 512 * 1024 * 1024, // Hard limit: 512MB
            CpuPeriod: 100000,
            CpuQuota: 50000, // Hard limit: 50% of 1 CPU Core
            AutoRemove: true, // Docker automatically deletes filesystem on exit
            NetworkMode: 'none', // SANDBOX: No internet access
            // PidsLimit: 50 // Prevent fork bombs
        }
      });

      await container.start();
      activeContainers.set(socket.id, container.id);
      
      socket.emit('session-ready', { containerId: container.id });
      console.log(`[${socket.id}] Ready: ${container.id.substring(0, 8)}`);

    } catch (err) {
      console.error(`[${socket.id}] Init Error:`, err);
      socket.emit('error', 'Failed to initialize environment: ' + err.message);
    }
  });

  // 2. Run Code
  socket.on('run-code', async ({ code, extension, entryCommand }) => {
    const containerId = activeContainers.get(socket.id);
    if (!containerId) {
      return socket.emit('error', 'Session expired. Please reload.');
    }

    const container = docker.getContainer(containerId);

    try {
      // Step A: Write code to file inside container
      // Using base64 avoids shell escaping issues with special characters in code
      const b64Code = Buffer.from(code).toString('base64');
      const filename = `/tmp/code.${extension}`;
      
      const writeCmd = `echo "${b64Code}" | base64 -d > ${filename}`;
      
      const execWrite = await container.exec({
        Cmd: ['sh', '-c', writeCmd],
        AttachStdout: false,
        AttachStderr: true
      });
      await execWrite.start({}); 

      // Step B: Execute the run command
      // Construct command: e.g., "python3 /tmp/code.py" or "go run /tmp/code.go"
      let finalCommand = entryCommand;
      
      if (finalCommand.includes('/tmp/code')) {
          // If the command template already has the path (e.g., C++ compilation logic)
          // Ensure extension matches
          finalCommand = finalCommand.replace(/code\.\w+/, `code.${extension}`); 
      } else {
          // Standard interpreters
          finalCommand = `${entryCommand} ${filename}`;
      }

      console.log(`[${socket.id}] Executing: ${finalCommand}`);

      const exec = await container.exec({
        Cmd: ['sh', '-c', finalCommand],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start({});
      
      // Demultiplex stream to separate stdout and stderr
      container.modem.demuxStream(stream, {
        write: (chunk) => socket.emit('output', { stream: 'stdout', data: chunk.toString() })
      }, {
        write: (chunk) => socket.emit('output', { stream: 'stderr', data: chunk.toString() })
      });

      // Step C: Monitor Process Exit
      // Dockerode stream doesn't inherently emit exit code, so we inspect the exec instance
      const checkExit = setInterval(async () => {
          try {
            const inspect = await exec.inspect();
            if (!inspect.Running) {
                clearInterval(checkExit);

                // --- CHECK FOR GENERATED IMAGE OUTPUT (e.g. plots) ---
                try {
                    // Check for output.png, convert to base64, print to stdout, and delete
                    const imgCmd = 'if [ -f /tmp/output.png ]; then base64 /tmp/output.png; rm /tmp/output.png; fi';
                    const imgExec = await container.exec({
                        Cmd: ['sh', '-c', imgCmd],
                        AttachStdout: true,
                        AttachStderr: true
                    });
                    
                    const imgStream = await imgExec.start();
                    let imgData = '';
                    
                    // Safely capture output
                    container.modem.demuxStream(imgStream, {
                        write: (chunk) => { imgData += chunk.toString(); }
                    }, { write: () => {} });

                    // Short wait for stream buffer
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const cleaned = imgData.replace(/[\r\n\s]/g, '');
                    if (cleaned.length > 20) {
                        socket.emit('output', { stream: 'stdout', data: `data:image/png;base64,${cleaned}` });
                    }
                } catch (e) {
                    // Ignore image errors
                }
                // -----------------------------------------------------

                socket.emit('exit', inspect.ExitCode);
            }
          } catch(e) { 
            clearInterval(checkExit); 
          }
      }, 200);

    } catch (err) {
      console.error(`[${socket.id}] Execution Error:`, err);
      socket.emit('error', 'Execution failed: ' + err.message);
    }
  });

  // 3. Stop Session (Explicit)
  socket.on('stop-session', async () => {
     await cleanupContainer(socket.id);
     socket.emit('session-stopped');
  });

  // 4. Disconnect (Implicit Cleanup)
  socket.on('disconnect', async () => {
    console.log(`[${socket.id}] Disconnected`);
    await cleanupContainer(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});