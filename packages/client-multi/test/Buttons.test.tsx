import { describe, it, expect, vi } from 'vite-plus/test';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Buttons } from '../src/components/Buttons.tsx';

const noopImport = (): void => {};

describe('<Buttons />', () => {
  it('renders three buttons with the legacy labels', () => {
    render(
      <Buttons
        canDelete
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onImport={noopImport}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('disables Delete when canDelete is false', () => {
    render(
      <Buttons
        canDelete={false}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onImport={noopImport}
      />,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('enables Delete when canDelete is true', () => {
    render(
      <Buttons
        canDelete
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onImport={noopImport}
      />,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('fires onAdd on click', async () => {
    const onAdd = vi.fn();
    render(
      <Buttons
        canDelete
        onAdd={onAdd}
        onRename={() => {}}
        onDelete={() => {}}
        onImport={noopImport}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('fires onRename on click', async () => {
    const onRename = vi.fn();
    render(
      <Buttons
        canDelete
        onAdd={() => {}}
        onRename={onRename}
        onDelete={() => {}}
        onImport={noopImport}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Rename...' }));
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it('fires onDelete on click when enabled', async () => {
    const onDelete = vi.fn();
    render(
      <Buttons
        canDelete
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={onDelete}
        onImport={noopImport}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDelete when disabled', async () => {
    const onDelete = vi.fn();
    render(
      <Buttons
        canDelete={false}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={onDelete}
        onImport={noopImport}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
  });
  it('renders Import button and triggers onImport on file selection', async () => {
    const onImport = vi.fn();
    render(
      <Buttons
        canDelete
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onImport={onImport}
      />,
    );

    const importBtn = screen.getByRole('button', { name: 'Import' });
    expect(importBtn).toBeInTheDocument();

    const fileInput = screen.getByTestId('import-file-input');
    const file = new File(['a,b'], 'test.csv', { type: 'text/csv' });
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    // Test keydown accessibility: Enter key, Space key, and non-triggering key (Escape)
    fireEvent.keyDown(importBtn, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockClear();

    fireEvent.keyDown(importBtn, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockClear();

    fireEvent.keyDown(importBtn, { key: 'Escape' });
    expect(clickSpy).not.toHaveBeenCalled();

    fireEvent.change(fileInput, { target: { files: [] } });
    expect(onImport).not.toHaveBeenCalled();

    await userEvent.upload(fileInput, file);
    expect(onImport).toHaveBeenCalledWith(file);
    clickSpy.mockRestore();
  });
});
