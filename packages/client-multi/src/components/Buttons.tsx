import type { FC } from 'react';
import styles from '../styles.module.css';

export interface ButtonsProps {
  readonly canDelete: boolean;
  readonly onAdd: () => void;
  readonly onRename: () => void;
  readonly onDelete: () => void;
  readonly onImport: (file: File) => void;
}

/**
 * Button strip on the right of the nav: Add / Import / Rename... / Delete, where
 * Delete is disabled when there is only one sheet.
 */
export const Buttons: FC<ButtonsProps> = ({
  canDelete,
  onAdd,
  onRename,
  onDelete,
  onImport,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <div className={styles['buttons']}>
      <button onClick={onAdd}>Add</button>
      <label style={{ cursor: 'pointer' }}>
        <span
          tabIndex={0}
          role="button"
          className={styles['importButton']}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.currentTarget.parentElement?.querySelector('input')?.click();
            }
          }}
        >
          Import
        </span>
        <input
          type="file"
          accept=".xlsx,.ods,.fods,.csv,.tsv,.txt,.socialcalc"
          style={{ display: 'none' }}
          data-testid="import-file-input"
          onChange={handleFileChange}
        />
      </label>
      <button onClick={onRename}>Rename...</button>
      <button onClick={onDelete} disabled={!canDelete}>
        Delete
      </button>
    </div>
  );
};
