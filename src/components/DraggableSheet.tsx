import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './DraggableSheet.css';

export type SnapPoint = 'compact' | 'expanded';

/**
 * Snap points (% do viewport).
 *
 * - `compact`  60vh — padrão de abertura. Mostra hero + 1ª seção sem
 *   precisar rolar muito. Cobre a maioria dos sheets de detalhe.
 * - `expanded` 88vh — ocupa praticamente a tela toda. Para conteúdos
 *   longos (Avançado com 3 sub-blocos, Modo Gamer com lista de jogos,
 *   guia DNS com steps por plataforma).
 */
const SNAP_VH: Record<SnapPoint, number> = {
  compact: 60,
  expanded: 88,
};

/** Threshold de velocidade (px/ms) para "fast swipe". 0.8 px/ms = 800 px/s. */
const VELOCITY_THRESHOLD = 0.8;

/**
 * Threshold de fechar baseado em distância: arrastou pra baixo > 30% da
 * altura inicial do drag → fecha. Mantém a sensação de "se eu puxei
 * bastante, está fechando" mesmo sem velocidade.
 */
const CLOSE_DISTANCE_PCT = 0.3;

/**
 * Resistência aplicada quando o usuário tenta arrastar pra cima além do
 * `expanded`. Sem isso o sheet "estica" infinito; com isso a barra
 * empurra de volta, dando feedback de "limite alcançado".
 */
const OVERDRAG_RESISTANCE = 0.3;

interface DraggableSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * Snap inicial ao abrir. Default `compact`. Cada vez que `open` flipa
   * de false → true, o sheet volta para esse snap (não preserva o que
   * estava antes).
   */
  initialSnap?: SnapPoint;
  /** Conteúdo do sheet (header, body, footer — tudo do consumidor). */
  children: ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /**
   * Eleva o z-index para empilhar acima de outro DraggableSheet (ex.: o
   * WifiOptimizeSheet abre POR CIMA do WifiDetailsSheet). Default false.
   */
  nested?: boolean;
}

/**
 * DraggableSheet — base universal para todos os bottom sheets do app.
 *
 * Substituiu animações próprias de cada sheet (DNSGuideSheet,
 * WifiDetailsSheet, WifiOptimizeSheet) e adiciona drag-to-resize com 2
 * snap points (compact/expanded). Renderiza:
 *
 *   - Backdrop (clica → fecha; opacity proporcional à altura).
 *   - Container fixed bottom: 0 com altura controlada pelo estado.
 *   - Drag handle no topo (área de 28px × full width, com a barra 40×4
 *     centralizada). Pointer events ficam SÓ no handle — não no
 *     `.lk-dsheet__content`, pra não conflitar com o scroll interno.
 *
 * Snap logic em `pointerup`:
 *   1. velocidade descendente > 0.8 px/ms → fecha;
 *   2. velocidade ascendente > 0.8 px/ms → snap para `expanded`;
 *   3. arrastou pra baixo > 30% da altura inicial → fecha;
 *   4. senão, snap para o ponto mais próximo (compact ou expanded).
 *
 * Respeita `prefers-reduced-motion: reduce` (animação de entrada/saída).
 */
