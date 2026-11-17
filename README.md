# n8n-nodes-zipline-api

This is an n8n community node. It lets you use the [Zipline](https://zipline.diced.sh/) API in your n8n workflows.

Zipline is a self-hosted file and image sharing service. This node lets you upload, list, update, download and delete files on your Zipline instance, and read its version, health and statistics.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Usage](#usage)
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
- **Get** - fetch a single file's metadata by ID or short name.
- **Update** - update a file's metadata (favorite, name, password, max views, type and more).
- **Delete** - delete a file by ID or short name. Returns `{ "deleted": true }`.
- **Download** - download a file's raw contents as binary data.

Get and Get Many have a **Simplify** toggle, on by default. It returns the ten fields most workflows need (`id`, `name`, `originalName`, `type`, `size`, `views`, `favorite`, `createdAt`, `deletesAt` and, on Get Many, `url`). Turn it off for Zipline's full file record.

**System**
- **Get Version** - backend version and upstream/latest info.
- **Health Check** - check that the instance is healthy.
- **Get Stats** - instance metrics over a date range (or all time).

> Roadmap: URL shortener, Folders, Tags, User (self) and Users (admin), and server administration are planned for upcoming releases. WebAuthn/MFA/OAuth login flows and chunked (partial) uploads are intentionally out of scope for an automation node.

## Credentials

The node authenticates against your own Zipline server, so you supply the **server URL** as part of the credential. Two credential types are available:

- **Zipline Token API** (recommended) - authenticate with your API token, sent as the `Authorization` header. Get the token from your Zipline dashboard (avatar → **Copy token**, or under user settings).
- **Zipline Cookie API** - sign in with username/password (and TOTP code if enabled); the node logs in to obtain a `zipline_session` cookie automatically. A TOTP code expires after about 30 seconds, so the automatic re-login after the session expires fails for 2FA accounts; use the Token credential for those.

Point the credential at your Zipline server URL (for example `https://zipline.example.com`). Both credentials have a **Test** button that calls an authenticated endpoint, so a wrong URL or token shows up before you run a workflow.

## Usage

1. Add the **Zipline API** node to a workflow and pick a credential.
2. Choose a **Resource** (File or System) and an **Operation**.
3. For Get, Update, Delete and Download, pick the file from the list (searchable by name), or switch the **File** field to **By ID** and paste an ID or short name.

### Example: share an email attachment as a link

**Gmail Trigger** (with "Download Attachments" on) → **Zipline API**: File → Upload, **Input Binary Field** `attachment_0`, **Deletes At** `7d`. The output contains the share URL, which you can post to Slack or reply with.

### Example: clean up old screenshots every night

**Schedule Trigger** (daily) → **Zipline API**: File → Get Many, **Return All** on, **Sort By** Created At, **Order** Ascending → **Filter** on `createdAt` older than 30 days → **Zipline API**: File → Delete, with **File** set to **By ID** and the expression `{{ $json.id }}`.

### Example: back up a file

**Zipline API**: File → Download → **Write Binary File** (or **Nextcloud**, **S3** and so on). The binary lands in the `data` field, with `fileName` and `mimeType` on the item.

## Compatibility

Requires n8n with `n8nNodesApiVersion` 1 and Node.js >= 20.15. Built against the Zipline v4 API.

Node version 3 is the default for new nodes. Workflows saved with version 2 keep the old output: Delete returns Zipline's deleted file record and Get / Get Many return the full file record without a Simplify option.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Zipline documentation](https://zipline.diced.sh/docs/)

## License

[MIT](LICENSE)
