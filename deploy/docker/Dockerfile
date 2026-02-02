# Стадия сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json
COPY package*.json ./

ARG NPM_TOKEN

# Устанавливаем ВСЕ зависимости (включая dev)
RUN if [ -n "${NPM_TOKEN}" ]; then \
      echo "@daniilabdulov:registry=https://npm.pkg.github.com" > .npmrc && \
      echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc && \
      npm install && \
      rm -f .npmrc; \
    else \
      npm install; \
    fi

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Стадия production
FROM node:20-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

ARG NPM_TOKEN

# Устанавливаем ТОЛЬКО production зависимости
RUN if [ -n "${NPM_TOKEN}" ]; then \
      echo "@daniilabdulov:registry=https://npm.pkg.github.com" > .npmrc && \
      echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc && \
      npm install --omit=dev && \
      rm -f .npmrc; \
    else \
      npm install --omit=dev; \
    fi

# Копируем собранный код из стадии builder
COPY --from=builder /app/build ./build

# Запускаем приложение
CMD ["node", "build/index.js"]