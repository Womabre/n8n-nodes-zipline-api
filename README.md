# n8n-nodes-zipline-api

This is an n8n community node. It lets you use the [Zipline](https://zipline.diced.sh/) API in your n8n workflows.

Zipline is a self-hosted file and image sharing service. This node lets you upload files and query users, statistics and server/version information from your Zipline instance.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

To install from npm:

```sh
npm install n8n-nodes-zipline-api
```

## Operations

The node currently exposes the following resources and operations:

**File**
- **Upload** – upload a file (from an input binary field) with options for expiry, max views, password, folder, compression, name format and more.
- **Get Many** - list your files (all of them, or up to a limit) with sorting, filtering and search.
- **Get** – fetch a single file's metadata by ID.
- **Update** – update a file's metadata (favorite, name, password, max views, type, …).
- **Delete** – delete a file by ID.
- **Download** – download a file's raw contents as binary data.

**System**
- **Get Version** – backend version and upstream/latest info.
- **Health Check** – check that the instance is healthy.
- **Get Stats** – instance metrics over a date range (or all time).

> Roadmap: URL shortener, Folders, Tags, User (self) and Users (admin), and server administration are planned for upcoming releases. WebAuthn/MFA/OAuth login flows and chunked (partial) uploads are intentionally out of scope for an automation node.

## Credentials

The node authenticates against your own Zipline server, so you supply the **server URL** as part of the credential. Two credential types are available:

- **Zipline Token API** (recommended) – authenticate with your API token, sent as the `Authorization` header. Get the token from your Zipline dashboard (avatar → **Copy token**, or under user settings).
- **Zipline Cookie API** – sign in with username/password (and TOTP code if enabled); the node logs in to obtain a `zipline_session` cookie automatically. A TOTP code expires after about 30 seconds, so the automatic re-login after the session expires fails for 2FA accounts; use the Token credential for those.

Point the credential at your Zipline server URL (for example `https://zipline.example.com`).

## Compatibility

Requires n8n with `n8nNodesApiVersion` 1 and Node.js >= 20.15.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Zipline documentation](https://zipline.diced.sh/docs/)

## License

[MIT](LICENSE)
