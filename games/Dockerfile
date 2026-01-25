FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

RUN --mount=type=secret,id=npmrc \
    cat /run/secrets/npmrc > /root/.npmrc && \
    cat /run/secrets/npmrc > .npmrc && \
    npm ci

RUN rm -f .npmrc

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "build/index.js"]