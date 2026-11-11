# Paket audit: Verdigris Discs

Dokumen ini untuk pembaca teknis (peninjau, auditor yang pemilik pilih sendiri). **Belum ada audit eksternal.** Situs menampilkan "No external audit yet" selama `AUDIT_REPORT_URL` kosong.

## 1. Cakupan

| Berkas | Peran |
|---|---|
| `contracts/src/VerdigrisDisc.sol` | ERC-721 + ERC-2981 + ERC-4906, mint terjadwal, patina, withdraw |
| `contracts/src/VerdigrisRenderer.sol` | Fungsi murni: parameter Disc menjadi SVG dan JSON metadata |
| `contracts/src/SignGlyphs.sol` | Data path 12 Sign |
| `contracts/src/IVerdigrisRenderer.sol` | Antarmuka renderer |

Ketergantungan: OpenZeppelin Contracts 5.1.0 (`ERC721`, `ERC2981`, `IERC4906`, `Base64`, `Strings`, `Math`). Solidity 0.8.28, EVM `paris`, optimizer 200 runs.

## 2. Aturan yang harus berlaku

1. Hanya ada 84 Day. Day `d = (now - START_TIME) / 86400`, valid bila `0 <= d < 84`.
2. Sign = `d % 12`, Numeral = `d % 7 + 1`. Tier: Numeral 1-4 Ordinary, 5-6 Fine, 7 Crown.
3. Batas per Day: Ordinary 24, Fine 16, Crown 8. Jumlah seluruh Day = 1.632 = `MAX_SUPPLY`.
4. Satu transaksi mint paling banyak 2 (`TX_CAP`). Satu dompet paling banyak 2 per Day (`WALLET_SLOT_CAP`).
5. `msg.value` harus sama persis dengan `harga * jumlah`. Tidak ada refund, tidak ada kelebihan yang diterima.
6. Patina level 0..4 dari `block.timestamp - lastMovedAt`, ambang `PATINA_1..4` (immutable, detik). Setiap transfer (termasuk mint, safeTransfer, transfer ke diri sendiri) menyetel `lastMovedAt = block.timestamp`. Approval tidak mereset.
7. Tidak ada owner, admin, pause, upgrade, atau setter. `withdraw()` bisa dipanggil siapa saja dan hanya mengirim saldo ke `TREASURY` (immutable).
8. Royalti ERC-2981 500 bps ke `TREASURY`, tidak bisa diubah.

## 3. Permukaan serangan dan analisis

- **Reentrancy lewat `_safeMint`**: semua penghitung (`mintedOnDay`, `mintedByWalletOnDay`, `_nextId`, data Disc) ditulis sebelum panggilan eksternal pertama. Reentry hanya bisa mint lagi dengan batas yang sudah terpotong. Tes: `test_reentrancyCannotExceedCaps`.
- **`withdraw()`**: panggilan `call` ke TREASURY setelah membaca saldo; tidak ada state yang bergantung padanya. **Risiko operasional**: bila TREASURY adalah kontrak yang menolak ETH, dana tertahan selamanya. Pemilik wajib memakai alamat yang menerima ETH (EOA atau multisig yang diuji) dan menguji `withdraw()` dengan satu mint di testnet.
- **Waktu**: `block.timestamp` di rantai keluarga Arbitrum adalah jam sequencer: monoton, tetapi dapat berbeda menit dari waktu nyata. Efeknya hanya pergeseran batas Day beberapa menit. Tidak ada logika yang bergantung pada ketelitian menit. Selisih terhadap `lastMovedAt` dijaga agar tidak underflow (`patinaLevel` memberi 0 bila `now <= last`).
- **Sybil**: batas per dompet tidak bisa mencegah satu orang memakai banyak dompet. Ini batasan yang diterima dan dicantumkan di halaman Rules dan Risk.
- **Kontrak sebagai pemanggil**: boleh mint (memakai `_safeMint`, jadi kontrak tanpa receiver ditolak). Batas per dompet berlaku per alamat kontrak.
- **`ownedIds`**: pemindaian terbatas oleh parameter `scan`; tidak ada loop tak terbatas. Fungsi `view`, tidak dipakai kontrak lain.
- **`tokenURI`**: bergantung pada gas panggilan `view`. Pengukuran terburuk di harness EVM JS (Crown, Patina level 4): sekitar 2,65 juta gas, di bawah anggaran 3 juta. Anggaran itu pilihan kami; batas `eth_call` rantai tujuan **belum diverifikasi** (RPC publik tidak terjangkau saat pengembangan).
- **Renderer**: tanpa panggilan eksternal, tanpa penyimpanan. SVG tidak memuat `<script>`, `<image>`, `href`, `<foreignObject>` (tes `test_noForbiddenMarkup`). Filter hanya pada dua lapisan overlay.
- **Overflow**: Solidity 0.8 menjaga aritmetika. Blok `unchecked` hanya pada pembacaan tabel `_t` (indeks dibatasi konstruksi).
- **Frontrunning/MEV**: harga tetap dan batas per Day bersifat first-come; urutan transaksi menentukan siapa dapat. Tidak ada komponen acak yang bisa dimanipulasi: identitas ditentukan Day.

## 4. Invarian yang diuji (Foundry, belum dijalankan)

`totalMinted <= 1632`; `mintedOnDay[d] <= capOf(d)` dan jumlahnya sama dengan `totalMinted`; `mintedByWalletOnDay <= 2`; saldo kontrak = total dibayar - total ditarik, dan saldo TREASURY = total ditarik; `patinaLevel <= 4`.

## 5. Bukti yang ada saat ini (jujur)

| Bukti | Status |
|---|---|
| Kompilasi solc-js 0.8.28 (src, test, script terhadap stub forge-std) | Lolos |
| Harness EVM JS (`contracts/scripts/smoke-evm.mjs`), 52 pemeriksaan: aturan Day, tier, batas, pembayaran, patina, reset, withdraw, antarmuka, royalti, akhir Count, gas tokenURI | Lolos |
| Paritas port TypeScript vs keluaran kontrak, 99 Disc | Byte-identik |
| `forge build`, `forge test`, fuzz, invarian | **Belum dijalankan** |
| Verifikasi terhadap RPC publik (batas eth_call, versi EVM, selisih timestamp) | **Belum dilakukan** |
| Audit eksternal | **Tidak ada** |

## 6. Batasan yang diketahui

Pembayaran tidak dikembalikan dan tidak ada jalur refund. Kontrak tidak bisa diperbaiki setelah deploy. Patina tidak memicu event sendiri saat waktu berjalan; marketplace perlu menyegarkan metadata (event `MetadataUpdate` hanya saat Disc berpindah). Pemindaian `ownedIds` O(jumlah id yang dipindai).
