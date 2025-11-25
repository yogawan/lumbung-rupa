**Authentication**

This document describes the authentication-related HTTP endpoints, expected request shapes, upload flows (Cloudinary), environment variables, and examples for the BudayaGo backend.

**Server**: - runs at `http://localhost:3000` in development (Next.js app router)

**API Docs (Swagger)**: `GET /api/docs` (serves Swagger UI) which points to `public/openapi.json`.

**Environment**
- **CLOUDINARY_CLOUD_NAME**: your Cloudinary cloud name.
- **CLOUDINARY_API_KEY**: Cloudinary API key.
- **CLOUDINARY_API_SECRET**: Cloudinary API secret.
- **ALLOW_ADMIN_SIGNUP**: set to `true` to allow public ADMIN registration (default: blocked).

Add these to your local `.env` (do not commit secrets).

**Models (high-level)**
- `User`: holds authentication and profile fields plus document URL fields:
	- `email`, `password` (hashed)
	- `fullName`, `phone`
	- `role` — one of `CULTURAL_PARTNER`, `LICENSE_BUYER`, `ADMIN`
	- Company fields: `companyName`, `industry`, `companyAddress`, `companyWebsite`, `companyRegistrationNumber`
	- Document URL fields (nullable): `buktiKemitraan`, `dokumenLegal`, `suratPernyataanIp`, `dokumenKYC`, `dokumenBilling`, `dokumenPajak`
	- `verificationStatus` — `PENDING` / `VERIFIED` / `REJECTED`

**Auth Endpoints**

- `POST /api/auth/register`
	- Purpose: register a new user. Supports two request modes:
		- `application/json`: client uploads files separately (e.g., via Cloudinary) and sends document URLs in `documents`.
		- `multipart/form-data`: client can send files directly in the same request; server will upload them to Cloudinary and store resulting URLs.
	- Supported form fields (multipart):
		- `email` (string), `password` (string), `fullName`, `nomorTelepon`, `role` (e.g., `CULTURAL_PARTNER`), `companyProfile` (JSON string)
		- Document file fields: `buktiKemitraanBudaya`, `dokumenLegal`, `suratPernyataanIP`, `dokumenKYC`, `dokumenBilling`, `dokumenPajak`
		- Optional `uploadFolder` to set Cloudinary folder for uploaded files.
	- JSON body shape (if not using multipart):
		{
			"email": "...",
			"password": "...",
			"fullName": "...",
			"nomorTelepon": "...",
			"role": "CULTURAL_PARTNER",
			"companyProfile": { /* company fields (localized keys accepted) */ },
			"documents": [ { "type": "BUKTI_KEMITRAAN", "url": "https://..." }, ... ]
		}
	- Behavior & validations:
		- Blocks creating `ADMIN` unless `ALLOW_ADMIN_SIGNUP=true`.
		- If `role` is `CULTURAL_PARTNER`, `BUKTI_KEMITRAAN` and `SURAT_PERYATAAN_IP` are required and must include a URL.
		- When multipart is used and files are provided, the server uploads files to Cloudinary and collects `secure_url` values to include as document URLs.
	- Response: `201` with created user (password removed from response).
**Autentikasi (Panduan Singkat)**

Panduan ini menjelaskan endpoint autentikasi, cara upload dokumen ke Cloudinary, variabel lingkungan yang perlu di-set, serta contoh request/response yang mudah dipahami.

Server (development): `http://localhost:3000`

API Docs (Swagger): buka `GET /api/docs` untuk melihat spesifikasi OpenAPI.

Variabel lingkungan penting (simpan di `.env`, jangan commit):
- `CLOUDINARY_CLOUD_NAME` — nama cloud Anda (contoh: `dp4cmgw8n`).
- `CLOUDINARY_API_KEY` — API key Cloudinary.
- `CLOUDINARY_API_SECRET` — API secret Cloudinary.
- `ALLOW_ADMIN_SIGNUP` — jika `true`, publik bisa mendaftar role ADMIN (default: blocked).

Model singkat (`User`):
- `email`, `password` (tersimpan dalam bentuk hash)
- `fullName`, `phone`
- `role`: `CULTURAL_PARTNER` | `LICENSE_BUYER` | `ADMIN`
- Data perusahaan: `companyName`, `industry`, `companyAddress`, `companyWebsite`, `companyRegistrationNumber`
- Field URL dokumen (nullable): `buktiKemitraan`, `dokumenLegal`, `suratPernyataanIp`, `dokumenKYC`, `dokumenBilling`, `dokumenPajak`
- `verificationStatus`: `PENDING` / `VERIFIED` / `REJECTED`

1) Endpoint: Registrasi
------------------------
POST /api/auth/register

Fungsi: mendaftarkan user baru.

Mode request yang didukung:
- JSON (`application/json`): bila Anda sudah memiliki URL file (misal upload ke Cloudinary dulu), kirim data user + array `documents` yang berisi objek `{ type, url }`.
- Multipart (`multipart/form-data`): Anda bisa langsung mengirim file (PDF/Gambar) ke endpoint ini; server akan otomatis meng-upload file ke Cloudinary dan menyimpan URL di database.

Field yang bisa dikirim (multipart atau JSON):
- `email` (string) — wajib
- `password` (string) — wajib
- `fullName` (string)
- `nomorTelepon` (string)
- `role` (string) — contoh: `CULTURAL_PARTNER` atau `LICENSE_BUYER`
- `companyProfile` (JSON string atau object) — data perusahaan (boleh pakai nama field Bahasa Indonesia seperti `namaPerusahaan`)

