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

The node exposes the following resources:

- **Upload** – upload files to Zipline.
- **Statistic** – retrieve usage statistics.
- **Version** – get the Zipline server version.
- **User** – read and manage users.

> Additional resources (Authentication, Health Check, Server, Setup) are scaffolded and planned for a future release.

## Credentials

The node authenticates against your own Zipline server, so you supply the **server URL** as part of the credential.

Two credential types are available:

- **Zipline Cookie API** – sign in with username/password (and TOTP code if enabled) to obtain a session cookie.
- **Zipline Token API** – authenticate with a Zipline token.

Point the credential at your Zipline server URL (for example `https://zipline.example.com`).

## Compatibility

Requires n8n with `n8nNodesApiVersion` 1 and Node.js >= 20.15.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Zipline documentation](https://zipline.diced.sh/docs/)

## License

[MIT](LICENSE)
