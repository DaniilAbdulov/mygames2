#!/bin/bash

# Вспомогательные функции
generate_manifests() {
  local environment=$1
  echo "📄 Генерация манифестов для окружения: $environment"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  CONFIG_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)/config"
  ROOT_DIR="$(cd $SCRIPT_DIR/../../../../ && pwd)"
  
  # Загружаем конфигурацию
  source "$CONFIG_DIR/k8s-config.sh"
  source "$CONFIG_DIR/services-config.sh"
  
  local templates_dir="$ROOT_DIR/templates"
  local manifests_dir="$ROOT_DIR/manifests"
  
  # Создаем директории
  mkdir -p "$manifests_dir/02-services"
  mkdir -p "$manifests_dir/03-deployments"
  
  echo "📁 Директория манифестов: $manifests_dir"
  echo "📁 Директория шаблонов: $templates_dir"
  
  # Для каждого сервиса
  for service in "${SERVICES[@]}"; do
    echo "🛠️  Генерация для $service"
    
    # Получаем конфигурацию сервиса
    local port_var="${service^^}_PORT"
    local replicas_var="${service^^}_REPLICAS"
    local memory_var="${service^^}_MEMORY_LIMIT"
    local cpu_var="${service^^}_CPU_LIMIT"
    
    # Экспортируем переменные для envsubst
    export SERVICE_NAME="$service"
    export PORT="${!port_var:-80}"
    export REPLICAS="${!replicas_var:-1}"
    export MEMORY_LIMIT="${!memory_var:-256Mi}"
    export CPU_LIMIT="${!cpu_var:-200m}"
    export IMAGE_TAG="\${IMAGE_TAG}"
    export K8S_NAMESPACE="myapp-dev"
    export ENVIRONMENT="\${ENVIRONMENT}"
    export POSTGRES_HOST="postgres"
    export POSTGRES_PASSWORD="0896"
    
    echo "  Конфигурация:"
    echo "    PORT: $PORT"
    echo "    REPLICAS: $REPLICAS"
    echo "    MEMORY_LIMIT: $MEMORY_LIMIT"
    echo "    CPU_LIMIT: $CPU_LIMIT"
    
    # Генерируем deployment из шаблона
    if [ -f "$templates_dir/deployment.tpl.yaml" ]; then
      envsubst < "$templates_dir/deployment.tpl.yaml" > \
        "$manifests_dir/03-deployments/${service}-deployment.yaml"
      echo "  ✅ deployment создан"
    fi

    # Генерируем service из шаблона
    if [ -f "$templates_dir/service.tpl.yaml" ]; then
      envsubst < "$templates_dir/service.tpl.yaml" > \
        "$manifests_dir/02-services/${service}-service.yaml"
      echo "  ✅ service создан"
    fi
  done
  
  # Создаем базовый namespace манифест
  cat > "$manifests_dir/00-namespace.yaml" << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \${K8S_NAMESPACE}
  labels:
    name: \${K8S_NAMESPACE}
    environment: \${ENVIRONMENT}
EOF
  echo "✅ namespace манифест создан"
  
  echo ""
  echo "🎉 Все манифесты сгенерированы!"
  echo "📁 Расположение: $manifests_dir"
  ls -la "$manifests_dir"/*/
}