FROM node:6
WORKDIR /usr/src/
COPY package*.json ./
RUN npm install -g gulp
RUN npm install
COPY . .
EXPOSE 3100
CMD [ "npm", "start" ]