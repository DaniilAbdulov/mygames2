#!/bin/bash

# Конфигурация Kubernetes для development окружения

export ENVIRONMENT="development"
export K8S_NAMESPACE="myapp-dev"
export K8S_CLUSTER_TYPE="minikube"  # minikube, kind, k3d
export K8S_VERSION="v1.27.0"

# Docker registry
export DOCKER_REGISTRY="localhost:5000"
export PUSH_TO_REGISTRY="false"
export SKIP_BUILD_ON_DEPLOY="false"

# Настройки Minikube
export MINIKUBE_DRIVER="docker"
export MINIKUBE_CPUS="2"
export MINIKUBE_MEMORY="4096"

# Настройки Kind
export KIND_CLUSTER_NAME="myapp-cluster"

# Настройки K3d
export K3D_CLUSTER_NAME="myapp"

# Ingress
export INSTALL_INGRESS="true"
export INGRESS_HOST="myapp.local"

# Флаги
export DEPLOY_ALL_AFTER_CLUSTER="true"

# Секреты
export NPM_TOKEN="${NPM_TOKEN:-}"