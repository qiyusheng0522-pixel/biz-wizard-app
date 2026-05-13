// 蜻蜓康健家 · 健管师端 mock 数据
// 来源：上传的产品规划文档（M1-M6 模块、五人团角色、客户画像等）

export type CustomerLayer = "urgent" | "abnormal" | "stable" | "new" | "churnRisk";

export const layerMeta: Record<CustomerLayer, { label: string; color: string; dot: string }> = {
  urgent:    { label: "紧急", color: "bg-danger/10 text-danger border-danger/30", dot: "bg-danger" },
  abnormal:  { label: "异常", color: "bg-warning/10 text-[oklch(0.45_0.13_75)] border-warning/40", dot: "bg-warning" },
  stable:    { label: "稳定", color: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  new:       { label: "新入", color: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary" },
  churnRisk: { label: "离网倾向", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

export interface Customer {
  id: string;
  name: string;
  age: number;
  gender: "男" | "女";
  layer: CustomerLayer;
  diseases: string[];
  package: string;
  lastTouch: string;
  metrics: { bg?: number; bp?: string; weight?: number; mood?: number };
  note: string;
}

export const customers: Customer[] = [
  { id: "C001", name: "张老爷子", age: 72, gender: "男", layer: "urgent",   diseases: ["2型糖尿病", "高血压"], package: "金卡 · 全周期", lastTouch: "2小时前 · 电话", metrics: { bg: 3.8, bp: "152/95", weight: 68 }, note: "凌晨 CGM 报警血糖 3.8" },
  { id: "C002", name: "王奶奶", age: 68, gender: "女", layer: "abnormal", diseases: ["乳腺癌康复", "失眠"],  package: "银卡 · 肿瘤陪护", lastTouch: "今早 · IM",       metrics: { bp: "138/88", mood: 3 }, note: "化疗后第 5 天，反馈恶心" },
  { id: "C003", name: "李叔",   age: 58, gender: "男", layer: "stable",   diseases: ["高血脂"],            package: "银卡 · 慢病管理", lastTouch: "昨天 · 留言墙", metrics: { weight: 76, bp: "128/82" }, note: "出差中，自动暂停打卡提醒" },
  { id: "C004", name: "陈姐",   age: 45, gender: "女", layer: "new",      diseases: ["甲状腺结节"],         package: "体验包 · 7天",   lastTouch: "首次建档",       metrics: { mood: 4 }, note: "新入档案，待首访" },
  { id: "C005", name: "刘伯",   age: 65, gender: "男", layer: "churnRisk",diseases: ["2型糖尿病"],          package: "银卡 · 即将到期", lastTouch: "12 天前",        metrics: { bg: 9.2 }, note: "断签 12 天，AI 建议温柔挽回" },
  { id: "C006", name: "周阿姨", age: 70, gender: "女", layer: "abnormal", diseases: ["高血压", "骨质疏松"],  package: "金卡 · 全周期",   lastTouch: "今早 · 视频",    metrics: { bp: "160/100" }, note: "晨起血压偏高，建议复测" },
];

export interface Task {
  id: string;
  type: "异常处理" | "主动关怀" | "复诊提醒" | "服药跟进" | "MDT 会诊" | "报告审阅";
  customer: string;
  title: string;
  priority: "P0" | "P1" | "P2";
  due: string;
  source: "AI 触发" | "医师指派" | "客户求助" | "系统预警";
  done?: boolean;
}

export const tasks: Task[] = [
  { id: "T-1", type: "异常处理", customer: "张老爷子", title: "凌晨低血糖（3.8）随访",        priority: "P0", due: "08:30 前", source: "系统预警" },
  { id: "T-2", type: "服药跟进", customer: "王奶奶",   title: "化疗后止吐药效果跟进",          priority: "P0", due: "上午",     source: "医师指派" },
  { id: "T-3", type: "主动关怀", customer: "刘伯",     title: "断签 12 天 · 温柔挽回话术",     priority: "P1", due: "今日",     source: "AI 触发" },
  { id: "T-4", type: "复诊提醒", customer: "周阿姨",   title: "高血压门诊复诊预约确认",        priority: "P1", due: "14:00",    source: "AI 触发" },
  { id: "T-5", type: "MDT 会诊", customer: "王奶奶",   title: "肿瘤 MDT 多学科会诊准备",       priority: "P1", due: "16:00",    source: "医师指派" },
  { id: "T-6", type: "报告审阅", customer: "陈姐",     title: "首访健康评估报告草稿",          priority: "P2", due: "今日",     source: "AI 触发" },
  { id: "T-7", type: "主动关怀", customer: "李叔",     title: "出差期 · 旅途简报",             priority: "P2", due: "今日",     source: "AI 触发", done: true },
];

export const fivePersonTeam = [
  { role: "责任医师",  name: "赵主任", desc: "慢病主诊"      },
  { role: "药师",     name: "钱药师", desc: "用药与相互作用"  },
  { role: "营养师",   name: "孙老师", desc: "饮食与体重"      },
  { role: "康复师",   name: "周教练", desc: "运动与康复"      },
  { role: "健管师",   name: "我",     desc: "陪伴与协调（你）" },
];

export const todayKpi = [
  { label: "今日待办", value: 18, sub: "已完成 7 / 18", tone: "primary" },
  { label: "异常预警", value: 3,  sub: "P0 紧急 1 例",   tone: "danger"  },
  { label: "服务客户", value: 86, sub: "活跃 72 · 沉默 9", tone: "success" },
  { label: "本月触点", value: 412, sub: "目标 480 · 86%", tone: "warning" },
] as const;

export const adminStats = [
  { label: "在线健管师",   value: "126",   sub: "工作中 98 · 休假 28" },
  { label: "在管客户",     value: "8,742", sub: "环比 +124"           },
  { label: "今日触点",     value: "3,219", sub: "IM 2.1k · 电话 380"  },
  { label: "异常事件",     value: "47",    sub: "P0 紧急 4 · 处理中 12" },
  { label: "服务包到期",   value: "73",    sub: "30 天内 · 续费率 68%" },
  { label: "MDT 会诊",     value: "12",    sub: "本周 · 完成 9"        },
];

export const healthManagers = [
  { id: "HM01", name: "林姐",   level: "L4 健管主任", customers: 8,  team: 8,  perf: 96, status: "工作中" },
  { id: "HM02", name: "小张",   level: "L2 健管师",   customers: 82, team: 0,  perf: 88, status: "工作中" },
  { id: "HM03", name: "陈医生", level: "L5 健管专家", customers: 45, team: 0,  perf: 99, status: "会诊中" },
  { id: "HM04", name: "王助理", level: "L1 健管助理", customers: 24, team: 0,  perf: 76, status: "培训中" },
  { id: "HM05", name: "李姐",   level: "L3 资深健管", customers: 92, team: 2,  perf: 91, status: "工作中" },
  { id: "HM06", name: "赵姐",   level: "L2 健管师",   customers: 78, team: 0,  perf: 84, status: "休假" },
];