import { useMemo } from 'react';

/**
 * Tiny inline sparkline. Pure SVG, no external deps.
 * Renders an area fill + stroke, with a final-point dot.
 */
export default function Sparkline({
  data = [],
  width = 90,
  height = 28,
  color = '#60a5fa',
  fillOpacity = 0.18,
  strokeWidth = 1.6,
  showDot = true,
  className,
}) {
  const { path, area, last } = useMemo(() => {
    if (!data.length) return { path: '', area: '', last: null };
    const pad = 1.5;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = Math.max(1, max - min);
    const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
    const points = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - (v - min) / range);
      return [x, y];
    });
    const path = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ');
    const area =
      `M${points[0][0].toFixed(2)},${(height - pad).toFixed(2)} ` +
      points
        .map(([x, y], i) => `${i === 0 ? 'L' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
        .join(' ') +
      ` L${points[points.length - 1][0].toFixed(2)},${(height - pad).toFixed(2)} Z`;
    return { path, area, last: points[points.length - 1] };
  }, [data, width, height]);

  if (!data.length) return null;

  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      {showDot && last && (
        <>
          <circle cx={last[0]} cy={last[1]} r={3.2} fill={color} fillOpacity={0.25} />
          <circle cx={last[0]} cy={last[1]} r={1.8} fill={color} />
        </>
      )}
    </svg>
  );
}