Jika Anda pakai multipart: nama field file yang didukung (kirim file di field ini):
- `buktiKemitraanBudaya` (-> `BUKTI_KEMITRAAN`)
- `dokumenLegal` (-> `DOKUMEN_LEGAL`)
- `suratPernyataanIP` (-> `SURAT_PERYATAAN_IP`)
- `dokumenKYC` (-> `DOKUMEN_KYC`)
- `dokumenBilling` (-> `DOKUMEN_BILLING`)
- `dokumenPajak` (-> `DOKUMEN_PAJAK`)
- Optional: `uploadFolder` (string) — letak folder di Cloudinary

Validasi penting:
- Jika `role` = `CULTURAL_PARTNER`, maka `BUKTI_KEMITRAAN` dan `SURAT_PERYATAAN_IP` harus tersedia dan memiliki URL.
- Membuat `ADMIN` lewat public signup diblokir kecuali `ALLOW_ADMIN_SIGNUP=true`.

Contoh request (JSON):
```json
POST /api/auth/register
Content-Type: application/json

{
	"email": "buyer@example.com",
	"password": "StrongPass123",
	"role": "LICENSE_BUYER",
	"companyProfile": { "namaPerusahaan": "PT Contoh" },
	"documents": [ { "type": "DOKUMEN_BILLING", "url": "https://res.cloudinary.com/.../file.jpg" } ]
}
```

Contoh request (multipart, kirim file langsung):
```bash
curl -X POST http://localhost:3000/api/auth/register \
	-F "email=partner@example.com" \
	-F "password=Secret123!" \
	-F "role=CULTURAL_PARTNER" \
	-F "companyProfile={\"namaPerusahaan\":\"PT Contoh\"}" \
	-F "buktiKemitraanBudaya=@/path/to/file.pdf" \
	-F "suratPernyataanIP=@/path/to/file.pdf"
```

Contoh response sukses (201):
```json
{
	"id": "64a1...",
	"email": "partner@example.com",
	"fullName": "Nama Partner",
	"role": "CULTURAL_PARTNER",
	"buktiKemitraan": "https://res.cloudinary.com/.../file.pdf",
	"verificationStatus": "PENDING"
}
```

Contoh error singkat:
- 400 Bad Request — data kurang / dokumen wajib belum ada
- 409 Conflict — email sudah terdaftar

2) Endpoint: Login
-------------------
POST /api/auth/login

Body (JSON):
```json
{
	"email": "user@example.com",
	"password": "Secret123"
}
```

Response sukses (200):
```json
{
	"user": { "id": "...", "email": "user@example.com", "role": "LICENSE_BUYER" },
	"token": "<JWT_TOKEN_HERE>"
}
```

3) Endpoint: Upload file satu-per-user (server upload + simpan URL)
--------------------------------------------------------------
POST /api/upload/user-document

Fungsi: endpoint ini menerima 1 file (PDF/Gambar) dari client, upload file itu ke Cloudinary, lalu langsung menyimpan `secure_url` yang dikembalikan Cloudinary ke field `User` yang sesuai.

Form (multipart) yang harus dikirim:
- `userId` (string) — id user yang akan disimpan URL-nya
- `type` (string) — salah satu: `BUKTI_KEMITRAAN`, `DOKUMEN_LEGAL`, `SURAT_PERYATAAN_IP`, `DOKUMEN_KYC`, `DOKUMEN_BILLING`, `DOKUMEN_PAJAK`
- `file` — file yang diupload (PDF/jpg/png)
- optional `folder` — Cloudinary folder

Contoh curl:
```bash
curl -X POST http://localhost:3000/api/upload/user-document \
	-F "userId=<USER_ID>" \
	-F "type=BUKTI_KEMITRAAN" \
	-F "file=@/path/to/file.pdf" \
	-F "folder=budayago/users"
```

Response sukses:
```json
{ "ok": true, "url": "https://res.cloudinary.com/.../file.pdf", "user": { /* updated user */ } }
```

Penting: untuk keamanan, sebaiknya endpoint ini dibatasi sehingga hanya pemilik `userId` atau admin yang dapat meng-upload (gunakan JWT di header Authorization).

4) Endpoint terkait Cloudinary lain
----------------------------------
- `POST /api/upload/signature` — untuk mendapatkan signature agar client bisa upload langsung ke Cloudinary (jika Anda ingin client upload sendiri).
- `POST /api/upload/cloudinary` — endpoint server-side lain yang menerima field `file` dan meng-upload ke Cloudinary (mengembalikan `secure_url`).

5) Catatan teknis dan rekomendasi
--------------------------------
- Server menyimpan hanya URL (`secure_url`) dari Cloudinary, bukan file biner atau nama file.
- Jika Anda butuh riwayat (banyak versi per tipe dokumen), sebaiknya gunakan model terpisah (Document[]) bukan field tunggal.
- Disarankan menambahkan validasi input (mis. `zod`) dan otorisasi JWT pada endpoint upload.

Troubleshooting singkat
- Jika upload gagal (500), cek variabel env Cloudinary dan restart server.
- Untuk melihat kontrak API, buka `http://localhost:3000/api/docs`.

---

Dokumentasi ini dimaksudkan supaya gampang dibaca — kalau mau saya tambahkan contoh kode React yang otomatis upload file lalu panggil register, saya bisa tambahkan.

