#!/bin/bash

# Переходим в директорию скрипта
cd "$(dirname "$0")"

echo "Развертывание микросервисов..."
echo

for arg in "$@"; do
    case $arg in
        token=*)
            TOKEN="${arg#*=}"
            shift
            ;;
        pg_host=*)
            PG_HOST="${arg#*=}"
            shift
            ;;
        pg_password=*)
            PG_PASSWORD="${arg#*=}"
            shift
            ;;
        *)
            echo "Неизвестный параметр: $arg"
            echo "Использование: ./deploy-services token=your_token pg_host=host pg_password=pass"
            exit 1
            ;;
    esac
done

# Список сервисов для развертывания
declare -A services=(
    ["users"]="3002"
    ["games"]="3001"
)

# Функция для обработки сервиса
deploy_service() {
    local service_name=$1
    local port=$2
    local service_dir="../$service_name"
    
    echo "=== Развертывание $service_name (порт: $port) ==="
    
    if [ -d "$service_dir" ]; then
        echo "Найден сервис в $service_dir"
        
        # Переходим в директорию сервиса
        cd "$service_dir"
        
        # Проверяем существование Dockerfile
        if [ -f "Dockerfile" ]; then
            # Останавливаем и удаляем старый контейнер
            docker stop "$service_name" 2>/dev/null
            docker rm "$service_name" 2>/dev/null
            docker rmi "$service_name:latest" 2>/dev/null
            
            # Собираем и запускаем
            echo "Сборка образа..."
            docker build -t "$service_name:latest" --build-arg NPM_TOKEN="$TOKEN" .
            
            if [ $? -eq 0 ]; then
                echo "Запуск контейнера..."
                docker run -d \
                    --name "$service_name" \
                    --network host \
                    -e PG_HOST="$PG_HOST" \
                    -e PG_PASSWORD="$PG_PASSWORD" \
                    -p "$port":"$port" \
                    "$service_name":latest
                
                echo "Сервис $service_name запущен на порту $port"
            else
                echo "Ошибка при сборке $service_name"
            fi
        else
            echo "Ошибка: Dockerfile не найден в $service_dir"
        fi
        
        # Возвращаемся в директорию deploy
        cd - > /dev/null
    else
        echo "Ошибка: Директория $service_dir не найдена"
    fi
    
    echo
}

# Развертываем все сервисы
for service_name in "${!services[@]}"; do
    deploy_service "$service_name" "${services[$service_name]}"
done

echo "=== Развертывание завершено ==="
echo "Доступные сервисы:"
for service_name in "${!services[@]}"; do
    echo "- $service_name: http://localhost:${services[$service_name]}"
done