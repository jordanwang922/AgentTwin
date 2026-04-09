insert into tenants (id, code, name, status, settings_json)
values (
  '00000000-0000-0000-0000-000000000001',
  'agenttwin-demo',
  'AgentTwin Demo Tenant',
  'active',
  '{"brandName":"AgentTwin老师","replyStyle":"共情 -> 判断 -> 2到3条建议 -> 收尾"}'::jsonb
)
on conflict (id) do nothing;

insert into channels (id, tenant_id, type, corp_id, agent_id, callback_url)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'wecom',
  'demo-corp-id',
  'demo-agent-id',
  'https://api.example.com/wecom/callback'
)
on conflict (id) do nothing;

insert into groups (id, tenant_id, channel_id, ext_group_id, name, trigger_mode, auto_reply_enabled)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'group-demo',
  '家长群演示组',
  'mention_only',
  true
)
on conflict (id) do nothing;

insert into knowledge_bases (id, tenant_id, name, type, status)
values (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000001',
  'Demo Knowledge Base',
  'mixed',
  'active'
)
on conflict (id) do nothing;
