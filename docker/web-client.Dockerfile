FROM node:18 AS build

WORKDIR /src

COPY ./web-client/package*.json ./web-client/
RUN cd web-client && npm ci

COPY ./web-client ./web-client/
RUN cd web-client && npm run build

FROM nginx AS server

COPY --from=build /src/web-client/build /usr/share/nginx/html
COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

