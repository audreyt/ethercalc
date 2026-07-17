FORMAT: 1A
HOST: https://www.ethercalc.org/

# EtherCalc

API for real-time collaborative spreadsheets.

* Overview: http://ethercalc.net/
* 中文版: http://ethercalc.tw/

Note: When using `curl`, please make sure to `--data-binary` instead of `--data`. For example:

```bash
curl -X PUT -H 'Content-Type: text/x-socialcalc' \
     --data-binary @example.sc http://127.0.0.1:8000/_/example
```

# Index [/_]

## Create Page [POST]

Takes a JSON structure with `room` and `snapshot` fields.

Replaces the page with a serialization in Socialtext save format.
If `room` is not specified, returns a new page.

+ Request (application/json)

    ```json
    { "room": "test"
    , "snapshot": "..."
    }
    ```

+ Response 201
    + Headers

        ```
        Location: /_/test
        ```

## Create from CSV [POST]

Takes a CSV structure that contains the new spreadsheet's content.

+ Request (text/csv)
+ Response 201

## Create from SocialCalc [POST]

Takes a SocialCalc serialization format that contains the new spreadsheet's content.

+ Request (text/x-socialcalc)
+ Response 201

## Create from Excel XML [POST]

Takes a Excel XML file that contains the new spreadsheet's content.

