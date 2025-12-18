# syntax=docker/dockerfile:1

FROM node:lts-alpine AS packages
WORKDIR /bookdress/packages

COPY ./packages /bookdress/packages

# Install dependencies and build all internal packages
RUN set -e && \
  find ./ -mindepth 1 -maxdepth 1 -type d \
  -exec sh -c 'for dir; do \
    if [ -f "$dir/package.json" ]; then \
      echo "Installing dependencies in $dir"; \
      npm --prefix "$dir" install; \
      echo "Building package in $dir"; \
      npm --prefix "$dir" run build 2>/dev/null || echo "No build script in $dir"; \
    fi; \
  done' _ {} +

FROM node:lts-alpine as build
WORKDIR /bookdress/backend
COPY ./backend ./
COPY ./backend/.env.docker .env
COPY --from=packages /bookdress/packages /bookdress/packages
RUN npm install --force
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

RUN rm -rf -- *
COPY --from=build /bookdress/backend/build .
COPY ./backend/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 3001
