#!/bin/bash

# Конфигурация сервисов

# Список всех сервисов
SERVICES=("users" "games")

# Конфигурация Users сервиса
USERS_PORT=3000
USERS_REPLICAS=2
USERS_MEMORY_LIMIT="256Mi"
USERS_CPU_LIMIT="200m"
USERS_HEALTH_PATH="/health"
USERS_READINESS_PATH="/ready"

# Конфигурация Games сервиса
GAMES_PORT=3001
GAMES_REPLICAS=3
GAMES_MEMORY_LIMIT="512Mi"
GAMES_CPU_LIMIT="500m"
GAMES_HEALTH_PATH="/api/health"
GAMES_READINESS_PATH="/api/ready"