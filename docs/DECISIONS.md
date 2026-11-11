# Verdigris: keputusan dan hasil Gerbang X

Tanggal verifikasi: 2026-11-11. Semua bukti di bawah diambil dari dokumentasi publik pada tanggal itu. Tidak ada transaksi yang disiarkan. Tidak ada kunci yang dipegang.

Penyangkalan di situs (bukan nasihat keuangan, tidak berafiliasi, dst.) tidak menggantikan tinjauan hukum. Tinjauan hukum atas teks, halaman Risk dan Terms, dan batasan wilayah tetap wajib sebelum mainnet.

## Ringkasan status

| Gerbang | Status | Catatan |
|---|---|---|
| a. Marketplace | Lolos bersyarat | OpenSea mencantumkan chain `robinhood`; sisanya belum terbukti (lihat di bawah) |
| b. Parameter chain | Sebagian | ID, RPC, explorer, batas kode terverifikasi dari dokumentasi; sisanya BELUM TERVERIFIKASI |
| c. block.timestamp | Sebagian | Dokumentasi Arbitrum ada; pengukuran langsung gagal (RPC tidak terjangkau) |
| d. Pustaka ERC-721 | Dipilih, commit belum dikunci | forge tidak ada; versi dikunci saat `forge install` oleh pemilik |
| e. Filter SVG | Sebagian | Chromium dan librsvg render benar; rasterizer marketplace belum teruji |
| Toolchain | forge, anvil, slither, aderyn, pnpm tidak ada | Aturan kerja melarang pemasangan otomatis |

## a. Pemilihan chain dan marketplace

Kandidat pertama: Robinhood Chain (L2 Arbitrum Orbit, gas ETH). Bukti:
- OpenSea, endpoint "Refresh NFT metadata" (docs.opensea.io/reference/refresh_nft_metadata): enum `chain` memuat `robinhood` bersama 25 chain lain. API penyegaran metadata ADA.
- OpenSea, "Updating metadata": proyek ERC-721 diarahkan memakai ERC-4906 (`MetadataUpdate`, `BatchMetadataUpdate`). Dokumen tidak menyatakan eksplisit bahwa ERC-4906 didukung penuh.
- OpenSea, "Metadata storage": tokenURI boleh berupa `data:application/json;base64,...`; disarankan untuk koleksi kecil atau seni generatif.
- OpenSea, "Media and traits": SVG didukung dan "dicache sebagai PNG". Tidak ada pernyataan tentang filter, skrip, atau SVG berbentuk data URI.
- Berita (bukan dokumentasi, bobot rendah): integrasi OpenSea dan Element dengan Robinhood Chain dilaporkan; halaman koleksi opensea.io untuk koleksi di chain ini muncul di hasil pencarian, yang menyiratkan pengindeksan tanpa izin.

BELUM TERVERIFIKASI: dukungan ERC-2981 oleh OpenSea di chain ini (halaman royalti gagal dimuat); apakah gambar SVG berbentuk data URI di dalam JSON base64 tampil; apakah koleksi baru terindeks tanpa izin; apakah ada marketplace di TESTNET.

Keputusan: Robinhood Chain dipilih sebagai chain pertama yang lolos bersyarat. Uji tampilan marketplace di testnet (atau mainnet kecil setelah audit) menjadi langkah wajib pemilik di docs/LAUNCH-CHECKLIST.md. Tidak ada kandidat cadangan yang diteliti karena kandidat pertama tidak gagal pada satu pun kriteria yang bisa diperiksa.

## b. Parameter chain (sumber: docs.robinhood.com/chain/connecting, differences-from-ethereum, protocol-contracts)

| Item | Mainnet | Testnet |
|---|---|---|
| Chain ID | 4663 | 46630 |
| Gas | ETH | ETH |
| RPC publik | https://rpc.mainnet.chain.robinhood.com | https://rpc.testnet.chain.robinhood.com |
| Explorer | robinhoodchain.blockscout.com | explorer.testnet.chain.robinhood.com |
| Faucet | tidak dicantumkan di halaman Connecting | faucet.testnet.chain.robinhood.com muncul di hasil pencarian (halaman gagal dimuat); faucet Alchemy juga ada. Batas BELUM TERVERIFIKASI |

