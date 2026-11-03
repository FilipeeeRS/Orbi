import type { LegalTexts } from ".";

const id: LegalTexts = {
  privacy: {
    title: "Kebijakan Privasi",
    intro:
      "Kebijakan ini menjelaskan data pribadi apa yang dikumpulkan Orbi, untuk apa, dibagikan kepada siapa, dan bagaimana kamu mengendalikannya, sesuai Undang-Undang Perlindungan Data Brasil (LGPD, UU 13.709/2018). Dengan memakai Orbi, kamu juga menyetujui {terms}. Ini adalah terjemahan; jika ada keraguan, versi bahasa Portugis yang berlaku.",
    sections: [
      {
        id: "who",
        title: "Siapa yang mengurus datamu",
        body: [
          "Orbi adalah proyek independen dari Brasil dan menjadi pengendali data pribadimu. Untuk urusan privasi apa pun, termasuk sebagai petugas pelindungan data (DPO), kirim email ke {email}.",
        ],
      },
      {
        id: "collect",
        title: "Data yang kami kumpulkan",
        body: ["Kami hanya mengumpulkan yang dibutuhkan agar Orbi berjalan:"],
        list: [
          "Akun: email, nama, dan kata sandi (disimpan terenkripsi oleh penyedia login kami; tidak ada orang di Orbi yang bisa melihatnya). Jika kamu masuk dengan Google, kami menerima nama, email, dan foto yang dibagikan Google.",
          "Profil: nama pengguna, nama tampilan, bio, lokasi, situs web, dan kata ganti (semuanya opsional kecuali nama pengguna), foto, sampul, stiker, favorit, bahasa, dan preferensi seperti profil tersembunyi dan konten dewasa.",
          "Yang kamu catat: status, rating, suka, ulasan, tanggal, episode yang ditonton, daftar, komentar, lampiran ulasan, orang yang kamu ikuti, laporan yang kamu kirim, dan karya yang kamu tambahkan ke katalog.",
          "Impor Letterboxd: file .zip hanya dibaca untuk membawa catatanmu; file itu sendiri tidak disimpan.",
          "Perangkat: jenis browser dan sistem (misalnya \"Chrome · Windows\") serta tanggal akses pertama, untuk memberi tahu saat akunmu masuk di perangkat baru. Kami tidak menyimpan alamat IP-mu di daftar ini.",
          "Data teknis: penyedia hosting dan basis data kami mencatat data seperti alamat IP serta tanggal dan waktu permintaan, demi keamanan dan agar layanan berjalan.",
        ],
      },
      {
        id: "not-collect",
        title: "Yang tidak kami kumpulkan",
        body: [
          "Kami tidak meminta nomor identitas, alamat, telepon, atau data pembayaran, tidak memakai lokasi tepatmu, dan tidak sengaja memproses data sensitif (seperti kesehatan, agama, atau pandangan politik). Kami tidak menjual datamu, tidak menampilkan iklan, dan tidak memakai alat pelacak atau analitik pihak ketiga.",
        ],
      },
      {
        id: "use",
        title: "Tujuan dan dasar hukum",
        list: [
          "Membuat dan mengelola akunmu, menyimpan dan menampilkan catatanmu, mengirim email akun (konfirmasi dan atur ulang kata sandi), serta menampilkan profilmu kepada orang lain: pelaksanaan kontrak, yaitu ketentuan ini (LGPD, pasal 7, V).",
          "Keamanan, seperti peringatan perangkat baru, pencegahan penyalahgunaan, dan peninjauan laporan: kepentingan sah (pasal 7, IX) dan pemenuhan kewajiban hukum (pasal 7, II).",
          "Menanggapi permintaan otoritas: pemenuhan kewajiban hukum atau perintah pengadilan.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "Apa yang bersifat publik",
        body: [
          "Profil, catatan, rating, ulasan, daftar, komentar, suka, dan siapa yang kamu ikuti bisa dilihat siapa saja, bahkan tanpa akun. Jika kamu menyembunyikan profil di {settings}, hanya kamu yang bisa melihat profil dan aktivitasmu. Emailmu tidak pernah ditampilkan kepada orang lain.",
        ],
      },
      {
        id: "share",
        title: "Dengan siapa kami berbagi",
        body: ["Kami tidak menjual atau menyewakan data. Data hanya melewati:"],
        list: [
          "Supabase (basis data, login, dan penyimpanan file) dan Vercel (hosting situs), yang memproses data atas nama kami.",
          "Google, hanya jika kamu memilih masuk dengan akun Google.",
          "TMDB, AniList, Open Library, dan Steam: gambar dan informasi karya dimuat dari server mereka, yang menerima alamat IP-mu, seperti di situs mana pun yang menampilkan gambar dari tempat lain.",
          "YouTube (youtube-nocookie.com): hanya saat kamu mengeklik untuk menonton trailer.",
          "MyMemory: hanya saat kamu mengeklik Terjemahkan pada ulasan; teks ulasan dikirim untuk diterjemahkan.",
          "Otoritas publik, jika diwajibkan oleh hukum atau perintah pengadilan.",
        ],
      },
      {
        id: "transfer",
        title: "Transfer ke luar negeri",
        body: [
          "Beberapa penyedia ini menyimpan data di server di luar Brasil, misalnya di Amerika Serikat. Transfer ini diperlukan untuk menjalankan layanan yang kamu minta (LGPD, pasal 33) dan dilakukan dengan penyedia yang menerapkan langkah keamanan dan klausul perlindungan data.",
        ],
      },
      {
        id: "retention",
        title: "Berapa lama kami menyimpan",
        body: [
          "Kami menyimpan datamu selama akunmu ada. Saat kamu menghapus akun, kami langsung menghapus profil, catatan, ulasan, daftar, komentar, suka, pengikut, perangkat, foto, dan lampiran. Cadangan penyedia dapat menyimpannya untuk waktu terbatas sampai tergantikan. Karya yang kamu tambahkan ke katalog tetap tersedia, tanpa kaitan denganmu. Kami dapat menyimpan data minimum yang diperlukan untuk mematuhi hukum atau membela diri dalam proses hukum.",
        ],
      },
      {
        id: "rights",
        title: "Hak-hakmu",
        body: [
          "Menurut LGPD (pasal 18), kamu bisa: memastikan apakah kami memproses datamu dan mengaksesnya; memperbaiki data yang tidak lengkap atau salah; meminta anonimisasi, pemblokiran, atau penghapusan data yang tidak perlu; menerima salinan datamu (portabilitas); mengetahui dengan siapa data dibagikan; mencabut persetujuan; dan menolak pemrosesan yang melanggar hukum.",
          "Hampir semuanya bisa kamu lakukan sendiri di {settings}: mengedit profil, mengunduh salinan datamu, dan menghapus akun. Untuk hal lain, kirim email ke {email}; kami membalas dalam 15 hari. Kamu juga bisa mengadu ke Otoritas Perlindungan Data Nasional Brasil (ANPD).",
        ],
      },
      {
        id: "minors",
        title: "Anak dan remaja",
        body: [
          "Orbi untuk orang berusia 13 tahun ke atas. Usia 13 sampai 17 tahun memerlukan izin orang tua atau wali. Jika kami tahu sebuah akun milik anak di bawah 13 tahun, akun itu akan dihapus. Orang tua dan wali dapat meminta penghapusan lewat {email}.",
        ],
      },
      {
        id: "security",
        title: "Keamanan",
        body: [
          "Kami memakai koneksi terenkripsi (HTTPS), kata sandi yang disimpan terenkripsi, dan aturan akses di basis data agar setiap orang hanya bisa mengubah miliknya sendiri. Tidak ada sistem yang benar-benar aman; jika terjadi insiden yang bisa menimbulkan risiko atau kerugian berarti, kami akan memberi tahu kamu dan ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookie",
        body: ["Kami hanya memakai cookie yang diperlukan agar situs berjalan dan mengingat pilihanmu. Detailnya ada di {cookies}."],
      },
      {
        id: "changes",
        title: "Perubahan kebijakan ini",
        body: [
          "Kami dapat memperbarui kebijakan ini. Tanggal versi yang berlaku ada di bagian atas halaman, dan untuk perubahan penting kami akan memberi tahu di situs sebelum berlaku.",
        ],
      },
    ],
  },
  terms: {
    title: "Ketentuan Penggunaan",
    intro:
      "Ketentuan ini adalah perjanjian antara kamu dan Orbi. Dengan membuat akun atau memakai situs, kamu menyetujuinya beserta {privacy}. Jika tidak setuju, jangan gunakan Orbi. Ini adalah terjemahan; jika ada keraguan, versi bahasa Portugis yang berlaku.",
    sections: [
      {
        id: "service",
        title: "Apa itu Orbi",
        body: [
          "Orbi adalah layanan gratis dan independen untuk mencatat dan berbagi apa yang kamu tonton, baca, dan mainkan. Layanan ini masih dikembangkan: fitur bisa berubah, dijeda, atau dihentikan, dan situs kadang bisa tidak tersedia.",
        ],
      },
      {
        id: "account",
        title: "Akunmu",
        list: [
          "Kamu harus berusia 13 tahun ke atas. Usia 13 sampai 17 tahun hanya dengan izin orang tua atau wali, yang juga bertanggung jawab atas penggunaannya.",
          "Gunakan data yang benar dan rahasiakan kata sandimu. Kamu bertanggung jawab atas apa yang dilakukan dengan akunmu.",
          "Nama pengguna tidak boleh meniru orang, merek, atau perusahaan lain, dan tidak boleh menyinggung.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "Kontenmu",
        body: [
          "Ulasan, rating, daftar, komentar, dan gambar yang kamu unggah tetap milikmu. Dengan mengunggah, kamu memberi Orbi lisensi gratis, berlaku di seluruh dunia, dan non-eksklusif untuk menyimpan, menampilkan, menyesuaikan format (misalnya membuat thumbnail atau menerjemahkan saat diminta), dan menyajikan konten itu di dalam Orbi selama masih dipublikasikan.",
          "Kamu menjamin punya hak untuk mengunggah apa yang kamu kirim. Karya yang kamu tambahkan ke katalog tetap tersedia bagi semua orang, bahkan setelah akunmu dihapus.",
        ],
      },
      {
        id: "rules",
        title: "Yang tidak diperbolehkan",
        list: [
          "Mengunggah konten ilegal, ujaran kebencian, pelecehan, ancaman, atau hasutan kekerasan.",
          "Mengunggah ketelanjangan atau konten seksual eksplisit; konten seksual apa pun yang melibatkan anak dihapus dan dilaporkan ke pihak berwenang.",
          "Menyebarkan data pribadi orang lain atau menyamar sebagai orang lain.",
          "Mengunggah konten bajakan atau tautannya, atau memakai gambar dan teks tanpa hak.",
          "Menulis ulasan palsu atau memanipulasi rating, suka, dan pengikut dengan akun palsu atau otomatisasi.",
          "Spam atau iklan massal.",
          "Mencoba membobol, membebani, atau menyalin situs secara massal, atau mengakali batas dan aturan akses.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Laporan dan moderasi",
        body: [
          "Gunakan tombol Laporkan di menu ulasan, komentar, dan daftar; untuk profil, kirim email ke {email}. Kami dapat menghapus konten serta menangguhkan atau menghapus akun yang melanggar ketentuan ini atau hukum, dan bila memungkinkan kami akan memberi tahu alasannya.",
        ],
      },
      {
        id: "copyright",
        title: "Hak cipta dan permintaan penghapusan",
        body: [
          "Jika ada konten di Orbi yang melanggar hakmu (termasuk gambar), kirim email ke {email} berisi tautan konten, alasannya, dan cara menghubungimu. Kami meninjau setiap permintaan dan menghapus yang beralasan.",
        ],
      },
      {
        id: "third-party",
        title: "Konten pihak ketiga",
        body: [
          "Judul, sinopsis, poster, sampul, dan data karya lainnya berasal dari TMDB, AniList, Open Library, dan Steam serta milik pemegang haknya; hanya dipakai untuk mengenali karya. Produk ini menggunakan API TMDB tetapi tidak didukung atau disertifikasi oleh TMDB. Orbi tidak berafiliasi dengan layanan-layanan tersebut maupun dengan Letterboxd.",
          "Rating dan ulasan adalah pendapat penulisnya, bukan Orbi. Kami tidak bertanggung jawab atas isi situs eksternal yang ditautkan.",
        ],
      },
      {
        id: "warranty",
        title: "Jaminan dan tanggung jawab",
        body: [
          "Orbi disediakan apa adanya, tanpa jaminan selalu tersedia, bebas kesalahan, atau informasi karyanya selalu benar. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kehilangan data, gangguan layanan, atau konten yang diunggah pengguna. Kami menyarankan kamu sesekali mengunduh salinan datamu di {settings}. Tidak ada di sini yang membatasi hakmu sebagai konsumen.",
        ],
      },
      {
        id: "end",
        title: "Pengakhiran",
        body: ["Kamu bisa menghapus akunmu kapan saja di {settings}. Kami dapat menutup akun yang melanggar ketentuan ini atau hukum."],
      },
      {
        id: "changes",
        title: "Perubahan ketentuan ini",
        body: [
          "Kami dapat memperbarui ketentuan ini. Tanggal versi yang berlaku ada di bagian atas halaman, dan untuk perubahan penting kami akan memberi tahu di situs sebelum berlaku. Terus memakai Orbi setelahnya berarti menerima versi baru.",
        ],
      },
      {
        id: "law",
        title: "Hukum yang berlaku dan kontak",
        body: ["Ketentuan ini tunduk pada hukum Brasil, dan yang berwenang adalah pengadilan di tempat tinggalmu. Pertanyaan, saran, atau keluhan: {email}."],
      },
    ],
  },
  cookies: {
    title: "Kebijakan Cookie",
    intro:
      "Cookie adalah file kecil yang disimpan situs di browsermu. Orbi hanya memakai cookie dan penyimpanan lokal yang diperlukan agar berjalan dan mengingat pilihanmu. Kami tidak memakai cookie iklan, pelacakan, atau analitik, jadi kami tidak meminta persetujuan.",
    sections: [
      {
        id: "cookies",
        title: "Cookie yang kami pakai",
        body: [],
        items: [
          ["sb-…-auth-token", "Membuatmu tetap masuk (Supabase). Berlaku sampai kamu keluar atau sesi berakhir."],
          ["orbi_locale", "Bahasa yang dipilih. 1 tahun."],
          ["orbi-device", "Menandai browser ini sebagai sudah dikenal, untuk peringatan \"perangkat baru\" di akunmu. 1 tahun."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Mengingat notifikasi yang sudah kamu lihat, tandai dibaca atau belum dibaca, dan hapus. 1 tahun."],
          ["orbi-getting-started-hidden", "Mengingat bahwa kamu menyembunyikan Langkah awal di Beranda. 1 tahun."],
        ],
      },
      {
        id: "storage",
        title: "Penyimpanan lokal",
        body: ["Beberapa pengaturan hanya tersimpan di browsermu dan tidak pernah dikirim ke kami:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Tema dan warna yang kamu pilih."],
          ["orbi-login", "Email atau nama penggunamu, hanya jika kamu mencentang \"Ingat saya\" saat masuk."],
          ["orbi-nav-history", "Halaman yang dibuka di tab ini, agar tombol Kembali berfungsi. Terhapus saat tab ditutup."],
        ],
      },
      {
        id: "third-party",
        title: "Cookie pihak ketiga",
        body: [
          "Orbi tidak memasang cookie pihak ketiga. Jika kamu mengeklik untuk menonton trailer, videonya berasal dari YouTube dalam mode privasi yang ditingkatkan (youtube-nocookie.com), yang dapat menyimpan data di browser sesuai kebijakan Google. Saat masuk dengan Google, halaman login Google memakai cookie miliknya.",
        ],
      },
      {
        id: "control",
        title: "Cara mengendalikannya",
        body: [
          "Kamu bisa menghapus atau memblokir cookie di pengaturan browser, tetapi tanpa cookie sesi kamu tidak bisa masuk. Keluar dari akun menghapus cookie sesi. Pertanyaan: {email}. Lihat juga {privacy}.",
        ],
      },
    ],
  },
};

export default id;
