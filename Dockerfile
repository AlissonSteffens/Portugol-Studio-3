FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 PORTUGOL_DATA_DIR=/app/data/files
COPY --from=build /app/dist ./dist
COPY server ./server
COPY desktop ./desktop
COPY package.json ./package.json
RUN mkdir -p /app/data/files && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server/index.js"]
