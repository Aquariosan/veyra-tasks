FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist/ ./dist/
ENTRYPOINT ["node", "dist/index.js"]
