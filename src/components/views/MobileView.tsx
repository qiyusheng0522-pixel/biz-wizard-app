import { useState, useEffect } from "react";
import { customers, tasks, todayKpi, layerMeta, fivePersonTeam, type Task, type Customer, type CustomerLayer } from "@/lib/mock-data";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Home, Users, MessageSquare, User, Bell, Search, AlertTriangle, ChevronRight, ChevronLeft,
  Phone, Video, Sparkles, HeartHandshake, CheckCircle2, Circle, Send, Mic, Image as ImageIcon,
  Plus, Filter, MoreHorizontal, FileText, Pill, Activity, Calendar, Star, Copy, BookOpen,
  TrendingUp, Award, Stethoscope, ClipboardList, Settings, LogOut, ShieldCheck, Clock,
  X, MapPin, AlertCircle, Heart, Users2, Package, Smile, BookMarked, Gift, Clipboard, Home as HomeIcon,
  RotateCw, ChevronDown, Play, CalendarDays, Flame,
  Paperclip, CheckCheck, RotateCcw, Reply, Bot, MicOff, Volume2, PhoneOff, Hash, AtSign, UserPlus,
} from "lucide-react";

/* ---------- 工具：等级/标签/虚拟号 ---------- */
// 客户分层标签（普通 / VIP / VVIP / 特别关注）
const TIER_MAP: Record<string, "普通" | "VIP" | "VVIP" | "特别关注"> = {
  "C001": "特别关注", // 张老爷子（urgent）
  "C002": "VVIP",     // 王奶奶
  "C003": "VIP",
  "C004": "普通",
  "C005": "VIP",
  "C006": "特别关注", // 周阿姨
};
const tierOf = (id: string) => TIER_MAP[id] ?? "普通";
const tierColor = (t: string) =>
  t === "VVIP" ? "bg-[oklch(0.55_0.18_300)]/10 text-[oklch(0.45_0.18_300)] border-[oklch(0.55_0.18_300)]/30" :
  t === "VIP"  ? "bg-warning/10 text-[oklch(0.45_0.13_75)] border-warning/30" :
  t === "特别关注" ? "bg-danger/10 text-danger border-danger/30" :
  "bg-secondary text-muted-foreground border-border";

// 客户来源（鼓e佳 / 骨安 / 院端转介）
const SOURCE_MAP: Record<string, "鼓e佳" | "骨安" | "院端转介"> = {
  "C001": "骨安",
  "C002": "鼓e佳",
  "C003": "鼓e佳",
  "C004": "院端转介",
  "C005": "骨安",
  "C006": "鼓e佳",
};
const sourceOf = (id: string) => SOURCE_MAP[id] ?? "鼓e佳";
const sourceColor = (s: string) =>
  s === "鼓e佳" ? "bg-primary/10 text-primary border-primary/30" :
  s === "骨安"  ? "bg-success/10 text-success border-success/30" :
                  "bg-secondary text-muted-foreground border-border";

// 风险等级（由 layer 推导：紧急→高风险，异常→中风险，离网→中风险，其他→低风险）
type RiskLevel = "高风险" | "中风险" | "低风险";
const riskOf = (layer: CustomerLayer): RiskLevel =>
  layer === "urgent" ? "高风险" : (layer === "abnormal" || layer === "churnRisk") ? "中风险" : "低风险";
const riskColor = (r: RiskLevel) =>
  r === "高风险" ? "bg-danger/10 text-danger border-danger/30" :
  r === "中风险" ? "bg-warning/10 text-[oklch(0.5_0.13_75)] border-warning/30" :
                  "bg-success/10 text-success border-success/30";

// 严重等级映射：P0=紧急、P1=高、P2=中、P3=低
// "紧急" 仅用于数据较大波动；"特别关注"客户的事项至少为"高"
type Severity = "紧急" | "高" | "中" | "低";
const sevFromPrio = (p: string): Severity =>
  p === "P0" ? "紧急" : p === "P1" ? "高" : p === "P2" ? "中" : "低";
const sevTone = (s: Severity) =>
  s === "紧急" ? "bg-danger/10 text-danger border-danger/30" :
  s === "高"   ? "bg-warning/10 text-[oklch(0.5_0.13_75)] border-warning/30" :
  s === "中"   ? "bg-primary/10 text-primary border-primary/30" :
                 "bg-secondary text-muted-foreground border-border";

// 虚拟号外呼提示（统一封装）
const placeCall = (name: string) => {
  toast.success(`正在通过虚拟号外呼 ${name}`, {
    description: "本次通话采用平台虚拟号，双方真实号码均不外露 · 通话全程加密录音",
    duration: 3500,
  });
};

// 紧急告警系统自动干预（模拟）
const autoIntervene = (name: string) => {
  toast.warning(`⚡ 已触发系统自动干预 · ${name}`, {
    description: "1) 推送应急话术至患者群 2) 通知紧急联系人 3) 同步责任医师 4) 排队上门护士",
    duration: 4500,
  });
};

/**
 * 移动端 — 健管师手机 App
 * 内置堆栈式路由（state-based stack），点击任何条目都会推入详情页
 */

type Stack =
  | { name: "tabs" }
  | { name: "task"; id: string }
  | { name: "customer"; id: string }
  | { name: "chat"; id: string }
  | { name: "notifications" }
  | { name: "search" }
  | { name: "addCustomer" }
  | { name: "care" }            // 我的关怀效果
  | { name: "stats" }           // 我的任务统计
  | { name: "scripts" }         // 话术模板库
  | { name: "newScript" }       // 新建话术
  | { name: "mdt" }             // MDT 会诊记录
  | { name: "settings" }
  | { name: "profile" }
  | { name: "groupInfo"; id: string }       // 群聊信息（患者+家人+协同人员）
  | { name: "callSummary"; id: string; kind: "phone" | "voice" | "text" } // 沟通结束后 AI 摘要
  | { name: "messageBoard"; id: string }    // 给客户的留言
  | { name: "contactRoster" }               // 选择医师/护士/康复师
  | { name: "imSearch" };                   // 沟通消息检索

