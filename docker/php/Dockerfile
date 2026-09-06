# syntax=docker/dockerfile:1.7

FROM php:8.4-fpm-alpine AS php-base

RUN apk add --no-cache \
    bash curl git icu-dev libpng-dev libjpeg-turbo-dev freetype-dev \
    libzip-dev oniguruma-dev postgresql-dev linux-headers $PHPIZE_DEPS \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
    pdo_pgsql pgsql bcmath intl gd zip pcntl posix opcache \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && apk del $PHPIZE_DEPS \
  && rm -rf /tmp/pear

COPY --from=composer:2.8.11 /usr/bin/composer /usr/bin/composer
COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY docker/php/entrypoint.sh /usr/local/bin/laravel-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/laravel-entrypoint.sh

WORKDIR /var/www/html

FROM php-base AS vendor
COPY apps/platform/composer.json apps/platform/composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

FROM node:24-alpine AS frontend
WORKDIR /app
COPY apps/platform/package.json apps/platform/package-lock.json* ./
RUN npm ci
COPY apps/platform/ .
RUN npm run build

FROM php-base AS runtime
ENV APP_ENV=production
ENV APP_DEBUG=false
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
COPY --chown=app:app apps/platform/ /var/www/html
COPY --from=vendor --chown=app:app /var/www/html/vendor /var/www/html/vendor
COPY --from=frontend --chown=app:app /app/public/build /var/www/html/public/build
USER app
EXPOSE 9000
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=3 \
  CMD php -v >/dev/null || exit 1
CMD ["php-fpm", "-F"]
