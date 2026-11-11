# Membangun dan menguji kontrak (dijalankan pemilik)

Status jujur saat ini: **kontrak belum dikompilasi atau diuji oleh Foundry**, karena `forge` tidak ada di lingkungan kerja agen dan agen tidak boleh memasangnya sendiri. Yang sudah dilakukan hanyalah kompilasi-cek dengan solc-js dan uji asap di EVM JavaScript (lihat `docs/DECISIONS.md`, bagian "Kontrak"). Suite Foundry di `contracts/test/` sudah ditulis dan lolos kompilasi terhadap stub `forge-std`, tetapi **belum pernah dijalankan**.

## Langkah di Mac pemilik

```bash
cd contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-commit
# Catat commit hash yang terpasang (git -C lib/<nama> rev-parse HEAD) di docs/DECISIONS.md.
forge build
forge test -vv
forge test --match-contract Invariants -vv
forge snapshot            # gas per fungsi
```

Yang diharapkan: semua tes lolos. Bila ada yang gagal, anggap itu temuan: jangan ubah tes agar lolos, periksa kontraknya dulu.

## Latihan di anvil (tanpa jaringan publik)

```bash
anvil                                  # terminal 1
./scripts/deploy-anvil.sh              # terminal 2: memakai akun anvil yang sudah terbuka, tanpa kunci
cd ../web && pnpm verify:deployment    # memeriksa file deployments/<chainId>.json terhadap chain lokal
```

## Deploy publik (hanya pemilik)

Lihat `scripts/deploy-owner.sh` dan `docs/LAUNCH-CHECKLIST.md`. Skrip menolak `PRIVATE_KEY` dan `--private-key`, hanya menerima keystore Foundry (`--account`) atau hardware wallet (`--ledger`), dan secara bawaan hanya mensimulasikan (dry run).

## Pemeriksaan lain yang tersedia tanpa forge

- `node scripts/compile-check.mjs <node_modules> <out> [stubs]`: kompilasi dengan solc-js (bukan pengganti `forge build`).
- `node scripts/smoke-evm.mjs <node_modules> <out> [svgDir]`: 52 pemeriksaan di EVM JS, juga menulis fixture paritas.
- `cd web && pnpm check:parity`: memastikan port TypeScript renderer identik byte-per-byte dengan keluaran kontrak.
