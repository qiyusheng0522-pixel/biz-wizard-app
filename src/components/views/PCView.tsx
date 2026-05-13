import { useState } from "react";
import { customers, tasks, fivePersonTeam, todayKpi, layerMeta, type CustomerLayer } from "@/lib/mock-data";
import {
  Users, Bell, MessageSquare, Stethoscope, Pill, HeartHandshake, LayoutDashboard,
  Search, Phone, Video, FileText, AlertTriangle, ChevronRight, Sparkles, Calendar,
  Activity, TrendingUp, CheckCircle2, Circle,
} from "lucide-react";

const nav = [
  { id: "today",   label: "今日工作台", icon: LayoutDashboard, badge: "18" },
  { id: "client",  label: "我的客户",   icon: Users,           badge: "86" },
  { id: "care",    label: "主动关怀",   icon: HeartHandshake,  badge: "12" },
  { id: "im",      label: "实时沟通",   icon: MessageSquare,   badge: "5"  },
  { id: "doctor",  label: "医师协同",   icon: Stethoscope                 },
  { id: "pharma",  label: "药事协同",   icon: Pill                        },
];

export function PCView() {
  const [active, setActive] = useState("today");
  const [layerFilter, setLayerFilter] = useState<CustomerLayer | "all">("all");

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* 左侧导航 — 健管师端核心 6 大模块 */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center text-primary-foreground font-bold">蜻</div>
            <div>
              <div className="text-sm font-semibold">蜻蜓康健家</div>
              <div className="text-[11px] text-muted-foreground">健管师工作台</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => {
            const Icon = n.icon;
            const isActive = active === n.id;
            return (
              <button key={n.id} onClick={() => setActive(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "text-foreground hover:bg-secondary"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{n.label}</span>
                {n.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>{n.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-medium">林</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">林健管师</div>
              <div className="text-[11px] text-muted-foreground">L4 健管主任 · 在线</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 主区域 */}
      <main className="flex-1 overflow-auto">
        {/* 顶栏 */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-0 focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="搜索客户姓名 / 手机 / ID / 标签…" />
          </div>
          <button className="text-sm px-3 py-1.5 rounded-md hover:bg-secondary flex items-center gap-1.5"><Bell className="w-4 h-4" />3</button>
          <button className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground flex items-center gap-1.5"><Sparkles className="w-4 h-4" />AI 助手</button>
        </header>

        {active === "today" && <TodayPanel />}
        {active === "client" && <ClientPanel layerFilter={layerFilter} setLayerFilter={setLayerFilter} />}
        {active === "care"   && <CarePanel />}
        {active === "im"     && <IMPanel />}
        {active === "doctor" && <Placeholder title="医师协同 · MDT 会诊" desc="病情升级 → 推送医师 → 排队 → MDT 会议室（多医师视频+共享病历+白板）" />}
        {active === "pharma" && <Placeholder title="药事协同 · 周药盒" desc="副作用识别 → 药师审核 → 周药盒重新分装 → O2O 配送闭环" />}
      </main>
    </div>
  );
}

// 今日工作台 — M2
function TodayPanel() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">今日工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">林姐，早上好 · AI 已为你筛出 5 位需特别关注的客户</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {todayKpi.map(k => (
          <div key={k.label} className="rounded-xl bg-card border border-border p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-semibold mt-1">{k.value}</div>
            <div className={`text-[11px] mt-1 ${
              k.tone === "danger" ? "text-danger" :
              k.tone === "warning" ? "text-[oklch(0.55_0.13_75)]" :
              k.tone === "success" ? "text-success" : "text-primary"
            }`}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 任务清单 */}
        <section className="col-span-2 rounded-xl bg-card border border-border shadow-[var(--shadow-card)]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">AI 任务清单</h2>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">按优先级排序</span>
            </div>
            <button className="text-xs text-primary hover:underline">批量处理 →</button>
          </div>
          <ul className="divide-y divide-border">
            {tasks.map(t => (
              <li key={t.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                {t.done ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  t.priority === "P0" ? "bg-danger/10 text-danger" :
                  t.priority === "P1" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
                  "bg-muted text-muted-foreground"
                }`}>{t.priority}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{t.customer}</span>·<span>{t.type}</span>·<span>{t.source}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{t.due}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </section>

        {/* 今日关注 + 五人团 */}
        <aside className="space-y-6">
          <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-danger" />今日关注（AI 推荐 3）</h2>
            <ul className="mt-3 space-y-2.5">
              {customers.filter(c => c.layer === "urgent" || c.layer === "abnormal").slice(0, 3).map(c => (
                <li key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/60">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{c.note}</div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${layerMeta[c.layer].color}`}>{layerMeta[c.layer].label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-primary" />五人团 · 当前客户</h2>
            <p className="text-[11px] text-muted-foreground mt-1">王奶奶 · 肿瘤陪护</p>
            <ul className="mt-3 space-y-2">
              {fivePersonTeam.map(p => (
                <li key={p.role} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground w-16">{p.role}</span>
                  <span className="flex-1">{p.name}</span>
                  <span className="text-[11px] text-muted-foreground">{p.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 我的客户 — M1
function ClientPanel({ layerFilter, setLayerFilter }: { layerFilter: CustomerLayer | "all"; setLayerFilter: (v: CustomerLayer | "all") => void }) {
  const filtered = layerFilter === "all" ? customers : customers.filter(c => c.layer === layerFilter);
  const [selected, setSelected] = useState(customers[0]);

  return (
    <div className="p-6 grid grid-cols-12 gap-6">
      <div className="col-span-7 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">我的客户</h1>
          <p className="text-sm text-muted-foreground mt-1">智能 5 档分层 · 共 86 位在管客户</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setLayerFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border ${layerFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
            全部
          </button>
          {(Object.keys(layerMeta) as CustomerLayer[]).map(k => (
            <button key={k} onClick={() => setLayerFilter(k)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${layerFilter === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${layerMeta[k].dot}`} />{layerMeta[k].label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-xs">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">客户</th>
                <th className="text-left font-medium px-4 py-2.5">分层</th>
                <th className="text-left font-medium px-4 py-2.5">病种</th>
                <th className="text-left font-medium px-4 py-2.5">服务包</th>
                <th className="text-left font-medium px-4 py-2.5">最近触点</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className={`cursor-pointer hover:bg-secondary/50 ${selected.id === c.id ? "bg-accent/30" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">{c.name[0]}</div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.gender} · {c.age}岁</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded border ${layerMeta[c.layer].color}`}>{layerMeta[c.layer].label}</span></td>
                  <td className="px-4 py-3 text-xs">{c.diseases.join(" / ")}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.package}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.lastTouch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360° 客户画像 — M1 B 组 */}
      <aside className="col-span-5 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] sticky top-20 self-start max-h-[calc(100vh-7rem)] overflow-auto">
        <div className="p-5 border-b border-border bg-[image:var(--gradient-soft)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center font-medium">{selected.name[0]}</div>
            <div className="flex-1">
              <div className="font-semibold">{selected.name}</div>
              <div className="text-xs text-muted-foreground">{selected.gender} · {selected.age}岁 · {selected.package}</div>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded border ${layerMeta[selected.layer].color}`}>{layerMeta[selected.layer].label}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[{i: Phone, l: "电话"}, {i: MessageSquare, l: "IM"}, {i: Video, l: "视频"}, {i: FileText, l: "档案"}].map(({i: Icon, l}) => (
              <button key={l} className="py-2 rounded-lg bg-card border border-border hover:border-primary/40 hover:text-primary transition-colors text-xs flex flex-col items-center gap-1">
                <Icon className="w-4 h-4" />{l}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Section title="变化雷达 · 30 天" icon={<Activity className="w-4 h-4 text-primary" />}>
            <div className="text-xs text-muted-foreground">{selected.note}</div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {selected.metrics.bg && <Mini label="空腹血糖" value={selected.metrics.bg + ""} unit="mmol/L" tone="danger" />}
              {selected.metrics.bp && <Mini label="血压" value={selected.metrics.bp} unit="mmHg" tone="warning" />}
              {selected.metrics.weight && <Mini label="体重" value={selected.metrics.weight + ""} unit="kg" tone="primary" />}
              {selected.metrics.mood && <Mini label="情绪" value={selected.metrics.mood + "/5"} unit="自评" tone="primary" />}
            </div>
          </Section>
          <Section title="既往史 / 用药" icon={<Pill className="w-4 h-4 text-primary" />}>
            <ul className="text-xs space-y-1.5 text-muted-foreground">
              <li>· 病种：{selected.diseases.join("、")}</li>
              <li>· 过敏史：青霉素</li>
              <li>· 当前用药：二甲双胍 0.5g bid · 缬沙坦 80mg qd</li>
            </ul>
          </Section>
          <Section title="沟通时间线" icon={<MessageSquare className="w-4 h-4 text-primary" />}>
            <ol className="text-xs space-y-2 border-l border-border pl-3">
              <li><span className="text-muted-foreground">今早 08:14</span> · 电话随访 12 分钟</li>
              <li><span className="text-muted-foreground">昨日 19:30</span> · IM：反馈用药感受</li>
              <li><span className="text-muted-foreground">3 天前</span> · 视频复诊 · 赵主任</li>
            </ol>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function CarePanel() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold">主动关怀引擎</h1>
        <p className="text-sm text-muted-foreground mt-1">AI 识别生活事件 · 反套路话术 · 不打扰住院/差旅客户</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { t: "断签挽回",  n: 5, d: "AI 推荐温柔话术", tone: "warning" },
          { t: "生活事件",  n: 12, d: "出差/住院/旅游 自动识别", tone: "primary" },
          { t: "今日关怀", n: 24, d: "已发送 18 · 待发 6", tone: "success" },
        ].map(c => (
          <div key={c.t} className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
            <div className="text-sm text-muted-foreground">{c.t}</div>
            <div className="text-3xl font-semibold mt-2">{c.n}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />话术工厂 · 推荐</h2>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            "刘伯，最近天气转凉，您的膝盖还好吗？上周您说想给孙女带的桂花糕，做成了吗？",
            "王奶奶，化疗后第 5 天，恶心是这阶段最常见反应。今天试试小米山药粥，温温的，少量多次。",
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-sm">{s}</div>
              <div className="flex gap-2 mt-3">
                <button className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground">采用</button>
                <button className="text-xs px-2.5 py-1 rounded bg-card border border-border">微调</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IMPanel() {
  return (
    <div className="grid grid-cols-12 h-[calc(100%-3.5rem)]">
      <div className="col-span-3 border-r border-border bg-card overflow-y-auto">
        {customers.map(c => (
          <div key={c.id} className="px-4 py-3 border-b border-border hover:bg-secondary/50 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{c.name}</div>
              <span className="text-[10px] text-muted-foreground">{c.lastTouch.split(" · ")[0]}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">{c.note}</div>
          </div>
        ))}
      </div>
      <div className="col-span-6 flex flex-col bg-[image:var(--gradient-soft)]">
        <div className="px-5 py-3 border-b border-border bg-card flex items-center gap-2">
          <div className="font-medium text-sm">王奶奶</div>
          <span className="text-[11px] text-muted-foreground">L2 银卡 · 肿瘤陪护</span>
          <div className="ml-auto flex gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <Video className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 p-5 space-y-3 overflow-y-auto">
          <Bubble side="left">林姐早，今天早上还是有点恶心，吃不下东西。</Bubble>
          <Bubble side="right">王奶奶别担心，化疗后第 5 天这是最常见的反应。我马上联系药师调整止吐方案。</Bubble>
          <Bubble side="left">谢谢你呀，太麻烦你了。</Bubble>
          <div className="flex justify-center"><span className="text-[11px] text-muted-foreground">AI：已建议触发 MDT 会诊（已打勾）</span></div>
        </div>
        <div className="px-5 py-3 border-t border-border bg-card flex gap-2">
          <input className="flex-1 px-3 py-2 text-sm rounded-lg bg-secondary border-0 focus:outline-none" placeholder="输入消息（AI 边打边提示）" />
          <button className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground">发送</button>
        </div>
      </div>
      <div className="col-span-3 border-l border-border bg-card p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3">协同侧栏</h3>
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-secondary/60">
            <div className="font-medium">五人团</div>
            {fivePersonTeam.map(p => <div key={p.role} className="flex justify-between text-muted-foreground mt-1"><span>{p.role}</span><span>{p.name}</span></div>)}
          </div>
          <div className="p-3 rounded-lg bg-secondary/60">
            <div className="font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />近期计划</div>
            <div className="text-muted-foreground mt-1">明日 10:00 · MDT 会诊</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-10">
      <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
        <Stethoscope className="w-10 h-10 mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{desc}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">{icon}{title}</h3>
      {children}
    </div>
  );
}
function Mini({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-[oklch(0.55_0.13_75)]" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
    </div>
  );
}
function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
        side === "right" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"
      }`}>{children}</div>
    </div>
  );
}