#!/bin/bash

run_postgres() {
  local environment=$1

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd $SCRIPT_DIR/../../../../ && pwd)"

  local manifests_dir="$ROOT_DIR/manifests"
  local postgres_manifest="$manifests_dir/01-stateful-sets/postgres.yml"

  echo "🗄️  Запуск PostgreSQL..."
  
  kubectl delete -f "$postgres_manifest" --ignore-not-found --wait=true 2>/dev/null || true
  
  # Даем время на удаление
  sleep 3
  
  # Применяем манифест
  kubectl apply -f "$postgres_manifest"
  
  # Ждем готовности
  echo "⏳ Ожидание готовности PostgreSQL..."
  sleep 20
  # Показываем логи для диагностики
  echo "📋 Логи PostgreSQL:"
  kubectl logs -l app=postgres --tail=20 2>/dev/null || true

  create_postgres_databases
  
  return 1
}

create_postgres_databases() {
  echo "🗃️  Создание баз данных для сервисов..."
  
  local namespace="${K8S_NAMESPACE:-myapp-dev}"
  local services=("games" "users")
  
  # Ждем, пока PostgreSQL будет готов принимать подключения
  echo "⏳ Ожидание готовности PostgreSQL..."
  
  local max_attempts=10
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if kubectl exec -n "$namespace" statefulset/postgres -- pg_isready -U postgres 2>/dev/null; then
      echo "✅ PostgreSQL готов к подключениям"
      break
    fi
    echo "⏳ Попытка $attempt/$max_attempts..."
    sleep 5
    ((attempt++))
  done
  
  if [ $attempt -gt $max_attempts ]; then
    echo "⚠️  PostgreSQL не готов, пропускаем создание баз"
    return 1
  fi
  
  # Создаем базы данных
  for service in "${services[@]}"; do
    echo "📝 Проверяем/создаем базу для: $service"
    
    # Проверяем, существует ли база
    if kubectl exec -n "$namespace" statefulset/postgres -- psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$service"; then
      echo "✅ База '$service' уже существует"
    else
      # Создаем базу
      if kubectl exec -n "$namespace" statefulset/postgres -- psql -U postgres -c "CREATE DATABASE $service;" 2>/dev/null; then
        echo "✅ База '$service' создана"
      else
        echo "❌ Не удалось создать базу '$service'"
      fi
    fi
  done
  
  echo "✅ Все базы данных проверены/созданы"
  
  # Покажем список всех баз для проверки
  echo "📋 Список баз данных в PostgreSQL:"
  kubectl exec -n "$namespace" statefulset/postgres -- psql -U postgres -c "\l" 2>/dev/null || true
}