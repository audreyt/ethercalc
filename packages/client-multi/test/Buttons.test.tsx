import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Buttons } from '../src/components/Buttons.tsx';

describe('<Buttons />', () => {
  it('renders three buttons with the legacy labels', () => {
    render(<Buttons canDelete onAdd={() => {}} onRename={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('disables Delete when canDelete is false', () => {
    render(<Buttons canDelete={false} onAdd={() => {}} onRename={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('enables Delete when canDelete is true', () => {
    render(<Buttons canDelete onAdd={() => {}} onRename={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('fires onAdd on click', async () => {
    const onAdd = vi.fn();
    render(<Buttons canDelete onAdd={onAdd} onRename={() => {}} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('fires onRename on click', async () => {
    const onRename = vi.fn();
    render(<Buttons canDelete onAdd={() => {}} onRename={onRename} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename...' }));
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it('fires onDelete on click when enabled', async () => {
    const onDelete = vi.fn();
    render(<Buttons canDelete onAdd={() => {}} onRename={() => {}} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDelete when disabled', async () => {
    const onDelete = vi.fn();
    render(<Buttons canDelete={false} onAdd={() => {}} onRename={() => {}} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
