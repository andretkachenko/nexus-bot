FROM node:16.15
WORKDIR /app
COPY . .
RUN npm ci
CMD ["npm", "start"]
