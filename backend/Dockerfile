# Use official Node.js LTS
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package.json / package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend code
COPY . .

# Build frontend if exists (optional)
# RUN npm run build --prefix frontend

# Expose port
EXPOSE 3001

# Start backend
CMD ["node", "server.js"]
