#!/bin/bash

# Docker функции

build_service() {
  local service=$1
  local environment=$2
  
  echo "📦 Сборка сервиса: $service (окружение: $environment)"
  
  # Проверяем существование сервиса
  local service_dir="../../../../$service"  # Из deploy/env/development/scripts/functions
  if [ ! -d "$service_dir" ]; then
    echo "❌ Ошибка: сервис $service не найден по пути: $service_dir"
    return 1
  fi
  
  # Определяем тег
  local image_tag="myapp-$service:$environment-$(date +%Y%m%d_%H%M%S)"
  local latest_tag="myapp-$service:latest"
  
  # Получаем порт для сервиса
  local port_var="${service^^}_PORT"
  local service_port="${!port_var:-3000}"
  
  echo "🔨 Использую Dockerfile: docker/Dockerfile"
  echo "📁 Директория сборки: $service_dir"
  
  # Собираем образ с ЕДИНЫМ Dockerfile
  docker build \
    --file "../../docker/Dockerfile" \
    --tag "$image_tag" \
    --tag "$latest_tag" \
    --build-arg SERVICE_NAME="$service" \
    --build-arg NODE_ENV="$environment" \
    --build-arg NPM_TOKEN="$NPM_TOKEN" \
    --label "service=$service" \
    --label "environment=$environment" \
    --label "version=$(date +%Y%m%d_%H%M%S)" \
    "$service_dir"
  
  # Сохраняем тег для использования в манифестах
  export CURRENT_IMAGE_TAG="$image_tag"
  
  echo "✅ Сборка завершена: $image_tag"
}

build_all_services() {
  local environment=$1
  
  echo "🏗️  Массовая сборка всех сервисов..."
  
  for service in "${SERVICES[@]}"; do
    build_service "$service" "$environment" || {
      echo "❌ Ошибка при сборке $service"
      return 1
    }
  done
  
  echo "✅ Все сервисы собраны"
}