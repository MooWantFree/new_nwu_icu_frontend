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

ARG UPLOAD_UID=10001
ARG UPLOAD_GID=10001
RUN addgroup -g "$UPLOAD_GID" resource-files \
    && adduser -D -H -u "$UPLOAD_UID" -G resource-files resource-reader \
    && sed -i 's/^user[[:space:]]\+nginx;/user resource-reader resource-files;/' /etc/nginx/nginx.conf \
    && grep -q '^user resource-reader resource-files;' /etc/nginx/nginx.conf

ARG FRONTEND_COMMIT=unknown
ARG BACKEND_COMMIT=unknown
ARG FRONTEND_GITHUB_URL=
ARG BACKEND_IMAGE=
LABEL org.opencontainers.image.source=$FRONTEND_GITHUB_URL \
    org.opencontainers.image.revision=$FRONTEND_COMMIT \
    io.nwuicu.backend-commit=$BACKEND_COMMIT \
    io.nwuicu.backend-image=$BACKEND_IMAGE

COPY nginx/zip-download-limit.conf /etc/nginx/conf.d/00-zip-download-limit.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/snippets/ /etc/nginx/snippets/
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/startup.css || exit 1
