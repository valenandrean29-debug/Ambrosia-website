# Ambrosia — E-Commerce Suplemen Gym dengan AI Consultant

Ambrosia adalah platform e-commerce suplemen gym lokal Indonesia yang dibangun di atas Next.js. Selain menyediakan katalog produk dan sistem belanja online, Ambrosia dilengkapi dengan asisten AI interaktif bernama **Heracles** — seorang konsultan suplemen yang bisa diajak ngobrol langsung di dalam website untuk membantu pengguna menemukan produk yang paling sesuai dengan kebutuhan dan budget mereka.

---

## Daftar Isi

- [Fitur-fitur Utama](#fitur-fitur-utama)
- [Alur & Workflow Website](#alur--workflow-website)
- [Arsitektur Agent Heracles](#arsitektur-agent-heracles)
- [Struktur Proyek](#struktur-proyek)
- [Persiapan Environment Variables](#persiapan-environment-variables)
- [Cara Menjalankan di Localhost](#cara-menjalankan-di-localhost)
- [Menguji Agent Chatbot via Terminal](#menguji-agent-chatbot-via-terminal)
- [Tech Stack](#tech-stack)

---

## Fitur-fitur Utama

**Katalog Produk dengan Kategori**

Pengguna dapat menjelajahi produk suplemen yang tersusun rapi per kategori. Saat ini tersedia tiga kategori produk utama: `whey`, `creatine`, dan `gainer`. Setiap produk menampilkan nama, brand, harga, stok, dan deskripsi lengkap.

**Keranjang Belanja & Halaman Checkout**

Pengguna dapat menambahkan produk ke keranjang, mengatur jumlah pembelian, lalu melanjutkan ke halaman checkout. Semua data keranjang disimpan secara lokal di browser pengguna.

**Integrasi Pembayaran Xendit**

Proses pembayaran ditangani menggunakan Xendit. Setelah checkout berhasil dikonfirmasi, pengguna akan diarahkan ke halaman konfirmasi transaksi sukses.

**Halaman Riwayat Pesanan**

Pengguna yang sudah login dapat melihat riwayat transaksi pembelian mereka secara lengkap di halaman Orders.

**Autentikasi Pengguna via Supabase**

Sistem login dan manajemen akun pengguna dikelola menggunakan Supabase Auth. Data pengguna tersimpan di tabel `users` pada database Supabase yang terhubung langsung dengan aplikasi.

**Fitur Favorit Produk**

Pengguna yang sudah login dapat menyimpan produk favorit mereka untuk memudahkan akses di kemudian hari.

**Heracles — AI Consultant Chat Bubble**

Heracles hadir sebagai ikon obrolan melayang di pojok kanan bawah setiap halaman. Saat diklik, sebuah jendela percakapan akan terbuka dan Heracles akan langsung menyapa pengguna. Heracles mampu memahami kebutuhan spesifik pengguna — baik berupa keluhan fisik, target kebugaran, maupun batasan budget — lalu secara otomatis mencari produk yang paling relevan langsung dari database Ambrosia.

---

## Alur & Workflow Website

Berikut gambaran umum bagaimana pengguna berinteraksi dengan website, baik melalui jalur belanja biasa maupun konsultasi dengan Heracles.

```
Pengguna masuk ke website
    |
    +-- [Jalur Belanja]
    |       |
    |       +--> Jelajahi Katalog Produk per Kategori
    |       +--> Tambah produk ke Keranjang
    |       +--> Proses Checkout
    |       +--> Pembayaran via Xendit
    |       +--> Halaman Konfirmasi Sukses
    |
    +-- [Jalur Konsultasi Heracles]
            |
            +--> Klik ikon chat bubble di pojok kanan bawah
            +--> Heracles menyapa dan siap menerima pertanyaan
            +--> Pengguna menjelaskan kebutuhan atau keluhan
                    |
                    +--> Heracles menganalisis input pengguna
                    +--> Heracles mencari produk yang sesuai dari database Supabase
                            |
                            +--> [Produk ditemukan]
                            |       +--> Heracles merekomendasikan maks. 2 produk terbaik
                            |       +--> Dilengkapi alasan & perbandingan harga
                            |
                            +--> [Produk tidak ditemukan]
                                    +--> Heracles menginformasikan ketersediaan produk
```

---

## Arsitektur Agent Heracles

Heracles dibangun menggunakan framework **LangGraph** dengan arsitektur ReAct (Reasoning + Acting), yang memungkinkan AI untuk berpikir terlebih dahulu sebelum memutuskan tindakan apa yang perlu diambil.

Berikut penjelasan alur kerja internal Heracles setiap kali menerima pesan dari pengguna:

**1. Planning Node (planningUserRequest)**

Ini adalah titik masuk utama. LLM membaca keseluruhan riwayat percakapan beserta *system prompt* yang mendefinisikan siapa Heracles dan apa tugasnya. Di sini LLM memutuskan dua hal:
- Apakah ini pertanyaan biasa yang bisa langsung dijawab?
- Atau apakah LLM perlu memanggil *tool* pencarian produk untuk mendapat data nyata?

**2. Router (Conditional Edge)**

Setelah Planning Node selesai berpikir, sebuah fungsi *router* mengecek apakah LLM memutuskan untuk memanggil *tool* atau tidak. Jika ya, alur diteruskan ke Tool Node. Jika tidak, alur langsung ke node `answerUser`.

**3. Tool Node (toolsToScrape)**

Di sinilah Heracles "mengakses database". *Tool* `search_products` akan mengirim *query* ke Supabase berdasarkan parameter yang ditentukan LLM:
- `category` — kategori produk (`whey`, `creatine`, atau `gainer`)
- `max_price` — batas harga maksimum dari budget pengguna
- `keyword` — kata kunci untuk pencarian di kolom `name`, `description`, dan `brand`

**4. Evaluate & Result Node (evaluateAndResult)**

Setelah database mengembalikan data, LLM kembali dipanggil untuk mengevaluasi hasil tersebut. Node ini bertugas memilih maksimal 2 produk yang paling relevan dan menyajikannya dalam format percakapan yang natural, seperti seorang sales yang menyenangkan namun tetap to-the-point.

**5. Memory (MemorySaver)**

Setiap percakapan disimpan berdasarkan `thread_id` yang unik per sesi browser. Ini memungkinkan Heracles untuk "mengingat" apa yang sudah dibicarakan sebelumnya dalam satu sesi. Jika pengguna di percakapan pertama menyebut budget di bawah 300 ribu, lalu di pesan berikutnya bertanya "ada yang lebih ringan?", Heracles akan tetap paham konteksnya.

---

## Struktur Proyek

```
ambrosia-app/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # API endpoint untuk chatbot Heracles (/api/chat)
│   │   └── midtrans/route.ts   # API endpoint untuk pembayaran Midtrans/Xendit
│   ├── cart/page.tsx           # Halaman keranjang belanja
│   ├── checkout/
│   │   ├── page.tsx            # Halaman checkout
│   │   └── success/page.tsx    # Halaman konfirmasi pembayaran berhasil
│   ├── favorites/page.tsx      # Halaman produk favorit
│   ├── login/page.tsx          # Halaman login pengguna
│   ├── orders/page.tsx         # Halaman riwayat pesanan
│   ├── product/[id]/page.tsx   # Halaman detail produk (dynamic routing)
│   ├── globals.css             # Stylesheet global
│   ├── layout.tsx              # Root layout (termasuk ChatBubble global)
│   └── page.tsx                # Halaman utama (homepage)
│
├── components/
│   ├── ChatBubble.tsx          # Komponen floating chat Heracles
│   ├── CategoryCards.tsx       # Komponen kartu kategori produk
│   ├── HeroSection.tsx         # Komponen hero banner homepage
│   ├── Navbar.tsx              # Komponen navigasi utama
│   ├── ShowcaseSection.tsx     # Komponen showcase produk unggulan
│   └── TopBanner.tsx           # Komponen banner promosi di bagian atas
│
├── lib/
│   ├── agent/
│   │   ├── graph.ts            # Konstruksi LangGraph: nodes, edges, dan memori agent
│   │   ├── state.ts            # Definisi state/memori percakapan agent
│   │   └── tools.ts            # Tool search_products yang terhubung ke Supabase
│   └── supabase.ts             # Inisialisasi Supabase client
│
├── test-agent.ts               # Script untuk pengujian agent Heracles via terminal
└── .env.local                  # File environment variables (tidak di-push ke GitHub)
```

---

## Persiapan Environment Variables

Buat file `.env.local` di dalam folder `ambrosia-app/`, kemudian isi dengan nilai yang sesuai. File ini tidak akan ikut ter-upload ke GitHub karena sudah terdaftar di `.gitignore`.

```env
# Supabase — untuk database produk dan autentikasi pengguna
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Xendit — untuk gateway pembayaran
XENDIT_SECRET_KEY=your-xendit-secret-key

# OpenAI / LLM Proxy — untuk menjalankan agent Heracles
OPENAI_API_KEY=your-openai-api-key
BASE_URL=https://api.openai.com/v1
```

Keterangan singkat masing-masing variabel:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase Anda, bisa ditemukan di pengaturan proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci publik (anon) untuk mengakses Supabase dari sisi browser |
| `XENDIT_SECRET_KEY` | Kunci rahasia dari dashboard Xendit untuk pemrosesan pembayaran |
| `OPENAI_API_KEY` | API Key untuk mengakses model LLM yang digunakan oleh Heracles |
| `BASE_URL` | Base URL endpoint LLM (bisa diisi URL proxy jika tidak menggunakan OpenAI langsung) |

---

## Cara Menjalankan di Localhost

**Langkah 1 — Clone/Pull Repositori**

Unduh kode sumber proyek ini ke komputer lokal Anda:

```bash
git clone https://github.com/valenandrean29-debug/Ambrosia-website.git
cd Ambrosia-website/ambrosia-app
```

**Langkah 2 — Install Semua Dependensi**

Pasang seluruh library yang dibutuhkan proyek dengan menjalankan:

```bash
npm install
```

**Langkah 3 — Buat File Environment**

Buat file `.env.local` di dalam folder `ambrosia-app/` dan isi sesuai panduan pada bagian [Persiapan Environment Variables](#persiapan-environment-variables) di atas.

**Langkah 4 — Jalankan Server Development**

```bash
npm run dev
```

Setelah server menyala, buka browser dan akses [http://localhost:3000](http://localhost:3000). Website Ambrosia akan tampil lengkap beserta ikon chat Heracles di pojok kanan bawah.

---

## Menguji Agent Chatbot via Terminal

Tersedia sebuah *script* pengujian untuk mencoba alur logika Heracles secara langsung melalui terminal, tanpa perlu membuka browser. Ini berguna untuk memverifikasi apakah koneksi ke LLM dan Supabase berjalan dengan benar.

```bash
npx tsx test-agent.ts
```

Script ini akan mensimulasikan dua giliran percakapan: pengguna menyebutkan kebutuhan suplemen, lalu di pesan berikutnya menanyakan produk dengan harga tertentu. Output di terminal akan menampilkan filter yang dikirim ke Supabase, jumlah produk yang ditemukan, dan respons akhir dari Heracles.

Pastikan file `.env.local` sudah terisi dengan benar sebelum menjalankan perintah ini.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| Database & Auth | Supabase |
| Payment Gateway | Xendit |
| AI Agent Framework | LangGraph (StateGraph) |
| LLM | OpenAI-compatible API (DeepSeek v4 Pro) |
| AI Orchestration | LangChain Core & LangChain OpenAI |
| Validasi Schema Tool | Zod |
