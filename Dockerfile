FROM node:12-alpine AS web
RUN apk add git
RUN mkdir -p /app
WORKDIR /app
COPY packages/web/package.json packages/web/package-lock.json /app/
RUN npm i
COPY packages/web /app
RUN npm run build

FROM node:12-alpine AS server
RUN mkdir -p /app
WORKDIR /app
COPY packages/server/package.json /app
RUN npm i
COPY packages/server /app
RUN npm run build
RUN npm prune --production

FROM astefanutti/scratch-node:12
COPY --from=server /app/node_modules node_modules
COPY --from=server /app/dist dist
COPY --from=web /app/dist public
EXPOSE 8080
ENTRYPOINT [ "node", "dist/index.js" ]
