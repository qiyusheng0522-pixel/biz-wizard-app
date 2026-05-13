import { adminStats, healthManagers } from "@/lib/mock-data";
import {
  LayoutDashboard, Users2, BarChart3, Settings, Shield, FileBarChart,
  Bell, Search, TrendingUp, AlertCircle, CheckCircle2,
} from "lucide-react";

/**
 * 后台管理 — 公司/运营视角
 * 健管师团队管理、客户全景、SLA、合规审计
 */
export function AdminView() {
  return (
    <div className="flex h-full bg-background">
      <aside className="w-56 shrink-0 bg-[oklch(0.22_0.04_220)] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-xs text-white/60">蜻蜓康健家</div>
          <div className="font-semibold mt-0.5">运营管理后台</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 text-sm">
          {[
            { i: LayoutDashboard, l: "运营总览", a: true },
            { i: Users2, l: "健管师团队" },
            { i: Users2, l: "客户全景" },
            { i: BarChart3, l: "SLA 与质量" },
            { i: FileBarChart, l: "绩效与排行" },
            { i: Shield, l: "合规审计" },
            { i: Settings, l: "系统配置" },
          ].map(n => {
            const Icon = n.i;
            return (
              <button key={n.l}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md ${n.a ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/5"}`}>
                <Icon className="w-4 h-4" />{n.l}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-4">
          <h1 className="font-semibold">运营总览</h1>
          <span className="text-xs text-muted-foreground">数据更新 · 5 分钟前</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pl-9 pr-3 py-1.5 text-sm rounded-md bg-secondary border-0 focus:outline-none w-64" placeholder="搜索 健管师 / 客户" />
            </div>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* KPI 网格 */}
          <div className="grid grid-cols-3 gap-4">
            {adminStats.map(s => (
              <div key={s.label} className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* 健管师列表 */}
            <section className="col-span-2 rounded-xl bg-card border border-border shadow-[var(--shadow-card)]">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">健管师团队（126）</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-secondary text-muted-foreground">L1-L5 全级别</span>
                  <button className="text-primary">导出 →</button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground bg-secondary/40">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">姓名</th>
                    <th className="text-left font-medium px-3 py-2.5">级别</th>
                    <th className="text-left font-medium px-3 py-2.5">在管客户</th>
                    <th className="text-left font-medium px-3 py-2.5">带徒</th>
                    <th className="text-left font-medium px-3 py-2.5">绩效</th>
                    <th className="text-left font-medium px-3 py-2.5">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {healthManagers.map(h => (
                    <tr key={h.id} className="hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs">{h.name[0]}</div>
                          <div>
                            <div className="font-medium">{h.name}</div>
                            <div className="text-[10px] text-muted-foreground">{h.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs">{h.level}</td>
                      <td className="px-3 py-3">{h.customers}</td>
                      <td className="px-3 py-3">{h.team || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${h.perf}%` }} />
                          </div>
                          <span className="text-xs">{h.perf}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          h.status === "工作中" ? "bg-success/10 text-success" :
                          h.status === "会诊中" ? "bg-primary/10 text-primary" :
                          h.status === "休假"   ? "bg-muted text-muted-foreground" :
                          "bg-warning/10 text-[oklch(0.5_0.13_75)]"
                        }`}>{h.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 异常事件 / SLA */}
            <aside className="space-y-6">
              <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
                <h2 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-danger" />实时异常事件</h2>
                <ul className="mt-3 space-y-3">
                  {[
                    { t: "P0 · 张老爷子低血糖 3.8", who: "林姐 · 处理中", time: "08:14" },
                    { t: "P0 · 王奶奶持续呕吐",     who: "已升级 MDT",  time: "07:42" },
                    { t: "P1 · 周阿姨血压 160/100", who: "AI 已提醒",   time: "07:30" },
                    { t: "P1 · 刘伯断签 12 天",     who: "话术已生成",   time: "06:00" },
                  ].map((e, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-[11px] text-muted-foreground w-10 shrink-0">{e.time}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{e.t}</div>
                        <div className="text-[11px] text-muted-foreground">{e.who}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
                <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />SLA 达成</h2>
                <div className="space-y-3 mt-3">
                  {[
                    { l: "P0 响应（<15min）", v: 98 },
                    { l: "P1 响应（<2h）",    v: 92 },
                    { l: "客户满意度（NPS）", v: 87 },
                    { l: "续费率",            v: 81 },
                  ].map(s => (
                    <div key={s.l}>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{s.l}</span><span className="font-medium">{s.v}%</span></div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                        <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${s.v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
                <h2 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />合规审计</h2>
                <ul className="text-xs text-muted-foreground mt-3 space-y-1.5">
                  <li>· 客户导出审批：今日 3 条 · 已通过 2</li>
                  <li>· 通话录音留存：100% · 已加密</li>
                  <li>· 数据访问日志：实时</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}