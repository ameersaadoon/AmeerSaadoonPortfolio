FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY index.html styles.css script.js app-server.js ./
COPY public ./public
COPY assets ./assets
EXPOSE 3000
CMD ["node", "app-server.js"]