- RPC publik "rate-limited dan tidak disarankan untuk produksi"; angka batas tidak dicantumkan.
- Batas ukuran kode: 96 KB (Ethereum 24 KB); init code 192 KB. Renderer jauh di bawah ini.
- Jembatan: jembatan Arbitrum kanonik dan beberapa rute lintas chain (halaman Bridging tidak dibaca).
- BELUM TERVERIFIKASI (tidak ada di dokumentasi dan RPC langsung tidak terjangkau dari lingkungan ini, proxy menolak CONNECT dengan 403 dari cloud maupun komputer pemilik): batas gas `eth_call`, versi EVM yang diterima (PUSH0, Cancun), ArbOS, batas laju numerik.
- Multicall: halaman Protocol Contracts mencantumkan "L2 Multicall" di `0x2cAC2D899eCC914d704FeaAE33ac1bF36277DaD1` (mainnet) dan `0xa432504b6F04Cafe775b09D8AA92e8dbe41Ec7a8` (testnet). Ini BUKAN alamat kanonik Multicall3 (`0xcA11bde05977b3631167028862bE2a173976CA11`); apakah yang kanonik terpasang belum diperiksa. Keputusan: situs tidak bergantung pada Multicall3; fungsi baca kontrak (`state`, `slots`, `ownedIds`) sudah dirancang sebagai pembacaan massal.
- Flag verifikasi: explorer mainnet berdomain Blockscout, jadi dugaan flag adalah `--verifier blockscout --verifier-url https://robinhoodchain.blockscout.com/api/`. Jenis explorer testnet BELUM TERVERIFIKASI. Pemilik memeriksa di checklist.
- Perilaku Arbitrum yang relevan (differences-from-ethereum): `block.number` adalah estimasi L1 dan tidak boleh dipakai sebagai jam; `prevrandao` konstan (tidak relevan, tanpa keacakan); `block.coinbase` bukan validator. Kontrak memakai HANYA `block.timestamp`.
- Transaksi terkait alamat yang disanksi disaring oleh sequencer. Perlu masuk di Risk.

## c. Semantik block.timestamp

Sumber: docs.arbitrum.io (block numbers and time). Timestamp diisi sequencer dari jam miliknya, tidak pernah turun, harus berada antara 24 jam lebih awal dan 1 jam lebih akhir dari waktu saat ini, dan dokumentasi menyebutnya "tidak andal dalam jangka pendek (menit)" tetapi andal dalam jam. Halaman Robinhood tidak membahas ini. Pengukuran langsung (selisih terhadap jam dinding) gagal karena RPC tidak terjangkau.

Akibat desain:
- Pergantian hari boleh bergeser menit. Klaim presisi detik dilarang; Rules dan Risk menyatakannya.
- TEST CLOCK dengan SLOT_SECONDS = 300 akan sangat terpengaruh oleh ketidakpastian menit. Rekomendasi untuk testnet: SLOT_SECONDS 900 atau lebih besar, dan pemilik mengukur selisih dulu. Ini rekomendasi, parameter tetap lewat constructor.
- Kontrak tidak memakai `block.number` sama sekali.

## d. Pustaka ERC-721

Dibandingkan dari sumber:
- Solady v0.1.26 (rilis terbaru di halaman rilis; tahun tidak tertera). `ERC721.sol` punya `_beforeTokenTransfer` dan `_afterTokenTransfer`, tetapi `transferFrom` memakai assembly inline dan tidak memanggil `_transfer`; tidak ada enumerasi; `supportsInterface` hanya ERC165, ERC721, ERC721Metadata (ERC-2981 dan ERC-4906 harus ditambah sendiri).
- OpenZeppelin Contracts v5.7.0 (rilis terbaru di halaman rilis; tahun tidak tertera). Semua mint dan transfer (termasuk safe) melewati satu hook `_update`. Ekstensi `ERC4906` dan `ERC2981` tersedia di pustaka yang sama (keberadaan kedua ekstensi ini di pohon sumber BELUM diperiksa di sesi ini, hanya dari pengetahuan; verifikasi saat instal).

Keputusan: OpenZeppelin v5.7.0 dengan override `_update` untuk mengisi `lastMovedAt` dan memancarkan `MetadataUpdate`. Alasan: satu titik hook untuk semua jalur pemindahan (mengurangi risiko `lastMovedAt` terlewat), pustaka teraudit dan umum dipakai, biaya gas tambahan tidak penting untuk koleksi 1.632 disc. Enumerasi `ownedIds` dikerjakan sebagai pindai view terbatas id 1..totalMinted (maksimum 1.632), tanpa ERC721Enumerable.

