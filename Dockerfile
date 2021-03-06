FROM node:14-alpine

WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn build:prod && (rm -r src & rm -r node_modules && yarn install --frozen-lockfile --production)

COPY config.json ./

CMD yarn start:prod
