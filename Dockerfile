FROM node:14.19.3

WORKDIR /app/quicksign

COPY package.json .

RUN apt-get update

RUN yarn

ENTRYPOINT ["./develop.sh"]