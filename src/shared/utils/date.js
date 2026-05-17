export const DAY_IT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

export const todayStr = () => new Date().toISOString().split("T")[0];
export const todayDOW = () => new Date().getDay();
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });

export function getWeekStart(d = new Date()) {
  const c = new Date(d);
  c.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  c.setHours(0, 0, 0, 0);
  return c;
}
