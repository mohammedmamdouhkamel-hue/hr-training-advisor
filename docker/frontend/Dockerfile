# ──────────────────────────────────────────────
# Stage 1 : Build the Vite + React application
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build with base=/ for Docker (overrides vite.config.ts base)
COPY . .
RUN npx vite build --base=/

# ──────────────────────────────────────────────
# Stage 2 : Serve with Nginx  (~45 MB image)
# ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx runs on port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
