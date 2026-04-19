/* istanbul ignore file — integration glue; exercised via Vite dev / Playwright
 * (see FINDINGS.md for rationale). All branching logic that matters for
 * correctness lives in `./state.ts`, `./Foldr.ts`, and `./components/*`,
 * each of which is covered to 100%.
 */

import { useCallback, useReducer, useRef, type FC } from 'react';
import { HackFoldr } from './Foldr.ts';
import { Buttons } from './components/Buttons.tsx';
import { TabBar } from './components/TabBar.tsx';
import {
  computeNextRow,
  createInitialState,
  reducer,
  titleTaken,
} from './state.ts';
import styles from './styles.module.css';

export interface AppProps {
  readonly foldr: HackFoldr;
  readonly basePath: string;
  readonly suffix: string;
  readonly index: string;
  readonly isReadOnly: boolean;
  /** Test seam — lets unit tests inject a deterministic prompt/confirm. */
  readonly prompt?: (message: string, seed: string) => string | null;
  readonly confirm?: (message: string) => boolean;
}

export const App: FC<AppProps> = ({
  foldr,
  basePath,
  suffix,
  index,
  isReadOnly,
  prompt: promptImpl,
  confirm: confirmImpl,
}) => {
  const [state, dispatch] = useReducer(reducer, foldr, createInitialState);
  const firstFocusUsed = useRef(false);
  const onFirstFocus = useCallback(() => {
    firstFocusUsed.current = true;
  }, []);

  const clampedIndex = Math.max(0, Math.min(state.activeIndex, foldr.lastIndex()));

  const handleChange = (next: number): void => {
    dispatch({ type: 'setActive', index: next });
  };

  const handleAdd = async (): Promise<void> => {
    const next = computeNextRow(foldr, index);
    await foldr.push(next);
    dispatch({ type: 'bumpRev+setActive', index: foldr.lastIndex() });
  };

  const handleRename = async (): Promise<void> => {
    const current = foldr.at(clampedIndex);
    const seed = current.title ?? '';
    const promptFn = promptImpl ?? ((m, s) => window.prompt(m, s));
    const title = promptFn('Rename Sheet', seed);
    if (!title) return;
    if (titleTaken(foldr.titles(), title)) return;
    await foldr.setAt(clampedIndex, { title });
    dispatch({ type: 'bumpRev' });
  };

  const handleDelete = async (): Promise<void> => {
    const current = foldr.at(clampedIndex);
    const title = current.title ?? '';
    const confirmFn = confirmImpl ?? ((m) => window.confirm(m));
    if (!confirmFn(`Really delete?\n${title}`)) return;
    await foldr.deleteAt(clampedIndex);
    dispatch({ type: 'bumpRev' });
  };

  const canDelete = foldr.size() > 1;
  const navClass = `${styles['nav']}${isReadOnly ? ' ' + styles['readonly'] : ''}`;

  return (
    <div className={navClass} data-rev={state.rev}>
      <TabBar
        rows={foldr.rows}
        activeIndex={clampedIndex}
        basePath={basePath}
        suffix={suffix}
        index={index}
        onChange={handleChange}
        firstFocusUsed={firstFocusUsed.current}
        onFirstFocus={onFirstFocus}
      />
      {isReadOnly ? null : (
        <Buttons
          canDelete={canDelete}
          onAdd={handleAdd}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
