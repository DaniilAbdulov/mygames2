#!/bin/bash

run_postgres() {
  local environment=$1

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd $SCRIPT_DIR/../../../../ && pwd)"

  local manifests_dir="$ROOT_DIR/manifests"

  kubectl delete -f "$manifests_dir/01-stateful-sets/postgres.yml"
  kubectl apply -f "$manifests_dir/01-stateful-sets/postgres.yml"
  
  echo "  ✅"
}