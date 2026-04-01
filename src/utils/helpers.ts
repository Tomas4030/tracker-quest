/**
 * Calculate hours between two times
 */
export function calculateHours(startTime: string, endTime: string): number {
  const [startHours, startMins] = startTime.split(":").map(Number);
  const [endHours, endMins] = endTime.split(":").map(Number);
  return Math.max(
    0,
    (endHours * 60 + endMins - startHours * 60 - startMins) / 60,
  );
}

/**
 * Format hours to human-readable format
 */
export function formatHours(hours: number): string {
  const hrs = Math.floor(hours);
  const mins = Math.round((hours - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Format date to Portuguese locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get week dates
 */
export function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

/**
 * Get today's date as string
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Convert status to label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    "em-curso": "Em curso",
    concluido: "Concluído",
    pendente: "Pendente",
  };
  return labels[status] || status;
}

/**
 * Get status badge color classes
 */
export function getStatusColorClass(status: string): string {
  const colors: Record<string, string> = {
    "em-curso": "bg-blue-100 text-blue-800",
    concluido: "bg-green-100 text-green-800",
    pendente: "bg-amber-100 text-amber-800",
  };
  return colors[status] || "bg-slate-100 text-slate-800";
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Truncate text
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "…";
}

/**
 * Format time range
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Sort activities by date and time
 */
export function sortActivities(activities: any[]): any[] {
  return [...activities].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.startTime.localeCompare(a.startTime);
  });
}
