FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG FRONTEND_COMMIT=unknown
ARG BACKEND_COMMIT=unknown
ARG FRONTEND_GITHUB_URL=
ARG BACKEND_GITHUB_URL=
ENV VITE_FRONTEND_COMMIT=$FRONTEND_COMMIT \
    VITE_BACKEND_COMMIT=$BACKEND_COMMIT \
    VITE_FRONTEND_GITHUB_URL=$FRONTEND_GITHUB_URL \
    VITE_BACKEND_GITHUB_URL=$BACKEND_GITHUB_URL
RUN pnpm build

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
