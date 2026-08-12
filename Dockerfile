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
COPY docker-entrypoint.sh /usr/local/bin/atlastime-entrypoint
RUN npm ci --omit=dev && apk add --no-cache su-exec && mkdir -p /data/backups && chown -R node:node /app /data && chmod 0755 /usr/local/bin/atlastime-entrypoint
ENV PORT=4173
ENV ATLASTIME_DATA_FILE=/data/availability-requests.json
ENV ATLASTIME_BACKUP_DIR=/data/backups
EXPOSE 4173
ENTRYPOINT ["/usr/local/bin/atlastime-entrypoint"]
CMD ["node", "server/index.mjs"]
