# Stage 1: Build Next.js frontend
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Python + Node.js runtime for Hugging Face Spaces (port 7860)
FROM python:3.11-slim AS runner
WORKDIR /app

# Copy Node.js 20 binary & npm from official image
COPY --from=node:20-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:20-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install CPU PyTorch + FastAPI dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.2.0 \
    && pip install --no-cache-dir -r requirements.txt

# Copy built frontend and backend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/next.config.ts ./next.config.ts
COPY backend ./backend
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Optional: set HF_MODEL_REPO in Space Variables to auto-download ISRO_BAH_2026 artifacts
ENV NODE_ENV=production \
    MODEL_API_URL=http://127.0.0.1:8000 \
    PORT=7860

EXPOSE 7860
CMD ["./start.sh"]
