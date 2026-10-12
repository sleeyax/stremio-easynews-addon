FROM node:24-alpine AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /build

# Copy every workspace manifest: --frozen-lockfile validates the lockfile against all projects it finds, so a missing one fails the check.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/addon/package.json ./packages/addon/
COPY packages/cloudflare-worker/package.json ./packages/cloudflare-worker/

# Install the addon and its dependencies only, leaving the cloudflare worker's toolchain out of the image.
RUN pnpm install --frozen-lockfile --filter "@easynews/addon..."

# Copy source files.
COPY tsconfig.*json ./
COPY packages/api ./packages/api
COPY packages/addon ./packages/addon

# Build the project.
RUN pnpm --filter "@easynews/addon..." run build

# Collect the addon and its workspace dependencies into a single self-contained directory.
RUN pnpm deploy --filter=@easynews/addon --prod /out

FROM node:24-alpine AS final

WORKDIR /app

# The LICENSE lives at the repository root, so it isn't part of the deployed package.
COPY LICENSE ./
COPY --from=builder /out ./

EXPOSE 1337

ENTRYPOINT ["node", "dist/server.js"]
