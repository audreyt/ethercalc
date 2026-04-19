import { useEffect, useRef, type FC } from 'react';
import type { FoldrRow } from '../Foldr.ts';

export interface SheetFrameProps {
  readonly src: string;
  readonly rows: readonly FoldrRow[];
  readonly index: string;
  readonly isFirst: boolean;
  /** Called the first time *any* frame receives focus — matches legacy boot. */
  readonly onFirstFocus?: () => void;
  readonly firstFocusUsed: boolean;
}

/**
 * Wraps a single iframe. After the iframe's document becomes `complete`, we
 * `postMessage({type:'multi', rows, index}, '*')` into it so the embedded
 * single-sheet app can render its tab chrome. Matches the legacy
 * `renderFrameContent` function.
 *
 * Notes preserved from legacy (see `multi/main.ls:85`):
 *  - 100 ms delay after `doc.readyState === 'complete'` before the postMessage.
 *  - The first iframe to mount receives focus exactly once via
 *    `contentWindow.focus()`.
 *  - Polling with `setTimeout(…, 1)` while the document is still loading.
 */
export const SheetFrame: FC<SheetFrameProps> = ({
  src,
  rows,
  index,
  isFirst,
  onFirstFocus,
  firstFocusUsed,
}) => {
  const ref = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // `ref.current` is always set by React before running this effect (the
    // iframe mounts synchronously as the immediate child), so we skip the
    // null guard. If that ever changes, the inner `node.contentDocument`
    // access fails gracefully via the `!doc` early-return.
    const node = ref.current as HTMLIFrameElement;
    let cancelled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const tryPost = (): void => {
      const doc = node.contentDocument;
      if (!doc) return;
      if (doc.readyState !== 'complete') {
        timeoutHandle = setTimeout(tryPost, 1);
        return;
      }
      timeoutHandle = setTimeout(() => {
        if (cancelled) return;
        const win = node.contentWindow;
        if (!win) return;
        win.postMessage(
          JSON.stringify({ type: 'multi', rows, index }, null, 2),
          '*',
        );
        if (isFirst && !firstFocusUsed) {
          win.focus();
          onFirstFocus?.();
        }
      }, 100);
    };

    tryPost();
    return () => {
      cancelled = true;
      // `clearTimeout` on `undefined` is a no-op per WHATWG, so we skip the
      // explicit null-check and keep the cleanup straight-line.
      clearTimeout(timeoutHandle as ReturnType<typeof setTimeout>);
    };
  }, [src, rows, index, isFirst, firstFocusUsed, onFirstFocus]);

  return <iframe ref={ref} key={src} src={src} />;
};