+ Request (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
+ Response 201

# Page [/_/{id}]

## Page Content [GET]

Fetch the page as a serialization in SocialCalc save format.

+ Response 200 (text/x-socialcalc)

## Overwrite with CSV [PUT]

Replace the page with a serialization in CSV format.

+ Request (text/csv)
+ Response 200

## Overwrite with SocialCalc [PUT]

Replace the page with a serialization in SocialCalc save format.

+ Request (text/x-socialcalc)
+ Response 200

## Overwrite with Excel XML [PUT]

Replace the page with a serialization in Excel XML format.

+ Request (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
+ Response 200

## Post Commands [POST]

Takes a JSON structure with a `command` field (either as a string
or an array of strings), or a plain-text command string.

Runs one or more commands specified in the `command` field.

To find out which command corresponds to which spreadsheet actions,
perform the actions on the web interface and check the _Audit_ tab
for the recorded commands.

+ Request (application/json)
+ Response 202

    ```json
    {"command": "..."}
    ```

## Append Rows [POST]

Takes a CSV structure that contains fields to be appended to the first column after the last row.

+ Parameters
    + row (optional, integer) ... If specified, insert and paste on the specified row instead of the last.
+ Request (text/csv)
+ Response 200

## Delete Room [DELETE]

Deletes a room from the database

+ Response 201 OK

# Point-in-Time Restore [/_/{id}/pitr-restore]

## Restore a hosted room [POST]

Restores the complete SQLite-backed Durable Object for one room to a Cloudflare PITR bookmark from approximately the previous 30 days. This recovers the snapshot, commands, audit/chat state, cell metadata, and alarms together. Local Miniflare and standalone workerd do not retain PITR history and return `501`.

The route requires the deployment operator token:

```text
Authorization: Bearer <ETHERCALC_MIGRATE_TOKEN>
```

If `ETHERCALC_MIGRATE_TOKEN` is unset, the route is hidden with `404`. A missing or incorrect bearer returns `401`.

Supply exactly one target. `at` accepts a positive millisecond epoch or an ISO-8601 timestamp. `dryRun` resolves and returns the target bookmark without scheduling a restore:

+ Request (application/json)

    ```json
    { "at": "2026-07-10T00:00:00.000Z", "dryRun": true }
    ```

+ Response 200 (application/json)

    ```json
    { "dryRun": true, "bookmark": "0000007b-..." }
    ```

Apply either the resolved bookmark or a previously returned undo bookmark:

+ Request (application/json)

    ```json
    { "bookmark": "0000007b-..." }
    ```

+ Response 200 (application/json)

    ```json
    {
      "restored": true,
      "bookmark": "0000007b-...",
      "undoBookmark": "0000009d-...",
      "exists": true,
      "updatedAt": 1783641600000
    }
    ```

`exists` is `false` when the restored point predates room creation; `updatedAt` is then omitted. To undo a restore, submit the returned `undoBookmark` as `bookmark`.

A freshly created room has no PITR history until Cloudflare's change log catches up (about a minute in practice). Until then, timestamp dry-runs return `400 PITR target is unavailable`; poll the dry-run before scheduling a real restore.

Invalid requests or unavailable/expired targets return `400`. An unsupported deployment returns `501`. A dispatch failure before the restore is accepted returns `502` as plain text — nothing was scheduled. Once the restore is accepted, the rewind is already armed, so later failures return JSON that keeps the reverse handle:

+ Response 500 (application/json)

    ```json
    {
      "accepted": true,
      "bookmark": "0000007b-...",
      "undoBookmark": "0000009d-...",
      "error": "PITR restore did not restart the room"
    }
    ```

Finalization failures after a confirmed restart use the same shape with status `502` and `"error": "PITR restore finalization failed"`. In both cases retain `undoBookmark`: the restore may have applied (or still apply), and submitting `undoBookmark` reverses it.

# Page Cells [/_/{id}/cells]

## GET

Returns a JSON representation of all defined cells in the page.

+ Response 200 (application/json)

# Cell Value [/_/{id}/cells/{coord}]

## GET

Returns a JSON representation of a single cell in the page.

+ Response 200 (application/json)

# HTML Export [/{id}.html]

## GET

Returns a HTML rendering of the page. (GET `/_/{id}/html` also works.)

+ Response 200 (text/html)

# CSV Export [/{id}.csv]

## GET

Returns a CSV rendering of the page. (GET `/_/{id}/csv` also works.)

+ Response 200 (text/csv)

# JSON Export [/{id}.csv.json]

## GET

Returns a JSON array-of-array rendering of the page. (GET `/_/{id}/csv.json` also works.)

+ Response 200 (application/json)

# Excel XML Export [/{id}.xlsx]

## GET

Returns a Excel XML rendering of the page. (GET `/_/{id}/xlsx` also works.)

+ Response 200 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

# Markdown Export [/{id}.md]

## GET

Returns a Excel XML rendering of the page. (GET `/_/{id}/md` also works.)

+ Response 200 (text/x-markdown)

# Multi-sheet Excel XML [/={id}.xlsx]

## Export [GET]

Fetch the sheet collection in Excel XML format.  (GET `/_/{id}/xlsx` also works.)

+ Response 200 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

## Import [PUT]

Replace the page with a serialization in Excel XML format.

+ Request (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
+ Response 200

# Rooms [/_rooms]

## Index of rooms [GET]

Get index of rooms.  Will fail with 403 if CORS is enabled.

+ Response 200

# Page [/_exists/{id}]

## Page Exists [GET]

Check if page exists

+ Response 200 (application/json)


# Passkey Auth [/_auth]

Available when the deployment sets `ETHERCALC_AUTH` plus the WebAuthn
trust anchors (`ETHERCALC_RP_ID`, `ETHERCALC_ORIGIN`); otherwise every
ceremony route responds 404. Sessions are carried by the HttpOnly
`ec_sess` cookie — tokens never appear in response bodies.

## Register Init [POST /_auth/register-init]

Begin creating a passkey. Returns WebAuthn creation options plus the
server-generated user id.

+ Response 200 (application/json)

## Register Complete [POST /_auth/register-complete]

Takes `{response, uid, challenge}` from the browser ceremony. On
success sets the `ec_sess` cookie and returns `{uid}`.

+ Response 200 (application/json)

## Login Init [POST /_auth/login-init]

Begin a usernameless (discoverable-credential) login.

+ Response 200 (application/json)

## Login Complete [POST /_auth/login-complete]

Takes `{response, challenge}`. On success sets the `ec_sess` cookie and
returns `{uid}`.

+ Response 200 (application/json)

## Who Am I [GET /_auth/whoami]

Returns `{uid, enabled}` — `uid` is null for anonymous visitors and
`enabled` reports whether passkey auth is configured at all.

+ Response 200 (application/json)

## Logout [POST /_auth/logout]

Clears the session cookie.

+ Response 204

# Private Page [/_/private]

## Create Private Page [POST]

Requires a passkey session. Creates a fresh room readable and writable
only by the owner, and returns `{room}` with a Location header.
Private rooms never appear in `/_rooms` listings, and every read,
write, export, and WebSocket path answers 403 for non-members.

+ Response 201 (application/json)
+ Response 401 — no passkey session

# Private Copy [/_from/{id}/private]

## Copy to Private [POST]

Requires a passkey session. Copies a readable page into a fresh
private room owned by the caller and redirects to its edit view.

+ Response 302
+ Response 401 — no passkey session
+ Response 403 — source page not readable by the caller

