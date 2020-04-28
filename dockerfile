FROM node:slim
RUN npm i npm@latest -g
RUN apt-get update && apt-get -y install netcat && apt-get clean
RUN mkdir /app && chown node:node /app
WORKDIR /app
USER node
COPY package.json .
COPY wait-for.sh .
RUN npm i -q --no-optional && npm cache clean -f
