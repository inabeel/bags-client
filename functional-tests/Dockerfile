FROM node:6

RUN npm install webdriverio
COPY package.json /app/package.json
WORKDIR /app
RUN npm install
COPY wdio.conf.js /app/wdio.conf.js
COPY tests.js /app/tests.js

ENTRYPOINT ["./node_modules/.bin/wdio", "wdio.conf.js"]
