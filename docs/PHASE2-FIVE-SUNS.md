# Fase 2: Five Suns (hanya spesifikasi, tidak dibangun, tidak dideploy)

Status: **spec saja**. Tidak ada kode, tidak ada kontrak, tidak ada halaman situs untuk fase ini. Dokumen ini ada agar keputusan Fase 1 tidak menutup pintu, dan agar Fase 1 tidak menjanjikan apa pun tentang Fase 2.

## Prinsip

1. `VerdigrisDisc` tidak diubah dan tidak bisa diubah. Fase 2 berdiri di kontrak terpisah yang hanya memakai antarmuka ERC-721 standar.
2. Tidak ada token, tidak ada imbalan finansial, tidak ada janji kenaikan nilai. Fase 2 bukan insentif untuk membeli di Fase 1.
3. Kosakata sama: Count, Day, Sign, Numeral, Disc, Patina, Vault.

## Gagasan

"Five Suns" adalah masa tempa: pemegang dapat menyerahkan beberapa Disc untuk ditempa menjadi satu objek baru. Penyerahan dilakukan dengan `transferFrom` ke alamat penampung permanen (Disc tidak punya fungsi burn; transfer ke alamat mati sudah cukup dan tidak memerlukan perubahan Fase 1).

## Pertanyaan terbuka (untuk diputuskan pemilik sebelum apa pun dibangun)

- Apa syarat tempa (kombinasi Sign, Numeral, tier, atau Patina)?
- Apakah hasil tempa memakai renderer yang sama atau baru? Bagaimana ia menampilkan asal-usulnya?
- Berapa banyak era dan kapan berakhir?
- Biaya tempa: ada atau tidak? Bila ada, ke TREASURY yang sama?
- Bagaimana Patina Disc asal tercermin pada hasil, tanpa mengklaim nilai?

## Batasan

- Tidak boleh ada kata atau salinan di situs Fase 1 yang menjanjikan Fase 2.
- Setiap rilis Fase 2 butuh paket audit sendiri dan checklist peluncuran sendiri.
