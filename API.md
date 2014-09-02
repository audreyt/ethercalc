FORMAT: 1A
HOST: https://www.ethercalc.org/

# EtherCalc
API for real-time collaborative spreadsheets.

# Index [/_]

## POST

+ Request (text/csv)
+ Response 201

+ Request (text/x-socialcalc)
+ Response 201

+ Request (application/json)
+ Response 201

# Page [/_/{id}]

## GET

+ Response 200 (text/x-socialcalc)

## PUT

+ Request (text/csv)
+ Response 200

+ Request (text/x-socialcalc)
+ Response 200

## POST

+ Request (text/csv)
+ Response 200

+ Request (application/json)
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
