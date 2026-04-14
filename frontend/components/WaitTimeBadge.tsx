interface WaitTimeBadgeProps {
  minutes: number;
  peakHour?: boolean;
}

export default function WaitTimeBadge({ minutes, peakHour }: WaitTimeBadgeProps) {
  const color =
    minutes <= 20
      ? "bg-green-100 text-green-700 border-green-300"
      : minutes <= 45
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-red-100 text-red-700 border-red-300";

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${color}`}>
      <span className="text-base">⏱</span>
      <span>{minutes} min wait</span>
      {peakHour && (
        <span className="ml-1 text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full">
          Peak
        </span>
      )}
    </div>
  );
}
