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

# Optional Docker first-boot (api / php-fpm only — not horizon/scheduler).
# Set in root .env (compose env_file):
#   RUN_MIGRATIONS=true
#   RUN_DB_SEED=true          # production: needs SUPER_ADMIN_* ; local: seeds demo accounts
is_truthy() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

should_bootstrap_db=0
for arg in "$@"; do
  case "$arg" in
    php-fpm|php-fpm*) should_bootstrap_db=1 ;;
  esac
done

if [ "$should_bootstrap_db" -eq 1 ]; then
  if is_truthy "${RUN_MIGRATIONS:-false}"; then
    echo "[entrypoint] RUN_MIGRATIONS: php artisan migrate --force"
    php artisan migrate --force
  fi

  if is_truthy "${RUN_DB_SEED:-false}"; then
    echo "[entrypoint] RUN_DB_SEED: php artisan db:seed --force"
    php artisan db:seed --force
  fi
fi

exec "$@"
