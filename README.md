# GhostChat

GhostChat adalah aplikasi messenger privat berbasis Expo/React Native. Aplikasi ini dirancang untuk komunikasi peer-to-peer tanpa backend chat permanen.

## Versi saat ini

**1.0.0** — package Android: `com.mrk1pl4y.ghostchat`.

## Fitur

GhostChat menyediakan chat teks realtime melalui WebRTC DataChannel, panggilan suara, video call, indikator kualitas jaringan, dan fallback TURN untuk koneksi lintas jaringan. Pengguna juga dapat mengirim foto dari galeri, mengambil foto langsung dari kamera, memilih dokumen, serta merekam dan mengirim voice note.

Aplikasi menampilkan notifikasi lokal ketika pesan, attachment, atau panggilan masuk diterima oleh aplikasi. Pesan dapat disalin dengan menekan lama bubble chat. Background chat dan video intro menggunakan aset branding GhostChat.

## Cara menghubungkan dua perangkat

1. Buat offer pada perangkat pertama.
2. Salin payload signaling ke perangkat kedua melalui kanal yang dipercaya.
3. Perangkat kedua memilih **Terima Offer**, lalu mengirim answer kembali.
4. Perangkat pertama memilih **Terapkan Answer**.
5. Setelah DataChannel berstatus terbuka, chat dan attachment dapat dikirim.

Signaling manual diperlukan karena aplikasi ini tidak memakai server signaling. TURN Open Relay dipakai sebagai fallback demo; untuk produksi, gunakan kredensial TURN sendiri.

## Pengembangan

```bash
pnpm install
pnpm check
pnpm lint
pnpm dev
```

Web preview dapat digunakan untuk memeriksa UI. Fitur native seperti kamera, mikrofon, notifikasi, dan WebRTC native perlu development build atau APK release; fitur tersebut tidak seluruhnya tersedia di Expo Go.

## Build Android

Workflow GitHub Actions berada di `.github/workflows/android-release.yml`. Jalankan workflow dari tab **Actions** atau push tag `v*`. APK release yang dihasilkan workflow harus diuji pada dua perangkat fisik dengan jaringan berbeda.

## Batasan penting

GhostChat saat ini memakai signaling manual. Notifikasi push ketika aplikasi benar-benar tertutup belum tersedia tanpa layanan push/signaling. Transfer file menggunakan DataChannel sehingga ukuran dan kestabilan dipengaruhi memory perangkat serta kualitas jaringan. Screen sharing belum diaktifkan dan memerlukan implementasi native platform-specific.

## Privasi dan keamanan

Media dikirim peer-to-peer melalui WebRTC ketika koneksi berhasil. TURN dapat menjadi relay ketika koneksi langsung tidak memungkinkan. Jangan memakai kredensial TURN demo untuk distribusi produksi. Pengguna bertanggung jawab untuk membagikan payload signaling hanya kepada partner yang dituju.

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat [LICENSE](LICENSE).

## Changelog

Riwayat perubahan tersedia di [CHANGELOG.md](CHANGELOG.md).