Commit yang dikunci: BELUM ADA. GitHub tidak dapat dibaca dari sesi ini dan forge tidak ada. Pemilik menjalankan `forge install OpenZeppelin/openzeppelin-contracts@v5.7.0` dan mencatat hash di AUDIT-PACKET.md.

evm_version di foundry.toml: `paris` sebagai default paling aman sampai dukungan PUSH0 dan Cancun diverifikasi di testnet. Solc dikunci ke satu versi 0.8.x saat konfigurasi.

## e. Filter SVG

Uji lokal (2026-11-11): SVG uji dengan `feTurbulence` + `feDiffuseLighting` + `feSpecularLighting` di dalam clipPath lingkaran, dirender oleh
- Chromium (Playwright): benar, sekitar 134 ms termasuk muat halaman;
- librsvg `rsvg-convert`: benar, sekitar 113 ms; warna lebih pucat dari Chromium.
ImageMagick juga menghasilkan keluaran bertekstur. Artinya filter tidak seragam antar rasterizer.

Rasterizer OpenSea (SVG dicache sebagai PNG) BELUM TERUJI; dokumentasinya diam soal filter.

Keputusan desain renderer (aturan keputusan Gerbang X): setiap disc harus tetap terbaca bila filter dibuang. Karena itu: (1) bentuk dasar, cincin, glif, takik, rivet, dan warna patina digambar dengan vektor dan gradien datar; (2) filter hanya dipasang pada lapisan overlay terpisah dengan `fill="none"` atau transparan, jadi bila filter diabaikan lapisan itu tidak tampak, bukan menjadi kotak hitam; (3) tingkat dibaca dari jumlah cincin, bukan dari tekstur. Uji grayscale dan uji tanpa-filter masuk ke golden test.

## Hosting

- Cloudflare Self-Serve Subscription Agreement (terakhir diperbarui 12 September 2025): tidak ada larangan eksplisit penggunaan komersial pada paket gratis; pasal 2.6 mengizinkan Cloudflare mengakhiri layanan gratis sesuai kebijakannya; pasal 2.2.1(h) melarang memproses data kartu kredit di properti web berpaket gratis (tidak relevan, tidak ada pembayaran fiat). Syarat Khusus Layanan (Pages) TIDAK dibaca. Pemilik membaca syarat yang berlaku saat membuat proyek.
- Pages Functions: permintaan dihitung ke kuota Workers Free (contoh dokumentasi: 100.000 per hari, reset 00:00 UTC); aset statis gratis dan tanpa batas. Akibat: `/api/rpc` harus hemat (cache pendek, batch, pembacaan massal) dan situs harus menampilkan keadaan "RPC dibatasi" bila kuota habis. CPU per pemanggilan tidak dibaca.
- Vercel Hobby tidak dipakai (larangan komersial).

## Toolchain dan lingkungan

- Ada: node v22.23.4, npm 10.9.9, git 2.34.1, python 3.10.12, curl. Tidak ada: forge, anvil, cast, slither, aderyn, pnpm. Lingkungan kerja adalah VM Linux; `~/.foundry` di Mac pemilik tidak terjangkau dari VM.
- Aturan kerja: forge tidak dipasang otomatis. Konsekuensi: kontrak tidak bisa dikompilasi atau diuji di sesi ini kecuali pemilik mengizinkan pemasangan atau menjalankan forge sendiri. Kontrak tidak boleh disebut "teruji" sebelum itu. Jalur cadangan sesuai aturan: spesifikasi dan rencana uji di docs/, situs dengan ABI tiruan berlabel.
- Hanya folder Verdigris yang terhubung. Folder rujukan (../Afterbell, ../dockhood-app, ../Asterism) tidak terjangkau; pola kode relay RPC tidak bisa disalin sampai akses diberikan, atau pola ditulis ulang dari awal dengan dokumentasi Cloudflare.

## Keputusan bawaan dari prompt (tidak diubah)

NFT ERC-721 saja; siklus 84 hari (12 x 7); Era Lima Matahari hanya spesifikasi; semua parameter immutable lewat constructor; tidak ada fungsi admin; Next.js static export + Cloudflare Pages Function `/api/rpc` read-only.

