-- =====================================================================
--  IHP Kukar — skema basis data
--  Jalankan SELURUH isi berkas ini sekali di Supabase:
--  Dashboard -> SQL Editor -> New query -> tempel -> Run
-- =====================================================================

-- 1. Tabel entri harga mingguan -------------------------------------------------
create table if not exists public.entri_harga (
  periode      text primary key,              -- '2026-08-M1'
  tahun        int  not null,
  bulan        int  not null,
  minggu       int  not null,
  label        text,
  harga        jsonb not null,                -- {"011101001": 17100, ...}
  catatan      text,
  diubah_oleh  text,
  diubah_pada  timestamptz not null default now()
);

-- 2. Catatan perubahan (jejak audit) --------------------------------------------
create table if not exists public.log_perubahan (
  id       bigserial primary key,
  periode  text not null,
  aksi     text not null,
  oleh     text,
  pada     timestamptz not null default now(),
  harga    jsonb
);

create or replace function public.catat_perubahan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.log_perubahan(periode, aksi, oleh, harga)
  values (new.periode, tg_op, coalesce(new.diubah_oleh, auth.jwt() ->> 'email'), new.harga);
  return new;
end $$;

drop trigger if exists trg_catat_perubahan on public.entri_harga;
create trigger trg_catat_perubahan
  after insert or update on public.entri_harga
  for each row execute function public.catat_perubahan();

-- 3. Row Level Security ---------------------------------------------------------
--    Siapa pun boleh membaca; hanya akun yang sudah masuk yang boleh menulis.
alter table public.entri_harga   enable row level security;
alter table public.log_perubahan enable row level security;

drop policy if exists "baca entri untuk semua"    on public.entri_harga;
drop policy if exists "tulis entri untuk petugas" on public.entri_harga;
drop policy if exists "ubah entri untuk petugas"  on public.entri_harga;
drop policy if exists "baca log untuk semua"      on public.log_perubahan;

create policy "baca entri untuk semua"    on public.entri_harga
  for select using (true);
create policy "tulis entri untuk petugas" on public.entri_harga
  for insert to authenticated with check (true);
create policy "ubah entri untuk petugas"  on public.entri_harga
  for update to authenticated using (true) with check (true);
create policy "baca log untuk semua"      on public.log_perubahan
  for select using (true);

-- 4. Realtime (opsional) — perubahan langsung muncul di layar lain ---------------
do $$
begin
  alter publication supabase_realtime add table public.entri_harga;
exception when duplicate_object then null;
end $$;
