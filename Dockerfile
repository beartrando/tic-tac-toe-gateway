ARG VERSION=dev

# ---------- BASE ----------
FROM node:22-slim AS base

WORKDIR /usr/src/app

COPY shared ./shared
COPY proto ./proto

COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

COPY services/server/gateway/package*.json ./services/server/gateway/
COPY services/server/gateway/jest.config.js ./services/server/gateway/
COPY services/server/gateway/jest.setup.ts ./services/server/gateway/
COPY services/server/gateway/tsconfig.json ./services/server/gateway/
COPY services/server/gateway/src ./services/server/gateway/src/

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssl \
        protobuf-compiler \
        libprotobuf-dev \
        wget \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.28.4 --activate


# ---------- DEPS ----------
FROM base AS deps

RUN pnpm fetch
RUN pnpm install --offline --frozen-lockfile --ignore-scripts

RUN mkdir -p ./services/server/gateway/src/contracts/proto
RUN pnpm --filter gateway proto:generate

RUN pnpm --filter @shared/logger build
#RUN pnpm --filter @shared/cache-store build
#RUN pnpm --filter @shared/state-store build
#RUN pnpm --filter @shared/timer build
#RUN pnpm --filter @shared/kafka-manager build
#RUN pnpm --filter @shared/pg-boss-manager build
RUN pnpm --filter @shared/persistent-logger build
RUN pnpm --filter @shared/grpc-client-manager build
RUN pnpm --filter @shared/errors proto:generate
RUN pnpm --filter @shared/errors build
RUN pnpm --filter @shared/otel build

RUN rm -rf node_modules \
    && pnpm install --offline --frozen-lockfile --ignore-scripts

RUN pnpm --filter gateway prisma:generate

# ---------- DEV ----------
FROM deps AS dev

COPY services/server/gateway/tsconfig.test.json ./services/server/gateway/

ENV NODE_ENV=development

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 50051
EXPOSE 9090

CMD ["pnpm", "--filter", "gateway", "dev"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:9090/gateway/livez || exit 1

# ---------- BUILD ----------
FROM deps AS build

ENV NODE_ENV=production

RUN pnpm --filter gateway build

RUN pnpm --filter gateway deploy /deploy --prod

#RUN GENERATED_PRISMA_DIR=$(dirname "$(find /usr/src/app/node_modules/.pnpm -path "*/.prisma/client/default.js" | head -1)") \
#    && PRISMA_PKG_DIR=$(find /deploy/node_modules/.pnpm -type d -name client -path "*@prisma*" | head -1) \
#    && NODE_MODULES_DIR=$(dirname "$(dirname "$PRISMA_PKG_DIR")") \
#    && mkdir -p "$NODE_MODULES_DIR/.prisma" \
#    && rm -rf "$NODE_MODULES_DIR/.prisma/client" \
#    && cp -r "$GENERATED_PRISMA_DIR" "$NODE_MODULES_DIR/.prisma/client" \
#    && mkdir -p /deploy/node_modules/.prisma \
#    && rm -rf /deploy/node_modules/.prisma/client \
#    && cp -r "$GENERATED_PRISMA_DIR" /deploy/node_modules/.prisma/client


# ---------- PROD ----------
FROM node:22-slim AS prod

ARG VERSION=dev

ENV APP_VERSION=$VERSION
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssl \
        wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=build /deploy/dist ./dist
COPY --from=build /deploy/node_modules ./node_modules

RUN printf "%s\n" "$VERSION" > VERSION

LABEL org.opencontainers.image.version="$VERSION"

USER node

EXPOSE 50051
EXPOSE 9090

CMD ["node", "dist/app.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:9090/gateway/livez || exit 1

# ---------- PREDEPLOY ----------
FROM node:22-slim AS predeploy

CMD ["sh", "-c", "echo 'no predeploy step'"]
