import { useState } from "react";
import { customers, tasks, todayKpi, layerMeta, fivePersonTeam, type Task, type Customer, type CustomerLayer } from "@/lib/mock-data";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Home, Users, MessageSquare, User, Bell, Search, AlertTriangle, ChevronRight, ChevronLeft,
  Phone, Video, Sparkles, HeartHandshake, CheckCircle2, Circle, Send, Mic, Image as ImageIcon,
  Plus, Filter, MoreHorizontal, FileText, Pill, Activity, Calendar, Star, Copy, BookOpen,
  TrendingUp, Award, Stethoscope, ClipboardList, Settings, LogOut, ShieldCheck, Clock,
  X, MapPin, AlertCircle, Heart, Users2, Package, Smile, BookMarked, Gift, Clipboard, Home as HomeIcon,
} from "lucide-react";

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
  | { name: "mdt" }             // MDT 会诊记录
  | { name: "settings" }
  | { name: "profile" };

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
        {top.name === "chat"          && <ChatScreen id={top.id} pop={pop} />}
        {top.name === "notifications" && <Notifications pop={pop} />}
        {top.name === "search"        && <SearchScreen pop={pop} push={push} />}
        {top.name === "addCustomer"   && <AddCustomer pop={pop} />}
        {top.name === "care"          && <CareEffect pop={pop} />}
        {top.name === "stats"         && <TaskStats pop={pop} />}
        {top.name === "scripts"       && <ScriptLibrary pop={pop} />}
        {top.name === "mdt"           && <MdtRecords pop={pop} />}
        {top.name === "settings"      && <SettingsScreen pop={pop} />}
        {top.name === "profile"       && <ProfileEdit pop={pop} />}
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

      {/* 今日关注 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-1.5 text-sm"><AlertTriangle className="w-4 h-4 text-danger" />今日关注</h2>
          <button className="text-xs text-primary" onClick={() => toast.info("已切换至「客户」Tab 的关注列表")}>查看全部</button>
        </div>
        <div className="space-y-2">
          {customers.filter(c => c.layer === "urgent" || c.layer === "abnormal").map(c => (
            <div key={c.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
              <button onClick={() => push({ name: "customer", id: c.id })} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${layerMeta[c.layer].color}`}>{layerMeta[c.layer].label}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.note}</div>
                </div>
              </button>
              <button onClick={() => toast.success(`正在拨打 ${c.name} ...`)} className="p-2 rounded-full bg-primary/10 active:bg-primary/20">
                <Phone className="w-4 h-4 text-primary" />
              </button>
              <button onClick={() => push({ name: "chat", id: c.id })} className="p-2 rounded-full bg-secondary active:bg-muted">
                <MessageSquare className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 任务清单 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">AI 任务清单</h2>
          <span className="text-xs text-muted-foreground">已完成 {doneCount}/{tasks.length}</span>
        </div>
        <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
          {tasks.map(t => {
            const done = taskState[t.id];
            return (
              <div key={t.id} className="px-3 py-3 flex items-center gap-2.5 active:bg-secondary/60">
                <button onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }} className="p-0.5">
                  {done ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                </button>
                <button onClick={() => push({ name: "task", id: t.id })} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    t.priority === "P0" ? "bg-danger/10 text-danger" :
                    t.priority === "P1" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
                    "bg-muted text-muted-foreground"
                  }`}>{t.priority}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="text-[10px] text-muted-foreground">{t.customer} · {t.due}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
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
function MIM({ push }: { push: (s: Stack) => void }) {
  return (
    <div>
      <div className="px-4 py-3 flex items-center justify-between bg-card border-b border-border">
        <h2 className="font-semibold">沟通</h2>
        <button onClick={() => push({ name: "notifications" })}><Bell className="w-5 h-5 text-muted-foreground" /></button>
      </div>
      <div className="divide-y divide-border bg-card">
        {customers.map(c => (
          <button key={c.id} onClick={() => push({ name: "chat", id: c.id })}
            className="w-full px-4 py-3 flex items-center gap-3 active:bg-secondary text-left">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-medium">{c.name[0]}</div>
              {c.layer === "urgent" && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger border-2 border-card" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">{c.lastTouch.split(" · ")[0]}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">{c.note}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * Tab 4：我的
 * ============================================================ */
function MMe({ push }: { push: (s: Stack) => void }) {
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
          <ActionTile icon={Phone} label="电话" onClick={() => toast.success(`正在拨打 ${t.customer}`)} />
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
  const [tab, setTab] = useState<"overview" | "archive" | "trend" | "history" | "family" | "log">("overview");
  // 进入患者详情先弹窗展示一段简介
  const [showIntro, setShowIntro] = useState(true);
  const [trendRange, setTrendRange] = useState<"30" | "90" | "custom">("30");

  // AI 一句话简介（模拟根据档案合成）
  const intro = `${c.name}，${c.age}岁${c.gender}性，${c.diseases.join("、")}患者，${c.package}。${c.note}。最近一次触达：${c.lastTouch}。建议关注：用药依从性 + 情绪状态。`;

  return (
    <div>
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
          <div className="grid grid-cols-4 gap-2 mt-3">
            <ActionTile dark icon={Phone} label="电话" onClick={() => toast.success(`正在拨打 ${c.name}`)} />
            <ActionTile dark icon={MessageSquare} label="IM" onClick={() => push({ name: "chat", id: c.id })} />
            <ActionTile dark icon={Video} label="视频" onClick={() => toast.info("视频邀请已发送")} />
            <ActionTile dark icon={Calendar} label="预约" onClick={() => toast.success("预约已发起")} />
          </div>
        </div>

        {/* Tab */}
        <div className="flex gap-1 bg-secondary p-1 rounded-xl text-xs overflow-x-auto">
          {[
            { id: "overview", l: "概览" },
            { id: "archive",  l: "档案" },
            { id: "trend",    l: "趋势" },
            { id: "history",  l: "沟通" },
            { id: "family",   l: "家庭" },
            { id: "log",      l: "记录" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex-1 py-1.5 rounded-lg whitespace-nowrap ${tab === t.id ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ===== 概览 ===== */}
        {tab === "overview" && (
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

        {/* ===== 档案 ===== */}
        {tab === "archive" && (
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
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">当前用药</div>
                  <div className="space-y-1.5">
                    {[
                      { n: "二甲双胍", d: "0.5g · 一日两次 · 餐后" },
                      { n: "厄贝沙坦", d: "150mg · 一日一次 · 早晨" },
                      { n: "阿托伐他汀", d: "20mg · 睡前" },
                    ].map(m => (
                      <div key={m.n} className="flex items-start gap-2 text-sm bg-secondary/40 rounded-lg px-2.5 py-1.5">
                        <Pill className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                        <div><span className="font-medium">{m.n}</span><span className="ml-1 text-[11px] text-muted-foreground">{m.d}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
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
        {tab === "history" && (
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

            <Section title="沟通时间线">
              {[
                { t: "今天 08:30", icon: Phone,         type: "电话", d: "低血糖处置回访 5'12\"" },
                { t: "昨天 19:00", icon: MessageSquare, type: "IM",   d: "推送晚餐建议（低 GI）" },
                { t: "5/12 14:30", icon: Video,         type: "视频", d: "MDT 会诊参与 32'" },
                { t: "5/10 10:00", icon: HomeIcon,      type: "上门", d: "上门测量血糖 + 健康教育" },
                { t: "5/08 09:15", icon: Mic,           type: "语音", d: "用药提醒语音 23\"" },
              ].map((e, i) => {
                const Icon = e.icon;
                return (
                  <div key={i} className="flex gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-primary" /></div>
                      <div className="flex-1 w-px bg-border mt-1" />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{e.type}</span>
                        <span className="text-[11px] text-muted-foreground">{e.t}</span>
                      </div>
                      <div className="text-sm mt-0.5">{e.d}</div>
                    </div>
                  </div>
                );
              })}
            </Section>

            {/* 变化雷达（CM-D） */}
            <Section title="变化雷达 · 异常告警">
              <div className="space-y-2">
                {[
                  { p: "P0", c: "danger",  t: "关键指标变化", d: "HbA1c 由 6.8 → 7.4 (↑0.6)" },
                  { p: "P0", c: "danger",  t: "行为异常", d: "连续 3 天打卡质量下降" },
                  { p: "P1", c: "warning", t: "关系变化", d: "近 7 天家人互动 -40%" },
                  { p: "P1", c: "warning", t: "重要日期", d: "下周三 生日（建议送祝福）" },
                  { p: "P0", c: "danger",  t: "续费机会", d: "服务包 30 天后到期" },
                ].map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${a.c === "danger" ? "bg-danger/5" : "bg-warning/5"}`}>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.c === "danger" ? "bg-danger/15 text-danger" : "bg-warning/15 text-[oklch(0.5_0.13_75)]"}`}>{a.p}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.t}</div>
                      <div className="text-[11px] text-muted-foreground">{a.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="问诊 + 医嘱历史">
              {[
                { t: "5/14 赵主任", d: "继续当前方案，2 周后复查 HbA1c" },
                { t: "4/28 钱药师", d: "二甲双胍餐后服用，监测低血糖" },
              ].map((r, i) => (
                <div key={i} className="py-2 border-b border-border last:border-0">
                  <div className="text-[11px] text-muted-foreground">{r.t}</div>
                  <div className="text-sm mt-0.5">{r.d}</div>
                </div>
              ))}
            </Section>

            <Section title="客户情绪轨迹（30 天）">
              <div className="flex items-end h-16 gap-1">
                {[3,4,4,3,2,2,3,3,4,4,5,4,3,3,4,4,3,2,3,4,4,5,4,3,3,4,4,4,5,5].map((v,i)=>(
                  <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v*20}%`, background: v>=4?"oklch(0.7 0.15 145)":v>=3?"oklch(0.7 0.15 75)":"oklch(0.65 0.2 25)" }} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>30天前</span><span>今日 5/5 ↗</span>
              </div>
            </Section>
          </>
        )}

        {/* ===== 家庭视图（CM-E）===== */}
        {tab === "family" && (
          <>
            <Section title="家庭结构图">
              <div className="flex flex-col items-center gap-2">
                {/* 上一代 */}
                <div className="flex gap-3">
                  {[{n:"父", a:95, dead:true}].map(m => (
                    <FamilyNode key={m.n} {...m} />
                  ))}
                </div>
                <div className="w-px h-3 bg-border" />
                {/* 本代 */}
                <div className="flex gap-3 items-center">
                  <FamilyNode n={c.name[0]} a={c.age} self />
                  <div className="text-[10px] text-muted-foreground">— 配偶 —</div>
                  <FamilyNode n="妻" a={c.age - 2} />
                </div>
                <div className="w-px h-3 bg-border" />
                {/* 下一代 */}
                <div className="flex gap-3">
                  <FamilyNode n="儿" a={42} authorized />
                  <FamilyNode n="女" a={38} authorized />
                </div>
              </div>
            </Section>

            <Section title="各家人健康概览">
              {[
                { n: "妻 周阿姨", age: 70, st: "有高血压、骨质疏松", color: "warning" },
                { n: "儿 张强",   age: 42, st: "亚健康，体检正常", color: "success" },
                { n: "女 张敏",   age: 38, st: "孕中期 28 周",     color: "primary" },
              ].map(m => (
                <div key={m.n} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm">{m.n[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.n} <span className="text-[11px] text-muted-foreground">{m.age}岁</span></div>
                    <div className="text-[11px] text-muted-foreground">{m.st}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${m.color === "warning" ? "bg-warning" : m.color === "success" ? "bg-success" : "bg-primary"}`} />
                </div>
              ))}
            </Section>

            <Section title="家庭互动频率（家人间冷暖）">
              <div className="space-y-1.5">
                {[
                  { p: "本人 ↔ 女儿", v: 92, hot: true },
                  { p: "本人 ↔ 妻子", v: 78, hot: true },
                  { p: "本人 ↔ 儿子", v: 35, hot: false },
                ].map(r => (
                  <div key={r.p}>
                    <div className="flex justify-between text-xs mb-1"><span>{r.p}</span><span className="text-muted-foreground">{r.v}%</span></div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full" style={{ width: `${r.v}%`, background: r.hot ? "oklch(0.65 0.2 25)" : "oklch(0.7 0.05 230)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="紧急联系人">
              {[
                { n: "张敏（女儿）", t: "紧急", p: "138-0000-1234" },
                { n: "张强（儿子）", t: "日常", p: "139-1111-5678" },
              ].map(m => (
                <div key={m.n} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <div className="text-sm">{m.n} <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded ${m.t === "紧急" ? "bg-danger/10 text-danger" : "bg-secondary text-muted-foreground"}`}>{m.t}</span></div>
                    <div className="text-[11px] text-muted-foreground">{m.p}</div>
                  </div>
                  <button onClick={() => toast.success(`正在拨打 ${m.n}`)} className="p-2 rounded-full bg-primary/10"><Phone className="w-3.5 h-3.5 text-primary" /></button>
                </div>
              ))}
            </Section>

            <Section title="授权关系（谁看得到谁的数据）">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">允许</span>女儿张敏 → 全部数据</div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">允许</span>妻子 → 用药 + 复诊提醒</div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 text-[10px] rounded bg-secondary text-muted-foreground">禁用</span>儿子 → 暂未授权</div>
              </div>
            </Section>
          </>
        )}

        {/* ===== 服务记录 ===== */}
        {tab === "log" && (
          <>
            <Section title="五人团">
              <div className="space-y-2">
                {fivePersonTeam.map(m => (
                  <div key={m.role} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs">{m.name[0]}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.name}<span className="ml-1 text-[11px] text-muted-foreground">{m.role}</span></div>
                      <div className="text-[11px] text-muted-foreground">{m.desc}</div>
                    </div>
                    <button onClick={() => toast.info(`已发起与 ${m.name} 的协作`)} className="p-1.5 rounded-full bg-primary/10">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="服务记录">
              {[
                { t: "今天 08:30", d: "电话回访低血糖处置，已恢复" },
                { t: "昨天 19:00", d: "推送晚餐建议（低 GI）" },
                { t: "前天 15:20", d: "完成 MDT 会诊纪要" },
                { t: "5/10",      d: "上门服务 + 健康宣教" },
                { t: "5/08",      d: "服务包权益使用提醒" },
              ].map((l, i) => (
                <div key={i} className="py-2 border-b border-border last:border-0">
                  <div className="text-[11px] text-muted-foreground">{l.t}</div>
                  <div className="text-sm mt-0.5">{l.d}</div>
                </div>
              ))}
            </Section>
          </>
        )}
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
function ChatScreen({ id, pop }: { id: string; pop: () => void }) {
  const c = customers.find(x => x.id === id) as Customer;
  const [msgs, setMsgs] = useState([
    { from: "them", text: c.note, time: "09:12" },
    { from: "me",   text: "好的，我马上协助您，请放心。", time: "09:14" },
  ]);
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { from: "me", text: input, time: "现在" }]);
    setInput("");
    setTimeout(() => {
      setMsgs(m => [...m, { from: "them", text: "收到，谢谢健管师！", time: "现在" }]);
    }, 700);
  };
  // 快捷操作面板项
  const quickActions: { label: string; icon: typeof BookOpen; color: string; onClick: () => void }[] = [
    { label: "话术库",   icon: BookOpen,    color: "bg-primary/10 text-primary",       onClick: () => { setMsgs(m => [...m, { from: "me", text: "[话术] {客户}您好，今天感觉如何？昨晚的睡眠质量怎样呢？", time: "现在" }]); setShowQuick(false); toast.success("话术已发送"); } },
    { label: "宣教",     icon: BookMarked,  color: "bg-success/10 text-success",       onClick: () => { setMsgs(m => [...m, { from: "me", text: "[宣教] 已为您推送《糖尿病饮食指南》，请查收 ▶", time: "现在" }]); setShowQuick(false); toast.success("宣教内容已推送"); } },
    { label: "服务包",   icon: Package,     color: "bg-warning/10 text-[oklch(0.5_0.13_75)]", onClick: () => { setMsgs(m => [...m, { from: "me", text: "[服务包] 您当前为「金卡 · 全周期」，本月已使用 12/30 次随访 ▶", time: "现在" }]); setShowQuick(false); toast.info("服务包详情已发送"); } },
    { label: "预约",     icon: Calendar,    color: "bg-primary/10 text-primary",       onClick: () => { setMsgs(m => [...m, { from: "me", text: "[预约] 已为您预约 周三 14:00 赵主任专家门诊，请确认 ▶", time: "现在" }]); setShowQuick(false); toast.success("预约卡已发送"); } },
    { label: "图片",     icon: ImageIcon,   color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.info("打开图片选择器"); } },
    { label: "语音",     icon: Mic,         color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.info("按住说话…"); } },
    { label: "视频",     icon: Video,       color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.success(`正在邀请 ${c.name} 视频`); } },
    { label: "上门",     icon: HomeIcon,    color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.success("已发起上门服务工单"); } },
    { label: "调取报告", icon: FileText,    color: "bg-secondary text-foreground",     onClick: () => { setMsgs(m => [...m, { from: "me", text: "[报告] 4 月健康月报 已发送 ▶", time: "现在" }]); setShowQuick(false); toast.success("报告已发送"); } },
    { label: "MDT 邀请", icon: Stethoscope, color: "bg-secondary text-foreground",     onClick: () => { setShowQuick(false); toast.success("已发起 MDT 会诊邀请"); } },
    { label: "快速打卡", icon: ClipboardList,color:"bg-secondary text-foreground",     onClick: () => { setMsgs(m => [...m, { from: "me", text: "[打卡] 请协助完成今日血糖打卡 ▶", time: "现在" }]); setShowQuick(false); } },
    { label: "送祝福",   icon: Gift,        color: "bg-secondary text-foreground",     onClick: () => { setMsgs(m => [...m, { from: "me", text: "🎂 祝您生日快乐，身体康健！", time: "现在" }]); setShowQuick(false); toast.success("祝福已送达"); } },
  ];
  return (
    <div className="flex flex-col h-full">
      <PageHeader title={c.name} pop={pop}
        right={<button onClick={() => toast.success(`正在拨打 ${c.name}`)} className="p-1.5 rounded-lg hover:bg-secondary"><Phone className="w-5 h-5" /></button>} />
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-secondary/40">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              m.from === "me" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
            }`}>
              <div>{m.text}</div>
              <div className={`text-[10px] mt-0.5 ${m.from === "me" ? "opacity-80" : "text-muted-foreground"}`}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      {/* 横滑快捷操作条 — 永久可见 */}
      <div className="border-t border-border bg-card px-2 py-2 flex gap-2 overflow-x-auto">
        {quickActions.slice(0, 4).map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={a.onClick}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg active:bg-secondary shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-muted-foreground">{a.label}</span>
            </button>
          );
        })}
      </div>
      {/* 输入栏 */}
      <div className="border-t border-border bg-card p-2 flex items-center gap-2">
        <button onClick={() => setShowQuick(s => !s)} className={`p-2 rounded-lg active:bg-secondary ${showQuick ? "bg-secondary" : ""}`}>
          {showQuick ? <X className="w-5 h-5 text-foreground" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
        </button>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          className="flex-1 px-3 py-2 text-sm rounded-full bg-secondary focus:outline-none" placeholder="输入消息…" />
        <button onClick={send} className="p-2 rounded-full bg-primary text-primary-foreground active:scale-95"><Send className="w-4 h-4" /></button>
      </div>
      {/* 展开的快捷操作面板 (12 项) */}
      {showQuick && (
        <div className="border-t border-border bg-card p-3 grid grid-cols-4 gap-3">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.onClick}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-foreground">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}
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
  const [form, setForm] = useState({ name: "", phone: "", age: "", gender: "女", pkg: "银卡" });
  return (
    <div>
      <PageHeader title="新建客户" pop={pop} />
      <div className="p-4 space-y-3">
        <Field label="姓名"   value={form.name}  onChange={v => setForm({ ...form, name: v })} placeholder="请输入" />
        <Field label="手机号" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="11 位手机号" />
        <Field label="年龄"   value={form.age}   onChange={v => setForm({ ...form, age: v })}   placeholder="请输入" />
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="text-xs text-muted-foreground mb-2">性别</div>
          <div className="flex gap-2">
            {["女", "男"].map(g => (
              <button key={g} onClick={() => setForm({ ...form, gender: g })}
                className={`flex-1 py-2 rounded-lg text-sm ${form.gender === g ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{g}</button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="text-xs text-muted-foreground mb-2">服务包</div>
          <div className="flex gap-2">
            {["体验包", "银卡", "金卡"].map(p => (
              <button key={p} onClick={() => setForm({ ...form, pkg: p })}
                className={`flex-1 py-2 rounded-lg text-sm ${form.pkg === p ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{p}</button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            if (!form.name) return toast.error("请填写姓名");
            toast.success(`已为 ${form.name} 建档`);
            pop();
          }}
          className="w-full py-3.5 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-medium">
          完成建档
        </button>
      </div>
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
function ScriptLibrary({ pop }: { pop: () => void }) {
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
        right={<button onClick={() => toast.success("已新建草稿")} className="p-1.5"><Plus className="w-5 h-5" /></button>} />
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
void MoreHorizontal; void Filter;
