FROM mhart/alpine-node:10

WORKDIR /app

# environment variables to make it easier in GUI editors
ENV NODE_ENV=production \
  DB_PATH="" \
  MQTT_URL="" \
  MQTT_TOPIC="news/drudge"

# install dependencies
COPY package*.json ./
RUN npm install --prod

# copy everything now that deps have been installed
COPY . .

CMD ["node", "index.js"]
