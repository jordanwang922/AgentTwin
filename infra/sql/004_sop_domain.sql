create table if not exists sop_templates (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name varchar(128) not null,
  channel varchar(32) not null,
  content text not null,
  variables_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sop_template_versions (
  id uuid primary key,
  template_id uuid not null references sop_templates(id),
  version_no integer not null,
  content text not null,
  variables_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sop_tasks (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  template_id uuid not null references sop_templates(id),
  delivery_type varchar(32) not null,
  target_group_id varchar(128),
  target_user_id varchar(128),
  schedule_at timestamptz not null,
  status varchar(32) not null default 'pending',
  variables_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create table if not exists task_executions (
  id uuid primary key,
  task_id uuid not null references sop_tasks(id),
  status varchar(32) not null,
  rendered_content text not null,
  created_at timestamptz not null default now()
);

create table if not exists message_deliveries (
  id uuid primary key,
  task_id uuid not null references sop_tasks(id),
  channel varchar(32) not null,
  target_type varchar(32) not null,
  target_id varchar(128) not null,
  content text not null,
  status varchar(32) not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