## Arah visual (diputuskan 2026-11-11)

Pemilik menyerahkan pilihan ("atur saja yang terbaik"). Dipilih Arah C, Exposure Rack: bronze coupons weathering on a test board.
Alasan: mekanik khas produk (waktu menjadi patina) tampil di layar pertama; gaya "laporan paparan" sejalan dengan kepribadian Jujur; paling jauh dari gaya yang dilarang (Bagian 1); gelap berasap merah-hitam dan perunggu teroksidasi sesuai suasana referensi. Dark-only: bahasa material membutuhkannya, `color-scheme: dark`.
Pilihan ini bisa diganti pemilik di titik berhenti kedua.

## Langkah 3: tokens dan styleguide

- Stack terpasang: Next.js 16.4.6 (App Router, `output: 'export'`, `trailingSlash`, gambar tidak dioptimasi), React 19.3.1, TypeScript 7.0.2 ketat (`noUncheckedIndexedAccess`), pnpm 12.18.0 (dipasang lewat `npm i -g` di lingkungan kerja; pnpm tidak ada di VM semula). Panduan terpasang dibaca di `node_modules/next/dist/docs` (static exports, fonts) sebelum menulis kode.
- Font di-host sendiri lewat paket `@fontsource` (subset Latin, bobot yang dipakai saja): Schibsted Grotesk 500/700/800, Source Serif 4 400/600, DM Mono 400/500. Fallback sistem dipilih mirip, ukuran fallback belum diselaraskan dengan `size-adjust` (CLS belum diukur).
- Semua nilai visual di `src/styles/tokens.css`. `pnpm check:tokens` menggagalkan warna atau ukuran liar; pengecualian: renderer disc tiruan (warna karya) dan satuan SVG di `Wheel.module.css`.
- `pnpm check:contrast` memeriksa 27 pasangan warna (teks 4,5:1; tepi komponen dan fokus 3:1) dan menulis `src/lib/contrast.generated.json` yang ditampilkan di /styleguide. Semua lolos. Satu pasangan (tepi switch aktif) awalnya salah digolongkan sebagai teks dan digolongkan ulang sebagai batas komponen 3:1 (4,18:1).
- Dialog memakai elemen `<dialog>` native (penjebak fokus, Esc, fokus kembali ke pemicu); laci HP memakai dialog yang sama.
- Disc di styleguide berasal dari renderer TIRUAN (`src/lib/disc.ts`, berlabel "Mock renderer"). Renderer on-chain belum ada karena forge tidak tersedia. Disc tiruan sudah memuat uji tanpa filter (cadangan) dan uji greyscale.
- Tooltip dibatasi 60vw supaya tidak meluber di 360px; penempatan di dekat tepi kanan belum dijamin dan perlu diperhatikan saat halaman dibuat.
- Tautan navigasi menuju halaman yang belum dibuat (Mint, Calendar, dst.) menghasilkan 404 di build statis sampai halaman itu ada.
- Belum dibuat (sesuai urutan kerja): halaman nyata, wagmi/viem, `/api/rpc`, 404 bermerek, uji E2E, Lighthouse.

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
- **Kebijakan teks**: `pnpm copy:check` memindai kata terlarang (kalimat negasi diizinkan). Tidak ada label "verified" atau "audited". Tanpa audit: "No external audit yet". Data pratinjau diberi label "PREVIEW".

### Hal yang BELUM TERVERIFIKASI (diulang agar tidak hilang)
Batas gas `eth_call`; dukungan Cancun/PUSH0; selisih jam sequencer; batas laju RPC; render SVG data-URI, ERC-2981 dan ERC-4906 di marketplace; perilaku dompet sungguhan; `/api/rpc` di Cloudflare; Syarat Khusus Layanan Cloudflare Pages; batas Tooltip pada tepi layar.

## UI motion and artwork