export function MobileView() {
  const [tab, setTab] = useState<"home" | "client" | "im" | "me">("home");
  const [stack, setStack] = useState<Stack[]>([{ name: "tabs" }]);
  const [taskState, setTaskState] = useState<Record<string, boolean>>(
    Object.fromEntries(tasks.map(t => [t.id, !!t.done]))
  );
  // 首次登录工作台总结弹窗（每次进入预览都会展示，方便验收）
  const [showWelcome, setShowWelcome] = useState(true);

  const top = stack[stack.length - 1];
  const push = (s: Stack) => setStack(prev => [...prev, s]);
  const pop = () => setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const toggleTask = (id: string) => {
    setTaskState(s => {
      const next = { ...s, [id]: !s[id] };
      toast.success(next[id] ? "任务已完成 ✓" : "已重新打开任务");
      return next;
    });
  };

  return (
    <div className="w-full h-full bg-background flex flex-col relative overflow-hidden">
      {/* 顶部状态栏 */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-foreground bg-card/60 z-10">
        <span>9:41</span>
        <span className="font-medium">蜻蜓康健家 · 健管师</span>
        <span>•••</span>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto pb-16">
        {top.name === "tabs" && (
          <>
            {tab === "home"   && <MHome push={push} taskState={taskState} toggleTask={toggleTask} />}
            {tab === "client" && <MClient push={push} />}
            {tab === "im"     && <MIM push={push} />}
            {tab === "me"     && <MMe push={push} />}
          </>
        )}
        {top.name === "task"          && <TaskDetail id={top.id} pop={pop} taskState={taskState} toggleTask={toggleTask} />}
        {top.name === "customer"      && <CustomerDetail id={top.id} pop={pop} push={push} />}
        {top.name === "chat"          && <ChatScreen id={top.id} pop={pop} nav={push} />}
        {top.name === "notifications" && <Notifications pop={pop} />}
        {top.name === "search"        && <SearchScreen pop={pop} push={push} />}
        {top.name === "addCustomer"   && <AddCustomer pop={pop} />}
        {top.name === "care"          && <CareEffect pop={pop} />}
        {top.name === "stats"         && <TaskStats pop={pop} />}
        {top.name === "scripts"       && <ScriptLibrary pop={pop} push={push} />}
        {top.name === "newScript"     && <NewScript pop={pop} />}
        {top.name === "mdt"           && <MdtRecords pop={pop} />}
        {top.name === "settings"      && <SettingsScreen pop={pop} />}
        {top.name === "profile"       && <ProfileEdit pop={pop} />}
        {top.name === "groupInfo"     && <GroupInfo id={top.id} pop={pop} push={push} />}
        {top.name === "callSummary"   && <CallSummary id={top.id} kind={top.kind} pop={pop} />}
        {top.name === "messageBoard"  && <MessageBoard id={top.id} pop={pop} />}
        {top.name === "contactRoster" && <ContactRoster pop={pop} />}
        {top.name === "imSearch"      && <ImSearch pop={pop} push={push} />}
      </div>

      {/* 底部 Tab Bar — 仅在根栈显示 */}
      {top.name === "tabs" && (
        <nav className="absolute bottom-0 inset-x-0 bg-card border-t border-border grid grid-cols-4 h-16 z-20">
          {[
            { id: "home", icon: Home, label: "今日" },
            { id: "client", icon: Users, label: "客户" },
            { id: "im", icon: MessageSquare, label: "沟通" },
            { id: "me", icon: User, label: "我的" },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{t.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <Toaster position="top-center" />
      {showWelcome && top.name === "tabs" && tab === "home" && (
        <WelcomeBriefing onClose={() => setShowWelcome(false)} />
      )}
    </div>
  );
}

/* ---------- 通用：详情页头部 ---------- */
function PageHeader({ title, pop, right }: { title: string; pop: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-2 py-2.5 flex items-center gap-1">
      <button onClick={pop} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5" /></button>
      <h1 className="flex-1 text-center text-sm font-semibold pr-8">{title}</h1>
      {right}
    </div>
  );
}

/* ============================================================
 * Tab 1：今日首页
 * ============================================================ */
function MHome({
  push, taskState, toggleTask,
}: { push: (s: Stack) => void; taskState: Record<string, boolean>; toggleTask: (id: string) => void }) {
  const doneCount = Object.values(taskState).filter(Boolean).length;
  // 任务来源 Tab：AI / 客户主动 / 协同 / 自建 / 节日 / 续费
  const [taskSrc, setTaskSrc] = useState<"all" | "ai" | "client" | "team" | "self" | "holiday" | "renew">("all");
  // 严重等级筛选
  const [sev, setSev] = useState<"all" | Severity>("all");
  // 用户标签筛选
  const [tier, setTier] = useState<"all" | "普通" | "VIP" | "VVIP" | "特别关注">("all");
  // 节日 + 续费类任务（追加到核心 tasks 之外，仅前端模拟）
  const extraTasks = [
    { id: "X-1", src: "client" as const,  customer: "陈姐",  title: "客户主动求助：失眠 3 天怎么办",   priority: "P1", due: "今日", tag: "客户主动" },
    { id: "X-2", src: "team" as const,    customer: "王奶奶", title: "钱药师协同：化疗止吐方案确认",     priority: "P1", due: "11:00", tag: "协同任务" },
    { id: "X-3", src: "self" as const,    customer: "李叔",  title: "自建：出差归来首次复盘",            priority: "P2", due: "本周", tag: "自建" },
    { id: "X-4", src: "holiday" as const, customer: "周阿姨", title: "母亲节祝福 + 子女联动问候",        priority: "P2", due: "5/12", tag: "节日关怀" },
    { id: "X-5", src: "renew" as const,   customer: "刘伯",  title: "服务包 12 天后到期 · 续费方案推送", priority: "P1", due: "本周", tag: "续费机会" },
    { id: "X-6", src: "self" as const,    customer: "王奶奶", title: "陪诊：瑞金医院肿瘤科 · 9:30 集合 · 化疗复查", priority: "P0", due: "明早 09:30", tag: "陪诊任务" },
  ];
  // 把核心 tasks 标记为 ai 来源（除 MDT/医师指派 → team；客户求助 → client）
  const merged = [
    ...tasks.map(t => ({ id: t.id, src: t.source === "医师指派" ? "team" as const : t.source === "客户求助" ? "client" as const : "ai" as const, customer: t.customer, title: t.title, priority: t.priority, due: t.due, tag: t.source })),
    ...extraTasks,
  ];
  // 客户名 → 客户对象
  const findCust = (name: string) => customers.find(c => c.name === name);
  // 严重等级（特别关注客户：所有事项至少为"高"）
  const severityOf = (t: { customer: string; priority: string }): Severity => {
    const base = sevFromPrio(t.priority);
    const cu = findCust(t.customer);
    if (cu && tierOf(cu.id) === "特别关注" && (base === "中" || base === "低")) return "高";
    return base;
  };
  const visibleTasks = merged
    .filter(t => taskSrc === "all" || t.src === taskSrc)
    .filter(t => sev === "all" || severityOf(t) === sev)
    .filter(t => {
      if (tier === "all") return true;
      const cu = findCust(t.customer);
      return cu ? tierOf(cu.id) === tier : false;
    });
  return (
    <div className="px-4 py-3 space-y-4">
      {/* 问候卡 */}
      <div className="rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs opacity-90">早上好，林姐</div>
            <div className="text-lg font-semibold mt-1">今天有 {tasks.length} 项待办，5 位客户需特别关注</div>
          </div>
          <button onClick={() => push({ name: "notifications" })} className="p-2 rounded-full bg-white/15 active:bg-white/25">
            <Bell className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {todayKpi.slice(0, 3).map(k => (
            <button key={k.label} onClick={() => toast.info(`${k.label}：${k.sub}`)}
              className="bg-white/15 rounded-lg p-2 text-left active:bg-white/25 transition">
              <div className="text-[10px] opacity-80">{k.label}</div>
              <div className="text-lg font-semibold">{k.value}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "新建客户", icon: Plus,         onClick: () => push({ name: "addCustomer" }) },
          { label: "搜索",     icon: Search,       onClick: () => push({ name: "search" }) },
          { label: "话术库",   icon: BookOpen,     onClick: () => push({ name: "scripts" }) },
          { label: "MDT",      icon: Stethoscope,  onClick: () => push({ name: "mdt" }) },
        ].map(q => {
          const Icon = q.icon;
          return (
            <button key={q.label} onClick={q.onClick}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border active:bg-secondary">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
              <span className="text-[11px]">{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* 今日关注 — 横滑卡片 / 可翻面 / 一键操作 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-1.5 text-sm"><AlertTriangle className="w-4 h-4 text-danger" />今日关注</h2>
          <span className="text-[11px] text-muted-foreground">左右滑动 · 点 ↻ 翻面看上下文</span>
        </div>
        <FocusCarousel push={push} />
      </section>

      {/* 工作台任务清单 — 多来源 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">工作台 · 任务清单</h2>
          <span className="text-xs text-muted-foreground">已完成 {doneCount}/{tasks.length}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {[
            { k: "all",     l: "全部" },
            { k: "ai",      l: "AI 生成" },
            { k: "client",  l: "客户主动" },
            { k: "team",    l: "协同" },
            { k: "self",    l: "自建" },
            { k: "holiday", l: "节日" },
            { k: "renew",   l: "续费到期" },
          ].map(s => (
            <Chip key={s.k} active={taskSrc === s.k} onClick={() => setTaskSrc(s.k as typeof taskSrc)}>{s.l}</Chip>
          ))}
        </div>
        {/* 严重等级 */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          <span className="text-[10px] text-muted-foreground shrink-0 self-center mr-1">等级</span>
          {(["all","紧急","高","中","低"] as const).map(s => (
            <Chip key={s} active={sev === s} onClick={() => setSev(s)}>{s === "all" ? "全部" : s}</Chip>
          ))}
        </div>
        {/* 用户标签 */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          <span className="text-[10px] text-muted-foreground shrink-0 self-center mr-1">客户</span>
          {(["all","普通","VIP","VVIP","特别关注"] as const).map(s => (
            <Chip key={s} active={tier === s} onClick={() => setTier(s)}>{s === "all" ? "全部" : s}</Chip>
          ))}
        </div>
        <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
          {visibleTasks.map(t => {
            const done = taskState[t.id];
            const isCore = tasks.some(x => x.id === t.id);
            const s = severityOf(t);
            const cu = findCust(t.customer);
            const tt = cu ? tierOf(cu.id) : "普通";
            return (
              <div key={t.id} className="px-3 py-3 flex items-center gap-2.5 active:bg-secondary/60">
                <button onClick={(e) => { e.stopPropagation(); isCore ? toggleTask(t.id) : toast.success("任务已完成 ✓"); }} className="p-0.5">
                  {done ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                </button>
                <button onClick={() => isCore ? push({ name: "task", id: t.id }) : toast.info(`${t.tag}：${t.title}`)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sevTone(s)}`}>{s}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="text-[10px] text-muted-foreground">{t.customer} · {t.due} · {t.tag}</div>
                  </div>
                  {tt !== "普通" && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${tierColor(tt)}`}>{tt}</span>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
          {visibleTasks.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">该来源暂无任务</div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- 今日关注 横滑可翻面卡片 ---------- */
function FocusCarousel({ push }: { push: (s: Stack) => void }) {
  const focus = customers.filter(c => c.layer === "urgent" || c.layer === "abnormal" || c.layer === "churnRisk");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  // 紧急客户：进入页面后自动触发系统干预（仅首次）
  useEffect(() => {
    const urgents = focus.filter(c => c.layer === "urgent");
    const timers = urgents.map((c, i) => setTimeout(() => autoIntervene(c.name), 600 + i * 400));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const flip = (id: string) => setFlipped(f => ({ ...f, [id]: !f[id] }));
  return (
    <div className="-mx-4 px-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
      {focus.map(c => {
        const tone =
          c.layer === "urgent" ? { bar: "bg-danger", txt: "text-danger", bg: "bg-danger/5", chip: "bg-danger/10 text-danger" } :
          c.layer === "abnormal" ? { bar: "bg-warning", txt: "text-[oklch(0.5_0.13_75)]", bg: "bg-warning/5", chip: "bg-warning/10 text-[oklch(0.5_0.13_75)]" } :
          { bar: "bg-muted-foreground", txt: "text-muted-foreground", bg: "bg-secondary/40", chip: "bg-secondary text-muted-foreground" };
        const summary =
          c.layer === "urgent"   ? `凌晨血糖 ${c.metrics.bg ?? 3.8}，需紧急回访` :
          c.layer === "abnormal" ? `${c.metrics.bp ? "血压 " + c.metrics.bp : "情绪低落"}，建议主动关怀` :
          `断签多日，建议温柔挽回话术`;
        const action = c.layer === "urgent" ? "立即电话 · 5 分钟内反馈" : c.layer === "abnormal" ? "上午发起视频复测" : "推送节日话题 + 服务包权益";
        const script = c.layer === "urgent"
          ? `"${c.name}您好，凌晨监测到血糖偏低，您现在感觉如何？"`
          : c.layer === "abnormal"
            ? `"${c.name}早上好～昨天的不适今天怎么样了？"`
            : `"${c.name}好久不见～最近身体还好吗？您的健康我一直挂在心上。"`;
        const front = (
          <div className={`h-full flex flex-col p-3 ${tone.bg}`}>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-5 rounded-full ${tone.bar}`} />
              <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.name} <span className="text-[10px] text-muted-foreground font-normal">{c.gender}·{c.age}</span></div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${tone.chip}`}>{layerMeta[c.layer].label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${tierColor(tierOf(c.id))}`}>{tierOf(c.id)}</span>
                </div>
              </div>
              <button onClick={() => flip(c.id)} className="p-1 rounded-md bg-card/80 active:bg-card"><RotateCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
            <div className="mt-2 text-xs leading-relaxed text-foreground line-clamp-2">{summary}</div>
            {c.layer === "urgent" && (
              <div className="mt-2 rounded-lg bg-danger/10 border border-danger/30 px-2 py-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-danger" />
                <span className="text-[10px] text-danger font-medium">系统已自动干预 · 应急话术+联系家属已触发</span>
              </div>
            )}
            <div className="mt-2 rounded-lg bg-card/80 border border-border p-2">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" />建议动作</div>
              <div className="text-[11px] mt-0.5 font-medium">{action}</div>
            </div>
            <div className="mt-2 rounded-lg bg-card/80 border border-border p-2 flex-1">
              <div className="text-[10px] text-muted-foreground">话术预览</div>
              <div className="text-[11px] mt-0.5 italic text-muted-foreground line-clamp-2">{script}</div>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <button onClick={() => placeCall(c.name)} className="py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Phone className="w-3.5 h-3.5" /></button>
              <button onClick={() => toast.info("视频邀请已发送")} className="py-1.5 rounded-lg bg-card border border-border flex items-center justify-center"><Video className="w-3.5 h-3.5" /></button>
              <button onClick={() => toast.info("按住说话…")} className="py-1.5 rounded-lg bg-card border border-border flex items-center justify-center"><Mic className="w-3.5 h-3.5" /></button>
              <button onClick={() => push({ name: "customer", id: c.id })} className="py-1.5 rounded-lg bg-card border border-border flex items-center justify-center"><FileText className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
        const back = (
          <div className="h-full flex flex-col p-3 bg-card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{c.name} · 完整上下文</div>
              <button onClick={() => flip(c.id)} className="p-1 rounded-md bg-secondary"><RotateCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px] text-foreground overflow-y-auto flex-1">
              <div><span className="text-muted-foreground">病种 · </span>{c.diseases.join(" / ")}</div>
              <div><span className="text-muted-foreground">服务包 · </span>{c.package}</div>
              <div><span className="text-muted-foreground">最近触达 · </span>{c.lastTouch}</div>
              <div><span className="text-muted-foreground">关键备注 · </span>{c.note}</div>
              <div><span className="text-muted-foreground">温度 · </span><span className="text-danger font-medium">82</span> · 30 天 ↘</div>
              <div><span className="text-muted-foreground">家庭 · </span>女儿张敏（紧急） · 妻子（已授权）</div>
              <div><span className="text-muted-foreground">医师 · </span>赵主任 · 2 周后复查 HbA1c</div>
            </div>
            <button onClick={() => push({ name: "customer", id: c.id })} className="mt-2 py-2 rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground text-xs">进入完整档案 →</button>
          </div>
        );
        return (
          <div key={c.id} className="snap-start shrink-0 w-[78%]">
            <div className="rounded-2xl border border-border overflow-hidden h-[260px] shadow-[var(--shadow-card)]">
              {flipped[c.id] ? back : front}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * Tab 2：客户列表
 * ============================================================ */
function MClient({ push }: { push: (s: Stack) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "urgent" | "abnormal" | "stable" | "new" | "churnRisk">("all");
  const [showAdv, setShowAdv] = useState(false);
  // 多条件筛选：病种 / 年龄段 / 服务包 / 状态
  const [adv, setAdv] = useState<{ disease: string[]; ageRange: string; pkg: string[]; status: string[] }>({
    disease: [], ageRange: "all", pkg: [], status: [],
  });
  const allDiseases = Array.from(new Set(customers.flatMap(c => c.diseases)));
  const allPkgs = ["体验包", "银卡", "金卡"];
  const ageMatch = (age: number) => {
    if (adv.ageRange === "all") return true;
    if (adv.ageRange === "<45") return age < 45;
    if (adv.ageRange === "45-60") return age >= 45 && age <= 60;
    if (adv.ageRange === "60-70") return age > 60 && age <= 70;
    if (adv.ageRange === ">70") return age > 70;
    return true;
  };
  const filtered = customers.filter(c =>
    (filter === "all" || c.layer === filter) &&
    (q === "" || c.name.includes(q) || c.diseases.some(d => d.includes(q))) &&
    (adv.disease.length === 0 || adv.disease.some(d => c.diseases.includes(d))) &&
    ageMatch(c.age) &&
    (adv.pkg.length === 0 || adv.pkg.some(p => c.package.includes(p))) &&
    (adv.status.length === 0 || adv.status.includes(c.layer))
  );
  const advCount =
    adv.disease.length + (adv.ageRange !== "all" ? 1 : 0) + adv.pkg.length + adv.status.length;
  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => push({ name: "search" })} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-secondary border-0 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="搜索客户姓名 / 病种"
          />
        </button>
        <button onClick={() => setShowAdv(true)} className="relative p-2.5 rounded-xl bg-secondary text-foreground active:scale-95 transition">
          <Filter className="w-4 h-4" />
          {advCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{advCount}</span>
          )}
        </button>
        <button onClick={() => push({ name: "addCustomer" })} className="p-2.5 rounded-xl bg-primary text-primary-foreground active:scale-95 transition">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>全部 86</Chip>
        <Chip active={filter === "urgent"} onClick={() => setFilter("urgent")}>紧急 1</Chip>
        <Chip active={filter === "abnormal"} onClick={() => setFilter("abnormal")}>异常 2</Chip>
        <Chip active={filter === "stable"} onClick={() => setFilter("stable")}>稳定 72</Chip>
        <Chip active={filter === "new"} onClick={() => setFilter("new")}>新入 1</Chip>
        <Chip active={filter === "churnRisk"} onClick={() => setFilter("churnRisk")}>离网倾向 3</Chip>
      </div>
      {advCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">已筛选：</span>
          {[...adv.disease, ...adv.pkg, ...adv.status.map(s => layerMeta[s as CustomerLayer]?.label || s)].map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
          ))}
          {adv.ageRange !== "all" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{adv.ageRange}岁</span>}
          <button onClick={() => setAdv({ disease: [], ageRange: "all", pkg: [], status: [] })} className="text-[11px] text-muted-foreground underline ml-auto">清空</button>
        </div>
      )}
      <div className="space-y-2">
        {filtered.map(c => (
          <button key={c.id} onClick={() => push({ name: "customer", id: c.id })}
            className="w-full rounded-xl bg-card border border-border p-3 flex items-center gap-3 active:bg-secondary text-left">
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-medium">{c.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-[11px] text-muted-foreground">{c.gender}·{c.age}</span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.diseases.join(" / ")}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${layerMeta[c.layer].color}`}>{layerMeta[c.layer].label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tierColor(tierOf(c.id))}`}>{tierOf(c.id)}</span>
                <span className="text-[10px] text-muted-foreground">{c.lastTouch}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">未找到客户</div>
        )}
      </div>
      {showAdv && (
        <AdvancedFilter
          allDiseases={allDiseases}
          allPkgs={allPkgs}
          adv={adv}
          onChange={setAdv}
          onClose={() => setShowAdv(false)}
        />
      )}
    </div>
  );
}

/* ============================================================
 * Tab 3：沟通列表
 * ============================================================ */
/**
 * 沟通模块 — 消息分类（客户 / 同事 / 系统 / 协同）
 * - 顶部：分类 Tab + 检索 + 关注提醒
 * - 客户：客户单聊或患者群（家人+协同人员）
 * - 同事：内部协作单聊（医师/药师/营养师等）
 * - 系统：平台/AI 提醒
 * - 协同：跨角色任务的临时群（医师→健管师转交、MDT 邀约等）
 */
type ImCat = "customer" | "colleague" | "system" | "collab";
function MIM({ push }: { push: (s: Stack) => void }) {
  const [cat, setCat] = useState<ImCat>("customer");
  // 客户消息：直接复用 customers
  const colleagueChats = [
    { id: "co-zhao", name: "赵主任 · 主管医师", role: "医师", last: "@林姐 王奶奶 MDT 我已加入", time: "10:42", unread: 2, online: true },
    { id: "co-qian", name: "钱药师", role: "药师", last: "二甲双胍剂量调整建议已发出", time: "09:18", unread: 0, online: true },
    { id: "co-sun",  name: "孙营养师", role: "营养师", last: "本周膳食模板更新 v3", time: "昨天", unread: 0, online: false },
    { id: "co-zhou", name: "周教练", role: "康复师", last: "刘伯运动方案审核已通过", time: "昨天", unread: 0, online: false },
    { id: "co-team", name: "五人团 · 内部群", role: "群聊", last: "李主管：本月 KPI 提前达成", time: "周一", unread: 5, online: true },
  ];
  const systemMsgs = [
    { id: "sys-1", title: "AI · 异常预警", body: "张老爷子 凌晨血糖 3.8 mmol/L，建议立即关怀", time: "08:12", level: "danger" as const },
    { id: "sys-2", title: "AI · 关注提示", body: "5 位客户 7 天未触达（含 2 位 churnRisk）", time: "今天", level: "warning" as const },
    { id: "sys-3", title: "系统 · 排班",   body: "明日 14:00 王奶奶 MDT 已加入您的日程", time: "今天", level: "primary" as const },
    { id: "sys-4", title: "系统 · KPI",    body: "本月触点完成 412/480（86%），保持良好", time: "昨天", level: "success" as const },
    { id: "sys-5", title: "系统 · 升级",   body: "新增「语音转文字 + 沟通评分」功能，去体验", time: "昨天", level: "primary" as const },
  ];
  const collabMsgs = [
    { id: "cb-1", title: "医师转交 · 赵主任 → 我", body: "王奶奶 化疗止吐方案，请 11:00 前回访", time: "10:30", urgent: true },
    { id: "cb-2", title: "MDT 协同邀请",          body: "周阿姨 高血压+骨质 联合方案讨论",     time: "09:50", urgent: false },
    { id: "cb-3", title: "护士 → 我",             body: "陈姐 上门换药已完成，附执行单",        time: "昨天", urgent: false },
    { id: "cb-4", title: "AI · 协同建议",          body: "李叔 出差归来，建议联动孙老师调整膳食", time: "昨天", urgent: false },
  ];

  const total = customers.length + colleagueChats.length + systemMsgs.length + collabMsgs.length;
  const cats: { k: ImCat; l: string; n: number }[] = [
    { k: "customer",  l: "客户", n: customers.length },
    { k: "colleague", l: "同事", n: colleagueChats.length },
    { k: "system",    l: "系统", n: systemMsgs.length },
    { k: "collab",    l: "协同", n: collabMsgs.length },
  ];

  return (
    <div>
      {/* 头部 */}
      <div className="px-4 py-3 flex items-center justify-between bg-card border-b border-border">
        <div>
          <h2 className="font-semibold">沟通</h2>
          <div className="text-[10px] text-muted-foreground mt-0.5">{total} 条会话 · 7 条未读</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => push({ name: "imSearch" })} className="p-1.5 rounded-lg active:bg-secondary"><Search className="w-5 h-5 text-muted-foreground" /></button>
          <button onClick={() => push({ name: "notifications" })} className="p-1.5 rounded-lg active:bg-secondary"><Bell className="w-5 h-5 text-muted-foreground" /></button>
        </div>
      </div>

      {/* 关注提醒条 — 来自 AI / 同事 */}
      <div className="px-3 py-2 bg-warning/5 border-b border-warning/20 flex items-center gap-2 overflow-x-auto">
        <Sparkles className="w-3.5 h-3.5 text-[oklch(0.5_0.13_75)] shrink-0" />
        {[
          { t: "AI", d: "@您 张老爷子需 5 分钟内回访", c: "danger" },
          { t: "赵主任", d: "@您 王奶奶 MDT 11:00 准时", c: "primary" },
          { t: "护士", d: "@您 陈姐 上门已完成，请确认", c: "success" },
        ].map((r, i) => (
          <button key={i} onClick={() => { setCat(i === 0 ? "system" : i === 1 ? "collab" : "collab"); toast.info(`${r.t}：${r.d}`); }}
            className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-card border border-border active:bg-secondary">
            <span className={`mr-1 font-medium ${r.c === "danger" ? "text-danger" : r.c === "success" ? "text-success" : "text-primary"}`}>{r.t}</span>
            {r.d}
          </button>
        ))}
      </div>

      {/* 分类 Tab */}
      <div className="px-3 pt-2 pb-2 bg-card flex gap-1 border-b border-border sticky top-0 z-10">
        {cats.map(c => (
          <button key={c.k} onClick={() => setCat(c.k)}
            className={`flex-1 py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 ${cat === c.k ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground active:bg-muted"}`}>
            {c.l}<span className={`text-[10px] px-1 rounded ${cat === c.k ? "bg-white/20" : "bg-muted-foreground/10"}`}>{c.n}</span>
          </button>
        ))}
      </div>

      {/* 客户列表 */}
      {cat === "customer" && (
        <div className="divide-y divide-border bg-card">
          {customers.map(c => (
            <button key={c.id} onClick={() => push({ name: "chat", id: c.id })}
              className="w-full px-4 py-3 flex items-center gap-3 active:bg-secondary text-left">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-medium">{c.name[0]}</div>
                {c.layer === "urgent" && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger border-2 border-card" />}
                {/* 群聊标记：紧急客户默认带家人协同群 */}
                {(c.layer === "urgent" || c.layer === "abnormal") && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center"><Users2 className="w-2 h-2" /></span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-1">
                    {c.name}
                    {c.layer === "urgent" && <span className="text-[9px] px-1 rounded bg-danger/10 text-danger">P0</span>}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c.lastTouch.split(" · ")[0]}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{c.note}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 同事列表 */}
      {cat === "colleague" && (
        <div className="divide-y divide-border bg-card">
          {colleagueChats.map(co => (
            <button key={co.id} onClick={() => toast.info(`打开与 ${co.name} 的会话（演示）`)}
              className="w-full px-4 py-3 flex items-center gap-3 active:bg-secondary text-left">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">{co.name[0]}</div>
                {co.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{co.name}</span>
                  <span className="text-[10px] text-muted-foreground">{co.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground truncate flex-1">{co.last}</span>
                  {co.unread > 0 && <span className="text-[10px] px-1.5 rounded-full bg-danger text-white">{co.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 系统消息 */}
      {cat === "system" && (
        <div className="divide-y divide-border bg-card">
          {systemMsgs.map(m => (
            <button key={m.id} onClick={() => toast.info(`${m.title}：${m.body}`)}
              className="w-full px-4 py-3 flex items-start gap-3 active:bg-secondary text-left">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                m.level === "danger" ? "bg-danger/10 text-danger" :
                m.level === "warning" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
                m.level === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
              }`}>
                {m.title.startsWith("AI") ? <Bot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{m.title}</span>
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.body}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 协同消息 */}
      {cat === "collab" && (
        <div className="divide-y divide-border bg-card">
          {collabMsgs.map(m => (
            <button key={m.id} onClick={() => toast.info(`${m.title}：${m.body}`)}
              className="w-full px-4 py-3 flex items-start gap-3 active:bg-secondary text-left">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.urgent ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">{m.title}{m.urgent && <span className="text-[9px] px-1 rounded bg-danger/10 text-danger">紧急</span>}</span>
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.body}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Tab 4：我的
 * ============================================================ */
function MMe({ push }: { push: (s: Stack) => void }) {
  // 服务时间段筛选
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  // 在管客户分层（演示数据）
  const layerDist = [
    { k: "活跃服务中", v: 52, c: "bg-success" },
    { k: "新签待激活", v: 12, c: "bg-primary" },
    { k: "续费窗口期", v: 14, c: "bg-warning" },
    { k: "高风险/异常", v: 8,  c: "bg-danger" },
  ];
  const totalManage = layerDist.reduce((a, b) => a + b.v, 0);
  // 服务周期分布
  const cycleDist = [
    { l: "30 天内", v: 8 },
    { l: "1-3 月",  v: 22 },
    { l: "3-6 月",  v: 28 },
    { l: "6-12 月", v: 18 },
    { l: "1 年以上", v: 10 },
  ];
  // 城市分布（地图替代）
  const cityDist = [
    { c: "上海", v: 48, x: 78, y: 40 },
    { c: "杭州", v: 16, x: 70, y: 50 },
    { c: "苏州", v: 12, x: 72, y: 42 },
    { c: "南京", v: 6,  x: 64, y: 38 },
    { c: "其他", v: 4,  x: 50, y: 60 },
  ];
  // 五大经营指标
  const kpis: { l: string; v: string; tip: string; tone: "primary" | "success" | "danger" }[] = [
    { l: "服务好评率", v: "96.4%", tone: "success", tip: "= (好评数 ÷ 已评价工单数) × 100%；统计周期内由客户主动评价的工单。" },
    { l: "商品转化率", v: "23.8%", tone: "primary", tip: "= (通过我推荐成交的商品订单数 ÷ 我推荐的商品次数) × 100%。" },
    { l: "服务转化率", v: "41.2%", tone: "primary", tip: "= (升级/加购/续费成功客户数 ÷ 我跟进的可销售客户数) × 100%。" },
    { l: "健康达标率", v: "78.6%", tone: "success", tip: "= (达标客户数 ÷ 在管客户数) × 100%；达标 = 主要指标连续 3 周内目标区间。" },
    { l: "客户投诉率", v: "0.4%",  tone: "danger",  tip: "= (有效投诉客户数 ÷ 在管客户数) × 100%；同一客户多次投诉合并计算。" },
  ];
  // 陪诊任务数据统计
  const escort = {
    month: 14, year: 86, rate: 98, hours: 56,
    nextHospital: "瑞金医院 · 肿瘤科",
    next: "明早 09:30 · 王奶奶 化疗复查",
  };
  // 收益
  const income = {
    month: "¥ 18,420",
    base: "¥ 9,000",
    perf: "¥ 6,820",
    bonus: "¥ 2,600",
    settle: "5/25",
    items: [
      { d: "5/16", t: "金卡服务奖金", v: "+ ¥ 1,200" },
      { d: "5/14", t: "MDT 协同提成", v: "+ ¥ 360" },
      { d: "5/12", t: "续费提成 · 李叔", v: "+ ¥ 480" },
      { d: "5/10", t: "商品推荐返佣 · 鱼油", v: "+ ¥ 86" },
    ],
  };
  return (
    <div className="px-4 py-4 space-y-4">
      <button onClick={() => push({ name: "profile" })}
        className="w-full text-left rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-5 active:opacity-90">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-medium">林</div>
          <div className="flex-1">
            <div className="font-semibold">林健管师</div>
            <div className="text-xs opacity-90">L4 健管主任 · 工号 HM01</div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-80" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><div className="text-lg font-semibold">86</div><div className="text-[10px] opacity-80">在管客户</div></div>
          <div><div className="text-lg font-semibold">412</div><div className="text-[10px] opacity-80">本月触点</div></div>
          <div><div className="text-lg font-semibold">96</div><div className="text-[10px] opacity-80">绩效分</div></div>
        </div>
      </button>

      {/* 服务时段筛选 */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl text-xs">
        {(["7","30","90"] as const).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`flex-1 py-1.5 rounded-lg ${range===r?"bg-card shadow-sm font-medium":"text-muted-foreground"}`}>
            近 {r} 天
          </button>
        ))}
      </div>

      {/* 我的收益 */}
      <Section title="我的收益">
        <div className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground p-4">
          <div className="text-xs opacity-90">本月预估收益（{income.settle} 结算）</div>
          <div className="text-2xl font-semibold mt-1">{income.month}</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-white/15 rounded-lg py-1.5"><div className="text-[10px] opacity-80">基本</div><div className="text-sm font-medium">{income.base}</div></div>
            <div className="bg-white/15 rounded-lg py-1.5"><div className="text-[10px] opacity-80">绩效</div><div className="text-sm font-medium">{income.perf}</div></div>
            <div className="bg-white/15 rounded-lg py-1.5"><div className="text-[10px] opacity-80">提成</div><div className="text-sm font-medium">{income.bonus}</div></div>
          </div>
        </div>
        <div className="mt-3 divide-y divide-border">
          {income.items.map((it,i)=>(
            <div key={i} className="py-2 flex items-center text-sm">
              <span className="text-[11px] text-muted-foreground w-12">{it.d}</span>
              <span className="flex-1">{it.t}</span>
              <span className="text-success font-medium">{it.v}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>toast.info("打开完整收益明细")} className="w-full mt-2 py-2 rounded-lg bg-secondary text-xs">查看全部明细</button>
      </Section>

      {/* 五大经营指标 */}
      <Section title="服务经营指标 · 近 30 天">
        <div className="grid grid-cols-2 gap-2">
          {kpis.map(k => (
            <button key={k.l} onClick={() => toast.info(`${k.l} 计算口径`, { description: k.tip, duration: 5000 })}
              className="rounded-xl bg-card border border-border p-3 text-left active:bg-secondary">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{k.l}</span>
                <AlertCircle className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className={`text-xl font-semibold mt-1 ${
                k.tone === "success" ? "text-success" : k.tone === "danger" ? "text-danger" : "text-primary"
              }`}>{k.v}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{k.tip}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* 在管患者服务情况 */}
      <Section title={`在管患者 · 共 ${totalManage} 位`}>
        {/* 分层 */}
        <div className="space-y-2">
          {layerDist.map(l => (
            <div key={l.k}>
              <div className="flex justify-between text-xs mb-1"><span>{l.k}</span><span className="text-muted-foreground">{l.v} 位</span></div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full ${l.c}`} style={{ width: `${(l.v/totalManage)*100}%` }} />
              </div>
            </div>
          ))}
        </div>
        {/* 服务周期范围 */}
        <div className="mt-4">
          <div className="text-[11px] text-muted-foreground mb-2">服务周期分布</div>
          <div className="flex items-end h-20 gap-1.5">
            {cycleDist.map(c => (
              <div key={c.l} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-[image:var(--gradient-primary)]" style={{ height: `${(c.v/Math.max(...cycleDist.map(x=>x.v)))*100}%` }} />
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{c.l}</span>
                <span className="text-[10px] font-medium">{c.v}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 用户阶段 */}
        <div className="mt-4">
          <div className="text-[11px] text-muted-foreground mb-2">客户阶段</div>
          <div className="flex items-center gap-1">
            {[
              { l: "导入期", v: 10, c: "bg-primary/40" },
              { l: "成长期", v: 22, c: "bg-primary/60" },
              { l: "成熟期", v: 38, c: "bg-primary" },
              { l: "维护期", v: 12, c: "bg-success" },
              { l: "流失期", v: 4,  c: "bg-danger" },
            ].map(s => (
              <div key={s.l} className="flex-1">
                <div className={`h-6 rounded ${s.c} flex items-center justify-center text-[10px] text-white font-medium`}>{s.v}</div>
                <div className="text-[9px] text-center text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* 用户地图（示意） */}
        <div className="mt-4">
          <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" />客户地理分布</div>
          <div className="relative w-full rounded-xl bg-secondary/50 overflow-hidden" style={{ height: 140 }}>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
              <path d="M30,30 Q50,20 75,30 L85,50 Q70,70 50,75 Q30,80 20,60 Z" fill="oklch(0.85 0.04 200)" stroke="oklch(0.6 0.1 200)" strokeWidth="0.5" />
            </svg>
            {cityDist.map(c => (
              <button key={c.c} onClick={()=>toast.info(`${c.c} · ${c.v} 位在管客户`)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                <span className="block rounded-full bg-primary/80 border-2 border-card shadow"
                  style={{ width: 8 + c.v/3, height: 8 + c.v/3 }} />
                <span className="text-[9px] mt-0.5 text-foreground whitespace-nowrap font-medium">{c.c} {c.v}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 陪诊数据 */}
      <Section title="陪诊服务统计">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold">{escort.month}</div><div className="text-[10px] text-muted-foreground">本月单</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold">{escort.year}</div><div className="text-[10px] text-muted-foreground">年度单</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold text-success">{escort.rate}%</div><div className="text-[10px] text-muted-foreground">准点率</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold">{escort.hours}</div><div className="text-[10px] text-muted-foreground">服务小时</div></div>
        </div>
        <div className="mt-3 rounded-lg bg-warning/5 border border-warning/30 p-3">
          <div className="text-[10px] text-[oklch(0.5_0.13_75)] flex items-center gap-1"><Stethoscope className="w-3 h-3" />下一次陪诊</div>
          <div className="text-sm font-medium mt-1">{escort.next}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{escort.nextHospital}</div>
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">常去医院 TOP3：瑞金 32% · 中山 21% · 华山 14%</div>
      </Section>

      <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
        {[
          { l: "我的关怀效果", i: HeartHandshake, to: "care" as const },
          { l: "我的任务统计", i: Sparkles,       to: "stats" as const },
          { l: "话术模板库",   i: MessageSquare,  to: "scripts" as const },
          { l: "MDT 会诊记录", i: Video,          to: "mdt" as const },
        ].map(it => {
          const Icon = it.i;
          return (
            <button key={it.l} onClick={() => push({ name: it.to })}
              className="w-full px-4 py-3.5 flex items-center gap-3 text-sm active:bg-secondary">
              <Icon className="w-4 h-4 text-primary" />
              <span className="flex-1 text-left">{it.l}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
        {[
          { l: "设置",   i: Settings, action: () => push({ name: "settings" }) },
          { l: "退出登录", i: LogOut,   action: () => toast.error("已退出登录（演示）") },
        ].map(it => {
          const Icon = it.i;
          return (
            <button key={it.l} onClick={it.action}
              className="w-full px-4 py-3.5 flex items-center gap-3 text-sm active:bg-secondary">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-left">{it.l}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 详情：任务
 * ============================================================ */
function TaskDetail({
  id, pop, taskState, toggleTask,
}: { id: string; pop: () => void; taskState: Record<string, boolean>; toggleTask: (id: string) => void }) {
  const t = tasks.find(x => x.id === id) as Task;
  const c = customers.find(x => x.name === t.customer);
  const done = taskState[id];
  return (
    <div>
      <PageHeader title="任务详情" pop={pop} />
      <div className="p-4 space-y-4">
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              t.priority === "P0" ? "bg-danger/10 text-danger" :
              t.priority === "P1" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
              "bg-muted text-muted-foreground"
            }`}>{t.priority}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t.type}</span>
            <span className="ml-auto text-[11px] text-muted-foreground">{t.source}</span>
          </div>
          <h2 className={`mt-2 text-base font-semibold ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</h2>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.due}</span>
            <span>客户：{t.customer}</span>
          </div>
        </div>

        <Section title="AI 推荐处置">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground">
            <li>核对客户最近 24h 监测数据与症状描述</li>
            <li>调取责任医师的随访方案与禁忌</li>
            <li>使用「{t.type}」推荐话术 1～2 条进行触达</li>
            <li>30 分钟内回填触达结果与客户反馈</li>
          </ol>
        </Section>

        {c && (
          <button onClick={pop /* parent will keep stack */}
            className="w-full rounded-xl bg-card border border-border p-3 flex items-center gap-3 active:bg-secondary text-left">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{c.name} · {c.gender} {c.age}</div>
              <div className="text-[11px] text-muted-foreground truncate">{c.diseases.join(" / ")}</div>
            </div>
            <span className="text-[11px] text-primary">查看档案</span>
          </button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <ActionTile icon={Phone} label="电话" onClick={() => placeCall(t.customer)} />
          <ActionTile icon={MessageSquare} label="发消息" onClick={() => toast.info("已打开 IM 草稿")} />
          <ActionTile icon={Video} label="视频" onClick={() => toast.info("视频通话邀请已发送")} />
        </div>

        <button onClick={() => { toggleTask(id); }}
          className={`w-full py-3.5 rounded-xl font-medium text-sm transition ${
            done ? "bg-secondary text-foreground" : "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]"
          }`}>
          {done ? "标记为未完成" : "标记完成 · 回填结果"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * 详情：客户档案 — 完整还原文档 4.3.x 章节
 *  · 进入弹窗简介（一段话 + 知道了）
 *  · 基本信息 / 健康档案 / 数据趋势(30/90/自定义) / 服务包
 *  · 生活偏好 / 家庭结构 / 沟通偏好 / 沟通历史 / 变化雷达 / 备注
 * ============================================================ */
function CustomerDetail({ id, pop, push }: { id: string; pop: () => void; push: (s: Stack) => void }) {
  const c = customers.find(x => x.id === id) as Customer;
  const [tab, setTab] = useState<"basic" | "health" | "history" | "trend" | "family" | "station" | "report" | "inquiry" | "med">("basic");
  // 进入患者详情先弹窗展示一段简介
  const [showIntro, setShowIntro] = useState(true);
  const [trendRange, setTrendRange] = useState<"30" | "90" | "custom">("30");
  const [showQuick, setShowQuick] = useState(false);
  // 温度指数（演示数据）
  const temperature = c.layer === "urgent" ? 62 : c.layer === "abnormal" ? 74 : c.layer === "churnRisk" ? 38 : 88;
  const tempTone = temperature >= 80 ? { txt: "text-success", bar: "bg-success", l: "温暖" } : temperature >= 60 ? { txt: "text-[oklch(0.5_0.13_75)]", bar: "bg-warning", l: "需关注" } : { txt: "text-danger", bar: "bg-danger", l: "冷淡" };

  // AI 一句话简介（模拟根据档案合成）
  const intro = `${c.name}，${c.age}岁${c.gender}性，${c.diseases.join("、")}患者，${c.package}。${c.note}。最近一次触达：${c.lastTouch}。建议关注：用药依从性 + 情绪状态。`;

  return (
    <div className="relative pb-16">
      <PageHeader title="客户档案" pop={pop}
        right={<button onClick={() => toast.info("已加入星标客户")} className="p-1.5 rounded-lg hover:bg-secondary"><Star className="w-5 h-5" /></button>} />
      <div className="p-4 space-y-4">
        {/* 头卡 */}
        <div className="rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-medium">{c.name[0]}</div>
            <div className="flex-1">
              <div className="font-semibold text-base">{c.name} <span className="text-xs font-normal opacity-80">{c.gender} · {c.age} 岁</span></div>
              <div className="text-[11px] opacity-90 mt-0.5">{c.package}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.diseases.map(d => <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-white/15">{d}</span>)}
              </div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/20`}>{layerMeta[c.layer].label}</span>
          </div>
          {/* AI 一句话简介 + 温度指数 + 私人备注入口 */}
          <div className="mt-3 rounded-lg bg-white/12 p-2.5">
            <div className="text-[10px] opacity-80 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI 一句话</div>
            <div className="text-[12px] mt-0.5 leading-relaxed line-clamp-2">{intro}</div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-white/12 px-2.5 py-2">
              <div className="flex items-center justify-between text-[10px] opacity-80"><span className="flex items-center gap-1"><Flame className="w-3 h-3" />温度指数</span><span>{tempTone.l}</span></div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-lg font-semibold leading-none">{temperature}</div>
                <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white" style={{ width: `${temperature}%` }} /></div>
              </div>
            </div>
            <button onClick={() => toast.info("打开私人备注")} className="rounded-lg bg-white/15 px-2.5 py-2 text-[11px] flex items-center gap-1 active:bg-white/25">
              <BookMarked className="w-3.5 h-3.5" />私人备注
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <ActionTile dark icon={Phone} label="电话" onClick={() => placeCall(c.name)} />
            <ActionTile dark icon={MessageSquare} label="IM" onClick={() => push({ name: "chat", id: c.id })} />
            <ActionTile dark icon={Video} label="视频" onClick={() => toast.info("视频邀请已发送")} />
            <ActionTile dark icon={Calendar} label="预约" onClick={() => toast.success("预约已发起")} />
          </div>
        </div>

        {/* Tab — 基本/健康/沟通/数据/家庭/报告/问诊/用药 */}
        <div className="flex gap-1 bg-secondary p-1 rounded-xl text-xs overflow-x-auto">
          {[
            { id: "basic",   l: "基本" },
            { id: "health",  l: "健康" },
            { id: "history", l: "沟通" },
            { id: "trend",   l: "数据" },
            { id: "family",  l: "家庭" },
            { id: "station", l: "驿站" },
            { id: "report",  l: "报告" },
            { id: "inquiry", l: "问诊" },
            { id: "med",     l: "用药" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex-1 py-1.5 rounded-lg whitespace-nowrap ${tab === t.id ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ===== 基本 ===== */}
        {tab === "basic" && (
          <>
            {/* 基本信息 */}
            <Section title="基本信息">
              <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                <InfoRow label="姓名" value={c.name} />
                <InfoRow label="年龄" value={`${c.age} 岁`} />
                <InfoRow label="性别" value={c.gender} />
                <InfoRow label="服务包" value={c.package} />
                <div className="col-span-2"><InfoRow label="地址" value="上海市浦东新区世纪大道 100 号 X 号楼" icon={MapPin} /></div>
                <div className="col-span-2 rounded-lg bg-danger/5 border border-danger/20 px-3 py-2 mt-1">
                  <div className="text-[11px] text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" />紧急联系人</div>
                  <div className="text-sm mt-0.5">{c.gender === "男" ? "女儿 张敏" : "儿子 李强"} · 138-0000-1234</div>
                </div>
              </div>
            </Section>

            {/* 沟通偏好 */}
            <Section title="沟通偏好">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { l: "电话", i: Phone, on: true,  best: "上午 9-11 点" },
                  { l: "视频", i: Video, on: c.layer !== "stable", best: "周末" },
                  { l: "语音", i: Mic,   on: true,  best: "随时" },
                  { l: "上门", i: HomeIcon, on: c.layer === "urgent", best: "需提前预约" },
                ].map(p => {
                  const Icon = p.i;
                  return (
                    <div key={p.l} className={`rounded-xl p-2.5 text-center border ${p.on ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40 opacity-60"}`}>
                      <Icon className={`w-4 h-4 mx-auto ${p.on ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-[11px] mt-1">{p.l}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{p.best}</div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* 健管师备注 */}
            <Section title="健管师备注 ✏️">
              <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-sm leading-relaxed">
                客户性格内敛、不爱主动表达。家中老伴去年离世，需特别关注情绪状态；
                喜欢早上散步，建议沟通安排在 9 点后；对甜食控制力较弱，需常规提醒。
              </div>
              <button onClick={() => toast.success("已进入编辑")} className="w-full mt-2 py-2 rounded-lg bg-secondary text-xs">编辑备注</button>
            </Section>
          </>
        )}

        {/* ===== 健康（病种/过敏/既往史 + 服务包 + 生活偏好） ===== */}
        {tab === "health" && (
          <>
            <Section title="健康档案">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">病种</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.diseases.map(d => <span key={d} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{d}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">过敏史</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["青霉素", "海鲜"].map(d => <span key={d} className="text-xs px-2 py-0.5 rounded bg-danger/10 text-danger">{d}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">既往史</div>
                  <ul className="text-sm space-y-0.5">
                    <li>· 2018 年阑尾炎手术</li>
                    <li>· 2021 年白内障手术</li>
                    <li>· 长期高血压病史 12 年</li>
                  </ul>
                </div>
                <div className="text-[11px] text-muted-foreground">当前用药请见「用药」Tab</div>
              </div>
            </Section>

            {/* 服务包详情 */}
            <Section title="服务包详情">
              <div className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground p-3">
                <div className="text-xs opacity-90">{c.package}</div>
                <div className="text-base font-semibold mt-0.5">2026.01.01 - 2026.12.31</div>
                <div className="text-[11px] opacity-90 mt-1">剩余 232 天</div>
              </div>
              <div className="mt-3 space-y-2.5">
                {[
                  { l: "健管师随访", used: 12, total: 30 },
                  { l: "MDT 会诊", used: 2, total: 6 },
                  { l: "上门服务", used: 1, total: 4 },
                  { l: "专家门诊", used: 3, total: 12 },
                ].map(b => (
                  <div key={b.l}>
                    <div className="flex justify-between text-xs mb-1"><span>{b.l}</span><span className="text-muted-foreground">{b.used}/{b.total} 次</span></div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(b.used/b.total)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 生活偏好 */}
            <Section title="生活偏好">
              <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" />AI 从打卡数据自动分析</div>
              <div className="flex flex-wrap gap-1.5">
                {["早起 6:30", "晨练步行", "口味偏咸", "喜甜食", "睡前阅读", "不吸烟", "偶尔饮酒"].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground mt-3 mb-2">健管师手动添加</div>
              <div className="flex flex-wrap gap-1.5">
                {["女儿陪伴重要", "信任老朋友推荐", "怕打针"].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-[oklch(0.5_0.13_75)]">{t}</span>
                ))}
                <button onClick={() => toast.success("已新增标签")} className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground">+ 添加</button>
              </div>
            </Section>
          </>
        )}

        {/* ===== 趋势 30/90/自定义 ===== */}
        {tab === "trend" && (
          <>
            <div className="flex gap-1 bg-secondary p-1 rounded-xl text-xs">
              {(["30", "90", "custom"] as const).map(r => (
                <button key={r} onClick={() => { setTrendRange(r); if (r === "custom") toast.info("打开日期选择器"); }}
                  className={`flex-1 py-1.5 rounded-lg ${trendRange === r ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>
                  {r === "30" ? "近 30 天" : r === "90" ? "近 90 天" : "自定义"}
                </button>
              ))}
            </div>

            {[
              { l: "血糖 (mmol/L)",   data: [6.2, 7.1, 6.8, 9.2, 5.4, 7.8, 6.5, 8.1, 5.9, 6.7, 7.3, 6.4], color: "var(--primary)", unit: "" },
              { l: "血压 (mmHg 收缩压)", data: [132, 138, 142, 152, 145, 138, 135, 130, 142, 148, 138, 132], color: "oklch(0.65 0.2 25)", unit: "" },
              { l: "体重 (kg)",       data: [68.2, 68.0, 67.8, 67.9, 67.5, 67.6, 67.4, 67.2, 67.0, 67.1, 66.9, 66.8], color: "oklch(0.7 0.15 145)", unit: "" },
              { l: "情绪 (1-5)",      data: [4, 4, 3, 3, 2, 3, 3, 4, 4, 3, 4, 5], color: "oklch(0.7 0.15 75)", unit: "" },
            ].map(s => {
              const max = Math.max(...s.data); const min = Math.min(...s.data);
              const range = max - min || 1;
              return (
                <Section key={s.l} title={s.l}>
                  <div className="flex items-end h-24 gap-1">
                    {s.data.map((v, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${((v-min)/range)*90+10}%`, background: s.color, opacity: 0.85 }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{trendRange === "30" ? "30 天前" : trendRange === "90" ? "90 天前" : "起始"}</span>
                    <span>当前 {s.data[s.data.length-1]}{s.unit}</span>
                  </div>
                </Section>
              );
            })}
          </>
        )}

        {/* ===== 沟通历史（CM-C 组）===== */}
        {tab === "history" && <CommunicationTimeline />}

        {tab === "family" && <FamilyView selfName={c.name} selfAge={c.age} />}
        {tab === "station" && <StationTab />}

        {tab === "report" && <ReportTab />}
        {tab === "inquiry" && <InquiryTab />}
        {tab === "med" && <MedTab />}
      </div>

      {/* 右侧固定悬浮：今日建议动作 + 快捷沟通 */}
      <div className="absolute right-2 top-1/3 z-20 flex flex-col items-end gap-2">
        {showQuick && (
          <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-card)] p-2.5 w-44 animate-in fade-in slide-in-from-right-2 duration-150">
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5"><Sparkles className="w-3 h-3 text-primary" />今日建议动作</div>
            <div className="text-[11px] leading-relaxed mb-2">
              · 上午 9:30 电话回访<br/>
              · 推送低 GI 食谱<br/>
              · 邀请女儿协同关怀
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { i: Phone, c: "primary",   tip: "电话",   on: () => placeCall(c.name) },
                { i: Video, c: "secondary", tip: "视频",   on: () => toast.info("视频邀请已发送") },
                { i: Mic,   c: "secondary", tip: "语音",   on: () => toast.info("按住说话…") },
                { i: MessageSquare, c: "secondary", tip: "IM", on: () => push({ name: "chat", id: c.id }) },
              ].map((a, i) => {
                const Icon = a.i;
                return (
                  <button key={i} onClick={a.on} title={a.tip}
                    className={`h-8 rounded-lg flex items-center justify-center ${a.c === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <button onClick={() => setShowQuick(s => !s)}
          className="w-11 h-11 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)] flex items-center justify-center active:scale-95">
          {showQuick ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </div>

      {/* 底部悬浮：变化雷达最近事件 */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-3 py-2 bg-card/95 backdrop-blur border-t border-border">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0"><Activity className="w-3 h-3 text-danger" />变化雷达</span>
          {[
            { p: "P0", t: "HbA1c ↑0.6",  c: "danger" },
            { p: "P1", t: "家人互动 -40%", c: "warning" },
            { p: "P1", t: "下周三生日",   c: "primary" },
            { p: "P0", t: "30 天后到期",  c: "danger" },
          ].map((a, i) => (
            <button key={i} onClick={() => { setTab("history"); toast.info(a.t); }}
              className={`shrink-0 text-[10px] px-2 py-1 rounded-full border ${
                a.c === "danger" ? "border-danger/30 bg-danger/5 text-danger" :
                a.c === "warning" ? "border-warning/40 bg-warning/5 text-[oklch(0.5_0.13_75)]" :
                "border-primary/30 bg-primary/5 text-primary"
              }`}>
              <b className="mr-1">{a.p}</b>{a.t}
            </button>
          ))}
        </div>
      </div>

      {/* === 进入弹窗：客户简介 === */}
      {showIntro && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="w-full bg-card rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center text-base font-medium">{c.name[0]}</div>
              <div>
                <div className="text-base font-semibold flex items-center gap-1.5">{c.name} <Sparkles className="w-3.5 h-3.5 text-primary" /></div>
                <div className="text-[11px] text-muted-foreground">AI 一句话简介</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{intro}</p>
            <button onClick={() => setShowIntro(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-medium text-sm">
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* 家庭节点 */
function FamilyNode({ n, a, self, dead, authorized }: { n: string; a: number; self?: boolean; dead?: boolean; authorized?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
        self ? "bg-[image:var(--gradient-primary)] text-primary-foreground" :
        dead ? "bg-secondary text-muted-foreground line-through" :
        authorized ? "bg-primary/15 text-primary border-2 border-primary/40" :
        "bg-secondary text-foreground"
      }`}>{n}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{a}岁</div>
    </div>
  );
}

/* ============================================================
 * 沟通时间线（CM-C）
 *  · 垂直时间线，按日期倒序
 *  · 每条触点：类型图标 + 时长 + 摘要 + 情绪识别 + 是否真温度
 *  · 可按类型筛选；点击展开原始内容（录音回放 / 文字记录）
 * ============================================================ */
function CommunicationTimeline() {
  type TT = "电话" | "IM" | "视频" | "上门" | "语音";
  const all: { t: string; type: TT; icon: typeof Phone; dur: string; sum: string; mood: "正向" | "中性" | "负向"; warm: boolean; raw: { kind: "audio" | "text"; body: string } }[] = [
    { t: "今天 08:30", type: "电话", icon: Phone,         dur: "5'12\"", sum: "低血糖处置回访，客户确认已恢复",       mood: "正向", warm: true,  raw: { kind: "audio", body: "[录音] 早上好，您现在感觉怎么样？……（5 分 12 秒）" } },
    { t: "昨天 19:00", type: "IM",   icon: MessageSquare, dur: "12 条",  sum: "推送晚餐建议（低 GI），客户已收藏",   mood: "中性", warm: false, raw: { kind: "text",  body: "健管师：今天晚餐建议\n客户：好的谢谢\n健管师：[食谱图片]\n客户：[已收藏]" } },
    { t: "5/12 14:30", type: "视频", icon: Video,         dur: "32'15\"", sum: "MDT 多学科会诊，方案已同步",         mood: "正向", warm: true,  raw: { kind: "audio", body: "[视频回放] 赵主任、钱药师、健管师与客户共同讨论用药方案……" } },
    { t: "5/10 10:00", type: "上门", icon: HomeIcon,      dur: "45'",    sum: "上门测量血糖 + 健康教育",            mood: "正向", warm: true,  raw: { kind: "text",  body: "上门服务记录：测得空腹血糖 6.2，血压 132/82。完成饮食宣教。" } },
    { t: "5/08 09:15", type: "语音", icon: Mic,           dur: "23\"",   sum: "用药提醒语音留言",                    mood: "中性", warm: false, raw: { kind: "audio", body: "[语音留言 23 秒] 别忘了餐后服用二甲双胍哦～" } },
    { t: "5/05 21:00", type: "IM",   icon: MessageSquare, dur: "3 条",   sum: "客户主动询问失眠问题，回复改善建议", mood: "负向", warm: true,  raw: { kind: "text",  body: "客户：我最近又睡不着了\n健管师：可以试试睡前 1 小时不看手机……" } },
  ];
  const types: ("全部" | TT)[] = ["全部", "电话", "IM", "视频", "上门", "语音"];
  const [filter, setFilter] = useState<(typeof types)[number]>("全部");
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const list = all.filter(x => filter === "全部" || x.type === filter);
  const moodColor = (m: string) => m === "正向" ? "text-success" : m === "负向" ? "text-danger" : "text-muted-foreground";
  return (
    <>
      <Section title="AI 历史触点摘要">
        <p className="text-sm leading-relaxed text-foreground">
          近 30 天共触达 <b>14 次</b>（电话 4、IM 8、视频 1、上门 1）。
          主要话题：<span className="text-primary">血糖控制</span>、
          <span className="text-primary">用药依从性</span>、
          <span className="text-primary">情绪关怀</span>。客户最关心：
          <span className="text-warning">"夜间低血糖如何避免"</span>。
        </p>
      </Section>
      <Section title="沟通时间线 · 倒序">
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {types.map(t => (
            <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>
          ))}
        </div>
        <div className="mt-2">
          {list.map((e, i) => {
            const Icon = e.icon;
            const isOpen = !!open[i];
            return (
              <div key={i} className="flex gap-3 py-2 border-b border-border last:border-0">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-primary" /></div>
                  <div className="flex-1 w-px bg-border mt-1" />
                </div>
                <div className="flex-1 pb-1">
                  <button onClick={() => setOpen(o => ({ ...o, [i]: !o[i] }))} className="w-full text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{e.type}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{e.dur}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded bg-secondary ${moodColor(e.mood)}`}>情绪 · {e.mood}</span>
                      {e.warm && <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />真温度</span>}
                      <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">{e.t}<ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} /></span>
                    </div>
                    <div className="text-sm mt-1">{e.sum}</div>
                  </button>
                  {isOpen && (
                    <div className="mt-2 rounded-lg bg-secondary/60 p-2.5">
                      {e.raw.kind === "audio" ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => toast.success("正在播放…")} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Play className="w-3.5 h-3.5" /></button>
                          <div className="flex-1 h-1 rounded-full bg-card overflow-hidden"><div className="h-full bg-primary w-1/3" /></div>
                          <span className="text-[10px] text-muted-foreground">{e.dur}</span>
                        </div>
                      ) : (
                        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-foreground">{e.raw.body}</pre>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1.5 italic">{e.raw.body.startsWith("[") ? "" : "原始记录"}</div>
                      {/* 本次沟通 AI 摘要 + 生成待办 */}
                      <div className="mt-2 rounded-lg bg-card border border-primary/20 p-2">
                        <div className="text-[10px] text-primary flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" />本次沟通 AI 总结</div>
                        <div className="text-[11px] leading-relaxed">{e.sum}。建议后续动作：{e.mood === "负向" ? "24h 内回访 + 情绪关怀" : e.warm ? "维持节奏，3 天后复测" : "推送相关宣教，1 周后跟进"}。</div>
                        <div className="flex gap-1.5 mt-2">
                          <button onClick={() => toast.success("已生成待办：" + e.sum)} className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground flex items-center gap-1"><ClipboardList className="w-3 h-3" />生成待办</button>
                          <button onClick={() => toast.info("打开完整聊天上下文")} className="text-[10px] px-2 py-1 rounded bg-secondary flex items-center gap-1"><MessageSquare className="w-3 h-3" />查看上下文</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">该类型暂无触点</div>}
        </div>
      </Section>
      <Section title="客户情绪轨迹（30 天）">
        <div className="flex items-end h-16 gap-1">
          {[3,4,4,3,2,2,3,3,4,4,5,4,3,3,4,4,3,2,3,4,4,5,4,3,3,4,4,4,5,5].map((v,i)=>(
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v*20}%`, background: v>=4?"oklch(0.7 0.15 145)":v>=3?"oklch(0.7 0.15 75)":"oklch(0.65 0.2 25)" }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>30 天前</span><span>今日 5/5 ↗</span>
        </div>
      </Section>
    </>
  );
}

/* ============================================================
 * 家庭视图（CM-E）
 *  · 中央：客户本人
 *  · 周围：家人节点（节点大小 = 互动频率冷热图）
 *  · 点击家人节点 → 弹该家人健康概览
 *  · 右侧：家庭关键事件日历
 * ============================================================ */
function FamilyView({ selfName, selfAge }: { selfName: string; selfAge: number }) {
  type Member = { name: string; rel: string; age: number; freq: number; isQt: boolean; status: string; tone: "danger" | "warning" | "success" | "primary" | "muted"; auth: "全部" | "部分" | "无" };
  const family: Member[] = [
    { name: "周阿姨", rel: "妻子", age: selfAge - 2, freq: 92, isQt: true,  status: "高血压、骨质疏松，规律服药", tone: "warning", auth: "部分" },
    { name: "张敏",   rel: "女儿", age: 38,          freq: 88, isQt: true,  status: "孕中期 28 周，产检正常",     tone: "primary", auth: "全部" },
    { name: "张强",   rel: "儿子", age: 42,          freq: 35, isQt: false, status: "未注册，年度体检无异常",     tone: "success", auth: "无" },
    { name: "父",     rel: "父亲", age: 95,          freq: 0,  isQt: false, status: "已故",                       tone: "muted",   auth: "无" },
    { name: "孙",     rel: "外孙", age: 6,           freq: 60, isQt: false, status: "上幼儿园，活泼好动",         tone: "success", auth: "无" },
  ];
  const [picked, setPicked] = useState<Member | null>(null);
  const events = [
    { d: "5/15", t: "周阿姨 高血压复诊", c: "warning" },
    { d: "5/18", t: "本人 生日 🎂",        c: "primary" },
    { d: "5/22", t: "张敏 产检",           c: "primary" },
    { d: "6/01", t: "外孙 儿童节",         c: "success" },
    { d: "6/15", t: "父亲忌日 · 注意情绪", c: "danger" },
  ];
  // 圆周布局
  const R = 95;
  const cx = 130, cy = 120;
  const positioned = family.map((m, i) => {
    const angle = (i / family.length) * Math.PI * 2 - Math.PI / 2;
    return { ...m, x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R };
  });
  const sizeFor = (freq: number) => 30 + (freq / 100) * 22; // 30-52 px
  const colorFor = (freq: number) =>
    freq >= 70 ? "oklch(0.65 0.2 25)" :
    freq >= 40 ? "oklch(0.78 0.15 75)" :
    freq > 0   ? "oklch(0.78 0.05 230)" :
                 "oklch(0.85 0.02 240)";
  return (
    <>
      <Section title="家庭关系图（节点大小 = 互动频率）">
        <div className="relative w-full" style={{ height: 250 }}>
          {/* 连线 */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 250">
            {positioned.map((m, i) => (
              <line key={i} x1={cx} y1={cy} x2={m.x} y2={m.y}
                stroke={colorFor(m.freq)} strokeOpacity={0.5} strokeWidth={Math.max(1, m.freq / 30)} strokeDasharray={m.freq === 0 ? "3 3" : ""} />
            ))}
          </svg>
          {/* 中心：本人 */}
          <div className="absolute" style={{ left: cx - 28, top: cy - 28 }}>
            <div className="w-14 h-14 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground flex flex-col items-center justify-center shadow-[var(--shadow-soft)]">
              <span className="text-base font-semibold leading-none">{selfName[0]}</span>
              <span className="text-[9px] opacity-80 mt-0.5">本人</span>
            </div>
          </div>
          {/* 家人节点 */}
          {positioned.map((m, i) => {
            const sz = sizeFor(m.freq);
            return (
              <button key={i} onClick={() => setPicked(m)} title={`${m.rel} · 互动 ${m.freq}%`}
                className="absolute rounded-full flex flex-col items-center justify-center shadow active:scale-95 transition"
                style={{ left: m.x - sz / 2, top: m.y - sz / 2, width: sz, height: sz, background: colorFor(m.freq), color: "white" }}>
                <span className="text-[11px] font-medium leading-none">{m.name[0]}</span>
                <span className="text-[8px] opacity-90 leading-none mt-0.5">{m.rel}</span>
                {m.isQt && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-card text-primary text-[8px] flex items-center justify-center border border-card font-bold">蜻</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground justify-center mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.65 0.2 25)" }} />高频</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.78 0.15 75)" }} />中频</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.78 0.05 230)" }} />低频</span>
          <span className="flex items-center gap-1"><span className="text-primary font-bold">蜻</span>蜻蜓用户</span>
        </div>
      </Section>

      <Section title="家庭关键事件日历">
        <div className="space-y-1.5">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
              <div className="w-12 text-center">
                <div className="text-[10px] text-muted-foreground">{e.d.split("/")[0]} 月</div>
                <div className="text-base font-semibold leading-none">{e.d.split("/")[1]}</div>
              </div>
              <div className={`w-1 h-8 rounded-full ${
                e.c === "danger" ? "bg-danger" : e.c === "warning" ? "bg-warning" : e.c === "success" ? "bg-success" : "bg-primary"
              }`} />
              <div className="flex-1 text-sm">{e.t}</div>
              <button onClick={() => toast.success("已加入提醒")} className="text-[11px] text-primary">提醒</button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="授权关系（谁看得到谁的数据）">
        <div className="space-y-1.5 text-sm">
          {family.filter(f => f.tone !== "muted").map(f => (
            <div key={f.name} className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                f.auth === "全部" ? "bg-primary/10 text-primary" :
                f.auth === "部分" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
                "bg-secondary text-muted-foreground"
              }`}>{f.auth === "无" ? "禁用" : "允许"}</span>
              {f.rel} {f.name} → {f.auth === "全部" ? "全部数据" : f.auth === "部分" ? "用药 + 复诊提醒" : "暂未授权"}
            </div>
          ))}
        </div>
      </Section>

      {/* 家人健康概览弹窗 */}
      {picked && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-end" onClick={() => setPicked(null)}>
          <div className="w-full bg-card rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-medium text-white" style={{ background: colorFor(picked.freq) }}>{picked.name[0]}</div>
              <div className="flex-1">
                <div className="text-base font-semibold flex items-center gap-1.5">
                  {picked.name}
                  <span className="text-[11px] text-muted-foreground font-normal">{picked.rel} · {picked.age}岁</span>
                  {picked.isQt && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">蜻蜓用户</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">与本人互动频率 · {picked.freq}%</div>
              </div>
              <button onClick={() => setPicked(null)} className="p-1.5"><X className="w-5 h-5" /></button>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3 text-sm">{picked.status}</div>
            {picked.isQt ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="血压" value="138/86" />
                <Metric label="情绪" value="3.6/5" />
                <Metric label="服药率" value="92%" />
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-warning/5 border border-warning/20 p-3 text-[12px] text-[oklch(0.45_0.13_75)]">
                该家人尚未注册蜻蜓康健家，无健康数据。可邀请其加入家庭组。
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={() => placeCall(picked.name)} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm flex items-center justify-center gap-1.5"><Phone className="w-4 h-4" />联系</button>
              <button onClick={() => toast.info(picked.isQt ? "已发送家庭关怀任务" : "邀请短信已发送")} className="flex-1 py-2.5 rounded-xl bg-secondary text-sm">{picked.isQt ? "发起协同" : "邀请加入"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== 报告 Tab ===== */
function ReportTab() {
  const reports = [
    { d: "2026/05", t: "5 月健康月报", tags: ["糖尿病", "情绪"], status: "新" },
    { d: "2026/04", t: "4 月健康月报", tags: ["糖尿病"],         status: "已读" },
    { d: "2026/Q1", t: "Q1 季度评估",  tags: ["综合"],           status: "已读" },
    { d: "2026/03", t: "MDT 会诊纪要 #028", tags: ["MDT"],       status: "已读" },
    { d: "2026/02", t: "年度体检解读",  tags: ["体检"],           status: "已读" },
  ];
  return (
    <>
      <Section title="健康报告">
        <div className="space-y-2">
          {reports.map((r, i) => (
            <button key={i} onClick={() => toast.info(`已打开 ${r.t}`)}
              className="w-full rounded-xl border border-border p-3 flex items-center gap-3 active:bg-secondary text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  {r.t}
                  {r.status === "新" && <span className="text-[10px] px-1.5 py-0 rounded bg-danger/10 text-danger">NEW</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{r.d} · {r.tags.join(" / ")}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ===== 问诊 Tab ===== */
function InquiryTab() {
  const list = [
    { d: "5/14", who: "赵主任 · 责任医师", topic: "复诊建议", body: "继续当前方案，2 周后复查 HbA1c。如夜间再次出现低血糖立即来诊。" },
    { d: "5/12", who: "MDT 多学科",       topic: "联合方案", body: "营养师调整碳水比例 → 45%；药师下调二甲双胍至餐后 0.5g。" },
    { d: "4/28", who: "钱药师",           topic: "用药咨询", body: "可餐后服用，避免空腹引起低血糖；监测晨起血糖。" },
    { d: "4/15", who: "赵主任",           topic: "图文问诊", body: "上传眼底照片 → 排查糖网。建议眼科专科就诊。" },
  ];
  return (
    <>
      <Section title="问诊与医嘱">
        <div className="space-y-2">
          {list.map((r, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium">{r.topic}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{r.d}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{r.who}</div>
              <p className="text-sm mt-1.5 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="发起新问诊">
        <div className="grid grid-cols-3 gap-2">
          <ActionTile icon={MessageSquare} label="图文问诊" onClick={() => toast.success("已发起图文问诊")} />
          <ActionTile icon={Video}         label="视频问诊" onClick={() => toast.success("视频问诊已预约")} />
          <ActionTile icon={Stethoscope}   label="MDT 申请" onClick={() => toast.success("MDT 申请已提交")} />
        </div>
      </Section>
    </>
  );
}

/* ===== 用药 Tab ===== */
function MedTab() {
  const meds = [
    { n: "二甲双胍",   d: "0.5g · 一日两次 · 餐后",  adh: 92, next: "今日 19:00", warn: "" },
    { n: "厄贝沙坦",   d: "150mg · 一日一次 · 早晨", adh: 88, next: "明日 07:00", warn: "" },
    { n: "阿托伐他汀", d: "20mg · 睡前",             adh: 76, next: "今晚 22:00", warn: "上周漏服 2 次" },
  ];
  return (
    <>
      <Section title="当前用药">
        <div className="space-y-2">
          {meds.map(m => (
            <div key={m.n} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{m.n}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${m.adh >= 90 ? "bg-success/10 text-success" : m.adh >= 80 ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" : "bg-danger/10 text-danger"}`}>依从 {m.adh}%</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{m.d}</div>
              <div className="flex items-center gap-3 mt-2 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />下次 {m.next}</span>
                {m.warn && <span className="text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" />{m.warn}</span>}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                <button onClick={() => toast.success(`已推送 ${m.n} 服药提醒`)} className="py-1.5 rounded-lg bg-secondary text-[11px]">推送提醒</button>
                <button onClick={() => toast.info("已询问钱药师")} className="py-1.5 rounded-lg bg-secondary text-[11px]">咨询药师</button>
                <button onClick={() => toast.success("已记录已服")} className="py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px]">已服</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="用药相互作用 / 警示">
        <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-[12px] leading-relaxed">
          <div className="flex items-center gap-1 text-[oklch(0.45_0.13_75)] font-medium mb-1"><AlertCircle className="w-3 h-3" />潜在风险</div>
          二甲双胍 + 厄贝沙坦 联合使用时需监测肾功能；阿托伐他汀夜间服用，避免与西柚同服。
        </div>
      </Section>
    </>
  );
}

/* 信息行 */
function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof MapPin }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/* ============================================================
 * 详情：聊天
 * ============================================================ */
/**
 * 沟通详情（单聊 / 群聊）
 * 文档要求：
 *  ① 文字 / 表情 / 文件 / 图片
 *  ② 群聊（服务终端人员 + 患者 + 家人）
 *  ③ 消息优先级标签 (P0/P1/常规)
 *  ④ 已读回执
 *  ⑤ 消息撤回（2 分钟内）
 *  ⑥ 语音输入 + 语音转文字；输入栏吸附底部
 *  ⑦ 底部快速：联系医师/护士/康复师 + 客户画像
 *  ⑧ 沟通结束生成 AI 摘要 → 录入档案 + 评分
 *  ⑨ 留言功能（患者档案【沟通】可见）
 */
type ChatMsg = {
  id: string;
  from: "me" | "them" | string; // string = group member name
  fromRole?: "self" | "patient" | "family" | "doctor" | "nurse";
  text: string;
  time: string;
  priority?: "P0" | "P1";
  read?: boolean;
  recalled?: boolean;
  attach?: { kind: "image" | "file" | "voice" | "card"; meta: string; transcript?: string };
};
function ChatScreen({ id, pop, nav }: { id: string; pop: () => void; nav: (s: Stack) => void }) {
  const c = customers.find(x => x.id === id) as Customer;
  // 紧急/异常客户默认为患者群（家人 + 护士 + 健管师 + 患者）
  const isGroup = c.layer === "urgent" || c.layer === "abnormal";
  const groupMembers = isGroup
    ? [
        { name: c.name, role: "patient" as const, label: "患者" },
        { name: c.gender === "男" ? "张敏" : "李强", role: "family" as const, label: "女儿" },
        { name: "林姐", role: "self" as const, label: "健管师" },
        { name: "周护士", role: "nurse" as const, label: "上门护士" },
        { name: "赵主任", role: "doctor" as const, label: "主管医师" },
      ]
    : [];

  const initial: ChatMsg[] = [
    { id: "m0", from: "them", fromRole: "patient", text: c.note, time: "09:12", read: true, priority: c.layer === "urgent" ? "P0" : c.layer === "abnormal" ? "P1" : undefined },
    { id: "m1", from: "me", fromRole: "self", text: "好的，我马上协助您，请放心。我已同步责任医师。", time: "09:14", read: true },
    ...(isGroup ? [
      { id: "m2", from: "赵主任", fromRole: "doctor" as const, text: "建议先复测，30 分钟后视频随访。", time: "09:16", read: true },
      { id: "m3", from: "周护士", fromRole: "nurse" as const, text: "我在路上，预计 10:00 上门。", time: "09:18", read: false },
    ] : []),
  ];
  const [msgs, setMsgs] = useState<ChatMsg[]>(initial);
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // 切换：键盘 / 按住说话
  const [showProfile, setShowProfile] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null); // 长按弹出操作的目标
  const [showLeave, setShowLeave] = useState(false);
  // 聊天结束摘要
  const [showEndPanel, setShowEndPanel] = useState(false);
  // 当前消息优先级（用户可在发送前选择）
  const [nextPrio, setNextPrio] = useState<"" | "P0" | "P1">("");

  const newId = () => `m${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const push = (m: Omit<ChatMsg, "id" | "time">) =>
    setMsgs(s => [...s, { ...m, id: newId(), time: "现在" }]);

  const send = () => {
    if (!input.trim()) return;
    push({ from: "me", fromRole: "self", text: input, priority: nextPrio || undefined, read: false });
    setInput(""); setNextPrio("");
    // 模拟对方已读 + 回复
    setTimeout(() => setMsgs(s => s.map(x => x.from === "me" ? { ...x, read: true } : x)), 1200);
    setTimeout(() => push({ from: "them", fromRole: "patient", text: "收到，谢谢健管师！", read: true }), 1500);
  };

  const recall = (mid: string) => {
    setMsgs(s => s.map(x => x.id === mid ? { ...x, recalled: true, text: "（消息已撤回）" } : x));
    setActionMsg(null); toast.success("已撤回");
  };
  const reply = (mid: string) => {
    const m = msgs.find(x => x.id === mid); if (!m) return;
    setInput(`「${m.text.slice(0, 12)}…」 `); setActionMsg(null);
  };

  // 快捷操作 — 12 项
  const quickActions: { label: string; icon: typeof BookOpen; color: string; onClick: () => void }[] = [
    { label: "话术库",   icon: BookOpen,    color: "bg-primary/10 text-primary",       onClick: () => { push({ from: "me", fromRole: "self", text: `${c.name}您好，今天感觉如何？昨晚的睡眠质量怎样呢？` }); setShowQuick(false); toast.success("话术已发送"); } },
    { label: "宣教",     icon: BookMarked,  color: "bg-success/10 text-success",       onClick: () => { push({ from: "me", fromRole: "self", text: "已为您推送宣教内容", attach: { kind: "card", meta: "《糖尿病饮食指南》" } }); setShowQuick(false); toast.success("宣教已推送"); } },
    { label: "服务包",   icon: Package,     color: "bg-warning/10 text-[oklch(0.5_0.13_75)]", onClick: () => { push({ from: "me", fromRole: "self", text: "服务包详情", attach: { kind: "card", meta: `${c.package} · 已使用 12/30` } }); setShowQuick(false); } },
    { label: "预约",     icon: Calendar,    color: "bg-primary/10 text-primary",       onClick: () => { push({ from: "me", fromRole: "self", text: "预约卡", attach: { kind: "card", meta: "周三 14:00 赵主任专家门诊" } }); setShowQuick(false); toast.success("预约卡已发送"); } },
    { label: "图片",     icon: ImageIcon,   color: "bg-secondary text-foreground",     onClick: () => { push({ from: "me", fromRole: "self", text: "[图片]", attach: { kind: "image", meta: "血糖监测截图.jpg" } }); setShowQuick(false); } },
    { label: "文件",     icon: Paperclip,   color: "bg-secondary text-foreground",     onClick: () => { push({ from: "me", fromRole: "self", text: "[文件]", attach: { kind: "file", meta: "4 月健康月报.pdf · 1.2MB" } }); setShowQuick(false); } },
    { label: "视频",     icon: Video,       color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.success(`正在邀请 ${c.name} 视频`); } },
    { label: "上门",     icon: HomeIcon,    color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.success("已发起上门服务工单"); } },
    { label: "调取报告", icon: FileText,    color: "bg-secondary text-foreground",     onClick: () => { push({ from: "me", fromRole: "self", text: "报告", attach: { kind: "card", meta: "4 月健康月报" } }); setShowQuick(false); } },
    { label: "MDT 邀请", icon: Stethoscope, color: "bg-secondary text-foreground",     onClick: () => { push({ from: "me", fromRole: "self", text: "已发起 MDT 会诊邀请", attach: { kind: "card", meta: "MDT-2026-032 · 5 人" } }); setShowQuick(false); } },
    { label: "送祝福",   icon: Gift,        color: "bg-secondary text-foreground",     onClick: () => { push({ from: "me", fromRole: "self", text: "🎂 祝您生日快乐，身体康健！" }); setShowQuick(false); } },
    { label: "留言",     icon: BookMarked,  color: "bg-primary/10 text-primary",       onClick: () => { setShowQuick(false); setShowLeave(true); } },
  ];

  // 表情池
  const emojis = ["😀","😊","🤝","👍","🙏","❤️","🎉","🌹","😴","🤔","💪","🥗","🩺","💊","☕️","🌞","🎂","✨","🆗","⚠️"];

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-2 py-2 flex items-center gap-1">
        <button onClick={pop} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => isGroup ? nav({ name: "groupInfo", id: c.id }) : setShowProfile(true)} className="flex-1 text-left px-1">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            {isGroup ? `${c.name} · 患者群` : c.name}
            {isGroup && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{groupMembers.length} 人</span>}
          </div>
          <div className="text-[10px] text-muted-foreground">{isGroup ? "患者 · 家人 · 健管师 · 护士 · 医师" : `${c.gender} · ${c.age}岁 · ${c.diseases.join("/")}`}</div>
        </button>
        <button onClick={() => setShowProfile(true)} className="p-1.5 rounded-lg active:bg-secondary"><User className="w-5 h-5" /></button>
        <button onClick={() => setShowEndPanel(true)} className="p-1.5 rounded-lg active:bg-secondary"><PhoneOff className="w-5 h-5 text-danger" /></button>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-secondary/40">
        {/* 群聊提醒条 */}
        {isGroup && (
          <div className="text-center text-[10px] text-muted-foreground bg-card/60 rounded-full py-1 px-3 inline-block mx-auto">
            <Users2 className="w-3 h-3 inline mr-1" />本群已加入家人 + 协同人员，发言所有人可见
          </div>
        )}
        {msgs.map(m => {
          const mine = m.from === "me";
          const sysMember = isGroup && !mine ? groupMembers.find(g => g.name === m.from) : null;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {sysMember && (
                <div className="text-[10px] text-muted-foreground ml-9 mb-0.5">{sysMember.name} · <span className="text-primary">{sysMember.label}</span></div>
              )}
              <div className="flex items-end gap-1.5 max-w-[80%]">
                {!mine && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    sysMember?.role === "doctor" ? "bg-primary text-primary-foreground" :
                    sysMember?.role === "nurse" ? "bg-success text-white" :
                    sysMember?.role === "family" ? "bg-warning text-white" :
                    "bg-secondary"
                  }`}>{(sysMember?.name ?? c.name)[0]}</div>
                )}
                <div className="flex flex-col">
                  {m.priority && !m.recalled && (
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded self-start mb-0.5 ${m.priority === "P0" ? "bg-danger text-white" : "bg-warning text-white"}`}>
                      {m.priority} 优先级
                    </div>
                  )}
                  <button
                    onContextMenu={e => { e.preventDefault(); if (mine && !m.recalled) setActionMsg(m.id); }}
                    onDoubleClick={() => { if (mine && !m.recalled) setActionMsg(m.id); }}
                    className={`text-left rounded-2xl px-3 py-2 text-sm ${
                      m.recalled ? "bg-muted text-muted-foreground italic" :
                      mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                    }`}>
                    <div>{m.text}</div>
                    {m.attach && !m.recalled && (
                      <div className={`mt-1.5 rounded-lg px-2 py-1.5 text-[11px] flex items-center gap-1.5 ${mine ? "bg-white/15" : "bg-secondary"}`}>
                        {m.attach.kind === "image" && <ImageIcon className="w-3 h-3" />}
                        {m.attach.kind === "file" && <Paperclip className="w-3 h-3" />}
                        {m.attach.kind === "voice" && <Volume2 className="w-3 h-3" />}
                        {m.attach.kind === "card" && <FileText className="w-3 h-3" />}
                        <span>{m.attach.meta}</span>
                      </div>
                    )}
                    {m.attach?.transcript && !m.recalled && (
                      <div className={`mt-1 text-[10px] ${mine ? "opacity-90" : "text-muted-foreground"}`}>转写：{m.attach.transcript}</div>
                    )}
                  </button>
                  <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${mine ? "self-end" : "self-start"} ${mine ? "text-muted-foreground" : "text-muted-foreground"}`}>
                    <span>{m.time}</span>
                    {mine && !m.recalled && (m.read ? <CheckCheck className="w-3 h-3 text-primary" /> : <CheckCircle2 className="w-3 h-3 text-muted-foreground" />)}
                    {mine && !m.recalled && <span className="text-[9px]">{m.read ? "已读" : "送达"}</span>}
                  </div>
                  {/* 操作菜单 */}
                  {actionMsg === m.id && (
                    <div className="mt-1 flex gap-1 self-end">
                      <button onClick={() => reply(m.id)} className="text-[10px] px-2 py-1 rounded bg-card border border-border flex items-center gap-1"><Reply className="w-3 h-3" />引用</button>
                      <button onClick={() => recall(m.id)} className="text-[10px] px-2 py-1 rounded bg-danger/10 text-danger flex items-center gap-1"><RotateCcw className="w-3 h-3" />撤回</button>
                      <button onClick={() => setActionMsg(null)} className="text-[10px] px-2 py-1 rounded bg-secondary">取消</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* 提示：长按 / 双击我方消息可撤回 / 引用 */}
        <div className="text-center text-[10px] text-muted-foreground/70">长按或双击我方消息可撤回 / 引用</div>
      </div>

      {/* 横滑快捷入口（永久可见 · 联系医师 / 护士 / 康复师 / 客户画像） */}
      <div className="border-t border-border bg-card px-2 py-1.5 flex gap-2 overflow-x-auto">
        {[
          { l: "客户画像", i: User,        onClick: () => setShowProfile(true) },
          { l: "联系医师", i: Stethoscope, onClick: () => { toast.success("已发起与赵主任的对话"); push({ from: "赵主任", fromRole: "doctor", text: "我在，请讲。" }); } },
          { l: "联系护士", i: HeartHandshake, onClick: () => { toast.success("已发起与周护士的对话"); push({ from: "周护士", fromRole: "nurse", text: "我可在 30 分钟内上门。" }); } },
          { l: "联系康复", i: Activity,    onClick: () => { toast.success("已发起与周教练的对话"); push({ from: "周教练", fromRole: "nurse", text: "今晚为您安排 20 分钟拉伸。" }); } },
          { l: "选人协同", i: UserPlus,    onClick: () => setShowRoster(true) },
          { l: "留言",     i: BookMarked,  onClick: () => setShowLeave(true) },
          { l: "结束沟通", i: PhoneOff,    onClick: () => setShowEndPanel(true) },
        ].map(a => {
          const Icon = a.i;
          return (
            <button key={a.l} onClick={a.onClick}
              className="shrink-0 flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-lg active:bg-secondary">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div>
              <span className="text-[10px] text-muted-foreground">{a.l}</span>
            </button>
          );
        })}
      </div>

      {/* 输入栏 — 吸附底部 */}
      <div className="border-t border-border bg-card p-2 flex items-end gap-1.5">
        <button onClick={() => setVoiceMode(v => !v)} className="p-2 rounded-lg active:bg-secondary">
          {voiceMode ? <MessageSquare className="w-5 h-5 text-muted-foreground" /> : <Mic className="w-5 h-5 text-muted-foreground" />}
        </button>
        {voiceMode ? (
          <button
            onPointerDown={() => { setRecording(true); toast.info("松开发送 · 上滑取消"); }}
            onPointerUp={() => {
              setRecording(false);
              push({ from: "me", fromRole: "self", text: "[语音]", attach: { kind: "voice", meta: "0:08", transcript: "我今天血糖偏高，是不是需要调整剂量？" } });
              toast.success("语音已发送（自动转文字）");
            }}
            className={`flex-1 py-2 rounded-full text-sm ${recording ? "bg-danger text-white" : "bg-secondary"}`}>
            {recording ? "● 录音中…松开发送" : "按住说话 · 自动转文字"}
          </button>
        ) : (
          <div className="flex-1 relative">
            {nextPrio && (
              <span className={`absolute -top-5 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${nextPrio === "P0" ? "bg-danger text-white" : "bg-warning text-white"}`}>
                {nextPrio} <button onClick={() => setNextPrio("")} className="ml-1">×</button>
              </span>
            )}
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              className="w-full px-3 py-2 text-sm rounded-full bg-secondary focus:outline-none" placeholder="输入消息…" />
          </div>
        )}
        <button onClick={() => { setShowEmoji(s => !s); setShowQuick(false); }} className={`p-2 rounded-lg active:bg-secondary ${showEmoji ? "bg-secondary" : ""}`}>
          <Smile className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => setNextPrio(p => p === "P0" ? "P1" : p === "P1" ? "" : "P0")} className="p-2 rounded-lg active:bg-secondary">
          <AlertTriangle className={`w-5 h-5 ${nextPrio === "P0" ? "text-danger" : nextPrio === "P1" ? "text-[oklch(0.5_0.13_75)]" : "text-muted-foreground"}`} />
        </button>
        {input.trim() ? (
          <button onClick={send} className="p-2 rounded-full bg-primary text-primary-foreground active:scale-95"><Send className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => { setShowQuick(s => !s); setShowEmoji(false); }} className={`p-2 rounded-lg active:bg-secondary ${showQuick ? "bg-secondary" : ""}`}>
            {showQuick ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
          </button>
        )}
      </div>

      {/* 表情面板 */}
      {showEmoji && (
        <div className="border-t border-border bg-card p-3 grid grid-cols-10 gap-1.5">
          {emojis.map(e => (
            <button key={e} onClick={() => { setInput(s => s + e); }} className="text-xl active:scale-110">{e}</button>
          ))}
        </div>
      )}

      {/* 快捷操作面板 12 项 */}
      {showQuick && (
        <div className="border-t border-border bg-card p-3 grid grid-cols-4 gap-3">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.onClick} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-foreground">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* —— 弹层：客户画像 —— */}
      {showProfile && <ProfilePeek c={c} onClose={() => setShowProfile(false)} />}
      {/* —— 弹层：选人协同 —— */}
      {showRoster && <RosterPicker onPick={(p) => { push({ from: "me", fromRole: "self", text: `已邀请「${p}」加入本次沟通` }); setShowRoster(false); toast.success(`${p} 已加入`); }} onClose={() => setShowRoster(false)} />}
      {/* —— 弹层：留言 —— */}
      {showLeave && <LeaveMessage c={c} onClose={() => setShowLeave(false)} onDone={(text) => { push({ from: "me", fromRole: "self", text: `[留言] ${text}` }); toast.success("留言已发送，同步至档案"); setShowLeave(false); }} />}
      {/* —— 弹层：结束沟通 → AI 摘要 —— */}
      {showEndPanel && <EndChatPanel c={c} kind="text" onClose={() => setShowEndPanel(false)} onConfirm={() => { setShowEndPanel(false); nav({ name: "callSummary", id: c.id, kind: "text" }); }} />}
    </div>
  );
}

/* ---------- 客户画像速览（弹窗） ---------- */
function ProfilePeek({ c, onClose }: { c: Customer; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl p-5 max-h-[80%] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-medium">{c.name[0]}</div>
          <div className="flex-1">
            <div className="font-semibold">{c.name} <span className="text-xs text-muted-foreground">{c.gender}·{c.age}</span></div>
            <div className="text-xs text-muted-foreground">{c.diseases.join(" / ")} · {c.package}</div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${layerMeta[c.layer].dot} text-white`}>{layerMeta[c.layer].label}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="rounded-lg bg-secondary p-2"><div className="text-[10px] text-muted-foreground">温度</div><div className="text-sm font-semibold">82</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-[10px] text-muted-foreground">血压</div><div className="text-sm font-semibold">{c.metrics.bp ?? "—"}</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-[10px] text-muted-foreground">血糖</div><div className="text-sm font-semibold">{c.metrics.bg ?? "—"}</div></div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground leading-relaxed">{c.note}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => { onClose(); placeCall(c.name); }} className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm">立即电话</button>
          <button onClick={onClose} className="py-2.5 rounded-lg bg-secondary text-sm">关闭</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 协同人员选择 ---------- */
function RosterPicker({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const list = [
    { n: "赵主任",  r: "主管医师", on: true },
    { n: "钱药师",  r: "药师",     on: true },
    { n: "孙营养师", r: "营养师",   on: false },
    { n: "周教练",  r: "康复师",   on: true },
    { n: "周护士",  r: "上门护士", on: true },
    { n: "李主管",  r: "团队主管", on: false },
  ];
  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl max-h-[70%] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-base font-semibold">选择协同人员</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto divide-y divide-border">
          {list.map(p => (
            <button key={p.n} onClick={() => onPick(p.n)} className="w-full px-4 py-3 flex items-center gap-3 active:bg-secondary text-left">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">{p.n[0]}</div>
                {p.on && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.n}</div>
                <div className="text-[11px] text-muted-foreground">{p.r} · {p.on ? "在线" : "离线"}</div>
              </div>
              <UserPlus className="w-4 h-4 text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 留言（落档） ---------- */
function LeaveMessage({ c, onClose, onDone }: { c: Customer; onClose: () => void; onDone: (text: string) => void }) {
  const [v, setV] = useState("亲爱的" + c.name + "，以下是今日健管师为您留下的关怀提醒：");
  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-semibold flex items-center gap-1.5"><BookMarked className="w-4 h-4 text-primary" />留言给患者</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <textarea value={v} onChange={e => setV(e.target.value)}
          rows={5} className="w-full p-3 rounded-lg bg-secondary text-sm focus:outline-none resize-none" />
        <div className="text-[11px] text-muted-foreground mt-2">留言会同步出现在患者档案 · 沟通模块，并附时间戳。</div>
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm">取消</button>
          <button onClick={() => onDone(v)} className="flex-[2] py-2.5 rounded-lg bg-primary text-primary-foreground text-sm">发送留言</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 结束沟通 → 引导生成 AI 摘要 ---------- */
function EndChatPanel({ c, kind, onClose, onConfirm }: { c: Customer; kind: "phone" | "voice" | "text"; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-semibold flex items-center gap-1.5"><PhoneOff className="w-4 h-4 text-danger" />结束本次沟通</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          AI 将生成本次{kind === "phone" ? "电话" : kind === "voice" ? "语音" : "文字"}沟通摘要、情绪识别、风险点、下一步行动建议，并请您确认后录入【{c.name}】的档案，同时生成本次沟通评分。
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-secondary p-2"><div className="text-[10px] text-muted-foreground">时长</div><div className="text-sm font-semibold">12'04"</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-[10px] text-muted-foreground">情绪</div><div className="text-sm font-semibold text-success">平稳</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-[10px] text-muted-foreground">风险</div><div className="text-sm font-semibold text-[oklch(0.5_0.13_75)]">中</div></div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm">稍后</button>
          <button onClick={onConfirm}
            className="flex-[2] py-2.5 rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground text-sm">生成 AI 摘要 →</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 通知中心
 * ============================================================ */
function Notifications({ pop }: { pop: () => void }) {
  const items = [
    { t: "P0 异常预警", d: "张老爷子凌晨低血糖 3.8 mmol/L", time: "08:12", color: "bg-danger" },
    { t: "医师指派",   d: "赵主任指派：王奶奶 MDT 准备",   time: "07:50", color: "bg-primary" },
    { t: "AI 触发",   d: "刘伯断签 12 天，建议温柔挽回",  time: "昨天",  color: "bg-warning" },
    { t: "系统",      d: "本月 KPI 已更新，绩效 96 分",   time: "昨天",  color: "bg-success" },
  ];
  return (
    <div>
      <PageHeader title="通知中心" pop={pop}
        right={<button onClick={() => toast.success("已全部标记已读")} className="text-xs text-primary px-2">全部已读</button>} />
      <div className="divide-y divide-border bg-card">
        {items.map((n, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full ${n.color}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{n.t}</span>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{n.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * 搜索页
 * ============================================================ */
function SearchScreen({ pop, push }: { pop: () => void; push: (s: Stack) => void }) {
  const [q, setQ] = useState("");
  const results = q ? customers.filter(c => c.name.includes(q) || c.diseases.some(d => d.includes(q))) : [];
  return (
    <div>
      <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-2 py-2 flex items-center gap-2">
        <button onClick={pop} className="p-1.5 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="搜索客户、病种、任务"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary focus:outline-none" />
        </div>
      </div>
      <div className="p-4">
        {!q && (
          <>
            <div className="text-xs text-muted-foreground mb-2">最近搜索</div>
            <div className="flex flex-wrap gap-2">
              {["张老爷子", "糖尿病", "高血压", "MDT"].map(s => (
                <button key={s} onClick={() => setQ(s)} className="text-xs px-3 py-1.5 rounded-full bg-secondary">{s}</button>
              ))}
            </div>
          </>
        )}
        {q && results.length > 0 && (
          <div className="space-y-2">
            {results.map(c => (
              <button key={c.id} onClick={() => push({ name: "customer", id: c.id })}
                className="w-full p-3 rounded-xl bg-card border border-border flex items-center gap-3 text-left active:bg-secondary">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm">{c.name[0]}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.diseases.join(" / ")}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {q && results.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">未找到结果</div>}
      </div>
    </div>
  );
}

/* ============================================================
 * 新建客户
 * ============================================================ */
function AddCustomer({ pop }: { pop: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", phone: "", age: "", gender: "女", idNo: "", address: "",
    emergency: "", emergencyPhone: "", pkg: "银卡",
    diseases: [] as string[], allergies: "", history: "", meds: "",
    note: "",
  });
  const [files, setFiles] = useState<{ kind: string; name: string; size: string }[]>([]);

  const diseaseOpts = ["糖尿病", "高血压", "冠心病", "肿瘤", "慢阻肺", "脑卒中", "肾病", "甲状腺", "失眠", "焦虑"];
  const docTypes = [
    { k: "病历",   icon: FileText,     hint: "门诊/住院病历首页、出院小结" },
    { k: "化验单", icon: Activity,     hint: "血常规、生化、糖化等" },
    { k: "入院单", icon: ClipboardList,hint: "入院记录、入院评估单" },
    { k: "检查单", icon: Stethoscope,  hint: "影像、超声、心电、内镜等" },
  ];

  const addMock = (kind: string) => {
    const samples: Record<string, string> = {
      "病历": "出院小结_2026-05.pdf",
      "化验单": "糖化血红蛋白_2026-05-20.jpg",
      "入院单": "入院记录_2026-04-12.pdf",
      "检查单": "胸部CT报告_2026-05-18.pdf",
    };
    setFiles(f => [...f, { kind, name: samples[kind] ?? `${kind}.pdf`, size: `${(Math.random()*2+0.4).toFixed(1)}MB` }]);
    toast.success(`已上传${kind}，AI 正在结构化解析…`);
  };

  const toggleDisease = (d: string) =>
    setForm(f => ({ ...f, diseases: f.diseases.includes(d) ? f.diseases.filter(x => x !== d) : [...f.diseases, d] }));

  const submit = () => {
    if (!form.name) return toast.error("请填写姓名");
    if (!form.phone) return toast.error("请填写手机号");
    toast.success(`已为 ${form.name} 建档，AI 正在合并病历/化验单生成健康档案`);
    pop();
  };

  return (
    <div className="pb-24">
      <PageHeader title="新建客户 · 手动建档" pop={pop} />

      {/* 步骤指示 */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          {[
            { n: 1, l: "基本信息" },
            { n: 2, l: "病历资料" },
            { n: 3, l: "健康档案" },
            { n: 4, l: "服务包" },
          ].map((s, i) => (
            <div key={s.n} className="flex-1 flex items-center gap-2">
              <button onClick={() => setStep(s.n)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] ${step === s.n ? "bg-primary text-primary-foreground" : step > s.n ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step >= s.n ? "bg-primary-foreground/30" : "bg-background"}`}>{s.n}</span>
                {s.l}
              </button>
              {i < 3 && <span className={`h-px flex-1 ${step > s.n ? "bg-primary/40" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {step === 1 && (
          <>
            <Field label="姓名"    value={form.name}  onChange={v => setForm({ ...form, name: v })}  placeholder="请输入真实姓名" />
            <Field label="手机号"  value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="11 位手机号" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="年龄" value={form.age} onChange={v => setForm({ ...form, age: v })} placeholder="如 68" />
              <div className="rounded-xl bg-card border border-border p-3">
                <div className="text-xs text-muted-foreground mb-2">性别</div>
                <div className="flex gap-2">
                  {["女", "男"].map(g => (
                    <button key={g} onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-1.5 rounded-lg text-sm ${form.gender === g ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <Field label="身份证号" value={form.idNo}    onChange={v => setForm({ ...form, idNo: v })}    placeholder="选填，用于实名" />
            <Field label="联系地址" value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="省市区 + 详细地址" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="紧急联系人"     value={form.emergency}      onChange={v => setForm({ ...form, emergency: v })}      placeholder="姓名/关系" />
              <Field label="紧急联系人电话" value={form.emergencyPhone} onChange={v => setForm({ ...form, emergencyPhone: v })} placeholder="11 位手机号" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-xl bg-primary/8 border border-primary/20 p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                上传 <b className="text-foreground">病历 / 化验单 / 入院单 / 检查单</b>，AI 将自动 OCR 识别并提取关键指标（如糖化、血压、肿瘤分期），同步生成结构化健康档案。
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {docTypes.map(d => {
                const Icon = d.icon;
                const cnt = files.filter(f => f.kind === d.k).length;
                return (
                  <button key={d.k} onClick={() => addMock(d.k)}
                    className="rounded-xl bg-card border border-dashed border-border p-3 text-left active:scale-[0.98] transition">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      {cnt > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">{cnt}</span>}
                    </div>
                    <div className="text-sm font-medium mt-2">{d.k}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{d.hint}</div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-primary"><Plus className="w-3 h-3" />添加</div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toast.info("调用相机拍照…")} className="flex-1 py-2.5 rounded-xl bg-secondary text-xs flex items-center justify-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />拍照上传</button>
              <button onClick={() => toast.info("从相册选择…")}   className="flex-1 py-2.5 rounded-xl bg-secondary text-xs flex items-center justify-center gap-1.5"><Paperclip className="w-3.5 h-3.5" />从文件</button>
            </div>

            {files.length > 0 && (
              <div className="rounded-xl bg-card border border-border divide-y divide-border">
                {files.map((f, i) => (
                  <div key={i} className="p-2.5 flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground">{f.kind} · {f.size} · <span className="text-primary">AI 已识别</span></div>
                    </div>
                    <button onClick={() => setFiles(arr => arr.filter((_, j) => j !== i))} className="p-1 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="text-xs text-muted-foreground mb-2">主要病种（可多选）</div>
              <div className="flex flex-wrap gap-1.5">
                {diseaseOpts.map(d => (
                  <button key={d} onClick={() => toggleDisease(d)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border ${form.diseases.includes(d) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-transparent"}`}>{d}</button>
                ))}
              </div>
              {files.length > 0 && (
                <div className="mt-2 text-[10px] text-primary flex items-center gap-1"><Sparkles className="w-3 h-3" />AI 已根据病历预填上述病种，请确认</div>
              )}
            </div>
            <TextArea label="过敏史" value={form.allergies} onChange={v => setForm({ ...form, allergies: v })} placeholder="如：青霉素、海鲜，无则填无" />
            <TextArea label="既往史" value={form.history}   onChange={v => setForm({ ...form, history: v })}   placeholder="既往手术、家族遗传等" />
            <TextArea label="当前用药" value={form.meds}    onChange={v => setForm({ ...form, meds: v })}     placeholder="药品名 / 剂量 / 频次" />
          </>
        )}

        {step === 4 && (
          <>
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="text-xs text-muted-foreground mb-2">服务包</div>
              <div className="grid grid-cols-3 gap-2">
                {["体验包", "银卡", "金卡"].map(p => (
                  <button key={p} onClick={() => setForm({ ...form, pkg: p })}
                    className={`py-2.5 rounded-lg text-sm ${form.pkg === p ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{p}</button>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {form.pkg === "体验包" && "14 天免费试用，含 2 次电话随访"}
                {form.pkg === "银卡"   && "12 个月 · 月度随访 + MDT 1 次"}
                {form.pkg === "金卡"   && "12 个月 · 周度随访 + MDT 4 次 + 24h 在线"}
              </div>
            </div>
            <TextArea label="健管师备注" value={form.note} onChange={v => setForm({ ...form, note: v })} placeholder="性格、沟通偏好、家庭背景等" />

            {/* 摘要 */}
            <div className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground p-3">
              <div className="text-[11px] opacity-90">建档摘要</div>
              <div className="text-sm font-medium mt-1">{form.name || "（未填姓名）"} · {form.gender} · {form.age || "?"}岁 · {form.pkg}</div>
              <div className="text-[11px] opacity-90 mt-1">病种：{form.diseases.join("、") || "—"}</div>
              <div className="text-[11px] opacity-90">已上传 {files.length} 份病历资料</div>
            </div>
          </>
        )}
      </div>

      {/* 底部操作 */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[390px] px-4 py-3 bg-background/95 backdrop-blur border-t border-border flex gap-2">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl bg-secondary text-sm">上一步</button>
        ) : (
          <button onClick={pop} className="flex-1 py-3 rounded-xl bg-secondary text-sm">取消</button>
        )}
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} className="flex-[1.5] py-3 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-medium">下一步</button>
        ) : (
          <button onClick={submit} className="flex-[1.5] py-3 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-medium">完成建档</button>
        )}
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={3}
        className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/60" />
    </div>
  );
}

/* ============================================================
 * 我的关怀效果
 * ============================================================ */
function CareEffect({ pop }: { pop: () => void }) {
  const stats = [
    { l: "客户满意度", v: "4.8/5", t: "近 30 天 412 次评价",   icon: Star },
    { l: "随访达成率", v: "93%",   t: "目标 90% · 行业 78%",   icon: TrendingUp },
    { l: "续约率",     v: "68%",   t: "金卡 81% · 银卡 62%",   icon: ShieldCheck },
    { l: "MDT 协同",   v: "12 次", t: "本月 · 完成 9 次",       icon: Stethoscope },
  ];
  return (
    <div>
      <PageHeader title="我的关怀效果" pop={pop} />
      <div className="p-4 space-y-4">
        <div className="rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-4">
          <div className="text-xs opacity-90">综合关怀指数</div>
          <div className="text-3xl font-semibold mt-1">96<span className="text-base opacity-80"> / 100</span></div>
          <div className="text-[11px] opacity-90 mt-1">较上月 ↑ 4 分，全公司排名 Top 5%</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.l} className="rounded-xl bg-card border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.l}</span>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-xl font-semibold mt-1">{s.v}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.t}</div>
              </div>
            );
          })}
        </div>
        <Section title="客户分层趋势（近 30 天）">
          {(["urgent", "abnormal", "stable", "new", "churnRisk"] as const).map(k => {
            const v = { urgent: 5, abnormal: 18, stable: 70, new: 4, churnRisk: 3 }[k];
            return (
              <div key={k} className="py-1.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{layerMeta[k].label}</span><span className="text-muted-foreground">{v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full ${layerMeta[k].dot}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </Section>
      </div>
    </div>
  );
}

/* ============================================================
 * 我的任务统计
 * ============================================================ */
function TaskStats({ pop }: { pop: () => void }) {
  const types = ["异常处理", "主动关怀", "复诊提醒", "服药跟进", "MDT 会诊", "报告审阅"];
  const data = [28, 84, 36, 52, 12, 18];
  const max = Math.max(...data);
  return (
    <div>
      <PageHeader title="我的任务统计" pop={pop} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <KpiCard label="累计完成" value="412" sub="本月" tone="primary" icon={Award} />
          <KpiCard label="按时率"   value="96%" sub="SLA"  tone="success" icon={ShieldCheck} />
          <KpiCard label="P0 处置"  value="11"  sub="例"   tone="danger"  icon={AlertTriangle} />
        </div>
        <Section title="按类型分布（本月）">
          <div className="space-y-2.5">
            {types.map((t, i) => (
              <div key={t}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{t}</span><span className="text-muted-foreground">{data[i]} 件</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${(data[i]/max)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="近 7 天完成趋势">
          <div className="flex items-end justify-between h-28 gap-1.5">
            {[12, 18, 14, 22, 19, 25, 21].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-[image:var(--gradient-primary)]" style={{ height: `${(v/25)*100}%` }} />
                <span className="text-[10px] text-muted-foreground">D{i+1}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ============================================================
 * 话术模板库
 * ============================================================ */
function ScriptLibrary({ pop, push }: { pop: () => void; push?: (s: Stack) => void }) {
  const cats = ["全部", "异常处置", "主动关怀", "复诊提醒", "用药提醒", "挽回话术"];
  const [cat, setCat] = useState(0);
  const scripts = [
    { c: "异常处置", t: "凌晨低血糖关怀", body: "{客户}您好，凌晨监测到血糖偏低（{value}），现在感觉如何？建议立即口服 15g 葡萄糖并复测..." },
    { c: "主动关怀", t: "化疗后第 N 天关怀", body: "{客户}今天感觉怎样？昨天的止吐药效果如何？如有恶心可少食多餐..." },
    { c: "挽回话术", t: "断签温柔挽回", body: "{客户}好久没和您聊聊啦～想问问最近身体怎么样？您的健康我一直挂在心上..." },
    { c: "复诊提醒", t: "高血压门诊复诊", body: "{客户}您好，按照赵主任方案，明天 {time} 已为您预约复诊号，请提前 15 分钟到院..." },
    { c: "用药提醒", t: "二甲双胍服药提醒", body: "{客户}饭后 30 分钟服用二甲双胍，喝杯温水，避免漏服哦～" },
  ];
  const filtered = cat === 0 ? scripts : scripts.filter(s => s.c === cats[cat]);
  return (
    <div>
      <PageHeader title="话术模板库" pop={pop}
        right={<button onClick={() => push ? push({ name: "newScript" }) : toast.info("已打开新建")} className="p-1.5"><Plus className="w-5 h-5" /></button>} />
      <div className="px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {cats.map((c, i) => (
            <Chip key={c} active={cat === i} onClick={() => setCat(i)}>{c}</Chip>
          ))}
        </div>
      </div>
      <div className="p-4 pt-1 space-y-2">
        {filtered.map((s, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s.c}</span>
              <span className="text-sm font-medium">{s.t}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { navigator.clipboard?.writeText(s.body); toast.success("已复制到剪贴板"); }}
                className="flex-1 py-2 rounded-lg bg-secondary text-xs flex items-center justify-center gap-1.5 active:bg-muted">
                <Copy className="w-3.5 h-3.5" /> 复制
              </button>
              <button onClick={() => toast.success("已发送至当前客户")} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs flex items-center justify-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> 发送
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * MDT 会诊记录
 * ============================================================ */
function MdtRecords({ pop }: { pop: () => void }) {
  const records = [
    { id: "MDT-2026-031", customer: "王奶奶", date: "今天 16:00", status: "进行中",  team: ["赵主任", "钱药师", "孙老师", "我"], topic: "化疗反应处置 + 营养调整" },
    { id: "MDT-2026-030", customer: "张老爷子", date: "昨天 10:30", status: "已结束", team: ["赵主任", "钱药师", "我"], topic: "低血糖应急方案优化" },
    { id: "MDT-2026-029", customer: "周阿姨",   date: "5/10 14:00", status: "已结束", team: ["赵主任", "周教练", "我"], topic: "高血压 + 骨质疏松联合管理" },
    { id: "MDT-2026-028", customer: "李叔",     date: "5/08 09:00", status: "已结束", team: ["孙老师", "我"],            topic: "出差期饮食方案" },
  ];
  return (
    <div>
      <PageHeader title="MDT 会诊记录" pop={pop}
        right={<button onClick={() => toast.success("已发起新的 MDT 申请")} className="p-1.5"><Plus className="w-5 h-5" /></button>} />
      <div className="p-4 space-y-2">
        {records.map(r => (
          <div key={r.id} className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{r.id}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                r.status === "进行中" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}>{r.status}</span>
            </div>
            <div className="mt-1 text-sm font-medium">{r.customer} · {r.topic}</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{r.date}</div>
            <div className="mt-2 flex items-center gap-1.5">
              {r.team.map(m => (
                <div key={m} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px]">{m[0]}</div>
              ))}
              <span className="ml-1 text-[10px] text-muted-foreground">{r.team.length} 人参与</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button onClick={() => toast.info("打开会诊纪要")} className="py-1.5 text-xs rounded-lg bg-secondary flex items-center justify-center gap-1"><FileText className="w-3 h-3" />纪要</button>
              <button onClick={() => toast.success("正在加入视频")} className="py-1.5 text-xs rounded-lg bg-secondary flex items-center justify-center gap-1"><Video className="w-3 h-3" />视频</button>
              <button onClick={() => toast.info("已查看处置清单")} className="py-1.5 text-xs rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-1"><ClipboardList className="w-3 h-3" />处置</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * 设置 / 个人资料
 * ============================================================ */
function SettingsScreen({ pop }: { pop: () => void }) {
  const [push, setPush] = useState(true);
  const [biometric, setBiometric] = useState(false);
  return (
    <div>
      <PageHeader title="设置" pop={pop} />
      <div className="p-4 space-y-3">
        <ToggleRow label="消息推送"   checked={push}      onChange={v => { setPush(v); toast.success(v ? "已开启" : "已关闭"); }} />
        <ToggleRow label="生物识别登录" checked={biometric} onChange={v => { setBiometric(v); toast.success(v ? "已开启 Face ID" : "已关闭"); }} />
        <RowBtn label="清除缓存" onClick={() => toast.success("缓存已清理 (12.3MB)")} />
        <RowBtn label="关于"     onClick={() => toast.info("蜻蜓康健家 健管师端 v1.0.0")} />
      </div>
    </div>
  );
}

function ProfileEdit({ pop }: { pop: () => void }) {
  return (
    <div>
      <PageHeader title="个人资料" pop={pop} />
      <div className="p-4 space-y-3">
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center text-2xl font-medium">林</div>
          <button onClick={() => toast.info("打开相册")} className="mt-2 text-xs text-primary">更换头像</button>
        </div>
        <Field label="姓名" value="林健管师" onChange={() => {}} />
        <Field label="工号" value="HM01" onChange={() => {}} />
        <Field label="等级" value="L4 健管主任" onChange={() => {}} />
        <Field label="手机" value="138****8888" onChange={() => {}} />
        <button onClick={() => { toast.success("资料已保存"); pop(); }}
          className="w-full py-3.5 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-medium">
          保存
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * 通用小组件
 * ============================================================ */
function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition ${
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground active:bg-muted"
      }`}>{children}</button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="text-sm font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

/** 手风琴样式分组 — 客户档案中【驿站/报告/问诊】等多分类内容使用 */
function AccordionSection({
  title, count, defaultOpen, children,
}: { title: string; count?: number | string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center justify-between active:bg-secondary/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {count !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{count}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-1">{children}</div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ActionTile({ icon: Icon, label, onClick, dark }: { icon: typeof Phone; label: string; onClick: () => void; dark?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl active:scale-95 transition ${
        dark ? "bg-white/15 text-primary-foreground" : "bg-secondary text-foreground"
      }`}>
      <Icon className="w-4 h-4" />
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function KpiCard({ label, value, sub, tone, icon: Icon }: {
  label: string; value: string; sub: string;
  tone: "primary" | "success" | "danger"; icon: typeof Award;
}) {
  const toneCls = { primary: "text-primary", success: "text-success", danger: "text-danger" }[tone];
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${toneCls}`} />
      </div>
      <div className="text-lg font-semibold mt-1">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block rounded-xl bg-card border border-border px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-0.5 bg-transparent text-sm focus:outline-none" />
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center">
      <span className="flex-1 text-sm">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

function RowBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-xl bg-card border border-border px-4 py-3.5 flex items-center text-sm active:bg-secondary">
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

// 仅做类型对齐占位（避免 lint 未使用警告）
void MoreHorizontal; void Heart; void Smile; void Clipboard; void Hash; void AtSign; void MicOff;

/* ============================================================
 * 群聊信息（患者群：患者 + 家人 + 健管师 + 护士 + 医师）
 * ============================================================ */
function GroupInfo({ id, pop, push }: { id: string; pop: () => void; push: (s: Stack) => void }) {
  const c = customers.find(x => x.id === id) as Customer;
  const members = [
    { n: c.name,   r: "患者",     t: "patient" },
    { n: c.gender === "男" ? "张敏" : "李强", r: "女儿（紧急联系人）", t: "family" },
    { n: "李太太",  r: "配偶",     t: "family" },
    { n: "林姐",    r: "健管师（我）", t: "self" },
    { n: "周护士",  r: "上门护士", t: "nurse" },
    { n: "赵主任",  r: "主管医师", t: "doctor" },
  ];
  return (
    <div>
      <PageHeader title={`${c.name} · 患者群`} pop={pop} />
      <div className="p-4 space-y-3">
        <Section title={`群成员（${members.length} 人）`}>
          <div className="grid grid-cols-4 gap-3">
            {members.map(m => (
              <button key={m.n} onClick={() => toast.info(`${m.n} · ${m.r}`)} className="flex flex-col items-center gap-1 active:scale-95">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                  m.t === "patient" ? "bg-primary text-primary-foreground" :
                  m.t === "doctor"  ? "bg-success/20 text-success" :
                  m.t === "nurse"   ? "bg-warning/20 text-[oklch(0.5_0.13_75)]" :
                  m.t === "family"  ? "bg-secondary" : "bg-primary/10 text-primary"
                }`}>{m.n[0]}</div>
                <span className="text-[10px] truncate w-full text-center">{m.n}</span>
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">{m.r}</span>
              </button>
            ))}
            <button onClick={() => push({ name: "contactRoster" })} className="flex flex-col items-center gap-1 active:scale-95">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center"><Plus className="w-4 h-4 text-muted-foreground" /></div>
              <span className="text-[10px] text-muted-foreground">添加</span>
            </button>
          </div>
        </Section>
        <Section title="群权限">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between"><span>家人可见健康数据</span><span className="text-success">已授权</span></div>
            <div className="flex items-center justify-between"><span>家人可发起求助</span><span className="text-success">允许</span></div>
            <div className="flex items-center justify-between"><span>医师指令优先推送</span><span className="text-primary">开启</span></div>
          </div>
        </Section>
        <button onClick={() => { toast.success("已退出群聊（演示）"); pop(); }}
          className="w-full py-3 rounded-xl bg-danger/10 text-danger text-sm font-medium">退出群聊</button>
      </div>
    </div>
  );
}

/* ============================================================
 * 沟通结束 AI 摘要（电话 / 语音 / 文字均复用）
 * - 健康师可编辑后确认录入档案
 * - 自动生成沟通评分
 * ============================================================ */
function CallSummary({ id, kind, pop }: { id: string; kind: "phone" | "voice" | "text"; pop: () => void }) {
  const c = customers.find(x => x.id === id) as Customer;
  const [summary, setSummary] = useState(
    `本次${kind === "phone" ? "电话" : kind === "voice" ? "语音" : "文字"}沟通时长 12 分钟。患者${c.name}主诉近日睡眠浅、晨起血压偏高（${c.metrics.bp ?? "146/92"}）。情绪稳定，对当前用药接受度良好。已提醒减盐 + 晚饭后散步 30 分钟，并预约周三 14:00 复诊。`
  );
  const [tags, setTags] = useState(["睡眠差", "血压偏高", "依从性良好"]);
  const [score, setScore] = useState(88);
  const risks = [
    { l: "高血压控制不达标",   c: "danger" as const },
    { l: "睡眠质量需观察 7 天", c: "warning" as const },
  ];
  const actions = [
    "推送《晚间放松练习》音频",
    "周三 14:00 提前 1 小时电话提醒复诊",
    "联动孙营养师调整低钠晚餐方案",
  ];
  return (
    <div>
      <PageHeader title="AI 沟通摘要" pop={pop} />
      <div className="p-4 space-y-3">
        <div className="rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-4">
          <div className="text-xs opacity-90 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI 已为本次沟通生成摘要</div>
          <div className="mt-1 text-sm">{c.name} · {kind === "phone" ? "电话" : kind === "voice" ? "语音" : "文字"} · {new Date().toLocaleString("zh-CN")}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-lg p-2 text-center"><div className="text-[10px] opacity-80">沟通评分</div><div className="text-xl font-semibold">{score}</div></div>
            <div className="bg-white/15 rounded-lg p-2 text-center"><div className="text-[10px] opacity-80">情绪</div><div className="text-base font-medium">平稳</div></div>
            <div className="bg-white/15 rounded-lg p-2 text-center"><div className="text-[10px] opacity-80">风险</div><div className="text-base font-medium">中</div></div>
          </div>
        </div>
        <Section title="摘要内容（可编辑）">
          <textarea value={summary} onChange={e => setSummary(e.target.value)}
            rows={6} className="w-full p-3 rounded-lg bg-secondary text-sm focus:outline-none resize-none" />
        </Section>
        <Section title="关键词标签">
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                {t}
                <button onClick={() => setTags(s => s.filter(x => x !== t))}><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button onClick={() => setTags(s => [...s, "新标签"])} className="text-xs px-2 py-1 rounded-full bg-secondary">+ 添加</button>
          </div>
        </Section>
        <Section title="风险点">
          <div className="space-y-1.5">
            {risks.map(r => (
              <div key={r.l} className={`text-sm rounded-lg px-3 py-2 ${r.c === "danger" ? "bg-danger/5 text-danger" : "bg-warning/5 text-[oklch(0.5_0.13_75)]"}`}>· {r.l}</div>
            ))}
          </div>
        </Section>
        <Section title="下一步行动建议">
          <ol className="list-decimal pl-5 space-y-1 text-sm">{actions.map(a => <li key={a}>{a}</li>)}</ol>
        </Section>
        <Section title="沟通评分">
          <input type="range" min={60} max={100} value={score} onChange={e => setScore(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-muted-foreground">满意度 {score} 分 · 拖动可微调</div>
        </Section>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { toast.info("摘要已暂存草稿"); }} className="py-3 rounded-xl bg-secondary text-sm font-medium">暂存</button>
          <button onClick={() => { toast.success("已确认，自动录入档案 · 沟通模块"); pop(); }}
            className="py-3 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-medium">确认并录入档案</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 客户留言列表（演示页 — 跳转入口）
 * ============================================================ */
function MessageBoard({ id, pop }: { id: string; pop: () => void }) {
  const c = customers.find(x => x.id === id) as Customer;
  const items = [
    { d: "今日 09:30", t: "已为您调整二甲双胍服用时间，请饭后 30 分钟服用。" },
    { d: "昨天 18:12", t: "周三 14:00 复诊提醒，记得空腹哦～" },
    { d: "5/10",      t: "您本周血压平均 138/86，比上周下降 4mmHg，继续保持！" },
  ];
  return (
    <div>
      <PageHeader title={`留言 · ${c.name}`} pop={pop} />
      <div className="p-4 space-y-2">
        {items.map((m, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-3">
            <div className="text-[11px] text-muted-foreground">{m.d}</div>
            <div className="text-sm mt-1">{m.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * 协同人员通讯录
 * ============================================================ */
function ContactRoster({ pop }: { pop: () => void }) {
  const groups = [
    { g: "主管医师", list: [{ n: "赵主任", r: "心内科" }, { n: "孙主任", r: "内分泌" }] },
    { g: "药师",     list: [{ n: "钱药师", r: "临床药学" }] },
    { g: "护士",     list: [{ n: "周护士", r: "上门护理" }, { n: "吴护士", r: "随访" }] },
    { g: "康复师",   list: [{ n: "周教练", r: "运动康复" }] },
    { g: "营养师",   list: [{ n: "孙老师", r: "膳食方案" }] },
  ];
  return (
    <div>
      <PageHeader title="协同通讯录" pop={pop} />
      <div className="p-4 space-y-4">
        {groups.map(g => (
          <div key={g.g}>
            <div className="text-xs text-muted-foreground mb-1.5">{g.g}</div>
            <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
              {g.list.map(p => (
                <button key={p.n} onClick={() => { toast.success(`已邀请 ${p.n}`); pop(); }}
                  className="w-full px-4 py-3 flex items-center gap-3 active:bg-secondary text-left">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">{p.n[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.n}</div>
                    <div className="text-[11px] text-muted-foreground">{p.r}</div>
                  </div>
                  <UserPlus className="w-4 h-4 text-primary" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * 沟通消息检索
 * ============================================================ */
function ImSearch({ pop, push }: { pop: () => void; push: (s: Stack) => void }) {
  const [q, setQ] = useState("");
  const all = [
    ...customers.map(c => ({ kind: "客户" as const, id: c.id, title: c.name, sub: c.note, push: () => push({ name: "chat", id: c.id }) })),
    { kind: "同事" as const, id: "co-zhao", title: "赵主任", sub: "@林姐 王奶奶 MDT 我已加入", push: () => toast.info("打开赵主任会话") },
    { kind: "系统" as const, id: "sys-1", title: "AI 异常预警", sub: "张老爷子 凌晨血糖 3.8", push: () => toast.info("打开预警详情") },
    { kind: "协同" as const, id: "cb-1", title: "医师转交", sub: "王奶奶 化疗止吐方案 11:00 前回访", push: () => toast.info("打开协同任务") },
  ];
  const r = q ? all.filter(x => x.title.includes(q) || x.sub.includes(q)) : [];
  return (
    <div>
      <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-2 py-2 flex items-center gap-2">
        <button onClick={pop} className="p-1.5 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="搜索消息内容、客户名、同事…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary focus:outline-none" />
        </div>
      </div>
      <div className="p-4">
        {!q && (
          <>
            <div className="text-xs text-muted-foreground mb-2">建议筛选</div>
            <div className="flex flex-wrap gap-2">
              {["@我的", "P0 紧急", "未读", "今天", "MDT", "护士"].map(s => (
                <button key={s} onClick={() => setQ(s.replace("@", ""))} className="text-xs px-3 py-1.5 rounded-full bg-secondary">{s}</button>
              ))}
            </div>
          </>
        )}
        {q && r.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">未找到结果</div>}
        {r.length > 0 && (
          <div className="space-y-2">
            {r.map(x => (
              <button key={x.kind + x.id} onClick={x.push}
                className="w-full p-3 rounded-xl bg-card border border-border flex items-center gap-3 text-left active:bg-secondary">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{x.kind}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{x.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{x.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * 首次登录工作台总结弹窗（对应文档示例图：今日工作台）
 * ============================================================ */
function WelcomeBriefing({ onClose }: { onClose: () => void }) {
  const top10 = [
    { tag: "紧急", c: "danger",  d: "王奶奶 78 岁 糖尿病 昨夜血糖 3.8", sub: "AI 话术建议 + 一键电话" },
    { tag: "紧急", c: "danger",  d: "陈叔 65 岁 心脏病 CGM 心率持续偏快", sub: "建议先视频了解情况" },
    { tag: "紧急", c: "danger",  d: "刘阿姨 情绪打卡连续低落 3 天", sub: "建议语音关怀" },
    { tag: "关怀", c: "warning", d: "断签 7 天客户 3 位（AI 话术已准备）", sub: "" },
    { tag: "到期", c: "primary", d: "赵女士 服务包下周到期", sub: "续费机会" },
  ];
  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-end animate-in fade-in duration-200">
      <div className="w-full bg-card rounded-t-3xl max-h-[90%] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-5 pt-5 pb-3 bg-[image:var(--gradient-primary)] text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs opacity-90">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</div>
              <div className="text-lg font-semibold mt-0.5">早安林姐 ☀️</div>
              <div className="text-[12px] opacity-90 mt-0.5">您今天服务中客户 <b>78</b> 位</div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/15"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { l: "今日关注", v: 7 },
              { l: "紧急",     v: 3 },
              { l: "新异常",   v: 2 },
              { l: "续费到期", v: 1 },
            ].map(k => (
              <div key={k.l} className="bg-white/15 rounded-lg p-2 text-center">
                <div className="text-[10px] opacity-80">{k.l}</div>
                <div className="text-xl font-semibold">{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />今日 Top 5 关注客户
          </div>
          <div className="space-y-2">
            {top10.map((it, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      it.c === "danger" ? "bg-danger/10 text-danger" :
                      it.c === "warning" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
                      "bg-primary/10 text-primary"
                    }`}>{it.tag}</span>
                    <span className="text-sm">{it.d}</span>
                  </div>
                  {it.sub && <div className="text-[11px] text-primary mt-0.5">· {it.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-secondary/60 p-3">
            <div className="text-xs font-semibold mb-1.5">本周团队总览</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              在管 86 位 · 本周触点 412 / 480（86%）· 团队完成率 91%
              <br />今日上海 多云 18°-26°，适合户外散步（可作为客户问候话题）
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-border bg-card">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-medium text-sm">
            开始今日工作 →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 客户列表 — 多条件高级筛选抽屉
 * ============================================================ */
function AdvancedFilter({
  allDiseases, allPkgs, adv, onChange, onClose,
}: {
  allDiseases: string[]; allPkgs: string[];
  adv: { disease: string[]; ageRange: string; pkg: string[]; status: string[] };
  onChange: (v: typeof adv) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(adv);
  const toggle = (key: "disease" | "pkg" | "status", v: string) => {
    setDraft(d => ({ ...d, [key]: d[key].includes(v) ? d[key].filter(x => x !== v) : [...d[key], v] }));
  };
  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl max-h-[88%] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-base font-semibold">多条件筛选</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <FilterGroup title="病种">
            <div className="flex flex-wrap gap-1.5">
              {allDiseases.map(d => (
                <FilterChip key={d} active={draft.disease.includes(d)} onClick={() => toggle("disease", d)}>{d}</FilterChip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="年龄段">
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { k: "all",    l: "不限" },
                { k: "<45",    l: "<45" },
                { k: "45-60",  l: "45-60" },
                { k: "60-70",  l: "60-70" },
                { k: ">70",    l: ">70" },
              ].map(o => (
                <FilterChip key={o.k} active={draft.ageRange === o.k} onClick={() => setDraft(d => ({ ...d, ageRange: o.k }))}>{o.l}</FilterChip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="服务包">
            <div className="flex flex-wrap gap-1.5">
              {allPkgs.map(p => (
                <FilterChip key={p} active={draft.pkg.includes(p)} onClick={() => toggle("pkg", p)}>{p}</FilterChip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="客户状态（分层）">
            <div className="flex flex-wrap gap-1.5">
              {(["urgent","abnormal","stable","new","churnRisk"] as CustomerLayer[]).map(s => (
                <FilterChip key={s} active={draft.status.includes(s)} onClick={() => toggle("status", s)}>{layerMeta[s].label}</FilterChip>
              ))}
            </div>
          </FilterGroup>
        </div>
        <div className="p-4 border-t border-border bg-card flex gap-2">
          <button onClick={() => setDraft({ disease: [], ageRange: "all", pkg: [], status: [] })}
            className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium">重置</button>
          <button onClick={() => { onChange(draft); onClose(); toast.success("筛选已应用"); }}
            className="flex-[2] py-3 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-medium text-sm">应用筛选</button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border active:bg-secondary"
      }`}>{children}</button>
  );
}

/* ============================================================
 * 驿站 Tab — 患者在线下驿站的服务/活动/饮食
 * ============================================================ */
function StationTab() {
  const [diet, setDiet] = useState<"home" | "station">("home");
  const checkups = [
    { d: "2026/04/12", t: "季度体检", station: "浦东世纪驿站", abnormal: ["LDL 3.6 ↑", "尿酸 482 ↑"] },
    { d: "2026/01/08", t: "年度体检", station: "浦东世纪驿站", abnormal: ["空腹血糖 7.8 ↑"] },
  ];
  const prints = [
    { d: "2026/05/02", t: "5 月健康方案 · 控糖版", pages: 6, by: "林姐" },
    { d: "2026/04/05", t: "运动处方 · 中等强度",   pages: 2, by: "周教练" },
  ];
  // 营养餐 — 用餐记录
  const meals = [
    { d: "今日 12:10", t: "燕麦鸡胸藜麦碗（驿站）", g: 380, kcal: 520, carb: 58, protein: 32, fat: 14, type: "蛋白质为主" },
    { d: "昨日 18:30", t: "杂粮饭 + 清蒸鲈鱼（外食）", g: 420, kcal: 610, carb: 70, protein: 36, fat: 18, type: "碳水为主" },
    { d: "昨日 12:00", t: "西芹百合炒虾仁（居家）",   g: 320, kcal: 410, carb: 22, protein: 28, fat: 22, type: "脂肪偏高" },
  ];
  // 居家饮食 vs 驿站饮食
  const homeMeals = meals.filter(m => m.t.includes("居家") || m.t.includes("外食"));
  const stationMeals = meals.filter(m => m.t.includes("驿站"));
  const tests = [
    { d: "今日 09:12", t: "驿站快测血糖（空腹）", v: "6.4 mmol/L", ok: true },
    { d: "昨日 17:40", t: "驿站血压",             v: "138/86 mmHg", ok: false },
    { d: "5/14",       t: "驿站体脂秤",           v: "67.2 kg · 体脂 27.4%", ok: true },
  ];
  // 线下活动 / 赛事
  const events = [
    { d: "5/04", t: "蜻蜓杯·浦东驿站健步走", role: "参与者", rank: "总第 18 名 / 156 人", station: "浦东世纪驿站" },
    { d: "4/20", t: "糖友烹饪比赛",           role: "选手",   rank: "二等奖 🥈",            station: "浦东世纪驿站" },
    { d: "3/15", t: "春日太极养生课",         role: "学员",   rank: "完课 · 出勤 100%",      station: "徐汇衡山驿站" },
  ];
  const dietList = diet === "home" ? homeMeals : stationMeals;
  return (
    <>
      <Section title="驿站体检记录">
        <div className="space-y-2">
          {checkups.map((c, i) => (
            <button key={i} onClick={() => toast.info(`已打开 ${c.t} 报告`)}
              className="w-full rounded-xl border border-border p-3 text-left active:bg-secondary">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{c.d}</span>
                <span className="text-sm font-medium">{c.t}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{c.station}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {c.abnormal.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger">{a}</span>)}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="健康方案打印记录">
        <div className="space-y-1.5">
          {prints.map((p, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{p.t}</div>
                <div className="text-[10px] text-muted-foreground">{p.d} · {p.pages} 页 · 由 {p.by} 打印</div>
              </div>
              <button onClick={() => toast.success("已重新发送至驿站打印")} className="text-[11px] text-primary">重打</button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="营养餐 · 用餐记录">
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold">1540</div><div className="text-[10px] text-muted-foreground">今日 kcal</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold text-primary">42%</div><div className="text-[10px] text-muted-foreground">碳水占比</div></div>
          <div className="rounded-lg bg-secondary p-2"><div className="text-base font-semibold text-success">达标</div><div className="text-[10px] text-muted-foreground">三大营养素</div></div>
        </div>
        <div className="space-y-2">
          {meals.map((m, i) => (
            <div key={i} className="rounded-lg border border-border p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{m.t}</span>
                <span className="text-[11px] text-muted-foreground">{m.d}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-secondary">{m.g} g</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{m.kcal} kcal</span>
                <span className="px-1.5 py-0.5 rounded bg-warning/10 text-[oklch(0.5_0.13_75)]">碳水 {m.carb}g</span>
                <span className="px-1.5 py-0.5 rounded bg-success/10 text-success">蛋白 {m.protein}g</span>
                <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger">脂肪 {m.fat}g</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary">{m.type}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="饮食来源 · 居家 vs 驿站">
        <div className="flex gap-1 bg-secondary p-1 rounded-xl text-xs mb-3">
          {(["home","station"] as const).map(d => (
            <button key={d} onClick={() => setDiet(d)}
              className={`flex-1 py-1.5 rounded-lg ${diet===d?"bg-card shadow-sm font-medium":"text-muted-foreground"}`}>
              {d === "home" ? "居家饮食（居家 + 外食）" : "驿站饮食"}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          {dietList.map((m,i)=>(
            <div key={i} className="flex items-center justify-between text-xs py-1">
              <div className="flex-1 min-w-0 truncate">{m.t}</div>
              <span className="text-muted-foreground ml-2">{m.kcal} kcal</span>
            </div>
          ))}
          {dietList.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">暂无记录</div>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
            <div className="text-[10px] text-muted-foreground">居家+外食占比</div>
            <div className="text-base font-semibold text-primary">62%</div>
          </div>
          <div className="rounded-lg bg-success/5 border border-success/20 p-2">
            <div className="text-[10px] text-muted-foreground">驿站餐占比</div>
            <div className="text-base font-semibold text-success">38%</div>
          </div>
        </div>
      </Section>

      <Section title="驿站测试数据">
        <div className="space-y-1.5">
          {tests.map((t,i)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
              <Activity className={`w-3.5 h-3.5 ${t.ok?"text-success":"text-danger"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{t.t}</div>
                <div className="text-[10px] text-muted-foreground">{t.d}</div>
              </div>
              <span className={`text-xs font-medium ${t.ok?"text-success":"text-danger"}`}>{t.v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="线下活动 / 赛事">
        <div className="space-y-2">
          {events.map((e,i)=>(
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{e.t}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{e.d}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-secondary">{e.role}</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{e.rank}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{e.station}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ============================================================
 * 新建话术
 * ============================================================ */
function NewScript({ pop }: { pop: () => void }) {
  const cats = ["异常处置", "主动关怀", "复诊提醒", "用药提醒", "挽回话术", "节日关怀"];
  const [cat, setCat] = useState(cats[0]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scene, setScene] = useState<string[]>([]);
  const [shared, setShared] = useState(true);
  const vars = ["{客户}", "{value}", "{time}", "{medicine}", "{doctor}"];
  const scenes = ["凌晨", "餐后", "睡前", "复诊前", "复诊后", "化疗", "情绪低落"];
  const toggleScene = (s: string) => setScene(arr => arr.includes(s) ? arr.filter(x=>x!==s) : [...arr, s]);
  const insert = (v: string) => setBody(b => (b ? b + " " + v : v));
  return (
    <div>
      <PageHeader title="新建话术" pop={pop}
        right={
          <button
            onClick={() => { if (!title || !body) { toast.error("请填写标题与内容"); return; } toast.success("话术已保存到模板库"); pop(); }}
            className="text-xs text-primary px-2 py-1.5 font-medium">保存</button>
        } />
      <div className="p-4 space-y-3">
        <Section title="分类">
          <div className="flex gap-1.5 flex-wrap">
            {cats.map(c => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
            ))}
          </div>
        </Section>

        <Section title="基本信息">
          <Field label="话术标题" value={title} onChange={setTitle} placeholder="如：凌晨低血糖关怀" />
        </Section>

        <Section title="内容">
          <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />支持变量占位，点击插入
          </div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {vars.map(v => (
              <button key={v} onClick={() => insert(v)}
                className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground active:bg-muted">{v}</button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="{客户}您好，凌晨监测到您的血糖偏低（{value}），现在感觉如何？建议立即……"
            className="w-full min-h-[140px] rounded-xl bg-secondary px-3 py-2.5 text-sm focus:outline-none" />
          <button onClick={() => { setBody("{客户}您好，结合您今日{value}的情况，建议……"); toast.success("已生成 AI 草稿"); }}
            className="mt-2 w-full py-2 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />AI 帮我起草
          </button>
        </Section>

        <Section title="适用场景标签">
          <div className="flex gap-1.5 flex-wrap">
            {scenes.map(s => (
              <Chip key={s} active={scene.includes(s)} onClick={() => toggleScene(s)}>{s}</Chip>
            ))}
          </div>
        </Section>

        <ToggleRow label="共享至团队话术库" checked={shared} onChange={setShared} />

        <Section title="预览">
          <div className="rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed">
            {body || <span className="text-muted-foreground">在上方填写内容，预览将自动更新…</span>}
          </div>
        </Section>
      </div>
    </div>
  );
}
