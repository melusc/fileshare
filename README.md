# fileshare

Self-hosted, minimal file share.

## Configuration / env variables

### FILESHARE_BIND_PORT

TCP port to bind to. Default `3178`.

### FILESHARE_BIND_HOST

Interface to bind to. Default `127.0.0.1`.

### FILESHARE_BIND_SOCKET

Bind to unix socket. Default unset.

Takes precedence over port and host, if set.

### FILESHARE_SESSION_SECRET

Secret used for JWTs. Randomly generated if unset.

### FILESHARE_BASE_URL

Base URL that fileshare is served on. This value must be set!

### FILESHARE_TRUST_PROXY

Set express' `trust proxy` value. See <https://expressjs.com/en/guide/behind-proxies.html>.
When using `FILESHARE_BIND_SOCKET`, this can be set to `true`.
