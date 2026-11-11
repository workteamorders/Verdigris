# Daftar periksa peluncuran (dijalankan pemilik)

Dokumen ini berisi semua langkah yang **hanya boleh dilakukan pemilik**. Agen tidak memegang kunci privat, tidak menyiarkan transaksi ke jaringan publik mana pun, dan tidak memasang Foundry. Karena itu, semua yang bertanda "BELUM" di bawah adalah pekerjaan terbuka, bukan hasil yang sudah terbukti.

Centang setiap butir hanya setelah Anda melihat hasilnya sendiri.

## 0. Status bukti saat serah terima

| Hal | Status |
|---|---|
| Kompilasi dengan solc-js 0.8.28 (OZ 5.1.0, evm paris) | Lolos |
| Harness EVM JS (`contracts/scripts/smoke-evm.mjs`), 52 pemeriksaan | Lolos |
| Paritas renderer TS dengan keluaran kontrak (99 fixture) | Identik byte-per-byte |
| Alur penuh situs di chain lokal (`devchain.mjs`, dompet pengganti) | Lolos |
| `forge build`, `forge test`, fuzz, invarian | **BELUM pernah dijalankan** |
| Kompilasi dan perilaku di Robinhood Chain (nyata) | **BELUM** |
| `/api/rpc` di Cloudflare Pages | **BELUM pernah dijalankan** |
| Dompet sungguhan (bukan dompet pengganti) | **BELUM** |
| Tampilan di marketplace (SVG data-URI, ERC-2981, ERC-4906) | **BELUM** |
| Audit eksternal | **Tidak ada** |
| Tinjauan hukum atas teks Risk/Terms | **BELUM** |

Jangan menyebut kontrak "teruji" atau "diaudit" di mana pun sebelum butir-butir itu selesai. Situs sudah menampilkan "No external audit yet" selama `NEXT_PUBLIC_AUDIT_REPORT_URL` kosong.

## 1. Perkakas dan dependensi kontrak

- [ ] Pasang Foundry sendiri (`foundryup`), catat versinya.
- [ ] `cd contracts && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-commit`
- [ ] Catat commit hash terpasang: `git -C lib/forge-std rev-parse HEAD` dan `git -C lib/openzeppelin-contracts rev-parse HEAD`, tulis di `docs/DECISIONS.md`.
- [ ] `forge build` lalu `forge test -vv` lalu `forge test --match-contract Invariants -vv` lalu `forge snapshot`.
- [ ] Bila ada tes gagal: perlakukan sebagai temuan. Jangan ubah tes agar lolos; periksa kontrak dulu.
- [ ] Bandingkan ukuran runtime (`forge build --sizes`) dengan angka di `docs/AUDIT-PACKET.md` (Disc sekitar 11,0 KB, Renderer sekitar 18 KB, batas 24 KB).
- [ ] Bandingkan gas `tokenURI` kasus terburuk (sekitar 2,65 juta) dengan keluaran `forge snapshot`.

## 2. Latihan lokal dengan anvil

- [ ] `anvil` di terminal 1.
- [ ] `./scripts/deploy-anvil.sh` di terminal 2 (akun anvil bawaan, tanpa kunci Anda).
- [ ] `cd web && NEXT_PUBLIC_CHAIN_ID=31337 NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545 pnpm verify:deployment`
- [ ] Jalankan situs (`pnpm dev`) dan lakukan satu mint, satu pindah (lihat Patina kembali ke 0), satu `withdraw()`.

## 3. Dompet penerbit dan TREASURY

- [ ] Buat keystore Foundry: `cast wallet import <nama> --interactive` (kunci diketik di terminal Anda, tidak pernah di berkas atau obrolan), atau pakai hardware wallet (`--ledger` / `--trezor`).
- [ ] Pilih `TREASURY` yang **bisa menerima ETH** (kontrak multisig harus punya fungsi `receive`). `withdraw()` gagal bila TREASURY menolak ETH; karena TREASURY immutable, salah pilih tidak bisa diperbaiki.
- [ ] Uji `withdraw()` ke TREASURY itu di testnet sebelum mainnet.
- [ ] Alamat TREASURY yang diketik ulang saat `BROADCAST=1` harus sama persis dengan yang Anda maksud (skrip meminta Anda mengetik ulang).

## 4. Deploy testnet (46630)

Semua nilai non-rahasia diberikan lewat lingkungan shell. Contoh nilai saja:

```bash
export RPC_URL=https://rpc.testnet.chain.robinhood.com
export CHAIN_NAME="Robinhood Chain Testnet"
export TREASURY=<alamat Anda>
export START_TIME=<epoch detik, di masa depan>
export SLOT_SECONDS=300                 # testnet boleh pendek (minimal 60); mainnet wajib 86400
export PRICE_ORDINARY_WEI=<wei>
export PRICE_FINE_WEI=<wei>
export PRICE_CROWN_WEI=<wei>
export PATINA_1_SECONDS=<detik> PATINA_2_SECONDS=<detik> PATINA_3_SECONDS=<detik> PATINA_4_SECONDS=<detik>

cd contracts
./scripts/deploy-owner.sh --account <nama-keystore>              # dry run: hanya simulasi
BROADCAST=1 ./scripts/deploy-owner.sh --account <nama-keystore>  # menyiarkan
node scripts/export-deployment.mjs 46630 "Robinhood Chain Testnet" ../web/deployments   # broadcast JSON -> web/deployments/46630.json (env yang sama harus masih terset)
```

