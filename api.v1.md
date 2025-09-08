# API

Base URL: /api/v1/

Authorization with header `Authorization: Bearer $TOKEN`

## /upload

Content-Type `multipart/form-data`

Fields:

- `file`: The file to upload. If filename is included, the filename is saved and used when downloading the file.
- `longid`: `boolean` to use long ID or short ID for more or less obscurity. Actual ID lengths are implementation-specific.
