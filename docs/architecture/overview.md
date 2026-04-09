# AgentTwin Architecture Overview

## Product Shape

AgentTwin is a unified assistant platform. The current product center is one assistant core serving:

- teacher-side SOP automation
- student-side learning companionship

## Reference-Driven Decisions

- HuixiangDou informed the staged group-chat handling mindset: preprocess, risk gate, then answer.
- LangBot informed the future multi-channel adapter boundary.
- FastGPT and MaxKB informed the expectation that knowledge management and operations tooling are product features, not side scripts.
- ChatGPT-on-WeChat informed plugin ergonomics, but AgentTwin keeps the business core independent from any single chat platform.

## Runtime Layers

1. Access layer
   - WeCom callback endpoints
   - payload normalization
   - signature verification boundary
2. Business layer
   - role routing
   - chat request assembly
   - SOP task orchestration
   - tenant, group, and trigger-mode decisions
   - audit metadata
3. Intelligence layer
   - role-aware routing
   - FAQ resolution
   - template rendering
   - dialogue continuity
   - learner recommendation stub
   - learner segmentation and tag derivation
   - teacher alert derivation from learner and runtime signals
   - retrieval interface
   - model generation interface
4. Data layer
   - PostgreSQL and pgvector-ready schema
   - repository-backed runtime state for messages, audits, routing, mutable knowledge, SOP templates, tasks, and deliveries
5. Management layer
   - teacher operations backend
   - unified operations dashboard
   - logs, knowledge, template, and task operations

## Core Contracts

- `NormalizedInboundMessage`: unified inbound event shape
- `ChatRequest`: internal chat-engine request
- `ChatReply`: reply payload with reply mode, confidence, citations, risk flags, and trace id

## Initial Reply Modes

- `faq`
- `rag`
- `ai`
- `manual_block`

## Current Implemented Flow

1. WeCom callback requests are normalized into the internal `ChatRequest`.
   - JSON payloads from local testing are supported.
   - WeCom-style XML text callbacks are now parsed directly by the adapter.
   - Event-style callbacks now preserve `Event`, `ChangeType`, and `ChatId` metadata.
   - URL verification can now compare a SHA1 signature using token, timestamp, and nonce.
   - Encrypted callback messages can be decrypted with `EncodingAESKey`, signature, timestamp, nonce, and receive id.
   - The controller now routes both plain and encrypted callbacks through one adapter resolution function before entering the chat engine.
   - For XML callbacks, the controller can now generate passive text reply XML and encrypt the response envelope when credentials are present.
   - Non-text callbacks are acknowledged and audited instead of incorrectly flowing into the reply engine.
2. The teacher-side backend can now create SOP templates, extract placeholder variables, create scheduled tasks, and execute pending tasks for MVP validation.
3. Task execution renders template variables, creates delivery records, attempts active send when credentials exist, marks tasks with final status, and stores execution records.
4. The chat engine checks sensitive-rule matches first.
   - Before retrieval, the bot mention is stripped from the incoming group message.
   - Outbound replies are formatted with the tenant's configured brand role.
   - student-mode requests now persist recent dialogue turns through a session-based dialogue service.
   - student-mode requests can record simple lesson completion into learner profiles.
   - student-mode requests now also increment learner interaction counts so later teacher follow-up can be derived from actual usage.
5. If no sensitive rule hits, the engine checks demo FAQ entries.
6. If no FAQ hits, the engine scores demo knowledge articles by keyword overlap.
7. If no article is strong enough, the engine falls back to the LLM stub reply.
8. Every generated reply is stored in the runtime message and audit store and exposed through admin endpoints.
9. FAQ entries, knowledge articles, and risk rules can now be created through admin APIs and are persisted to the development knowledge catalog file.
10. Group routing configuration now gates the chat engine, including auto-reply enablement and mention-only triggering.
11. Runtime, knowledge, routing, dialogue, learner, and SOP state services now sit on top of repository-backed persistence, so the same service code can run against file-backed JSON stores or PostgreSQL-backed JSON state rows.
12. Phase 3 adds a derived linkage layer:
   - learner profiles now emit segments such as `new`, `active`, `needs_follow_up`, and `milestone`
   - teacher alerts are derived from learner segments plus runtime risk signals
   - admin now exposes a unified dashboard that combines SOP execution state with learner-level follow-up signals

## Current Limits

- active WeCom sending is implemented as an adapter helper, but not yet wired into a production-grade token cache and full delivery reconciliation loop
- retrieval and generation are stubs
- no auth yet
- no production-grade worker scheduler loop yet
- unified analytics are currently derived in-process from repository state; they are not yet materialized into a dedicated reporting store
