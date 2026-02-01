#!/bin/bash

# Генерация манифестов из шаблонов

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "$SCRIPT_DIR/env/development/config/k8s-config.sh"
source "$SCRIPT_DIR/env/development/config/services-config.sh"

TEMPLATES_DIR="$SCRIPT_DIR/templates"
MANIFESTS_DIR="$SCRIPT_DIR/manifests"

echo "Генерация манифестов..."

# Создаем директории
mkdir -p "$MANIFESTS_DIR/02-services"
mkdir -p "$MANIFESTS_DIR/03-deployments"

# Для каждого сервиса
for service in "${SERVICES[@]}"; do
  echo "Генерация для $service"
  
  # Получаем конфигурацию сервиса
  port_var="${service^^}_PORT"
  replicas_var="${service^^}_REPLICAS"
  memory_var="${service^^}_MEMORY_LIMIT"
  cpu_var="${service^^}_CPU_LIMIT"
  health_var="${service^^}_HEALTH_PATH"
  ready_var="${service^^}_READINESS_PATH"
  
  # Экспортируем переменные для envsubst
  export SERVICE_NAME="$service"
  export PORT="${!port_var:-3000}"
  export REPLICAS="${!replicas_var:-1}"
  export MEMORY_LIMIT="${!memory_var:-256Mi}"
  export CPU_LIMIT="${!cpu_var:-200m}"
  export HEALTH_PATH="${!health_var:-/health}"
  export READINESS_PATH="${!ready_var:-/ready}"
  export IMAGE_TAG="\${IMAGE_TAG}" # Заполнится при деплое
  
  # Генерируем deployment
  envsubst < "$TEMPLATES_DIR/deployment.tpl.yaml" > \
    "$MANIFESTS_DIR/03-deployments/${service}-deployment.yaml"
  
  # Генерируем service
  cat > "$MANIFESTS_DIR/02-services/${service}-service.yaml" << EOF
apiVersion: v1
kind: Service
metadata:
  name: ${service}
  namespace: \${K8S_NAMESPACE}
spec:
  selector:
    app: ${service}
  ports:
  - port: ${PORT}
    targetPort: ${PORT}
  type: ClusterIP
EOF
  
  echo "  ✅ $service: deployment и service сгенерированы"
done

echo "✅ Все манифесты сгенерированы в $MANIFESTS_DIR"