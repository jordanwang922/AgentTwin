import { startTransition, useEffect, useState } from "react";
import type {
  AdminOverview,
  AuditLogEntry,
  ChannelProfile,
  ChatReply,
  FaqEntry,
  GroupProfile,
  KnowledgeArticle,
  LearnerProfile,
  MessageDelivery,
  MessageLogEntry,
  RiskRule,
  SopTask,
  SopTemplate,
  TeacherAlert,
  TeacherDashboard,
  TenantProfile,
  UnifiedOpsDashboard
} from "@agenttwin/core";

const apiBaseUrl = (import.meta.env.VITE_AGENTTWIN_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:3100";

type SectionKey =
  | "overview"
  | "templates"
  | "tasks"
  | "deliveries"
  | "alerts"
  | "learners"
  | "settings"
  | "debug";

interface AdminKnowledgeResponse {
  faq: FaqEntry[];
  articles: KnowledgeArticle[];
  riskRules: RiskRule[];
}

interface AdminMessagesResponse {
  messages: MessageLogEntry[];
  audits: AuditLogEntry[];
}

interface AdminRoutingResponse {
  tenant: TenantProfile;
  channel: ChannelProfile;
  groups: GroupProfile[];
}

interface AdminStorageResponse {
  mode: "file" | "postgres";
  dataDir: string;
  databaseConfigured: boolean;
  databaseUrlPreview: string | null;
}

const navItems: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: "overview", label: "运营总览", description: "查看整体指标和联动看板" },
  { key: "templates", label: "SOP 模板库", description: "新增、编辑、删除模板" },
  { key: "tasks", label: "SOP 任务", description: "定时任务、立即执行、待执行处理" },
  { key: "deliveries", label: "投递日志", description: "查看消息投递结果" },
  { key: "alerts", label: "班主任提醒", description: "查看待跟进和风险提醒" },
  { key: "learners", label: "学员画像", description: "查看学员进度和分层" },
  { key: "settings", label: "班主任设置", description: "设置机器人和群触发规则" },
  { key: "debug", label: "调试测试", description: "问答测试、知识和审计" }
];

const variablePresets = [
  { label: "学员姓名", token: "{{student_name}}", hint: "系统会在发送任务时替换成具体学员姓名" },
  { label: "课程名称", token: "{{lesson_name}}", hint: "系统会替换成当前课程或本次复盘主题" },
  { label: "班级名称", token: "{{group_name}}", hint: "可用于群发时显示群或班级名称" },
  { label: "下一步行动", token: "{{next_step}}", hint: "可填写为复盘、作业或跟进行动" }
];

