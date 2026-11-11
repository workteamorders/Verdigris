# Verdigris

Koleksi NFT ERC-721 ("Verdigris Discs", simbol VERD) dan situs penjualan statis. Identitas Disc ditentukan oleh waktu: 84 Day, 12 Sign x 7 Numeral, tiga tier, paling banyak 1.632 Disc. Gambar dirender seluruhnya on-chain sebagai SVG. Kontrak immutable, tanpa fungsi admin.

```
contracts/   Solidity (Foundry): VerdigrisDisc, VerdigrisRenderer, tes, skrip deploy
web/         Next.js (static export) + viem/wagmi, satu Cloudflare Pages Function read-only (/api/rpc)
docs/        DECISIONS, LAUNCH-CHECKLIST, CONTRACTS-BUILD, AUDIT-PACKET, PHASE2-FIVE-SUNS
```

## Status jujur

Kontrak belum pernah dibangun atau diuji oleh Foundry (agen tidak boleh memasangnya). Yang sudah ada: kompilasi solc-js, 52 pemeriksaan di EVM JavaScript, paritas byte-per-byte renderer TypeScript, dan alur penuh situs di chain lokal. Belum ada audit eksternal. Baca `docs/LAUNCH-CHECKLIST.md` bagian 0.

## Mulai cepat

```bash
# Situs
cd web && pnpm install
pnpm dev                 # tanpa deployment, situs menampilkan "Not deployed"
pnpm typecheck && pnpm check:contrast && pnpm check:tokens && pnpm check:parity && pnpm copy:check
pnpm build               # hasil di web/out

# Kontrak (di mesin pemilik, perlu Foundry)
cd contracts && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-commit
forge build && forge test -vv
```

Rincian: `docs/CONTRACTS-BUILD.md` (membangun dan menguji) dan `docs/LAUNCH-CHECKLIST.md` (deploy dan peluncuran, hanya pemilik).

## Aturan keamanan proyek

- Tidak ada kunci privat atau seed phrase di berkas, skrip, atau obrolan. Deploy hanya dengan keystore Foundry (`--account`) atau hardware wallet (`--ledger`), dijalankan manual oleh pemilik.
- `.env*` tidak pernah masuk repositori; hanya `web/.env.example` (nilai contoh).
- Layanan hanya tier gratis.
