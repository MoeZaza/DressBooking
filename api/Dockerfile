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

FROM node:lts-alpine
WORKDIR /bookdress/api

# Install curl for health checks
RUN apk add --no-cache curl

COPY ./api ./
COPY ./api/.env.docker .env
COPY --from=packages /bookdress/packages /bookdress/packages
RUN npm install
RUN npm run build

# Create startup script that initializes database and starts the API server
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'echo "Starting BookDress API..."' >> /startup.sh && \
    echo 'echo "Waiting for MongoDB to be ready..."' >> /startup.sh && \
    echo 'sleep 30' >> /startup.sh && \
    echo 'echo "Initializing database..."' >> /startup.sh && \
    echo 'npm run db:init:prod || echo "Database initialization failed or already exists"' >> /startup.sh && \
    echo 'echo "Starting API server..."' >> /startup.sh && \
    echo 'npm start' >> /startup.sh && \
    chmod +x /startup.sh

CMD ["/startup.sh"]
EXPOSE 4002
