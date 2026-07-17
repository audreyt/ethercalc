import { test, expect } from '../src/fixtures.ts';
import { unzipSync } from 'fflate';

test.describe('Worker room CRUD and export lifecycle', () => {
  test('covers nonexistence, create, read save, overwrite, command, cells, exports (both route forms), delete', async ({
    workerBase,
    request,
  }) => {
    const room = `crud-spec-${Date.now().toString(36)}`;

    // 1. Nonexistence checks
    // Raw save returns 404
    const getNoRoom = await request.get(`${workerBase}/_/${room}`);
    expect(getNoRoom.status()).toBe(404);

    // Export formats return 200 but serve empty sheets/data
    const getNoRoomCsv = await request.get(`${workerBase}/${room}.csv`);
    expect(getNoRoomCsv.status()).toBe(200);
    expect(await getNoRoomCsv.text()).toBe('\n');

    const getNoRoomXlsx = await request.get(`${workerBase}/_/${room}/xlsx`);
    expect(getNoRoomXlsx.status()).toBe(200);
    const getNoRoomXlsxBuffer = await getNoRoomXlsx.body();
    expect(getNoRoomXlsxBuffer.length).toBeGreaterThan(0); // Valid blank sheet zip

    // 2. Create room via POST /_ with CSV data
    const initialCsv = 'A1,B1\nhello,123';
    const createRes = await request.post(`${workerBase}/_`, {
      headers: { 'Content-Type': 'text/csv' },
      data: initialCsv,
    });
    expect(createRes.status()).toBe(201);
    const location = createRes.headers()['location'];
    expect(location).toBeDefined();
    // E.g., Location: /_/crud-spec-xxxx
    const createdRoomId = location!.split('/').pop()!;
    expect(createdRoomId).toBeTruthy();

    const createdRoomUrl = `${workerBase}/_/${createdRoomId}`;

    // Verify it exists now (returns 200)
    const getRoomRaw = await request.get(createdRoomUrl);
    expect(getRoomRaw.status()).toBe(200);

    // 3. Read raw save (text/plain; charset=utf-8)
    const rawSaveRes = await request.get(createdRoomUrl);
    expect(rawSaveRes.status()).toBe(200);
    expect(rawSaveRes.headers()['content-type']).toContain('text/plain');
    const rawSave = await rawSaveRes.text();
    // The CSV has 'A1,B1' as row 1, and 'hello,123' as row 2. So A2 contains 'hello', B2 contains '123'.
    expect(rawSave).toContain('cell:A2:t:hello');
    expect(rawSave).toContain('cell:B2:v:123');

    // 4. Overwrite room content via PUT /_/:room with new CSV data
    const newCsv = 'foo,bar\n999,888';
    const overwriteRes = await request.put(createdRoomUrl, {
      headers: { 'Content-Type': 'text/csv' },
      data: newCsv,
    });
    // Worker PUT /_/:room returns 201 OK text/plain on success
    expect(overwriteRes.status()).toBe(201);
    expect(await overwriteRes.text()).toBe('OK');

    // Verify PUT overwrite
    const afterPutSaveRes = await request.get(createdRoomUrl);
    expect(await afterPutSaveRes.text()).toContain('cell:A1:t:foo');

    // Run command via POST /_/:room to update a cell
    // E.g. set A2 value n 777
    const commandRes = await request.post(createdRoomUrl, {
      headers: { 'Content-Type': 'application/json' },
      data: { command: 'set A2 value n 777' },
    });
    expect(commandRes.status()).toBe(202);
    const commandBody = await commandRes.json();
    expect(commandBody).toHaveProperty('command');

    // 5. Cells API checks
    // GET /_/:room/cells
    const cellsRes = await request.get(`${createdRoomUrl}/cells`);
    expect(cellsRes.status()).toBe(200);
    const cells = await cellsRes.json();
    // A2 should be updated
    expect(cells).toHaveProperty('A2');
    expect(cells.A2).toHaveProperty('datavalue', 777);

    // GET /_/:room/cells/A2
    const cellA2Res = await request.get(`${createdRoomUrl}/cells/A2`);
    expect(cellA2Res.status()).toBe(200);
    const cellA2 = await cellA2Res.json();
    expect(cellA2).toHaveProperty('datavalue', 777);

    // 6. Export CSV (Both route forms)
    // Form A: GET /_/:room/csv
    const csvFormARes = await request.get(`${createdRoomUrl}/csv`);
    expect(csvFormARes.status()).toBe(200);
    expect(csvFormARes.headers()['content-type']).toContain('text/csv');
    expect(csvFormARes.headers()['content-disposition']).toBe(`attachment; filename="${createdRoomId}.csv"`);
    const csvFormA = await csvFormARes.text();
    expect(csvFormA).toContain('foo,bar\n777,888\n');

    // Form B: GET /:room.csv
    const csvFormBRes = await request.get(`${workerBase}/${createdRoomId}.csv`);
    expect(csvFormBRes.status()).toBe(200);
    expect(csvFormBRes.headers()['content-type']).toContain('text/csv');
    expect(csvFormBRes.headers()['content-disposition']).toBe(`attachment; filename="${createdRoomId}.csv"`);
    const csvFormB = await csvFormBRes.text();
    expect(csvFormB).toBe(csvFormA);

    // 7. Export csv.json (Both route forms)
    // Form A: GET /_/:room/csv.json
    const jsonFormARes = await request.get(`${createdRoomUrl}/csv.json`);
    expect(jsonFormARes.status()).toBe(200);
    expect(jsonFormARes.headers()['content-type']).toContain('application/json');
    const jsonFormA = await jsonFormARes.json();
    expect(jsonFormA).toEqual([['foo', 'bar'], ['777', '888']]);

    // Form B: GET /:room.csv.json
    const jsonFormBRes = await request.get(`${workerBase}/${createdRoomId}.csv.json`);
    expect(jsonFormBRes.status()).toBe(200);
    const jsonFormB = await jsonFormBRes.json();
    expect(jsonFormB).toEqual(jsonFormA);

    // 8. Export HTML (Both route forms) and validate CSP
    const expectedCsp = "default-src 'none'; style-src 'unsafe-inline'";
    // Form A: GET /_/:room/html
    const htmlFormARes = await request.get(`${createdRoomUrl}/html`);
    expect(htmlFormARes.status()).toBe(200);
    expect(htmlFormARes.headers()['content-type']).toContain('text/html');
    expect(htmlFormARes.headers()['content-security-policy']).toBe(expectedCsp);
    const htmlFormA = await htmlFormARes.text();
    expect(htmlFormA).toContain('<table');
    expect(htmlFormA).toContain('777');

    // Form B: GET /:room.html
    const htmlFormBRes = await request.get(`${workerBase}/${createdRoomId}.html`);
    expect(htmlFormBRes.status()).toBe(200);
    expect(htmlFormBRes.headers()['content-security-policy']).toBe(expectedCsp);
    const htmlFormB = await htmlFormBRes.text();
    expect(htmlFormB).toBe(htmlFormA);

    // 9. Export Markdown (Both route forms)
    // Form A: GET /_/:room/md
    const mdFormARes = await request.get(`${createdRoomUrl}/md`);
    expect(mdFormARes.status()).toBe(200);
    expect(mdFormARes.headers()['content-type']).toContain('text/x-markdown');
    const mdFormA = await mdFormARes.text();
    expect(mdFormA).toContain('| foo | bar |');
    expect(mdFormA).toContain('| 777 | 888 |');

    // Form B: GET /:room.md
    const mdFormBRes = await request.get(`${workerBase}/${createdRoomId}.md`);
    expect(mdFormBRes.status()).toBe(200);
    const mdFormB = await mdFormBRes.text();
    expect(mdFormB).toBe(mdFormA);

    // 10. Export XLSX (Both route forms) and validate zip/xml structural contents
    // Form A: GET /_/:room/xlsx
    const xlsxFormARes = await request.get(`${createdRoomUrl}/xlsx`);
    expect(xlsxFormARes.status()).toBe(200);
    expect(xlsxFormARes.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(xlsxFormARes.headers()['content-disposition']).toBe(`attachment; filename="${createdRoomId}.xlsx"`);
    const xlsxFormABuffer = await xlsxFormARes.body();

    // Verify Zip signature PK\x03\x04
    expect(xlsxFormABuffer.length).toBeGreaterThan(4);
    expect(xlsxFormABuffer[0]).toBe(0x50); // P
    expect(xlsxFormABuffer[1]).toBe(0x4B); // K
    expect(xlsxFormABuffer[2]).toBe(0x03);
    expect(xlsxFormABuffer[3]).toBe(0x04);

    // Unzip and validate structural contents
    const xlsxFormAEntries = unzipSync(new Uint8Array(xlsxFormABuffer));
    expect(xlsxFormAEntries['[Content_Types].xml']).toBeDefined();
    expect(xlsxFormAEntries['xl/workbook.xml']).toBeDefined();
    expect(xlsxFormAEntries['xl/worksheets/sheet1.xml']).toBeDefined();

    // Decode sheet1.xml to confirm cell values exist
    const sheet1Xml = new TextDecoder().decode(xlsxFormAEntries['xl/worksheets/sheet1.xml']);
    // Check for string "foo" / "bar" and numeric values
    expect(sheet1Xml).toContain('777');
    expect(sheet1Xml).toContain('888');

    // Form B: GET /:room.xlsx
    const xlsxFormBRes = await request.get(`${workerBase}/${createdRoomId}.xlsx`);
    expect(xlsxFormBRes.status()).toBe(200);
    const xlsxFormBBuffer = await xlsxFormBRes.body();
    // Compare buffers to check size/signature parity
    expect(xlsxFormBBuffer[0]).toBe(0x50);
    expect(xlsxFormBBuffer[1]).toBe(0x4B);

    // 11. Delete Room
    const deleteRes = await request.delete(createdRoomUrl);
    expect(deleteRes.status()).toBe(201);
    expect(await deleteRes.text()).toBe('OK');

    // 12. Nonexistence post-delete verification
    const getAfterDelete = await request.get(createdRoomUrl);
    expect(getAfterDelete.status()).toBe(404);

    const getCsvAfterDelete = await request.get(`${workerBase}/${createdRoomId}.csv`);
    expect(getCsvAfterDelete.status()).toBe(200); // Exporter initializes blank sheet on non-existent room
    expect(await getCsvAfterDelete.text()).toBe('\n');
  });
});
