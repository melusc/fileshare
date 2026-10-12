# API

Base URL: /api/v1/

Authorization with header `Authorization: Bearer $TOKEN`

## /upload

### Request Body

Content-Type `multipart/form-data`

Fields:

- `file`: The file to upload. If filename is included, the filename is saved and used when downloading the file.
- `longid`: `boolean` to use long ID or short ID for more or less obscurity. Actual ID lengths are implementation-specific.

## /status

### Response Body

```json
{
	"status": "ok",
	"user": "$USER",
	"uptime": 421337
}
```