- The site layout mounts a canvas over the token gradient. Idle drift, pointer and touch bloom, ripples, and scroll depth share one drawing loop. It starts during idle, pauses on visibility changes, caps device pixel ratio at two, and cuts the backing resolution in half after sustained slow frames. Reduced motion uses a static frame. Two additional contrast checks cover the brightest canvas pigment.
- The Home wheel highlights the current Sign and supports pointer drag and arrow-key navigation. Gallery, Disc detail, Mint, and Vault use the same tilt surface. Home uses a keyboard-operable Patina timeline with deployment thresholds or the mainnet defaults. The Count clock uses the existing chain timestamp, and Calendar groups the same 84 Days by Sign and Numeral. The styleguide demonstrates the interactive and data states.
- The exposure plate, wheel accents, divider, status illustrations, favicon, and app icons are original SVG artwork. The 1200 × 630 Open Graph PNG is rasterized from its SVG source. Set the public site origin through `NEXT_PUBLIC_SITE_URL` at build time to publish an absolute Open Graph image URL. The artwork ships with the export in either case.
- No runtime dependency was added. The ambient component is about 1.7 KiB minified and gzipped in isolation. The wheel, timeline, and Gallery thumbnails omit Disc texture filters to reduce rendering work. Gallery's initial fallback reserves the same grid as its loading state, and the header reserves space for the Count status while the first read is pending.
- Typecheck, contrast, token check, parity, build, and copy check passed. Parity returned 99 byte-identical Discs. Browser checks use Chromium emulation and a synthetic read-only Count. Physical phones, a live deployment, and social crawler previews remain unverified.

Mobile Lighthouse 13.6.0 compared `main` with the updated static export. Both builds used the same loopback Brotli server and the same 168-Disc read-only fixture.

| Route | Performance before | Performance after | CLS before | CLS after | TBT before → after |
|---|---:|---:|---:|---:|---:|
| Home | 92 | 100 | 0.1824 | 0.0035 | 6.5 → 2.5 ms |
| Mint | 100 | 100 | 0.0476 | 0.0003 | 0.5 → 7.5 ms |
| Calendar | 100 | 100 | 0.0488 | 0.0002 | 10 → 5 ms |
| Gallery | 94 | 100 | 0.1509 | 0.0003 | 10.5 → 13 ms |
| Rules | 100 | 100 | 0.0560 | 0.0071 | 4 → 2 ms |
| Vault | 100 | 100 | 0.0513 | 0.0057 | 1 → 1.5 ms |

The updated routes scored 100 for Accessibility, Best Practices, and SEO.

Chromium reported no horizontal overflow at 360, 768, or 1440 px. Keyboard navigation, tilt, wheel inertia, the ticking Count, and the live Calendar selection passed against the local fixture. The canvas checks exercised touch ripples, hidden and off-screen pausing, reduced motion, half-resolution fallback, and the CSS fallback. Median frame interval was 16.7 ms in mobile emulation with 4× CPU throttling.

### Ambient field revision

Patina now grows in irregular textured patches anchored to the Home wheel and viewport edges. The pointer draws a short bronze trail, and taps leave a bloom that expands and fades at its document position. The canvas reuses four small procedural textures. Other routes use a quieter composition. The bronze pigment adds one contrast check.

Home scored 100 in all four mobile Lighthouse categories with CLS 0.0018 and TBT 1.5 ms on the undeployed local export. Chromium reproduced the mouse and touch effects, static reduced motion, and off-screen pausing. Mobile emulation at 4× CPU throttling had a median frame interval of 16.7 ms. The six-route fixture audit above predates this revision.

The cursor revision replaces the bronze trail with one small light that follows the pointer. Patina patches grow faster, fine grains drift through the field, and tap blooms clear sooner. Touch canvases use one backing pixel per CSS pixel, and grain drawing is batched. Home's local mobile Lighthouse scored 100 in all four categories with CLS 0 and TBT 3.5 ms. The final 4× throttled mobile Chromium run measured a 33.3 ms median frame interval.

The texture revision uses 288-pixel Patina sprites with interpolated grain, replacing the regular pattern that showed when the sprites were enlarged. The canvas starts at up to 2× device resolution and reduces it in two steps under sustained load. The sprites are cached across client navigation.

## UI gerak dan karya visual (2026-11-11, dikerjakan langsung, bukan lewat Codex)

`docs/CODEX-UI-PROMPT.md` tetap ada sebagai catatan, tetapi **tidak dipakai**: pekerjaan itu dikerjakan di sesi ini.

