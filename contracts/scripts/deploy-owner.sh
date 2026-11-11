#!/usr/bin/env bash
# OWNER-RUN ONLY. Deploys to a public chain with a Foundry keystore or a hardware wallet.
# This script never reads, prints or accepts a private key, and refuses to run if one is in the environment.
#
#   Dry run (simulates, sends nothing):   ./scripts/deploy-owner.sh --account <keystore-name>
#   Real broadcast:                       BROADCAST=1 ./scripts/deploy-owner.sh --account <keystore-name>
#   Hardware wallet:                      BROADCAST=1 ./scripts/deploy-owner.sh --ledger
#
# Required (non-secret) environment: RPC_URL, TREASURY, START_TIME, SLOT_SECONDS (86400 on mainnet), PRICE_ORDINARY_WEI, PRICE_FINE_WEI, PRICE_CROWN_WEI,
# PATINA_1_SECONDS .. PATINA_4_SECONDS, CHAIN_NAME. On mainnet (4663) also CONFIRM_MAINNET=yes.
set -euo pipefail
cd "$(dirname "$0")/.."

for v in PRIVATE_KEY ETH_PRIVATE_KEY DEPLOYER_PRIVATE_KEY MNEMONIC; do
  if [ -n "${!v:-}" ]; then echo "Refusing to run: $v is set. Use a keystore (--account) or --ledger." >&2; exit 1; fi
done
for a in "$@"; do
  case "$a" in
    --private-key*|--mnemonic*|--interactives) echo "Refusing: $a. Use --account <keystore> or --ledger." >&2; exit 1 ;;
  esac
done
case " $* " in
  *" --account "*|*" --ledger "*|*" --trezor "*) ;;
  *) echo "Pass --account <keystore-name>, --ledger or --trezor." >&2; exit 1 ;;
esac
: "${SLOT_SECONDS:?set SLOT_SECONDS}" "${RPC_URL:?set RPC_URL}" "${TREASURY:?set TREASURY}" "${START_TIME:?set START_TIME}" "${CHAIN_NAME:?set CHAIN_NAME}"
: "${PRICE_ORDINARY_WEI:?}" "${PRICE_FINE_WEI:?}" "${PRICE_CROWN_WEI:?}"
: "${PATINA_1_SECONDS:?}" "${PATINA_2_SECONDS:?}" "${PATINA_3_SECONDS:?}" "${PATINA_4_SECONDS:?}"
export TREASURY START_TIME SLOT_SECONDS PRICE_ORDINARY_WEI PRICE_FINE_WEI PRICE_CROWN_WEI PATINA_1_SECONDS PATINA_2_SECONDS PATINA_3_SECONDS PATINA_4_SECONDS

echo "Chain id: $(cast chain-id --rpc-url "$RPC_URL")"
echo "Treasury (CANNOT be changed after deploy): $TREASURY"
if [ "${BROADCAST:-0}" = "1" ]; then
  read -r -p "Type the treasury address again to broadcast: " again
  [ "$again" = "$TREASURY" ] || { echo "Mismatch. Nothing sent." >&2; exit 1; }
  forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --broadcast "$@"
  node scripts/export-deployment.mjs "$(cast chain-id --rpc-url "$RPC_URL")" "$CHAIN_NAME" ../web/deployments
else
  echo "DRY RUN: simulating only."
  forge script script/Deploy.s.sol --rpc-url "$RPC_URL" "$@"
fi
