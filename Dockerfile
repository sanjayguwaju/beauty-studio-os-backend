FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy package.json and install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8000

CMD ["node", "dist/server.js"]
