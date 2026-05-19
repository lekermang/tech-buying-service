type Props = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};

export default function Sparkline({ data, color = "#FFD700", width = 80, height = 24 }: Props) {
  if (!data.length) return <svg width={width} height={height} />;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const range = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = data[data.length - 1];
  const first = data[0];
  const up = last >= first;
  const stroke = color === "auto" ? (up ? "#34d399" : "#fb7185") : color;
  const fill = `${stroke}33`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill={fill}
        stroke="none"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
