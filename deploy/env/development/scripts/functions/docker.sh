#!/bin/bash

# Docker функции

build_service() {
  local service=$1
  local environment=$2

  NPM_TOKEN=""
  
  echo "📦 Сборка сервиса: $service (окружение: $environment)"
  
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd $SCRIPT_DIR/../../../../../ && pwd)"
  local service_dir="${ROOT_DIR}/$service"

  if [ ! -d "$service_dir" ]; then
    echo "❌ Ошибка: сервис $service не найден по пути: $service_dir"
    return 1
  fi
  
  # ФИКСИРОВАННЫЙ тег для каждого окружения
  local image_tag=""
  case "$environment" in
    "development")
      image_tag="myapp-$service:dev"      # Фиксированный тег для разработки
      ;;
    "staging")
      image_tag="myapp-$service:staging"  # Фиксированный тег для staging
      ;;
    "production")
      # Для production используем версию из package.json
      local version=$(node -p "require('$service_dir/package.json').version" 2>/dev/null || echo "latest")
      image_tag="myapp-$service:v$version"
      ;;
    *)
      image_tag="myapp-$service:latest"   # Fallback
      ;;
  esac
  
  echo "🔨 Использую Dockerfile: docker/Dockerfile"
  echo "📁 Директория сборки: $service_dir"
  echo "🏷️  Тег образа: $image_tag"
  
  # Собираем образ
  docker build \
    --file "${ROOT_DIR}/deploy/docker/Dockerfile" \
    --tag "$image_tag" \
    --build-arg SERVICE_NAME="$service" \
    --build-arg NODE_ENV="$environment" \
    --build-arg NPM_TOKEN="$NPM_TOKEN" \
    --label "service=$service" \
    --label "environment=$environment" \
    --label "build-date=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    "$service_dir"
  
  # Определяем тип кластера для локальной разработки
  local context=$(kubectl config current-context 2>/dev/null || echo "")
  
  # Если это Minikube - загружаем образ
  if [[ "$context" == *"minikube"* ]] && [ "$environment" = "development" ]; then
    echo "🚚 Загрузка образа в Minikube..."
    minikube image load "$image_tag"
  fi
  
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