FROM node:12-alpine AS web
RUN apk add git
RUN mkdir -p /app
WORKDIR /app
COPY packages/web/package.json /app
RUN npm i
COPY packages/web /app
RUN npm run build

FROM node:12-alpine
RUN mkdir -p /app
WORKDIR /app
COPY packages/server/package.json /app
RUN npm i
COPY packages/server /app
RUN npm run build
RUN npm prune
COPY --from=web /app/dist public
EXPOSE 8080
CMD [ "npm", "start" ]