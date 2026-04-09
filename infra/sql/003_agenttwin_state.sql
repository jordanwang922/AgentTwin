create table if not exists agenttwin_state (
  state_key varchar(128) primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
