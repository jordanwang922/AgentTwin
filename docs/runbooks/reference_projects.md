# AgentTwin Reference Projects

These projects informed the AgentTwin foundation design. They are references for boundaries and implementation ideas, not direct templates to copy wholesale.

## Reference List

- HuixiangDou
  - URL: `https://github.com/InternLM/HuixiangDou`
  - Use for: staged group-chat processing, refusal logic, and knowledge-first answering
- LangBot
  - URL: `https://github.com/rockchinQ/LangBot`
  - Use for: channel abstraction and multi-platform bot expansion
- ChatGPT-on-WeChat
  - URL: `https://github.com/zhayujie/chatgpt-on-wechat`
  - Use for: adapter ergonomics and plugin-inspired extension points
- FastGPT
  - URL: `https://github.com/labring/FastGPT`
  - Use for: knowledge-base and retrieval workflow expectations
- MaxKB
  - URL: `https://github.com/1Panel-dev/MaxKB`
  - Use for: enterprise knowledge operations surface and PostgreSQL + pgvector-oriented architecture
- WeCom Bot MCP Server
  - Docs: `https://loonghao.github.io/wecom-bot-mcp-server/`
  - Use for: WeCom bot configuration patterns and communication-layer constraints

## How They Influence This Repo

- Access layer decisions should remain lightweight and adapter-oriented.
- Business logic should stay independent from any single chat platform.
- Knowledge management is a product feature, not an integration afterthought.
- Strong logging, routing, and refusal boundaries matter as much as the generation step.
