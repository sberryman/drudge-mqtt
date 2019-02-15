FROM mhart/alpine-node:10

WORKDIR /app
COPY . .

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

RUN npm install --prod

CMD ["node", "index.js"]
