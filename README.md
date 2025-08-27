# fileshare

Self-hosted, minimal file share.

## Configuration

### BIND_PORT

TCP port to bind to. Default `3178`.

### BIND_HOST

Interface to bind to. Default `127.0.0.1`.

### BIND_SOCKET

Bind to unix socket. Default unset.

Takes precedence if set.

### SESSION_SECRET

Secret used for JWTs. Randomly generated if unset.
