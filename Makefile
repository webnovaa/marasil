COMPOSE_FILE ?= compose.yaml
COMPOSE_DEV  ?= compose.dev.yaml
PROFILE      ?= dev
COMPOSE      := docker compose --profile $(PROFILE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV)

API_SERVICE  := api
WAIT_SCRIPT  := docker/scripts/wait-for-it.sh
BACKUP_DIR   ?= ./storage/backups

.PHONY: setup up down build test lint logs migrate seed health backup restore help ensure-env generate-secrets

help:
	@echo "Targets: setup up down build test lint logs migrate seed health backup restore"

ensure-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
	else \
		echo ".env already exists"; \
	fi
	@if [ ! -f apps/platform/.env ]; then \
		cp apps/platform/.env.example apps/platform/.env; \
		echo "Created apps/platform/.env from .env.example"; \
	fi

# Fill empty secrets in root .env (placeholders only — never commit .env)
generate-secrets: ensure-env
	@set -e; \
	if ! grep -qE '^SESSION_MASTER_KEY=.+' .env; then \
		key=$$(openssl rand -base64 32); \
		sed -i.bak "s|^SESSION_MASTER_KEY=.*|SESSION_MASTER_KEY=$$key|" .env && rm -f .env.bak; \
		echo "Generated SESSION_MASTER_KEY"; \
	fi; \
	if ! grep -qE '^INTERNAL_HMAC_SECRET=.+' .env; then \
		key=$$(openssl rand -base64 32); \
		sed -i.bak "s|^INTERNAL_HMAC_SECRET=.*|INTERNAL_HMAC_SECRET=$$key|" .env && rm -f .env.bak; \
		echo "Generated INTERNAL_HMAC_SECRET"; \
	fi; \
	if ! grep -qE '^SESSION_MASTER_KEY=.+' .env; then \
		key=$$(grep -E '^INTERNAL_HMAC_SECRET=' .env | cut -d= -f2-); \
		if [ -n "$$key" ]; then \
			sed -i.bak "s|^SESSION_MASTER_KEY=.*|SESSION_MASTER_KEY=$$key|" .env && rm -f .env.bak; \
			echo "Set SESSION_MASTER_KEY from INTERNAL_HMAC_SECRET"; \
		fi; \
	fi

setup: generate-secrets
	@$(COMPOSE) build
	@$(COMPOSE) up -d
	@echo "Waiting for dependencies..."
	@sh $(WAIT_SCRIPT) localhost:$${POSTGRES_PORT:-5432} -t 120 || true
	@sh $(WAIT_SCRIPT) localhost:$${REDIS_PORT:-6379} -t 120 || true
	@if ! grep -qE '^APP_KEY=base64:' .env; then \
		KEY=$$($(COMPOSE) exec -T $(API_SERVICE) php -r "echo 'base64:'.base64_encode(random_bytes(32));"); \
		sed -i.bak "s|^APP_KEY=.*|APP_KEY=$$KEY|" .env && rm -f .env.bak; \
		sed -i.bak "s|^APP_KEY=.*|APP_KEY=$$KEY|" apps/platform/.env && rm -f apps/platform/.env.bak; \
		echo "Generated APP_KEY"; \
		$(COMPOSE) up -d --force-recreate $(API_SERVICE) horizon scheduler; \
	else \
		$(COMPOSE) exec -T $(API_SERVICE) php artisan key:generate --force || true; \
	fi
	@$(COMPOSE) exec -T $(API_SERVICE) php artisan migrate --force
	@$(COMPOSE) exec -T $(API_SERVICE) php artisan db:seed --force || true
	@echo ""
	@echo "=============================================="
	@echo "  Marasil / مراسيل — development stack is ready"
	@echo "=============================================="
	@echo "  App:           http://localhost:$${NGINX_HTTP_PORT:-8080}"
	@echo "  Vite HMR:      http://localhost:$${VITE_PORT:-5173}"
	@echo "  API health:    http://localhost:$${NGINX_HTTP_PORT:-8080}/api/v1/health"
	@echo "=============================================="

up: ensure-env
	@$(COMPOSE) up -d

down:
	@$(COMPOSE) down

build:
	@$(COMPOSE) build

test:
	@$(COMPOSE) exec -T $(API_SERVICE) php artisan test
	@$(COMPOSE) run --rm --no-deps whatsapp-service npm test || \
		(cd apps/whatsapp-service && npm test)

lint:
	@$(COMPOSE) exec -T $(API_SERVICE) ./vendor/bin/pint --test || true
	@$(COMPOSE) run --rm --no-deps whatsapp-service npm run lint || \
		(cd apps/whatsapp-service && npm run lint)

logs:
	@$(COMPOSE) logs -f --tail=200

migrate:
	@$(COMPOSE) exec -T $(API_SERVICE) php artisan migrate --force

seed:
	@$(COMPOSE) exec -T $(API_SERVICE) php artisan db:seed --force

health:
	@echo "==> Nginx / Laravel /up"
	@curl -sf "http://localhost:$${NGINX_HTTP_PORT:-8080}/up" >/dev/null && echo "OK /up" || echo "FAIL /up"
	@echo "==> API /api/v1/health"
	@curl -sf "http://localhost:$${NGINX_HTTP_PORT:-8080}/api/v1/health" && echo "" || echo "FAIL /api/v1/health"
	@echo "==> Compose services"
	@$(COMPOSE) ps

backup:
	@mkdir -p $(BACKUP_DIR)
	@ts=$$(date +%Y%m%d_%H%M%S); \
	file="$(BACKUP_DIR)/postgres_$${ts}.sql.gz"; \
	$(COMPOSE) exec -T postgres sh -c 'pg_dump -U "$$POSTGRES_USER" "$$POSTGRES_DB"' | gzip > "$$file"; \
	echo "Backup written to $$file"

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make restore FILE=./storage/backups/postgres_YYYYMMDD_HHMMSS.sql.gz"; \
		exit 1; \
	fi
	@echo "Restoring $(FILE) ..."
	@gzip -dc "$(FILE)" | $(COMPOSE) exec -T postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
	@echo "Restore complete."