export function App() {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [teacherDashboard, setTeacherDashboard] = useState<TeacherDashboard | null>(null);
  const [unifiedDashboard, setUnifiedDashboard] = useState<UnifiedOpsDashboard | null>(null);
  const [teacherAlerts, setTeacherAlerts] = useState<TeacherAlert[]>([]);
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [templates, setTemplates] = useState<SopTemplate[]>([]);
  const [tasks, setTasks] = useState<SopTask[]>([]);
  const [deliveries, setDeliveries] = useState<MessageDelivery[]>([]);
  const [knowledge, setKnowledge] = useState<AdminKnowledgeResponse | null>(null);
  const [messages, setMessages] = useState<AdminMessagesResponse | null>(null);
  const [routing, setRouting] = useState<AdminRoutingResponse | null>(null);
  const [storage, setStorage] = useState<AdminStorageResponse | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [draftQuestion, setDraftQuestion] = useState("@AgentTwin老师 孩子写作业拖拉，总是分心，有什么陪伴步骤？");
  const [testReply, setTestReply] = useState<ChatReply | null>(null);
  const [templateName, setTemplateName] = useState("周复盘提醒");
  const [templateContent, setTemplateContent] = useState("您好，{{student_name}}，今天请完成 {{lesson_name}} 复盘。");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateQuery, setTemplateQuery] = useState("");
  const [taskTemplateId, setTaskTemplateId] = useState("");
  const [taskScheduleAt, setTaskScheduleAt] = useState("2026-04-10T17:00");
  const [taskDeliveryType, setTaskDeliveryType] = useState<"group" | "private">("group");
  const [taskTargetId, setTaskTargetId] = useState("group-demo");
  const [taskVariables, setTaskVariables] = useState('{"student_name":"李妈妈","lesson_name":"第 3 课"}');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskQuery, setTaskQuery] = useState("");
  const [tenantBrandName, setTenantBrandName] = useState("AgentTwin老师");
  const [groupBotName, setGroupBotName] = useState("AgentTwin老师");
  const [groupTriggerMode, setGroupTriggerMode] = useState<"mention_only" | "always">("mention_only");
  const [groupAutoReply, setGroupAutoReply] = useState(true);

  useEffect(() => {
    void refreshAdminData();
  }, []);

  async function refreshAdminData() {
    const [
      overviewResponse,
      teacherDashboardResponse,
      unifiedDashboardResponse,
      alertsResponse,
      learnersResponse,
      templatesResponse,
      tasksResponse,
      deliveriesResponse,
      knowledgeResponse,
      messagesResponse,
      routingResponse,
      storageResponse
    ] = await Promise.all([
      fetch(`${apiBaseUrl}/api/admin/overview`),
      fetch(`${apiBaseUrl}/api/admin/teacher-dashboard`),
      fetch(`${apiBaseUrl}/api/admin/unified-dashboard`),
      fetch(`${apiBaseUrl}/api/admin/alerts`),
      fetch(`${apiBaseUrl}/api/admin/learners`),
      fetch(`${apiBaseUrl}/api/admin/sop/templates`),
      fetch(`${apiBaseUrl}/api/admin/sop/tasks`),
      fetch(`${apiBaseUrl}/api/admin/sop/deliveries`),
      fetch(`${apiBaseUrl}/api/admin/knowledge`),
      fetch(`${apiBaseUrl}/api/admin/messages`),
      fetch(`${apiBaseUrl}/api/admin/routing`),
      fetch(`${apiBaseUrl}/api/admin/storage`)
    ]);

    const [
      overviewData,
      teacherDashboardData,
      unifiedDashboardData,
      alertsData,
      learnersData,
      templatesData,
      tasksData,
      deliveriesData,
      knowledgeData,
      messagesData,
      routingData,
      storageData
    ] = await Promise.all([
      overviewResponse.json(),
      teacherDashboardResponse.json(),
      unifiedDashboardResponse.json(),
      alertsResponse.json(),
      learnersResponse.json(),
      templatesResponse.json(),
      tasksResponse.json(),
      deliveriesResponse.json(),
      knowledgeResponse.json(),
      messagesResponse.json(),
      routingResponse.json(),
      storageResponse.json()
    ]);

    startTransition(() => {
      setOverview(overviewData);
      setTeacherDashboard(teacherDashboardData);
      setUnifiedDashboard(unifiedDashboardData);
      setTeacherAlerts(alertsData);
      setLearners(learnersData);
      setTemplates(templatesData);
      setTasks(tasksData);
      setDeliveries(deliveriesData);
      setKnowledge(knowledgeData);
      setMessages(messagesData);
      setRouting(routingData);
      setStorage(storageData);
      setTenantBrandName(routingData.tenant.brandName);
      const group = routingData.groups[0];
      if (group) {
        setGroupBotName(group.botName);
        setGroupTriggerMode(group.triggerMode);
        setGroupAutoReply(group.autoReplyEnabled);
      }
      if (templatesData[0]?.id && !taskTemplateId) {
        setTaskTemplateId(templatesData[0].id);
      }
    });

    const learnerResponse = await fetch(`${apiBaseUrl}/api/admin/learners/student-001`);
    const learnerData = (await learnerResponse.json()) as LearnerProfile;
    startTransition(() => {
      setLearnerProfile(learnerData);
    });
  }

  async function createTemplate() {
    const endpoint = editingTemplateId
      ? `${apiBaseUrl}/api/admin/sop/templates/${editingTemplateId}`
      : `${apiBaseUrl}/api/admin/sop/templates`;

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingTemplateId ?? `tpl-${Date.now()}`,
        name: templateName,
        channel: "wecom",
        content: templateContent
      })
    });

    resetTemplateForm();
    await refreshAdminData();
  }

  async function deleteTemplate(templateId: string) {
    await fetch(`${apiBaseUrl}/api/admin/sop/templates/${templateId}`, {
      method: "DELETE"
    });

    if (editingTemplateId === templateId) {
      resetTemplateForm();
    }
    await refreshAdminData();
  }

  async function createTask() {
    const endpoint = editingTaskId ? `${apiBaseUrl}/api/admin/sop/tasks/${editingTaskId}` : `${apiBaseUrl}/api/admin/sop/tasks`;

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingTaskId ?? `task-${Date.now()}`,
        templateId: taskTemplateId,
        scheduleAt: toIsoDateTime(taskScheduleAt),
        deliveryType: taskDeliveryType,
        targetGroupId: taskDeliveryType === "group" ? taskTargetId : undefined,
        targetUserId: taskDeliveryType === "private" ? taskTargetId : undefined,
        variables: parseVariables(taskVariables)
      })
    });

    resetTaskForm();
    await refreshAdminData();
  }

  async function deleteTask(taskId: string) {
    await fetch(`${apiBaseUrl}/api/admin/sop/tasks/${taskId}`, {
      method: "DELETE"
    });

    if (editingTaskId === taskId) {
      resetTaskForm();
    }
    await refreshAdminData();
  }

  async function executeTask(taskId: string) {
    await fetch(`${apiBaseUrl}/api/admin/sop/tasks/${taskId}/execute`, {
      method: "POST"
    });
    await refreshAdminData();
  }

  async function processPendingTasks() {
    await fetch(`${apiBaseUrl}/api/admin/sop/process-pending`, {
      method: "POST"
    });
    await refreshAdminData();
  }

  async function runTestChat() {
    const response = await fetch(`${apiBaseUrl}/api/admin/test-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: draftQuestion, userId: "student-console-001" })
    });
    setTestReply(await response.json());
    await refreshAdminData();
  }

  async function saveRoutingConfig() {
    if (!routing) {
      return;
    }

    const group = routing.groups[0];

    await Promise.all([
      fetch(`${apiBaseUrl}/api/admin/tenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...routing.tenant, brandName: tenantBrandName })
      }),
      group
        ? fetch(`${apiBaseUrl}/api/admin/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...group,
              botName: groupBotName,
              triggerMode: groupTriggerMode,
              autoReplyEnabled: groupAutoReply
            })
          })
        : Promise.resolve()
    ]);

    await refreshAdminData();
  }

  function resetTemplateForm() {
    setEditingTemplateId(null);
    setTemplateName("周复盘提醒");
    setTemplateContent("您好，{{student_name}}，今天请完成 {{lesson_name}} 复盘。");
  }

  function resetTaskForm() {
    setEditingTaskId(null);
    setTaskScheduleAt("2026-04-10T17:00");
    setTaskDeliveryType("group");
    setTaskTargetId("group-demo");
    setTaskVariables('{"student_name":"李妈妈","lesson_name":"第 3 课"}');
  }

  function editTemplate(template: SopTemplate) {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setActiveSection("templates");
  }

  function editTask(task: SopTask) {
    setEditingTaskId(task.id);
    setTaskTemplateId(task.templateId);
    setTaskScheduleAt(toLocalDateTime(task.scheduleAt));
    setTaskDeliveryType(task.deliveryType);
    setTaskTargetId(task.targetGroupId ?? task.targetUserId ?? "");
    setTaskVariables(JSON.stringify(task.variables, null, 2));
    setActiveSection("tasks");
  }

  function insertVariable(token: string) {
    setTemplateContent((current) => `${current}${current.endsWith(" ") || current.length === 0 ? "" : " "}${token}`.trim());
  }

  function handleTaskTemplateChange(templateId: string) {
    setTaskTemplateId(templateId);
    const selectedTemplate = templates.find((template) => template.id === templateId);
    if (!selectedTemplate) {
      return;
    }

    const nextVariables = Object.fromEntries(
      selectedTemplate.variables.map((variable) => [
        variable,
        variable === "student_name"
          ? "李妈妈"
          : variable === "lesson_name"
            ? "第 3 课"
            : variable === "group_name"
              ? "家长群演示组"
              : variable === "next_step"
                ? "完成今天的复盘"
                : ""
      ])
    );
    setTaskVariables(JSON.stringify(nextVariables, null, 2));
  }

  const selectedTaskTemplate = templates.find((template) => template.id === taskTemplateId);
  const filteredTemplates = templates.filter((template) =>
    `${template.name} ${template.content}`.toLowerCase().includes(templateQuery.trim().toLowerCase())
  );
  const filteredTasks = tasks.filter((task) =>
    `${task.id} ${task.templateId} ${task.targetGroupId ?? ""} ${task.targetUserId ?? ""}`
      .toLowerCase()
      .includes(taskQuery.trim().toLowerCase())
  );

  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <p className="eyebrow">AgentTwin</p>
          <h1>班主任运营后台</h1>
          <p className="sidebar-copy">左侧选择栏目，右侧只展示当前栏目，避免模板、任务、日志全部挤在一屏里。</p>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === activeSection ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection(item.key)}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="content-header">
          <div>
            <p className="eyebrow">当前栏目</p>
            <h2>{navItems.find((item) => item.key === activeSection)?.label ?? "运营总览"}</h2>
          </div>
          <button className="ghost-action" type="button" onClick={() => void refreshAdminData()}>
            刷新数据
          </button>
        </header>

        {activeSection === "overview" ? (
          <>
            <section className="grid">
              <article className="card accent">
                <h3>模板数</h3>
                <p>{teacherDashboard?.templateCount ?? 0}</p>
              </article>
              <article className="card accent">
                <h3>待执行任务</h3>
                <p>{teacherDashboard?.pendingTasks ?? 0}</p>
              </article>
              <article className="card accent">
                <h3>失败投递</h3>
                <p>{teacherDashboard?.failedDeliveries ?? 0}</p>
              </article>
              <article className="card accent">
                <h3>学员总数</h3>
                <p>{unifiedDashboard?.totalLearners ?? 0}</p>
              </article>
              <article className="card accent">
                <h3>待跟进学员</h3>
                <p>{unifiedDashboard?.atRiskLearners ?? 0}</p>
              </article>
              <article className="card accent">
                <h3>里程碑学员</h3>
                <p>{unifiedDashboard?.milestoneLearners ?? 0}</p>
              </article>
            </section>

            <section className="panel-grid">
              <article className="panel">
                <h3>统一联动看板</h3>
                <div className="response-box">
                  <strong>学员分层</strong>
                  <span>
                    新学员 {unifiedDashboard?.segmentCounts.new ?? 0} / 活跃 {unifiedDashboard?.segmentCounts.active ?? 0} / 待跟进{" "}
                    {unifiedDashboard?.segmentCounts.needs_follow_up ?? 0} / 里程碑 {unifiedDashboard?.segmentCounts.milestone ?? 0}
                  </span>
                  <small>
                    高频标签：
                    {unifiedDashboard?.topTags.map((item) => `${toChineseTag(item.tag)}（${item.count}）`).join("、") || "暂无"}
                  </small>
                </div>
                <ul className="stack-list tight">
                  {(unifiedDashboard?.recentLearners ?? []).map((learner) => (
                    <li key={learner.learnerId}>
                      <strong>{learner.learnerId}</strong>
                      <span>{toChineseSegment(learner.segment)}</span>
                      <small>
                        已完成 {learner.completedLessons.length} 节课 / 对话 {learner.conversationCount} 次 / 下一课{" "}
                        {learner.nextRecommendedLesson}
                      </small>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="panel">
                <h3>系统说明</h3>
                <ul className="stack-list tight">
                  <li>
                    <strong>SOP 任务是否定时</strong>
                    <small>是。任务会根据你设置的日期和时间，在到点后由 worker 自动轮询执行。</small>
                  </li>
                  <li>
                    <strong>处理待执行任务</strong>
                    <small>这是手动补偿按钮。它只会处理“已经到点但还没执行”的任务，适合联调或补跑。</small>
                  </li>
                  <li>
                    <strong>学员问答测试</strong>
                    <small>当前是开发联调入口，知识库和 AI fallback 仍以 demo/stub 为主，不是最终真实模型效果。</small>
                  </li>
                </ul>
              </article>
            </section>
          </>
        ) : null}

        {activeSection === "templates" ? (
          <section className="panel-grid panel-grid-wide">
            <article className="panel">
              <h3>{editingTemplateId ? "编辑模板" : "新建模板"}</h3>
              <input className="field" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="请输入模板名称" />
              <textarea
                className="composer"
                value={templateContent}
                onChange={(event) => setTemplateContent(event.target.value)}
                placeholder="请输入模板正文"
              />
              <div className="help-box">
                <strong>模板变量怎么用</strong>
                <small>下面这些是可插入变量。你不需要懂代码，点击按钮就会自动插入到正文里。</small>
                <div className="chip-row">
                  {variablePresets.map((preset) => (
                    <button key={preset.token} type="button" className="chip" onClick={() => insertVariable(preset.token)}>
                      {preset.label}
                    </button>
                  ))}
                </div>
                <ul className="stack-list tight compact">
                  {variablePresets.map((preset) => (
                    <li key={preset.token}>
                      <strong>{preset.label}</strong>
                      <span>{preset.token}</span>
                      <small>{preset.hint}</small>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="action-row">
                <button className="action" type="button" onClick={() => void createTemplate()}>
                  {editingTemplateId ? "保存模板" : "新增模板"}
                </button>
                {editingTemplateId ? (
                  <button className="ghost-action" type="button" onClick={() => resetTemplateForm()}>
                    取消编辑
                  </button>
                ) : null}
              </div>
            </article>

            <article className="panel">
              <h3>模板列表</h3>
              <input
                className="field"
                value={templateQuery}
                onChange={(event) => setTemplateQuery(event.target.value)}
                placeholder="查找模板名称或正文"
              />
              <ul className="stack-list tight">
                {filteredTemplates.map((template) => (
                  <li key={template.id}>
                    <strong>{template.name}</strong>
                    <span>变量：{template.variables.map((item) => toChineseVariable(item)).join("、") || "无"}</span>
                    <small>{template.content}</small>
                    <div className="inline-actions">
                      <button className="mini-action" type="button" onClick={() => editTemplate(template)}>
                        编辑
                      </button>
                      <button className="mini-action danger" type="button" onClick={() => void deleteTemplate(template.id)}>
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeSection === "tasks" ? (
          <section className="panel-grid panel-grid-wide">
            <article className="panel">
              <h3>{editingTaskId ? "编辑任务" : "新增任务"}</h3>
              <select className="field" value={taskTemplateId} onChange={(event) => handleTaskTemplateChange(event.target.value)}>
                <option value="">请选择模板</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTaskTemplate ? (
                <div className="help-box">
                  <strong>当前模板预览</strong>
                  <small>{selectedTaskTemplate.content}</small>
                  <small>
                    需要填写的变量：
                    {selectedTaskTemplate.variables.map((item) => toChineseVariable(item)).join("、") || "无"}
                  </small>
                </div>
              ) : null}
              <input
                className="field"
                type="datetime-local"
                value={taskScheduleAt}
                onChange={(event) => setTaskScheduleAt(event.target.value)}
              />
              <select
                className="field"
                value={taskDeliveryType}
                onChange={(event) => setTaskDeliveryType(event.target.value as "group" | "private")}
              >
                <option value="group">群发</option>
                <option value="private">私发</option>
              </select>
              <input
                className="field"
                value={taskTargetId}
                onChange={(event) => setTaskTargetId(event.target.value)}
                placeholder={taskDeliveryType === "group" ? "请输入群 ID" : "请输入学员用户 ID"}
              />
              <textarea
                className="composer"
                value={taskVariables}
                onChange={(event) => setTaskVariables(event.target.value)}
                placeholder='{"student_name":"李妈妈","lesson_name":"第 3 课"}'
              />
              <div className="help-box">
                <strong>任务时间说明</strong>
                <small>这里设置的就是任务的执行时间。系统会按你选择的日期和时间定时执行，不需要手工输入 ISO 时间。</small>
              </div>
              <div className="action-row">
                <button className="action" type="button" onClick={() => void createTask()} disabled={!taskTemplateId}>
                  {editingTaskId ? "保存任务" : "新增任务"}
                </button>
                <button className="ghost-action" type="button" onClick={() => void processPendingTasks()}>
                  处理已到点任务
                </button>
                {editingTaskId ? (
                  <button className="ghost-action" type="button" onClick={() => resetTaskForm()}>
                    取消编辑
                  </button>
                ) : null}
              </div>
            </article>

            <article className="panel">
              <h3>任务列表</h3>
              <small className="meta-note">按计划时间倒序展示，最新任务排在最前面。</small>
              <input
                className="field"
                value={taskQuery}
                onChange={(event) => setTaskQuery(event.target.value)}
                placeholder="查找任务编号、模板编号或目标对象"
              />
              <ul className="stack-list tight">
                {filteredTasks.map((task) => (
                  <li key={task.id}>
                    <strong>{task.id}</strong>
                    <span>
                      {toChineseDeliveryType(task.deliveryType)} / {toChineseTaskStatus(task.status)}
                    </span>
                    <small>
                      计划时间：{formatDateTime(task.scheduleAt)} / 目标：{task.targetGroupId ?? task.targetUserId ?? "未设置"}
                    </small>
                    <div className="inline-actions">
                      <button className="mini-action" type="button" onClick={() => editTask(task)}>
                        编辑
                      </button>
                      <button className="mini-action danger" type="button" onClick={() => void deleteTask(task.id)}>
                        删除
                      </button>
                      {task.status === "pending" ? (
                        <button className="mini-action" type="button" onClick={() => void executeTask(task.id)}>
                          立即执行
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeSection === "deliveries" ? (
          <section className="panel-grid">
            <article className="panel">
              <h3>投递日志</h3>
              <div className="help-box">
                <strong>这里看什么</strong>
                <small>这里只显示真正被执行过的任务产生的投递记录。未到点的任务，不应该提前出现在这里。</small>
              </div>
              <ul className="stack-list tight">
                {deliveries.map((delivery) => (
                  <li key={delivery.id}>
                    <strong>{delivery.targetId}</strong>
                    <span>
                      {toChineseDeliveryStatus(delivery.status)} / {toChineseDeliveryType(delivery.targetType)}
                    </span>
                    <small>{delivery.content}</small>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeSection === "alerts" ? (
          <section className="panel-grid">
            <article className="panel">
              <h3>班主任提醒</h3>
              <div className="help-box">
                <strong>这是干嘛的</strong>
                <small>系统会根据学员互动、进度和风险信号，自动生成班主任待跟进提醒，帮助你决定谁需要人工介入。</small>
              </div>
              <ul className="stack-list tight">
                {teacherAlerts.map((alert) => (
                  <li key={alert.id}>
                    <strong>{toChineseAlertType(alert.type)}</strong>
                    <span>
                      学员 {alert.learnerId} / {toChineseSeverity(alert.severity)}
                    </span>
                    <small>{alert.summary}</small>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeSection === "learners" ? (
          <section className="panel-grid panel-grid-wide">
            <article className="panel">
              <h3>重点学员画像</h3>
              <div className="response-box">
                <strong>{learnerProfile?.learnerId ?? "student-001"}</strong>
                <span>
                  已完成课程：{learnerProfile?.completedLessons.join("、") || "暂无"} / 分层：
                  {learnerProfile ? toChineseSegment(learnerProfile.segment) : "新学员"}
                </span>
                <small>
                  下一课建议：{learnerProfile?.nextRecommendedLesson ?? "lesson-01"} / 对话次数：{learnerProfile?.conversationCount ?? 0}
                </small>
              </div>
            </article>
            <article className="panel">
              <h3>学员列表</h3>
              <ul className="stack-list tight">
                {learners.map((learner) => (
                  <li key={learner.learnerId}>
                    <strong>{learner.learnerId}</strong>
                    <span>{learner.tags.map((tag) => toChineseTag(tag)).join("、")}</span>
                    <small>
                      最近互动：{learner.lastInteractionAt ? formatDateTime(learner.lastInteractionAt) : "暂无"} / 下一课 {learner.nextRecommendedLesson}
                    </small>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeSection === "settings" ? (
          <section className="panel-grid panel-grid-wide">
            <article className="panel">
              <h3>班主任设置</h3>
              <input className="field" value={tenantBrandName} onChange={(event) => setTenantBrandName(event.target.value)} placeholder="机器人品牌名" />
              <input className="field" value={groupBotName} onChange={(event) => setGroupBotName(event.target.value)} placeholder="群内机器人显示名" />
              <select
                className="field"
                value={groupTriggerMode}
                onChange={(event) => setGroupTriggerMode(event.target.value as "mention_only" | "always")}
              >
                <option value="mention_only">仅 @ 机器人时自动回复</option>
                <option value="always">群内所有消息都自动回复</option>
              </select>
              <label className="toggle">
                <input type="checkbox" checked={groupAutoReply} onChange={(event) => setGroupAutoReply(event.target.checked)} />
                <span>开启自动回复</span>
              </label>
              <button className="action" type="button" onClick={() => void saveRoutingConfig()}>
                保存设置
              </button>
            </article>

            <article className="panel">
              <h3>设置说明</h3>
              <ul className="stack-list tight">
                <li>
                  <strong>班主任设置是干嘛的</strong>
                  <small>这里控制机器人在群里的名字、回复触发条件，以及是否允许自动回复。</small>
                </li>
                <li>
                  <strong>真实企业微信联调</strong>
                  <small>你需要配置 `WECOM_CORP_ID`、`WECOM_AGENT_ID`、`WECOM_APP_SECRET`、`WECOM_TOKEN`、`WECOM_AES_KEY` 才能做真实发消息联调。</small>
                </li>
                <li>
                  <strong>当前存储模式</strong>
                  <small>{storage?.mode === "postgres" ? "PostgreSQL" : "本地文件模式"}，{storage?.databaseUrlPreview ?? storage?.dataDir}</small>
                </li>
              </ul>
            </article>
          </section>
        ) : null}

        {activeSection === "debug" ? (
          <section className="panel-grid panel-grid-wide">
            <article className="panel">
              <h3>学员问答测试</h3>
              <div className="help-box">
                <strong>这怎么用</strong>
                <small>这里是开发测试入口。它会调用当前聊天链路，适合验证 FAQ、风险规则、练习反馈和联动逻辑。</small>
              </div>
              <textarea className="composer" value={draftQuestion} onChange={(event) => setDraftQuestion(event.target.value)} />
              <button className="action" type="button" onClick={() => void runTestChat()}>
                运行测试
              </button>
              {testReply ? (
                <div className="response-box">
                  <strong>{toChineseReplyMode(testReply.replyMode)}</strong>
                  <span>{testReply.replyText}</span>
                  <small>{testReply.citations.join("、") || "无引用"}</small>
                </div>
              ) : null}
            </article>

            <article className="panel">
              <h3>当前是否是真实 AI</h3>
              <ul className="stack-list tight">
                <li>
                  <strong>学员问答</strong>
                  <small>现在不是完整真实模型。当前是 demo FAQ、demo 知识检索、风险规则，加上 fallback/stub 组合。</small>
                </li>
                <li>
                  <strong>真实企业微信发送</strong>
                  <small>只有配置了真实企业微信凭证，任务投递才会真正调用企业微信主动发送接口。</small>
                </li>
              </ul>
            </article>

            <article className="panel">
              <h3>知识与审计快照</h3>
              <ul className="stack-list tight">
                {messages?.messages.slice(0, 4).map((message) => (
                  <li key={message.traceId}>
                    <strong>{toChineseReplyMode(message.replyMode)}</strong>
                    <span>{message.normalizedText}</span>
                    <small>{message.replyText}</small>
                  </li>
                ))}
                {messages?.audits.slice(0, 3).map((audit) => (
                  <li key={`${audit.traceId}-${audit.eventType}`}>
                    <strong>{audit.eventType}</strong>
                    <small>{JSON.stringify(audit.payload)}</small>
                  </li>
                ))}
              </ul>
              <div className="knowledge-inline">
                <strong>知识库基础状态</strong>
                <small>
                  {knowledge ? `${knowledge.faq.length} 条 FAQ / ${knowledge.articles.length} 篇文章 / ${knowledge.riskRules.length} 条风险规则` : "加载中..."}
                </small>
              </div>
            </article>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function parseVariables(input: string) {
  try {
    const parsed = JSON.parse(input) as Record<string, string>;
    return parsed;
  } catch {
    return {};
  }
}

function toLocalDateTime(isoString: string) {
  const date = new Date(isoString);
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(localDateTime: string) {
  const date = new Date(localDateTime);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function toChineseDeliveryType(value: "group" | "private") {
  return value === "group" ? "群发" : "私发";
}

function toChineseTaskStatus(value: SopTask["status"]) {
  if (value === "sent") {
    return "已执行";
  }
  if (value === "failed") {
    return "执行失败";
  }
  return "待执行";
}

function toChineseDeliveryStatus(value: MessageDelivery["status"]) {
  if (value === "prepared") {
    return "已准备";
  }
  if (value === "failed") {
    return "发送失败";
  }
  return "发送成功";
}

function toChineseReplyMode(value: ChatReply["replyMode"]) {
  if (value === "faq") {
    return "FAQ 命中";
  }
  if (value === "rag") {
    return "知识检索";
  }
  if (value === "manual_block") {
    return "人工拦截";
  }
  return "AI 回复";
}

function toChineseSegment(value: LearnerProfile["segment"]) {
  if (value === "active") {
    return "活跃学员";
  }
  if (value === "needs_follow_up") {
    return "待跟进";
  }
  if (value === "milestone") {
    return "里程碑";
  }
  return "新学员";
}

function toChineseSeverity(value: TeacherAlert["severity"]) {
  if (value === "high") {
    return "高优先级";
  }
  if (value === "medium") {
    return "中优先级";
  }
  return "低优先级";
}

function toChineseAlertType(value: TeacherAlert["type"]) {
  if (value === "learner_needs_follow_up") {
    return "学员待跟进";
  }
  if (value === "risk_intervention") {
    return "风险干预";
  }
  return "里程碑提醒";
}

function toChineseVariable(value: string) {
  const found = variablePresets.find((item) => item.token === `{{${value}}}`);
  return found ? found.label : value;
}

function toChineseTag(value: string) {
  const map: Record<string, string> = {
    new: "新学员",
    active: "活跃学员",
    needs_follow_up: "待跟进",
    milestone: "里程碑",
    engaged: "有互动",
    completed_1_lessons: "已完成 1 节课",
    completed_2_lessons: "已完成 2 节课",
    completed_3_lessons: "已完成 3 节课"
  };
  return map[value] ?? value;
}
