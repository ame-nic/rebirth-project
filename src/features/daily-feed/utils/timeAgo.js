export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)   return "adesso";
  if (mins < 60)  return `${mins}m fa`;
  if (hours < 24) return `${hours}h fa`;
  return `${days}g fa`;
}
