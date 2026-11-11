#!/usr/bin/env bash
# Local rehearsal on anvil. Uses anvil's own unlocked first account: no key is read, stored or passed.
# Start anvil in another terminal first:  anvil
set -euo pipefail
cd "$(dirname "$0")/.."
RPC="${RPC_URL:-http://127.0.0.1:8545}"
case "$RPC" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "deploy-anvil.sh only talks to a local anvil. Got: $RPC" >&2; exit 1 ;;
esac
SENDER="$(cast rpc --rpc-url "$RPC" eth_accounts | tr -d '[]" ' | cut -d, -f1)"
NOW="$(cast block --rpc-url "$RPC" -f timestamp latest)"
export TREASURY="${TREASURY:-$(cast rpc --rpc-url "$RPC" eth_accounts | tr -d '[]" ' | cut -d, -f10)}"
export START_TIME="${START_TIME:-$((NOW + 60))}"
export SLOT_SECONDS="${SLOT_SECONDS:-300}"   # a rehearsal Day of 5 minutes; the site shows a TEST CLOCK banner
export PRICE_ORDINARY_WEI="${PRICE_ORDINARY_WEI:-2000000000000000}"
export PRICE_FINE_WEI="${PRICE_FINE_WEI:-4000000000000000}"
export PRICE_CROWN_WEI="${PRICE_CROWN_WEI:-10000000000000000}"
# Short Patina steps so a rehearsal can watch every level (seconds): 60, 120, 240, 480.
export PATINA_1_SECONDS="${PATINA_1_SECONDS:-60}" PATINA_2_SECONDS="${PATINA_2_SECONDS:-120}"
export PATINA_3_SECONDS="${PATINA_3_SECONDS:-240}" PATINA_4_SECONDS="${PATINA_4_SECONDS:-480}"
forge script script/Deploy.s.sol --rpc-url "$RPC" --unlocked --sender "$SENDER" --broadcast
node scripts/export-deployment.mjs "$(cast chain-id --rpc-url "$RPC")" "anvil (local)" ../web/deployments