export function DraggableSheet({
  open,
  onClose,
  initialSnap = 'compact',
  children,
  ariaLabel,
  ariaLabelledBy,
  nested = false,
}: DraggableSheetProps) {
  // Snap atual (estado "definitivo"). Atualizado no pointerup (após snap).
  const [snap, setSnap] = useState<SnapPoint>(initialSnap);
  // Altura "ao vivo" durante o drag. `null` quando não está arrastando —
  // a altura efetiva vem do snap. Quando set, sobrescreve o snap pra
  // animar o usuário arrastando.
  const [dragHeightVh, setDragHeightVh] = useState<number | null>(null);

  const startYRef = useRef<number | null>(null);
  const startHeightVhRef = useRef<number>(0);
  // Tracking de velocidade: posição/timestamp do último pointermove. A
  // velocidade do pointerup é `(lastY - prevY) / (lastT - prevT)`.
  const lastSampleRef = useRef<{ y: number; t: number } | null>(null);
  const velocityRef = useRef<number>(0);

  // Reset do snap a cada abertura. Sem isso, fechar+abrir manteria o
  // último snap (que pode ser `expanded`, surpreendendo o usuário).
  useEffect(() => {
    if (open) {
      setSnap(initialSnap);
      setDragHeightVh(null);
    }
  }, [open, initialSnap]);

  // Body scroll lock + Esc fecha. Mantém o padrão antigo de cada sheet
  // — consolidado aqui para os consumidores não precisarem repetir.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const currentHeightVh = dragHeightVh ?? SNAP_VH[snap];
  const isDragging = startYRef.current != null;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    startYRef.current = e.clientY;
    startHeightVhRef.current = currentHeightVh;
    lastSampleRef.current = { y: e.clientY, t: performance.now() };
    velocityRef.current = 0;
    // Trava o estado em `dragHeightVh` para o transition desligar agora
    // (a regra inline já considera `isDragging`, mas só recalcula a
    // próxima render — setando aqui garantimos o lift instantâneo).
    setDragHeightVh(currentHeightVh);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startYRef.current == null) return;
    const vh = window.innerHeight || 1;
    const dy = e.clientY - startYRef.current;
    // Convenção: dy positivo = pointer descendo = sheet encolhendo
    // (height diminui). Por isso subtraímos.
    let newVh = startHeightVhRef.current - (dy / vh) * 100;

    // Resistência além do expanded (puxar pra cima além do max).
    if (newVh > SNAP_VH.expanded) {
      const overshoot = newVh - SNAP_VH.expanded;
      newVh = SNAP_VH.expanded + overshoot * OVERDRAG_RESISTANCE;
    }
    // Floor: não deixa height ficar negativa (mata o layout).
    if (newVh < 0) newVh = 0;

    setDragHeightVh(newVh);

    // Tracking de velocidade — janela curta entre samples produz
    // medida instantânea, suficiente pra decidir fast swipe no up.
    const now = performance.now();
    const last = lastSampleRef.current;
    if (last) {
      const dt = now - last.t;
      if (dt > 0) {
        velocityRef.current = (e.clientY - last.y) / dt;
      }
    }
    lastSampleRef.current = { y: e.clientY, t: now };
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (startYRef.current == null) return;
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    const finalVh = dragHeightVh ?? SNAP_VH[snap];
    const startVh = startHeightVhRef.current;
    const vel = velocityRef.current;

    startYRef.current = null;
    lastSampleRef.current = null;

    // 1. Fast swipe down → fecha.
    if (vel > VELOCITY_THRESHOLD) {
      onClose();
      return;
    }
    // 2. Fast swipe up → expande.
    if (vel < -VELOCITY_THRESHOLD) {
      setSnap('expanded');
      setDragHeightVh(null);
      return;
    }
    // 3. Distância: arrastou pra baixo mais que 30% da altura inicial → fecha.
    if (finalVh < startVh * (1 - CLOSE_DISTANCE_PCT)) {
      onClose();
      return;
    }
    // 4. Snap para o ponto mais próximo.
    const dCompact = Math.abs(finalVh - SNAP_VH.compact);
    const dExpanded = Math.abs(finalVh - SNAP_VH.expanded);
    setSnap(dCompact <= dExpanded ? 'compact' : 'expanded');
    setDragHeightVh(null);
  };

  // Backdrop opacity escala com a altura — quando o usuário puxa pra
  // baixo (height diminui), o backdrop começa a desaparecer junto. Top
  // em compact, fade out abaixo dele. Acima de compact mantém 1.
  const backdropOpacity = Math.min(1, currentHeightVh / SNAP_VH.compact);

  const sheetStyle: CSSProperties = {
    height: `${currentHeightVh}vh`,
    transition: isDragging
      ? 'none'
      : 'height 300ms cubic-bezier(0.32, 0.72, 0, 1)',
  };

  const backdropStyle: CSSProperties = {
    opacity: backdropOpacity,
    transition: isDragging ? 'none' : 'opacity 300ms ease-out',
  };

  // Stacking: nested adiciona modifier que sobe o z-index pra empilhar
  // sobre outro sheet aberto (ex.: WifiOptimizeSheet em cima de
  // WifiDetailsSheet).
  const backdropClass = `lk-dsheet__backdrop${nested ? ' lk-dsheet__backdrop--nested' : ''}`;
  const sheetClass = `lk-dsheet${nested ? ' lk-dsheet--nested' : ''}`;

  return (
    <>
      <div
        className={backdropClass}
        style={backdropStyle}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={sheetClass}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <div
          className="lk-dsheet__handle-area"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          role="presentation"
        >
          <div className="lk-dsheet__handle" aria-hidden="true" />
        </div>
        <div className="lk-dsheet__content">{children}</div>
      </div>
    </>
  );
}
