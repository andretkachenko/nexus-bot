FROM node:16.15
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
