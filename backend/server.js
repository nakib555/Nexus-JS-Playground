/**
 * Dynamic Code Execution Backend
 * Uses Dockerode to spawn isolated containers for each user session.
 */
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const { Stream } = require('stream');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for the playground
    methods: ["GET", "POST"]
  }
});

// Connect to Docker Daemon (socket file)
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Store active containers: { socketId: containerId }
const activeContainers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 1. Initialize Session: Create a container
  socket.on('init-session', async ({ language, image }) => {
    try {
      console.log(`[${socket.id}] Initializing ${language} (${image})`);
      
      // Cleanup existing if any
      if (activeContainers.has(socket.id)) {
        await cleanupContainer(socket.id);
      }

      // Check if image exists, pull if not (simplified)
      // In production, you might want to pre-pull images
      
      const container = await docker.createContainer({
        Image: image,
        Cmd: ['/bin/sh', '-c', 'while true; do sleep 1000; done'], // Keep alive
        Tty: false,
        OpenStdin: true,
        HostConfig: {
            Memory: 512 * 1024 * 1024, // Limit to 512MB
            CpuPeriod: 100000,
            CpuQuota: 50000, // Limit to 50% CPU
            AutoRemove: true, // Automatically remove when stopped
            NetworkMode: 'none' // No internet access for security
        }
      });

      await container.start();
      activeContainers.set(socket.id, container);
      
      socket.emit('session-ready', { containerId: container.id });
      console.log(`[${socket.id}] Container started: ${container.id}`);

    } catch (err) {
      console.error(`[${socket.id}] Init Error:`, err);
      socket.emit('error', 'Failed to initialize container: ' + err.message);
    }
  });

  // 2. Run Code
  socket.on('run-code', async ({ code, extension, entryCommand }) => {
    const container = activeContainers.get(socket.id);
    if (!container) {
      return socket.emit('error', 'No active container session');
    }

    try {
      // Create a temporary file inside the container
      // We use 'exec' to write the file because we don't share volumes
      // Escaping code for echo is tricky, so we use base64
      const b64Code = Buffer.from(code).toString('base64');
      const filename = `/tmp/code.${extension}`;
      
      // Write file command
      const writeCmd = `echo "${b64Code}" | base64 -d > ${filename}`;
      
      // Setup Execution
      const execWrite = await container.exec({
        Cmd: ['sh', '-c', writeCmd],
        AttachStdout: false,
        AttachStderr: true
      });
      await execWrite.start({}); // Wait for write to finish

      // Run code command (e.g., "python3 /tmp/code.py")
      // If C++, entryCommand is complex: "g++ ... && ./app"
      let finalCommand = entryCommand;
      if (finalCommand.includes('/tmp/code')) {
          // Command already includes the file path (e.g. C++ compilation)
          // Ensure we use the correct extension in the command if needed, but client usually sends full string
          finalCommand = finalCommand.replace('code.cpp', `code.${extension}`); 
      } else {
          finalCommand = `${entryCommand} ${filename}`;
      }

      console.log(`[${socket.id}] Running: ${finalCommand}`);

      const exec = await container.exec({
        Cmd: ['sh', '-c', finalCommand],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start({});
      
      // Dockerode returns a multiplexed stream. We need to demux it.
      container.modem.demuxStream(stream, {
        write: (chunk) => socket.emit('output', { stream: 'stdout', data: chunk.toString() })
      }, {
        write: (chunk) => socket.emit('output', { stream: 'stderr', data: chunk.toString() })
      });

      // Monitor exit code (polling exec instance)
      const checkExit = setInterval(async () => {
          try {
            const inspect = await exec.inspect();
            if (!inspect.Running) {
                clearInterval(checkExit);
                socket.emit('exit', inspect.ExitCode);
            }
          } catch(e) { clearInterval(checkExit); }
      }, 500);

    } catch (err) {
      console.error(`[${socket.id}] Run Error:`, err);
      socket.emit('error', 'Execution failed: ' + err.message);
    }
  });

  // 3. Cleanup on Disconnect
  socket.on('disconnect', async () => {
    console.log(`[${socket.id}] Disconnected`);
    await cleanupContainer(socket.id);
  });
});

async function cleanupContainer(socketId) {
  const container = activeContainers.get(socketId);
  if (container) {
    try {
      console.log(`[${socketId}] Stopping container...`);
      await container.stop(); // AutoRemove is set, so it deletes itself
      activeContainers.delete(socketId);
    } catch (err) {
      // Container might already be stopped
      console.log(`[${socketId}] Cleanup warning: ${err.message}`);
    }
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
