interface ConfidenceBarProps {
  value: number; // 0-100
}

export default function ConfidenceBar({ value }: ConfidenceBarProps) {
  const color =
    value >= 80
      ? "bg-green-500"
      : value >= 65
      ? "bg-yellow-500"
      : "bg-red-400";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>AI Confidence</span>
        <span className="font-semibold text-gray-700">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Based on past visit patterns</p>
    </div>
  );
}
