
## Kontrak dan situs (diputuskan 2026-11-11, menggantikan bagian yang bertentangan di atas)

**Yang menggantikan.** Bagian "d. Pustaka ERC-721" menyebut OpenZeppelin v5.7.0 dan bagian "Toolchain" menyebut ABI tiruan berlabel. Keduanya sudah tidak berlaku: kontrak nyata sudah ditulis, dan ABI situs dihasilkan dari kompilasi nyata (label sumber di `abi.generated.ts`: "solc-js 0.8.28 compile-check (NOT a forge build)").

### Kontrak
- **OpenZeppelin 5.1.0, bukan 5.7.0.** Versi 5.7.0 memakai opcode `mcopy` (Cancun) yang tidak bisa dikompilasi dengan `evm_version = paris`. Dukungan Cancun di Robinhood Chain BELUM terverifikasi, jadi `paris` dipertahankan dan OZ diturunkan. `forge install ...@v5.1.0`; hash commit dicatat pemilik.
- **`SLOT_SECONDS` immutable** (86400 di mainnet, minimal 60 di testnet). Skrip deploy menolak nilai selain 86400 di chain 4663 dan meminta `CONFIRM_MAINNET=yes`. Tujuannya: latihan testnet dengan Day pendek tanpa mengubah logika mainnet.
- **`mintedAll()`** mengembalikan jumlah terminted per Day sekaligus, agar kalender cukup satu panggilan RPC.
- **Anggaran gas renderer.** Kasus terburuk `tokenURI` sekitar 2,65 juta gas (pernah di atas 3 juta; diturunkan dengan lapisan datar lebih dulu, filter hanya pada lapisan tindih, dan tabel pencarian COS64/NOTCH/RIVET). Batas `eth_call` Robinhood Chain BELUM diukur. Lihat LAUNCH-CHECKLIST bagian 4.
- **Pengurangan risiko**: `_update` mengisi `lastMovedAt` dan memancarkan `MetadataUpdate` pada semua jalur pindah; efek sebelum interaksi pada `_safeMint`; `ownedIds(holder, fromId, scan)` terbatas; kesalahan khusus (custom errors); `withdraw()` tanpa izin ke TREASURY immutable; tanpa fungsi admin (daftar nama fungsi diperiksa persis di harness).
- **Risiko operasional yang diterima**: TREASURY harus bisa menerima ETH, dan tidak bisa diganti setelah deploy.

### Bukti verifikasi (apa yang ada, apa yang tidak)
- Ada: kompilasi solc-js 0.8.28; harness EVM JS dengan 52 pemeriksaan; paritas byte-per-byte renderer TypeScript terhadap keluaran kontrak (99 fixture); alur penuh situs di `devchain.mjs` (JSON-RPC lokal berbasis ethereumjs, bukan anvil) dengan dompet pengganti.
- Tidak ada: `forge build`, `forge test`, fuzz, invarian (suite Foundry ditulis dan lolos kompilasi terhadap stub `forge-std`, belum pernah dijalankan); pengukuran di Robinhood Chain; dompet sungguhan; tampilan marketplace; `/api/rpc` di Cloudflare; audit eksternal; tinjauan hukum.

### Situs
- **Port TypeScript renderer** (`web/src/lib/disc.ts`) identik byte-per-byte; styleguide dan galeri memakainya. Pemeriksaan: `pnpm check:parity`. Tombol "Compare with the contract's own image" di detail Disc membandingkan dengan `tokenURI` kontrak.
- **Pembacaan lewat `/api/rpc`** (kecuali `NEXT_PUBLIC_RPC_URL` diset untuk latihan lokal): hanya metode baca, target dibatasi `ALLOWED_CONTRACTS`, batch maksimum 24, badan maksimum 16 KB, cek Origin, tanpa penyimpanan state. Tidak ada jalur untuk mengirim transaksi.
- **Pembatasan wilayah**: `GET /api/rpc` mengembalikan hanya `{blocked: boolean}` dari `request.cf.country` dan `BLOCKED_COUNTRIES`; negara tidak pernah dikembalikan. Ini penyaringan tampilan, bukan kontrol akses kontrak, dan tidak menggantikan tinjauan hukum.
- **Jam chain**: situs mengambil jam dari timestamp blok terbaru (jam sequencer, tidak presisi ke menit), bukan jam peramban. Ada banner "TEST CLOCK" bila jam diuji.
- **Mint**: `simulateContract`, lalu `writeContract`, lalu kuitansi, lalu parsing event `Minted`. Dialog mewajibkan centang "payment is final". Pembayaran harus pas; tidak ada pengembalian.
- **Service worker** hanya menyimpan `/offline/`; tidak menyimpan data chain.
- **Font**: paket `@fontsource` (latin saja), dimuat lewat CSS.
- **Galeri**: 12 Disc per halaman, thumbnail tanpa filter (detail memakai gambar penuh), placeholder berukuran sama untuk mencegah pergeseran tata letak.
- **Lighthouse mobile** (server lokal dengan brotli, chain lokal berisi sekitar 168 Disc; bukan hasil di Cloudflare): Perf Home 91, Mint 97, Calendar 90, Rules 96, Vault 96, Gallery 88; A11y 100, Best Practices 96, SEO 100. Gallery di bawah target 90; sisa waktunya adalah JavaScript wagmi/viem (TBT). Ukur ulang di deploy nyata.
- **Kebijakan teks**: `pnpm copy:check` memindai kata terlarang (kalimat negasi diizinkan). Tidak ada label "verified" atau "audited". Tanpa audit: "No external audit yet". Data contoh diberi label "EXAMPLE".

### Hal yang BELUM TERVERIFIKASI (diulang agar tidak hilang)
Batas gas `eth_call`; dukungan Cancun/PUSH0; selisih jam sequencer; batas laju RPC; render SVG data-URI, ERC-2981 dan ERC-4906 di marketplace; perilaku dompet sungguhan; `/api/rpc` di Cloudflare; Syarat Khusus Layanan Cloudflare Pages; batas Tooltip pada tepi layar.

## Frame berukir per kotak

- Setiap kotak (Panel, LinkPanel, plat roda) memakai `Frame`: bingkai perunggu cor dengan cahaya dari kiri atas, tampak tiga dimensi (bevel, alur, baut sudut berbayang), bukan garis datar.
- Ada delapan frame: reed, bead, dentil, rope, lozenge, moulding, scale, inlay. Masing-masing punya pola ukiran tepi dan baut sudut sendiri. Kotak yang bersebelahan diberi frame berbeda lewat prop `frame`.
- Tidak ada motif Mesoamerika; polanya dari tradisi bingkai klasik (alur, manik, dentil, tali pilin, kisi berlian, profil bertingkat, sisik, inlay verdigris).
- Semua nilai berupa token (`--metal-*`, `--frame-w`, `--boss`, `--frame-shadow`, `--grain`). `Frame.module.css` dihasilkan oleh `tools/gen-frames.py`; ubah generatornya, bukan berkas CSS-nya.
- Bingkai hanya dekorasi (`aria-hidden`); wajah panel tetap di atas `--surface`, jadi pasangan kontras tidak berubah (27 dari 27 lolos).
- Elevasi: bayangan bingkai dihitung sebagai bagian dari level "raised"; jumlah level tetap tiga.
- Biaya: Lighthouse mobile Home turun ke sekitar 86 sampai 88 (sebelumnya 89 sampai 92) pada ukuran yang sama; Style & Layout naik sekitar 65 ms. Belum diukur di perangkat nyata.
