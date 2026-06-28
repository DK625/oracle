# Service Map

| Service/module | Responsibility | Depends on | Notes |
| -------------- | -------------- | ---------- | ----- |
| Browser engine | Control ChatGPT, extract answers, collect downloads | Chrome/CDP, authenticated profile | Runs on Windows in case3 |
| Remote server | Execute browser runs and expose redacted artifact descriptors/bytes | Browser engine, bearer token | Hosts `/health`, `/runs`, artifact endpoint |
| Remote client | Submit runs and materialize validated artifacts on the client | Remote server, session artifact helpers | Runs on cloud Linux in case3 |
| Artifact helpers | Safe names, unique paths, SHA-256, generic/ZIP validation | Node filesystem/crypto | Shared by host and client |
| Session manager | Persist run status, response, warnings, and artifact metadata | Oracle home directory | Client paths must never be Windows host paths |
| Bridge CLI/doctor | Configure connection and report protocol capability | Remote health endpoint | `bridge v1` proves patched host support |
