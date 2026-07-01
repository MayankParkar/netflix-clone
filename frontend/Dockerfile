# ── STAGE 1: Build the React app ─────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite compiles all TypeScript/React/Tailwind into static files in /app/dist
RUN npm run build

# ── STAGE 2: Serve the static files with Nginx ───────────────────────────────
# Nginx is a lightweight, battle-tested web server — perfect for serving
# pre-built static files. We don't need Node.js at all in this final image.
FROM nginx:alpine AS production

# Remove Nginx's default placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy ONLY the compiled static output from the builder stage
# Notice: no node_modules, no source code, no build tools ship in this image
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config — handles React Router's client-side routing correctly
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
