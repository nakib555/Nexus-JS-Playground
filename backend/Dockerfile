# Use a lightweight Node.js image for the backend service itself
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package definition files first to leverage Docker cache
COPY package*.json ./

# Install backend dependencies (express, socket.io, dockerode)
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the port the server listens on
EXPOSE 3001

# Start the backend server
CMD ["node", "server.js"]
