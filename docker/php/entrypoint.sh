#!/bin/sh
set -e

mkdir -p \
  storage/framework/views \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/logs \
  storage/app/private \
  storage/app/public \
  bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

# vendor/ may live on a Docker volume (see compose.dev.yaml) — bootstrap once.
if [ ! -f vendor/autoload.php ] && [ -f composer.json ]; then
  echo "Installing Composer dependencies into Docker volume..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

exec "$@"
