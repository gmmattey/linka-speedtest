import './Skeleton.css';

/**
 * Skeleton — placeholder visual com shimmer para estados de loading.
 *
 * Sem box-shadow (regra do projeto). Cores via `--surface` /
 * `--surface-2`. Em `prefers-reduced-motion`, o componente fica estático
 * em `--surface-2` (sem animação).
 *
 * Variants:
 *   - rect (padrão): radius `--radius-sm`
 *   - pill: radius 999px (ideal para texto inline)
 *   - circle: border-radius 50% (avatar/ícone)
 *
 * Uso:
 *   <Skeleton width={120} height={16} variant="pill" />
 *   <Skeleton width="100%" height={80} />
 */
export type SkeletonVariant = 'rect' | 'pill' | 'circle';

export interface SkeletonProps {
  /** Largura. Aceita string CSS ('100%', '60%', '120px') ou número (px). Default '100%'. */
  width?: string | number;
  /** Altura. Aceita string CSS ou número (px). Default 16. */
  height?: string | number;
  /** Forma do placeholder. Default 'rect'. */
  variant?: SkeletonVariant;
  /** Classe extra opcional (override de margin, etc.). */
  className?: string;
  /** Estilo extra opcional (não substitui width/height calculados). */
  style?: React.CSSProperties;
  /** Acessibilidade — quando true, anuncia status de loading. Default false (parent dita). */
  ariaBusy?: boolean;
}

function toCss(v: string | number | undefined, fallback: string): string {
  if (v == null) return fallback;
  return typeof v === 'number' ? `${v}px` : v;
}

export function Skeleton({
  width = '100%',
  height = 16,
  variant = 'rect',
  className,
  style,
  ariaBusy,
}: SkeletonProps) {
  const cls = `lk-skeleton lk-skeleton--${variant}${className ? ` ${className}` : ''}`;
  const finalStyle: React.CSSProperties = {
    width: toCss(width, '100%'),
    height: toCss(height, '16px'),
    ...style,
  };
  return (
    <span
      className={cls}
      style={finalStyle}
      aria-hidden={ariaBusy ? undefined : true}
      aria-busy={ariaBusy ? true : undefined}
      role={ariaBusy ? 'status' : undefined}
    />
  );
}
