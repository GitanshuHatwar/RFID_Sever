create extension if not exists pgcrypto;

create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  username varchar(100) not null unique,
  password_hash text not null,
  full_name varchar(200) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  rfid_uid varchar(20) not null unique,
  name varchar(200) not null,
  device_type varchar(100) not null,
  model varchar(200),
  serial_number varchar(200),
  manufacturer varchar(200),
  location varchar(200),
  status varchar(20) not null default 'ACTIVE'
    check (status in ('ACTIVE','UNDER_REPAIR','RETIRED')),
  purchase_date date,
  warranty_expiry date,
  notes text,
  photo_path text,
  created_by uuid references technicians(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists readers (
  id uuid primary key default gen_random_uuid(),
  reader_id varchar(100) not null unique,
  name varchar(200) not null,
  location varchar(200),
  is_active boolean not null default true,
  last_seen timestamptz
);

create table if not exists tap_logs (
  id bigserial primary key,
  rfid_uid varchar(20) not null,
  device_id uuid references devices(id) on delete set null,
  reader_id uuid references readers(id),
  recognized boolean not null,
  tapped_at timestamptz not null default now()
);
create index if not exists tap_logs_tapped_at_idx on tap_logs(tapped_at desc);
create index if not exists tap_logs_id_idx on tap_logs(id desc);

create sequence if not exists ticket_number_seq start 1;
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number varchar(20) not null unique,
  device_id uuid not null references devices(id),
  title varchar(300) not null,
  description text,
  priority varchar(20) not null check (priority in ('LOW','MEDIUM','HIGH','CRITICAL')),
  status varchar(20) not null default 'OPEN'
    check (status in ('OPEN','IN_PROGRESS','CLOSED')),
  assigned_to uuid references technicians(id),
  created_by uuid references technicians(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  resolution_notes text
);
create index if not exists tickets_status_idx on tickets(status);
create index if not exists tickets_assigned_status_idx on tickets(assigned_to,status);
create index if not exists tickets_device_idx on tickets(device_id);

create table if not exists ticket_updates (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  technician_id uuid not null references technicians(id),
  note text not null,
  old_status varchar(20),
  new_status varchar(20),
  created_at timestamptz not null default now()
);

alter table technicians enable row level security;
alter table devices enable row level security;
alter table readers enable row level security;
alter table tap_logs enable row level security;
alter table tickets enable row level security;
alter table ticket_updates enable row level security;
