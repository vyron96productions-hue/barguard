-- Run in Supabase SQL editor

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  email text not null,
  rep_name text,
  created_at timestamptz not null default now(),
  unique(business_id, name)
);
create index if not exists idx_vendors_business on vendors(business_id);

alter table inventory_items add column if not exists vendor_id uuid references vendors(id) on delete set null;
alter table businesses add column if not exists contact_email text;
