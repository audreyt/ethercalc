import { useCallback, useReducer, useRef, type FC } from 'react';
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
  const onFirstFocus = useCallback(() => {
    firstFocusUsed.current = true;
  }, []);
  const onTocSync = useCallback(() => {
    dispatch({ type: 'syncToc' });
  }, []);
  useTocPoll(foldr, onTocSync);

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
      />
      {isReadOnly ? null : (
        <Buttons
          canDelete={canDelete}
          onAdd={handleAdd}
          onImport={handleImport}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
