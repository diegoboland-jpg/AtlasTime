FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
RUN npm ci --omit=dev && mkdir -p /data && chown -R node:node /app /data
USER node
ENV PORT=4173
ENV ATLASTIME_DATA_FILE=/data/availability-requests.json
ENV ATLASTIME_BACKUP_DIR=/data/backups
EXPOSE 4173
CMD ["node", "server/index.mjs"]
