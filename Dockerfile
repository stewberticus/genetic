FROM nginx

MAINTAINER Alex Stuart (mr@alexanderdwstuart.com)

COPY html/ /usr/share/nginx/html

EXPOSE 80