- [ ] Dry run bersih sebelum menyiarkan.
- [ ] Setelah siar: `web/deployments/46630.json` terisi, lalu `cd web && NEXT_PUBLIC_CHAIN_ID=46630 pnpm verify:deployment` (membaca langsung dari chain: kode ada, parameter sama, `tokenURI` bisa dibaca).
- [ ] Verifikasi sumber di explorer (Blockscout) dengan `forge verify-contract --verifier blockscout --verifier-url <url explorer>/api/ ...`. Flag dan URL persisnya ambil dari dokumentasi explorer; jangan menebak. Jangan menampilkan label "verified" di situs sampai explorer sendiri menampilkannya.
- [ ] Ukur sendiri hal yang **tidak terverifikasi**: batas gas `eth_call` (panggil `tokenURI` kasus terburuk lewat RPC publik), dukungan opcode Cancun/PUSH0, selisih jam sequencer terhadap waktu nyata (menentukan kapan Day berganti), batas laju RPC.
- [ ] Mint pada setiap tier, cek `Minted`, cek batas dompet 2 dan batas tx 2, cek pembayaran salah ditolak, cek Day habis, cek Count berakhir (gunakan `SLOT_SECONDS` pendek di testnet).
- [ ] Tes marketplace/penjelajah: gambar tampil, `contractURI` terbaca, royalti 500 bps terbaca (ERC-2981), dan setelah pindah-tangan metadata disegarkan (ERC-4906 `MetadataUpdate`). Catat marketplace mana yang tidak mendukung.

## 5. Situs di Cloudflare Pages

- [ ] Hubungkan repositori; perintah build: `cd web && pnpm install --frozen-lockfile && pnpm build`; direktori output: `web/out`; Functions dari `web/functions`.
- [ ] Variabel build (publik): `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_AUDIT_REPORT_URL` (kosong dulu), `NEXT_PUBLIC_SOURCE_URL` (opsional). Jangan set `NEXT_PUBLIC_RPC_URL` di produksi.
- [ ] Variabel Functions (server): `RPC_URL_<chainId>`, `ALLOWED_CONTRACTS` (alamat kontrak Disc hasil deploy), `BLOCKED_COUNTRIES` (opsional).
- [ ] Kuota gratis fungsi sekitar 100 ribu permintaan per hari. Pantau; bila tipis, pasang `NEXT_PUBLIC_RPC_URL` ke RPC publik yang mengizinkan CORS (konsekuensinya: alamat RPC terlihat publik).
- [ ] Baca syarat layanan Cloudflare Pages dan pastikan penggunaan ini diizinkan.
- [ ] Cek `/api/rpc`: panggilan `eth_sendRawTransaction` harus ditolak, target alamat lain harus ditolak, asal lintas-origin harus ditolak, `GET /api/rpc` mengembalikan `{ "blocked": false }`.
- [ ] Cek header (`public/_headers`): CSP, nosniff, no-referrer; cek bahwa `/_next/static` ber-cache immutable.
- [ ] Jalankan Lighthouse mobile pada hasil deploy nyata. Angka terukur di lingkungan agen (server lokal dengan brotli, chain lokal): Home 91, Mint 97, Calendar 90, Rules 96, Vault 96, Gallery 88 (target 90, belum tercapai di Gallery); A11y 100, Best Practices 96, SEO 100.
- [ ] Uji dengan dompet sungguhan (MetaMask, Rabby, dompet bergerak): hubung, ganti jaringan, mint, kirim dari Vault.
- [ ] Uji mode offline dan halaman 404.

## 6. Sebelum mainnet (4663)

- [ ] Tinjauan hukum atas halaman Risk/Terms dan seluruh teks produk. Teks yang ada adalah draf produk, bukan nasihat hukum.
- [ ] Putuskan audit eksternal. Bila ada, isi `NEXT_PUBLIC_AUDIT_REPORT_URL`. Bila tidak, biarkan kosong; situs tetap menampilkan "No external audit yet".
- [ ] Paket audit: `docs/AUDIT-PACKET.md`.
- [ ] `START_TIME` dipilih dengan sadar: jam sequencer tidak presisi ke menit.
- [ ] Deploy mainnet: `CONFIRM_MAINNET=yes`, `SLOT_SECONDS=86400`, keystore atau hardware wallet, dry run dulu, lalu `BROADCAST=1`.
- [ ] Setelah deploy: `pnpm verify:deployment` dengan `NEXT_PUBLIC_CHAIN_ID=4663`, verifikasi sumber di explorer, perbarui `ALLOWED_CONTRACTS`, build ulang situs.
- [ ] Kontrak immutable dan tanpa fungsi admin: setelah deploy, **tidak ada** cara mengubah harga, jadwal, TREASURY, atau renderer. Tidak ada pengembalian dana untuk pembayaran. Pastikan semua parameter benar sebelum `BROADCAST=1`.

## 7. Berkas yang tidak boleh masuk repositori

`.env*`, `.dev.vars`, `vercel.*.vars`, keystore, seed phrase, kunci privat. `web/.env.example` hanya berisi contoh. Cek `.gitignore` sebelum commit pertama.

## 8. Yang dibiarkan sebagai spesifikasi saja

Era "Five Suns" hanya spesifikasi (`docs/PHASE2-FIVE-SUNS.md`). Tidak ada kontrak, halaman, atau teks situs yang menjanjikannya.
