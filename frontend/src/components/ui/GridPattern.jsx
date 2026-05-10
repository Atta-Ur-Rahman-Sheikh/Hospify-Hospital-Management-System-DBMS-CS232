/**
 * Subtle dotted-grid background. Used as an ambient surface texture in
 * place of the generic radial gradients. Inspired by Linear/Vercel.
 */
export default function GridPattern({
  size = 28,
  dotSize = 1,
  color = 'rgba(148, 163, 184, 0.06)',
  className,
  fade = true,
}) {
  return (
    <div className={className} aria-hidden="true">
      <div
        style={{
          backgroundImage: `radial-gradient(${color} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${size}px ${size}px`,
          maskImage: fade
            ? 'radial-gradient(ellipse at top, black 30%, transparent 80%)'
            : undefined,
          WebkitMaskImage: fade
            ? 'radial-gradient(ellipse at top, black 30%, transparent 80%)'
            : undefined,
        }}
        className="absolute inset-0"
      />
    </div>
  );
}
