import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Monitor, Smartphone, Settings2, Maximize2 } from "lucide-react";
import { PCView } from "@/components/views/PCView";
import { MobileView } from "@/components/views/MobileView";
import { AdminView } from "@/components/views/AdminView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "蜻蜓康健家 · 健管师端 · 聚合预览" },
      { name: "description", content: "PC 端 / 移动端 / 后台管理 一站式预览（健康管理师端原型）" },
    ],
  }),
  component: Index,
});

/**
 * 聚合预览首页
 * 一键切换 PC 端 / 移动端 / 后台管理 三种视角
 * 设计：左侧选择器 + 右侧设备外框（响应式 — 移动浏览器下退化为全宽 Tab）
 */
type Mode = "pc" | "mobile" | "admin";

const MODES: { id: Mode; label: string; sub: string; icon: typeof Monitor }[] = [
  { id: "pc",     label: "PC 端",     sub: "健管师桌面工作台", icon: Monitor },
  { id: "mobile", label: "移动端",    sub: "随身 App",         icon: Smartphone },
  { id: "admin",  label: "后台管理",  sub: "运营/团队管理后台", icon: Settings2 },
];

function Index() {
  const [mode, setMode] = useState<Mode>("pc");

  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)]">
      {/* 顶部品牌栏 */}
      <header className="px-6 py-4 flex items-center gap-4 border-b border-border bg-background/60 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center text-primary-foreground font-bold">蜻</div>
          <div>
            <h1 className="text-base font-semibold leading-tight">蜻蜓康健家 · 健管师端</h1>
            <p className="text-[11px] text-muted-foreground">聚合预览 · PC / 移动 / 后台 三端切换</p>
          </div>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-secondary">M1 客户</span>
          <span className="px-2 py-1 rounded-full bg-secondary">M2 工作台</span>
          <span className="px-2 py-1 rounded-full bg-secondary">M3 关怀</span>
          <span className="px-2 py-1 rounded-full bg-secondary">M4 沟通</span>
          <span className="px-2 py-1 rounded-full bg-secondary">M5 医师</span>
          <span className="px-2 py-1 rounded-full bg-secondary">M6 药事</span>
        </div>
      </header>

      {/* 切换 Tab */}
      <div className="px-6 pt-5">
        <div className="inline-flex p-1 rounded-xl bg-card border border-border shadow-[var(--shadow-card)]">
          {MODES.map(m => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                  active ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]" : "text-foreground hover:bg-secondary"
                }`}>
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium leading-tight">{m.label}</div>
                  <div className={`text-[10px] leading-tight ${active ? "opacity-90" : "text-muted-foreground"}`}>{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 设备框预览区 */}
      <main className="px-6 py-6">
        {mode === "pc"     && <DeviceFrame kind="pc"><PCView /></DeviceFrame>}
        {mode === "mobile" && <DeviceFrame kind="mobile"><MobileView /></DeviceFrame>}
        {mode === "admin"  && <DeviceFrame kind="pc"><AdminView /></DeviceFrame>}
      </main>

      <footer className="px-6 pb-8 text-center text-[11px] text-muted-foreground">
        基于产品规划文档 · L1-L5 健管师 · 五人团协同 · M1-M6 模块原型 · React + Tailwind
      </footer>
    </div>
  );
}

/** 设备外框 — pc: 浏览器外壳；mobile: 手机外壳 */
function DeviceFrame({ kind, children }: { kind: "pc" | "mobile"; children: React.ReactNode }) {
  if (kind === "mobile") {
    return (
      <div className="flex justify-center">
        <div className="relative w-[390px] h-[780px] rounded-[44px] bg-[oklch(0.18_0.02_240)] p-3 shadow-[0_30px_80px_-20px_oklch(0_0_0/0.35)]">
          {/* 听筒 */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-[oklch(0.18_0.02_240)] rounded-full z-10" />
          <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-background">
            {children}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-card border border-border shadow-[0_20px_60px_-20px_oklch(0_0_0/0.18)] overflow-hidden">
      {/* 浏览器顶栏 */}
      <div className="px-4 py-2.5 border-b border-border bg-secondary/60 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.18_25)]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.78_0.15_75)]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.15_150)]" />
        </div>
        <div className="ml-3 px-3 py-1 rounded-md bg-card text-[11px] text-muted-foreground flex-1 max-w-md">
          https://hm.qingting-health.com/workspace
        </div>
        <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="h-[780px] overflow-hidden">{children}</div>
    </div>
  );
}

function Index() {
  return <PlaceholderIndex />;
}
