#!/usr/bin/env bash
set -euo pipefail

UPDATE_SNAPSHOT=true ./gradlew \
  :server:test \
  --tests "io.github.simonhauck.openfirestationmanager.HttpApiContractIT"

./gradlew spotlessApply
