import { describe, it, expect, vi } from 'vite-plus/test';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { HackFoldr } from '../src/Foldr.ts';

function createMockFoldr(): HackFoldr {
  const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/csv.json')) {
      return {
        ok: true,
        json: async () => [
          ['#url', '#title'],
          ['/room.1', 'Sheet1'],
          ['/room.2', 'Sheet2'],
        ],
      };
    }
    if (init?.method === 'POST') {
      return {
        ok: true,
        json: async () => ({ command: ['ok', 'paste A2 all'] }),
      };
    }
    if (init?.method === 'PUT') {
      return {
        ok: true,
        text: async () => 'OK',
      };
    }
    return { ok: true, json: async () => null };
  });

  const foldr = new HackFoldr('http://localhost', { fetchImpl: fetchMock });
  foldr.id = 'room';
  foldr.rows = [
    { link: '/room.1', title: 'Sheet1', row: 2 },
    { link: '/room.2', title: 'Sheet2', row: 3 },
  ];
  return foldr;
}

describe('<App /> integration', () => {
  it('renders tab bar and button strip', () => {
    const foldr = createMockFoldr();
    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Sheet1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sheet2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('double-clicking an inactive tab selects and renames THAT tab', async () => {
    const foldr = createMockFoldr();
    const promptMock = vi.fn().mockReturnValue('RenamedSheet2');

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
        prompt={promptMock}
      />,
    );

    // Active tab initially is Sheet1 (index 0)
    const tab2 = screen.getByRole('tab', { name: 'Sheet2' });
    await act(async () => {
      fireEvent.doubleClick(tab2);
    });

    expect(promptMock).toHaveBeenCalledWith('Rename Sheet', 'Sheet2');
    expect(foldr.rows[1]?.title).toBe('RenamedSheet2');
  });

  it('clicking strip Rename renames the active tab', async () => {
    const foldr = createMockFoldr();
    const promptMock = vi.fn().mockReturnValue('RenamedSheet1');

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
        prompt={promptMock}
      />,
    );

    const renameButton = screen.getByRole('button', { name: 'Rename...' });
    await userEvent.click(renameButton);

    expect(promptMock).toHaveBeenCalledWith('Rename Sheet', 'Sheet1');
    expect(foldr.rows[0]?.title).toBe('RenamedSheet1');
  });

  it('does nothing when prompt is cancelled or title is taken or empty', async () => {
    const foldr = createMockFoldr();
    const promptMock = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce('Sheet2');

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
        prompt={promptMock}
      />,
    );

    const renameButton = screen.getByRole('button', { name: 'Rename...' });
    // Prompt cancelled
    await userEvent.click(renameButton);
    expect(foldr.rows[0]?.title).toBe('Sheet1');

    // Title taken ("Sheet2")
    await userEvent.click(renameButton);
    expect(foldr.rows[0]?.title).toBe('Sheet1');
  });

  it('adds a new sheet when Add button is clicked', async () => {
    const foldr = createMockFoldr();

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
      />,
    );

    const addButton = screen.getByRole('button', { name: 'Add' });
    await userEvent.click(addButton);

    expect(foldr.rows).toHaveLength(3);
    expect(foldr.rows[2]?.title).toBe('Sheet3');
  });

  it('deletes sheet when confirmed, or cancels when rejected', async () => {
    const foldr = createMockFoldr();
    const confirmMock = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
        confirm={confirmMock}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    // Cancelled delete
    await userEvent.click(deleteButton);
    expect(foldr.rows).toHaveLength(2);

    // Confirmed delete
    await userEvent.click(deleteButton);
    expect(foldr.rows).toHaveLength(1);
  });

  it('imports a file and appends it as a new sheet', async () => {
    const foldr = createMockFoldr();
    const alertMock = vi.fn();
    const importFetch = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
        alert={alertMock}
        fetch={importFetch}
      />,
    );

    const fileInput = screen.getByTestId('import-file-input');
    const file = new File(['col1,col2\nval1,val2'], 'ImportedData.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(foldr.rows).toHaveLength(3);
      expect(foldr.rows[2]?.title).toBe('ImportedData');
      expect(importFetch).toHaveBeenCalledWith(
        'http://localhost/_/room.3',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });


  it('serializes overlapping imports so each allocates a distinct subroom', async () => {
    const serverRows = [
      { link: '/room.1', title: 'Sheet1' },
      { link: '/room.2', title: 'Sheet2' },
    ];
    const tocFetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const [link, title] = String(init.body)
          .split(',')
          .map((field) => field.replace(/^"|"$/g, ''));
        serverRows.push({ link: link!, title: title! });
        return {
          ok: true,
          json: async () => ({ command: [0, `paste A${serverRows.length + 1} all`] }),
        };
      }
      return {
        ok: true,
        json: async () => [
          ['#url', '#title'],
          ...serverRows.map(({ link, title }) => [link, title]),
        ],
      };
    }) as unknown as typeof fetch;
    const foldr = new HackFoldr('http://localhost', { fetchImpl: tocFetch });
    foldr.id = 'room';
    foldr.rows = serverRows.map(({ link, title }, offset) => ({ link, title, row: offset + 2 }));

    let resolveFirst!: (response: Response) => void;
    const firstPut = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const importFetch = vi.fn()
      .mockReturnValueOnce(firstPut)
      .mockResolvedValueOnce(new Response('OK', { status: 201 }));

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
        fetch={importFetch}
        alert={vi.fn()}
      />,
    );

    const input = screen.getByTestId('import-file-input');
    fireEvent.change(input, { target: { files: [new File(['first'], 'first.csv')] } });
    fireEvent.change(input, { target: { files: [new File(['second'], 'second.csv')] } });

    await waitFor(() => expect(importFetch).toHaveBeenCalledTimes(1));
    expect(importFetch.mock.calls[0]?.[0]).toBe('http://localhost/_/room.3');
    resolveFirst(new Response('OK', { status: 201 }));

    await waitFor(() => expect(importFetch).toHaveBeenCalledTimes(2));
    expect(importFetch.mock.calls[1]?.[0]).toBe('http://localhost/_/room.4');
  });

  it('hides buttons and disables rename in read-only mode', async () => {
    const foldr = createMockFoldr();
    const promptMock = vi.fn();

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={true}
        prompt={promptMock}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rename...' })).not.toBeInTheDocument();

    const tab2 = screen.getByRole('tab', { name: 'Sheet2' });
    await userEvent.dblClick(tab2);

    expect(promptMock).not.toHaveBeenCalled();
  });

  it('uses production browser dialogs and surfaces a server import rejection', async () => {
    const foldr = createMockFoldr();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('BrowserRename');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('sheet exceeds limits', { status: 413 }),
    );

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Rename...' }));
    expect(promptSpy).toHaveBeenCalledWith('Rename Sheet', 'Sheet1');
    expect(foldr.rows[0]?.title).toBe('BrowserRename');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirmSpy).toHaveBeenCalledWith('Really delete?\nBrowserRename');
    expect(foldr.rows).toHaveLength(2);

    fireEvent.change(screen.getByTestId('import-file-input'), {
      target: { files: [new File(['a'], 'upload.csv')] },
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Import failed (413): sheet exceeds limits');
    });

    fetchSpy.mockRestore();
  });

  it('renders a peer TOC change received by the polling callback', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        ['#url', '#title'],
        ['/room.1', 'PeerRename'],
        ['/room.2', 'Sheet2'],
      ],
    }) as unknown as typeof fetch;
    const foldr = new HackFoldr('http://localhost', { fetchImpl });
    foldr.id = 'room';
    foldr.rows = [
      { link: '/room.1', title: 'Sheet1', row: 2 },
      { link: '/room.2', title: 'Sheet2', row: 3 },
    ];

    render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
      />,
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(screen.getByRole('tab', { name: 'PeerRename' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('records the first iframe focus through App state glue', () => {
    vi.useFakeTimers();
    const foldr = createMockFoldr();
    const { container } = render(
      <App
        foldr={foldr}
        basePath="http://localhost"
        suffix=""
        index="room"
        isReadOnly={false}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const focus = vi.fn();
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: 'complete' }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: vi.fn(), focus }),
      configurable: true,
    });

    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(100);
    expect(focus).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
