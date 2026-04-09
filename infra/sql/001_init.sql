create table if not exists tenants (
  id uuid primary key,
  code varchar(64) not null unique,
  name varchar(128) not null,
  status varchar(32) not null default 'active',
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists channels (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  type varchar(32) not null,
  corp_id varchar(128),
  agent_id varchar(128),
  secret varchar(256),
  token varchar(256),
  aes_key varchar(256),
  callback_url text,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  channel_id uuid not null references channels(id),
  ext_group_id varchar(128) not null,
  name varchar(128) not null,
  trigger_mode varchar(32) not null default 'mention_only',
  auto_reply_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  channel_user_id varchar(128) not null,
  nickname varchar(128),
  role varchar(32) not null default 'member',
  tags_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  channel_id uuid references channels(id),
  group_id uuid references groups(id),
  user_id uuid references users(id),
  trace_id varchar(128) not null,
  normalized_text text not null,
  raw_payload jsonb not null,
  reply_text text,
  reply_mode varchar(32),
  confidence numeric(5, 4),
  created_at timestamptz not null default now()
);

create table if not exists knowledge_bases (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name varchar(128) not null,
  type varchar(32) not null,
  status varchar(32) not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists knowledge_items (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  knowledge_base_id uuid not null references knowledge_bases(id),
  item_type varchar(32) not null,
  source_uri text,
  section_title varchar(255),
  content text not null,
  tags_json jsonb not null default '[]'::jsonb,
  chunk_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  trace_id varchar(128) not null,
  event_type varchar(64) not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
