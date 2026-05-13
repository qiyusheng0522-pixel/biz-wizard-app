import { useState } from "react";
import { customers, tasks, todayKpi, layerMeta } from "@/lib/mock-data";
import {
  Home, Users, MessageSquare, User, Bell, Search, AlertTriangle, ChevronRight,
  Phone, Video, Sparkles, HeartHandshake, CheckCircle2, Circle,
} from "lucide-react";

/**
 * 移动端 — 健管师手机 App
 * 4 个 Tab：首页(今日) / 客户 / 沟通 / 我的
 */
export function MobileView() {
  const [tab, setTab] = useState<"home" | "client" | "im" | "me">("home");

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* 顶部状态栏 */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-foreground">
        <span>9:41</span>
        <span className="font-medium">蜻蜓康健家 · 健管师</span>
        <span>•••</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-16">
        {tab === "home"   && <MHome />}
        {tab === "client" && <MClient />}
        {tab === "im"     && <MIM />}
        {tab === "me"     && <MMe />}
      </div>

      {/* 底部 Tab Bar */}
      <nav className="absolute bottom-0 inset-x-0 bg-card border-t border-border grid grid-cols-4 h-16">
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
              className={`flex flex-col items-center justify-center gap-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function MHome() {
  return (
    <div className="px-4 py-3 space-y-4">
      {/* 问候卡 */}
      <div className="rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-4 shadow-[var(--shadow-soft)]">
        <div className="text-xs opacity-90">早上好，林姐</div>
        <div className="text-lg font-semibold mt-1">今天有 18 项待办，5 位客户需特别关注</div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {todayKpi.slice(0, 3).map(k => (
            <div key={k.label} className="bg-white/15 rounded-lg p-2">
              <div className="text-[10px] opacity-80">{k.label}</div>
              <div className="text-lg font-semibold">{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 今日关注 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-1.5 text-sm"><AlertTriangle className="w-4 h-4 text-danger" />今日关注</h2>
          <span className="text-xs text-primary">查看全部</span>
        </div>
        <div className="space-y-2">
          {customers.filter(c => c.layer === "urgent" || c.layer === "abnormal").map(c => (
            <div key={c.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${layerMeta[c.layer].color}`}>{layerMeta[c.layer].label}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.note}</div>
              </div>
              <Phone className="w-5 h-5 text-primary" />
            </div>
          ))}
        </div>
      </section>

      {/* 任务清单 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">AI 任务清单</h2>
          <span className="text-xs text-muted-foreground">已完成 1/7</span>
        </div>
        <div className="rounded-xl bg-card border border-border divide-y divide-border">
          {tasks.map(t => (
            <div key={t.id} className="px-3 py-3 flex items-center gap-2.5">
              {t.done ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                t.priority === "P0" ? "bg-danger/10 text-danger" :
                t.priority === "P1" ? "bg-warning/10 text-[oklch(0.5_0.13_75)]" :
                "bg-muted text-muted-foreground"
              }`}>{t.priority}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                <div className="text-[10px] text-muted-foreground">{t.customer} · {t.due}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MClient() {
  return (
    <div className="px-4 py-3 space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-secondary border-0 focus:outline-none" placeholder="搜索客户" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active>全部 86</Chip>
        <Chip>紧急 1</Chip>
        <Chip>异常 2</Chip>
        <Chip>稳定 72</Chip>
        <Chip>新入 1</Chip>
      </div>
      <div className="space-y-2">
        {customers.map(c => (
          <div key={c.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
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
          </div>
        ))}
      </div>
    </div>
  );
}

function MIM() {
  return (
    <div className="divide-y divide-border bg-card">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold">沟通</h2>
        <Bell className="w-5 h-5 text-muted-foreground" />
      </div>
      {customers.map(c => (
        <div key={c.id} className="px-4 py-3 flex items-center gap-3">
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
        </div>
      ))}
    </div>
  );
}

function MMe() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground p-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-medium">林</div>
          <div>
            <div className="font-semibold">林健管师</div>
            <div className="text-xs opacity-90">L4 健管主任 · 工号 HM01</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><div className="text-lg font-semibold">86</div><div className="text-[10px] opacity-80">在管客户</div></div>
          <div><div className="text-lg font-semibold">412</div><div className="text-[10px] opacity-80">本月触点</div></div>
          <div><div className="text-lg font-semibold">96</div><div className="text-[10px] opacity-80">绩效分</div></div>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border divide-y divide-border">
        {[
          { l: "我的关怀效果",  i: HeartHandshake },
          { l: "我的任务统计",  i: Sparkles },
          { l: "话术模板库",    i: MessageSquare },
          { l: "MDT 会诊记录",  i: Video },
        ].map(it => {
          const Icon = it.i;
          return (
            <button key={it.l} className="w-full px-4 py-3.5 flex items-center gap-3 text-sm">
              <Icon className="w-4 h-4 text-primary" />
              <span className="flex-1 text-left">{it.l}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{children}</span>
  );
}