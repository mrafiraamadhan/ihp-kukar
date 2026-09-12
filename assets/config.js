/* Sambungan ke Supabase.
   Ganti dua nilai di bawah dengan milik proyekmu:
   Supabase -> Project Settings -> API -> Project URL dan anon public key.
   Anon key memang aman ditaruh di repo publik; yang menjaga data adalah
   aturan Row Level Security di basis datanya, bukan kerahasiaan kunci ini. */
window.IHP_CONFIG = {
  url:     "https://anohggvwwldffmffbbvd.supabase.co",       // contoh: https://abcdefgh.supabase.co
  anonKey: "sb_publishable_8x1bZ1jbeLefzk0nK9_w1Q_O6-S-_N3"
};
