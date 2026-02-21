# ── Stage 1: Build React-app ────────────────────────────────
FROM node:20-alpine AS builder

ARG VITE_API_KEY=njord-secret-change-me
ENV VITE_API_KEY=$VITE_API_KEY

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: nginx ───────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
