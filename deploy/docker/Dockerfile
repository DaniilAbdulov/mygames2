# Единый Dockerfile для всех Node.js микросервисов
FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Установка зависимостей
ARG NPM_TOKEN
RUN if [ -n "${NPM_TOKEN}" ]; then \
      echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
      npm ci --only=production && \
      rm -f .npmrc; \
    else \
      npm ci --only=production; \
    fi

# Копируем исходный код сервиса
COPY src/ ./src/

# Переменные окружения
ARG SERVICE_NAME
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV} \
    SERVICE_NAME=${SERVICE_NAME} \
    PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]