FROM node:12.18-alpine

WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=8013

EXPOSE 8013

COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock

RUN yarn install

COPY . /app
RUN yarn tsc

CMD ["yarn", "production"]