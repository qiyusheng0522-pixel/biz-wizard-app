import { createFileRoute } from "@tanstack/react-router";
import { MobileView } from "@/components/views/MobileView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "蜻蜓康健家 · 健管师端 · 移动端预览" },
      { name: "description", content: "蜻蜓康健家 健康管理师 移动端 App 原型预览" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)]">
      <header className="px-6 py-4 flex items-center gap-4 border-b border-border bg-background/60 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center text-primary-foreground font-bold">蜻</div>
          <div>
            <h1 className="text-base font-semibold leading-tight">蜻蜓康健家 · 健管师端</h1>
            <p className="text-[11px] text-muted-foreground">移动端 App 预览</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <DeviceFrame><MobileView /></DeviceFrame>
      </main>

      <footer className="px-6 pb-8 text-center text-[11px] text-muted-foreground">
        基于产品规划文档 · L1-L5 健管师 · 五人团协同 · M1-M6 模块原型 · React + Tailwind
      </footer>
    </div>
  );
}

/** 手机外框 */
function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="relative w-[390px] h-[780px] rounded-[44px] bg-[oklch(0.18_0.02_240)] p-3 shadow-[0_30px_80px_-20px_oklch(0_0_0/0.35)]">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-[oklch(0.18_0.02_240)] rounded-full z-10" />
        <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}