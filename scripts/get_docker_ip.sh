#!/bin/bash

if [[ $# -eq 0 ]]; then
  echo "Missing arguments"
  exit 1
fi

docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1"

