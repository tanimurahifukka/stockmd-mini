# Dockerfile — stockmd-mini
# Minimal app image for the local sandbox. Stack-aware via build args; the
# bootstrap generator pins to a known-good base per stack.

FROM node:20-bookworm-slim AS base

WORKDIR /app

# Corepack picks the pnpm version declared in package.json's `packageManager`.
RUN corepack enable

# Copy manifest(s) first so install layer caches between source edits.
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Always install. The bootstrap ships package.json without a lockfile; pnpm
# will create one on first install and subsequent builds will be reproducible.
# We use --shamefully-hoist for compatibility with Next.js/eslint-config-next.
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install --no-frozen-lockfile; \
    fi

COPY . .

EXPOSE 3000
CMD ["pnpm", "dev"]

