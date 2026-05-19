export function formatRupiah(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function formatWeight(weight: number | string | null | undefined, unit: string | null | undefined): string {
  if (weight == null) return '—';
  const num = Number(weight);
  const formatted = unit === 'kg' ? num.toFixed(2) : Math.round(num);
  return `${formatted} ${unit ?? 'kg'}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
}