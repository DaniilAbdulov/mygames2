#!/bin/sh
set -e

echo "🚀 Запуск сервиса: $SERVICE_NAME"

# Настройка порта в зависимости от сервиса
case "$SERVICE_NAME" in
  users)
    export PORT=${USERS_PORT:-3000}
    ;;
  games)
    export PORT=${GAMES_PORT:-3001}
    ;;
  *)
    export PORT=3000
    ;;
esac

echo "📡 Порт: $PORT"
echo "🌐 Окружение: $NODE_ENV"

# Выполняем команду
exec "$@"