### Yang ditambahkan
- **Tingkat gerak** (`web/src/lib/motion.tsx`): Full, Medium, Minimal, dipilih dari perangkat (kursor halus, jumlah inti CPU, `saveData`, memori). Render pertama selalu Minimal agar server dan klien sama. Pengaturan reduced-motion dari sistem selalu menang; tombol "Motion: Full / Reduced" di footer (disimpan di `localStorage`, dibungkus try/catch). Bila frame rata-rata lambat sekitar 2,5 detik, lapisan berat turun satu tingkat sendiri.
- **Latar hidup** (`Ambient*.tsx`): Minimal = backdrop CSS statis (tanpa pekerjaan skrip). Medium = canvas 2D (bloom verdigris hanyut, tertarik kursor seperti lensa hangat, riak saat klik atau tap, bergeser saat scroll). Full = shader WebGL tulisan sendiri (chunk terpisah, dimuat lazy), jatuh kembali ke canvas 2D bila WebGL tidak ada, gagal kompilasi, hilang konteks, atau lambat. Mulai 1,5 detik setelah halaman selesai dimuat. Berhenti saat tab tersembunyi. Resolusi setengah. Jumlah dan ukuran bloom mengecil di layar sempit.
- **Karya visual**: huruf judul Bodoni Moda (OFL-1.1, paket `@fontsource/bodoni-moda`, dimuat lewat `next/font/local` dengan fallback berukuran serasi), ukiran hero (`HeroArt`: 84 tik untuk 84 Day, arsiran medali, bloom Patina yang tumbuh mengikuti scroll lewat CSS `animation-timeline: scroll()` bila didukung), ornamen (`Rule`, `ChapterHead`, `Plate`), bab Romawi di Home.
- **Elemen live**: `TiltCard` (miring dan kilau, hanya mouse), `Strike` (animasi cetak saat mint sukses), `PatinaScrubber` (slider level 0-4), `Ticker` (CSS), sorotan Sign di Calendar plus denyut hari ini, reveal saat scroll (hanya elemen di bawah layar, diatur setelah halaman berjalan), transisi bersama Gallery ke detail (`ViewTransition` React).
- Semua dipajang di `/styleguide`, bagian "Motion and artwork".

### Keputusan
- Font: Schibsted 800 dan DM Mono 500 dibuang (bobot 800 dipetakan ke 700) untuk memangkas sekitar 40 KB font; Bodoni 700 satu berkas ditambahkan. Bodoni italic tidak dipakai (terlalu berat untuk jalur kritis).
- `h3` di `EmptyState`/`ErrorState` menjadi `h2` (urutan heading, A11y).
- Sticky wheel di Calendar, drag roda dengan inersia, tombol magnetik, dan loupe kursor **tidak dibuat**; diganti sorotan Sign (lebih sederhana dan tetap aksesibel). Roda tetap `role="img"`.
- Kanvas diberi gaya posisi inline karena CSS-nya bisa tiba setelah kanvas dan menggeser tata letak (ditemukan lewat CLS 0,44 di Rules, sudah diperbaiki).

### Pengukuran (Lighthouse mobile, build statis, kompresi brotli, chain lokal tanpa deployment)
Metode devtools-throttling (waktu nyata), sebelum dan sesudah, mesin yang sama: Home 88 -> 87, Mint 87 -> 92, Calendar 86 -> 88, Gallery 90 -> 89, Rules 89 -> 90, Vault 93 -> 86. Selisih masih dalam derau pengukuran (TBT 300-500 ms bergantung beban VM). A11y 100, Best Practices 96, SEO 100, CLS paling tinggi 0,048 (Rules, sama dengan sebelum perubahan). **Target Perf >= 90 belum tercapai di Home, Calendar, Gallery, dan Vault pada metode ini** (sebelum perubahan pun belum). Metode simulasi bawaan Lighthouse memberi angka lebih rendah karena server lokal terlalu cepat; tidak dipakai sebagai perbandingan.

### Belum terverifikasi
- Shader WebGL hanya dicoba di GL perangkat lunak (swiftshader), tidak di GPU nyata; frame time Full belum diukur di GPU.
- Perilaku kursor dan sentuhan di perangkat nyata; browser tanpa `animation-timeline` (fallback statis ada, belum dilihat).
- `ViewTransition` Gallery ke detail dan animasi Strike pada mint sungguhan (butuh deployment); Strike hanya diputar di `/styleguide`.
- Kontras teks di atas latar hidup tidak tercakup pemeriksa kontras (27 pasangan token); alpha bloom sudah diturunkan dan diperiksa mata di 390 dan 1440 px.
