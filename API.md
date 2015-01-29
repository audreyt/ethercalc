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
