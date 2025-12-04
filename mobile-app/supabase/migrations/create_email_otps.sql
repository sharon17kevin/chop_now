-- Create email OTPs table for secure verification code storage
-- This table stores hashed verification codes with expiry and attempt tracking

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts int not null default 0,
  constraint email_otps_attempts_check check (attempts >= 0 and attempts <= 10)
);

-- Index for fast email lookup
create index if not exists email_otps_email_idx on public.email_otps(email);

-- Index for cleanup of expired codes
create index if not exists email_otps_expires_at_idx on public.email_otps(expires_at);

-- Enable Row Level Security
alter table public.email_otps enable row level security;

-- RLS policies (only server with service_role can access)
create policy "Service role can manage OTPs"
  on public.email_otps
  for all
  using (auth.role() = 'service_role');

-- Function to clean up expired OTPs (run periodically via pg_cron or manual)
create or replace function public.cleanup_expired_otps()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.email_otps
  where expires_at < now();
end;
$$;

-- Comment on table
comment on table public.email_otps is 'Stores hashed email verification codes with expiry and rate limiting';
