import type { FC } from 'react';
import styles from '../styles.module.css';

export interface ButtonsProps {
  readonly canDelete: boolean;
  readonly onAdd: () => void;
  readonly onRename: () => void;
  readonly onDelete: () => void;
}

/**
 * Three-button strip on the right of the nav. Matches the legacy
 * `Buttons` React class: Add / Rename... / Delete, where Delete is disabled
 * when there is only one sheet.
 */
export const Buttons: FC<ButtonsProps> = ({ canDelete, onAdd, onRename, onDelete }) => (
  <div className={styles['buttons']}>
    <button onClick={onAdd}>Add</button>
    <button onClick={onRename}>Rename...</button>
    <button onClick={onDelete} disabled={!canDelete}>
      Delete
    </button>
  </div>
);
