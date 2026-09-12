/* Sambungan ke Supabase.
   Ganti dua nilai di bawah dengan milik proyekmu:
   Supabase -> Project Settings -> API -> Project URL dan anon public key.
   Anon key memang aman ditaruh di repo publik; yang menjaga data adalah
   aturan Row Level Security di basis datanya, bukan kerahasiaan kunci ini. */
window.IHP_CONFIG = {
  url:     "ISI-URL-PROYEK-SUPABASE",       // contoh: https://abcdefgh.supabase.co
  anonKey: "ISI-ANON-PUBLIC-KEY"
};
