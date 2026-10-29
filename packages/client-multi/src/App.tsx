import { useCallback, useEffect, useReducer, useRef, type FC } from 'react';
import { HackFoldr } from './Foldr.ts';
import { appendImportedWorkbook } from './importWorkbook.ts';
import { Buttons } from './components/Buttons.tsx';
import { TabBar } from './components/TabBar.tsx';
import {
  computeNextRow,
  createInitialState,
  reducer,
  titleTaken,
} from './state.ts';
import { useTocPoll } from './useTocPoll.ts';
import styles from './styles.module.css';

export interface AppProps {
  readonly foldr: HackFoldr;
  readonly basePath: string;
  readonly suffix: string;
  readonly index: string;
  readonly isReadOnly: boolean;
  /** Test seams for browser dialogs and same-origin requests. */
  readonly prompt?: ((message: string, seed: string) => string | null) | undefined;
  readonly confirm?: ((message: string) => boolean) | undefined;
  readonly alert?: ((message: string) => void) | undefined;
  readonly fetch?: typeof fetch | undefined;
}

export const App: FC<AppProps> = ({
  foldr,
  basePath,
  suffix,
  index,
  isReadOnly,
  prompt: promptImpl,
  confirm: confirmImpl,
  alert: alertImpl,
  fetch: fetchImpl,
}) => {
  const [state, dispatch] = useReducer(reducer, foldr, createInitialState);
  const firstFocusUsed = useRef(false);
  const importQueue = useRef<Promise<void>>(Promise.resolve());
  const pivotRequest = useRef(false);
  const pivotSourceWindow = useRef<Window | null>(null);
  type PivotSource = { headers: string[]; rows: string[][]; rawRows: string[][] };
  const [pivotSheet, setPivotSheet] = useReducer(
    (_: { link: string; source: PivotSource } | null,
      next: { link: string; source: PivotSource } | null) => next,
    null,
  );
  const onFirstFocus = useCallback(() => {
    firstFocusUsed.current = true;
  }, []);
  const onTocSync = useCallback(() => {
    dispatch({ type: 'syncToc' });
  }, []);
  useTocPoll(foldr, onTocSync);

  useEffect(() => {
    const onMessage = async (event: MessageEvent<unknown>): Promise<void> => {
      if (event.origin !== window.location.origin || !pivotRequest.current || event.source !== pivotSourceWindow.current || !event.data || typeof event.data !== 'object') return;
      const message = event.data as { type?: unknown; source?: { headers?: unknown; rows?: unknown; rawRows?: unknown } };
      if (message.type !== 'ethercalc:pivot-source' || !Array.isArray(message.source?.headers) || !Array.isArray(message.source?.rows) || !Array.isArray(message.source?.rawRows)) return;
      const source = message.source as PivotSource;
      if (!source.headers.every((v) => typeof v === 'string') || !source.rows.every((r) => Array.isArray(r) && r.every((v) => typeof v === 'string')) || !source.rawRows.every((r) => Array.isArray(r) && r.every((v) => typeof v === 'string'))) return;
      pivotRequest.current = false;
      pivotSourceWindow.current = null;
      const next = computeNextRow(foldr, index);
      let pivotTitle = 'Pivot';
      let suffix = 2;
      while (foldr.titles().some((title) => title.toLowerCase() === pivotTitle.toLowerCase())) {
        pivotTitle = `Pivot ${suffix++}`;
      }
      const ok = await foldr.pushChecked({ ...next, title: pivotTitle });
      if (!ok) {
        (alertImpl ?? ((m) => window.alert(m)))('Could not create the Pivot sheet.');
        return;
      }
      const created = foldr.lastRow();
      const link = created.link ?? '';
      setPivotSheet({ link, source });
      dispatch({ type: 'bumpRev+setActive', index: foldr.lastIndex() });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [foldr, index, alertImpl]);

  const clampedIndex = Math.max(0, Math.min(state.activeIndex, foldr.lastIndex()));

  const handleChange = (next: number): void => {
    dispatch({ type: 'setActive', index: next });
  };

  const handleAdd = async (): Promise<void> => {
    const next = computeNextRow(foldr, index);
    await foldr.push(next);
    dispatch({ type: 'bumpRev+setActive', index: foldr.lastIndex() });
  };

  const handleRename = async (targetIndex?: number): Promise<void> => {
    const idx = typeof targetIndex === 'number' ? targetIndex : clampedIndex;
    if (idx !== clampedIndex) {
      handleChange(idx);
    }
    const current = foldr.rows[idx]!;
    const seed = current.title;
    const promptFn = promptImpl ?? ((m, s) => window.prompt(m, s));
    const title = promptFn('Rename Sheet', seed);
    if (!title) return;
    if (titleTaken(foldr.titles(), title, idx)) return;
    await foldr.setAt(idx, { title });
    dispatch({ type: 'bumpRev' });
  };

  const handleDelete = async (): Promise<void> => {
    const current = foldr.rows[clampedIndex]!;
    const title = current.title;
    const confirmFn = confirmImpl ?? ((m) => window.confirm(m));
    if (!confirmFn(`Really delete?\n${title}`)) return;
    await foldr.deleteAt(clampedIndex);
    dispatch({ type: 'bumpRev' });
  };
  const handlePivotTable = (): void => {
    const frame = document.querySelector<HTMLIFrameElement>('[data-state="active"] iframe');
    if (!frame?.contentWindow) return;
    pivotRequest.current = true;
    pivotSourceWindow.current = frame.contentWindow;
    frame.contentWindow.postMessage({ type: 'ethercalc:create-pivot-table' }, window.location.origin);
  };
  const handleImport = (file: File): void => {
    importQueue.current = importQueue.current.then(async () => {
      await foldr.refreshToc();
      const ok = await appendImportedWorkbook({
        foldr,
        index,
        basePath,
        file,
        fetchImpl: fetchImpl ?? fetch.bind(globalThis),
        alertImpl: alertImpl ?? ((message) => window.alert(message)),
      });
      if (ok) dispatch({ type: 'bumpRev+setActive', index: foldr.lastIndex() });
    });
  };

  const canDelete = foldr.size() > 1;
  const navClass = [styles['nav'], isReadOnly ? styles['readonly'] : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={navClass} data-rev={state.rev}>
      <TabBar
        rows={foldr.rows}
        activeIndex={clampedIndex}
        rowsRev={state.rev}
        basePath={basePath}
        suffix={suffix}
        index={index}
        onChange={handleChange}
        onRename={isReadOnly ? undefined : handleRename}
        firstFocusUsed={firstFocusUsed.current}
        onFirstFocus={onFirstFocus}
        pivotLink={pivotSheet?.link}
        pivotSource={pivotSheet?.source}
      />
      {isReadOnly ? null : (
        <Buttons
          canDelete={canDelete}
          onAdd={handleAdd}
          onImport={handleImport}
          onRename={handleRename}
          onDelete={handleDelete}
          onPivotTable={handlePivotTable}
        />
      )}
    </div>
  );
};
