interface BadgeProps {
  color: string;
  label: string;
}

export default function Badge({ color, label }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: color + "22",
        borderColor: color + "44",
        color: darkenColor(color),
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function darkenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)})`;
}

export function DocumentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "#94a3b8" },
    UPLOADED: { label: "Subido", color: "#60a5fa" },
    APPROVED: { label: "Aprobado", color: "#4ade80" },
    REJECTED: { label: "Rechazado", color: "#f87171" },
  };
  const { label, color } = map[status] ?? { label: status, color: "#94a3b8" };
  return <Badge color={color} label={label} />;
}
