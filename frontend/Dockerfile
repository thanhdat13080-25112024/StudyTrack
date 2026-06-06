# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (use lockfile when present for reproducible builds).
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the static SPA.
COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine AS runtime

# SPA history-fallback config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static output from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
