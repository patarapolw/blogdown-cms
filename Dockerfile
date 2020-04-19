FROM node:12-alpine
RUN mkdir -p /app
WORKDIR /app
COPY packages/server/package.json /app
RUN npm i
COPY packages/server /app
RUN npm run build
RUN npm prune
EXPOSE 8080
CMD [ "npm", "start" ]