# Stage 1: Build production bundle
FROM node:20-slim AS builder

WORKDIR /app

# Copy only package.json so npm installs native Linux binaries without Windows lockfile platform locks
COPY package.json ./

# Install dependencies for target Linux environment
RUN npm install

# Copy application source code
COPY . .

# Optional build arg for remote API URL if not using reverse proxy
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build frontend with Vite
RUN npm run build

# Stage 2: Serve static bundle via Nginx
FROM nginx:alpine AS runner

# Remove default nginx site config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
