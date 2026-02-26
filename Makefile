SHELL := /bin/sh

COMPOSE := docker compose
SERVICE ?= rocket-web

.DEFAULT_GOAL := help

.PHONY: help pull refresh up down restart redeploy logs logs-follow ps

help: ## Show available commands with short descriptions.
	@printf "\nUsage: make <target>\n\n"
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "  %-14s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

pull: ## Pull latest git changes (fast-forward only).
	git pull --ff-only

refresh: ## Pull latest code and fully redeploy containers.
	$(MAKE) pull
	$(MAKE) redeploy

up: ## Build and start containers in detached mode.
	$(COMPOSE) up -d --build

down: ## Stop and remove containers.
	$(COMPOSE) down

restart: ## Restart containers without rebuilding.
	$(COMPOSE) down
	$(COMPOSE) up -d

redeploy: ## Recreate containers with a fresh image build.
	$(COMPOSE) down
	$(COMPOSE) up -d --build

logs: ## Show recent logs (use SERVICE=<name> to override).
	$(COMPOSE) logs --tail=200 $(SERVICE)

logs-follow: ## Follow live logs (use SERVICE=<name> to override).
	$(COMPOSE) logs -f $(SERVICE)

ps: ## List compose service status.
	$(COMPOSE) ps
