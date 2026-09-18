# Changelog

Semua perubahan penting pada GhostChat dicatat di file ini.

## [1.0.0] — 2026-09-19

### Ditambahkan

- UI GhostChat bertema dark merah dengan video intro bersuara.
- Background percakapan dan ikon aplikasi dari aset branding.
- Pairing code dengan masa berlaku 1 sampai 3 hari.
- WebRTC audio call dan video call dengan signaling manual.
- STUN dan fallback TURN Open Relay melalui UDP, TCP, dan TLS.
- Indikator kualitas jaringan real-time untuk RTT, packet loss, dan jalur koneksi.
- Chat teks antarperangkat melalui WebRTC DataChannel.
- Transfer attachment melalui DataChannel dengan chunk Base64.
- Picker foto dari galeri dan kamera langsung.
- Pemilih dokumen untuk file umum.
- Rekaman dan pengiriman voice note.
- Notifikasi lokal untuk pesan, attachment, dan panggilan masuk.
- Long-press untuk menyalin pesan.
- Workflow GitHub Actions untuk APK Android signed release.

### Catatan rilis

Versi ini adalah baseline release untuk pengujian pada perangkat fisik. Signaling masih manual dan screen sharing belum termasuk dalam rilis ini. Notifikasi ketika aplikasi tertutup memerlukan push service atau signaling backend.
