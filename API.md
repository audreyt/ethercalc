FORMAT: 1A
HOST: https://www.ethercalc.org/

# EtherCalc

API for real-time collaborative spreadsheets.

* Introduction:
    * English: https://gist.github.com/3978463
    * 中文版: https://gist.github.com/3985324
* Overview:
    * English: http://ethercalc.net/
    * 中文版: http://ethercalc.tw/

# Index [/_]

## Create Page [POST]

+ Request (application/json)
+ Response 201

## Create from CSV [POST]

+ Request (text/csv)
+ Response 201

## Create from SocialCalc [POST]

+ Request (text/x-socialcalc)
+ Response 201

# Page [/_/{id}]

## GET

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
+ Response 200 (application/json)

# Cell Value [/_/{id}/cells/{coord}]

## GET
+ Response 200 (application/json)

# HTML Export [/_/{id}.html]

## GET
+ Response 200 (text/html)

# CSV Export [/_/{id}.csv]

## GET
+ Response 200 (text/csv)
