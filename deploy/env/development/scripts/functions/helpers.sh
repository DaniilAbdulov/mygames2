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
    local health_var="${service^^}_HEALTH_PATH"
    local ready_var="${service^^}_READINESS_PATH"
    
    # Экспортируем переменные для envsubst
    export SERVICE_NAME="$service"
    export PORT="${!port_var:-3000}"
    export REPLICAS="${!replicas_var:-1}"
    export MEMORY_LIMIT="${!memory_var:-256Mi}"
    export CPU_LIMIT="${!cpu_var:-200m}"
    export HEALTH_PATH="${!health_var:-/health}"
    export READINESS_PATH="${!ready_var:-/ready}"
    export IMAGE_TAG="\${IMAGE_TAG}"
    export K8S_NAMESPACE="\${K8S_NAMESPACE}"
    export ENVIRONMENT="\${ENVIRONMENT}"
    
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
    else
      # Создаем простой deployment если шаблона нет
      cat > "$manifests_dir/03-deployments/${service}-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${service}
  namespace: \${K8S_NAMESPACE}
spec:
  replicas: ${REPLICAS}
  selector:
    matchLabels:
      app: ${service}
  template:
    metadata:
      labels:
        app: ${service}
    spec:
      containers:
      - name: ${service}
        image: \${IMAGE_TAG}
        ports:
        - containerPort: ${PORT}
        env:
        - name: NODE_ENV
          value: \${ENVIRONMENT}
        - name: SERVICE_NAME
          value: ${service}
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "${MEMORY_LIMIT}"
            cpu: "${CPU_LIMIT}"
EOF
      echo "  ✅ deployment создан (базовый)"
    fi
    
    # Генерируем service
    cat > "$manifests_dir/02-services/${service}-service.yaml" << EOF
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
    echo "  ✅ service создан"
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