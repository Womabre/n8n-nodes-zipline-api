# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Brings the node in line with n8n's community node UX guidelines, ahead of submitting it for
verification. The changes sit behind a new node version, so existing workflows keep their output.

### Added

- Node version 3, the default for new Zipline API nodes. Version 2 stays available and unchanged.
- **Simplify** option on File: Get and Get Many (v3, on by default). It returns `id`, `name`,
  `originalName`, `type`, `size`, `views`, `favorite`, `createdAt`, `deletesAt` and, on Get Many,
  `url`, instead of Zipline's full 17-19 field file record.
- README: usage steps, three example workflows, and a note on the v2/v3 output difference.

### Changed

- File: Delete returns a single `{ "deleted": true }` item on v3, instead of the deleted file
  record Zipline sends back.

### Fixed

- README no longer claims the node can query users; it lists the operations it actually has.

## [1.0.1] - 2026-10-11

No changes to the node itself; this release moves publishing to npm Trusted Publishing.

### Changed

- Publishing authenticates with npm Trusted Publishing (OIDC) only; the workflow no longer
  passes an npm token.
- The publish workflow uses `actions/checkout@v7` and `actions/setup-node@v7` (Node 24 runtime)
  and no longer caches dependencies, so a poisoned cache cannot end up in a published package.
- GitHub releases take their notes from this changelog instead of the commit list.
- `repository.url` uses npm's normalized `git+https://` form.

## [1.0.0] - 2026-10-11

First public release of the Zipline API n8n community node.

### Added

- **File** resource: Upload, Get Many, Get, Update, Delete and Download.
  - Upload sends options as Zipline's `x-zipline-*` headers: name format, expiry (a duration,
    `never`, or an ISO date sent as `date=<ISO>`), max views, password, folder, original name,
    image compression and extension override.
  - Get Many offers **Return All** or a **Limit**, with sort, filter ("All Files" or
    "Media Only"), favorites, folder and search options.
  - Get, Update, Delete and Download use a searchable file picker, or accept a file ID or
    short name directly.
  - Download returns the file as binary data, with `fileId`, `fileName`, `mimeType` and
    `fileSize` on the item's JSON. The server's `Content-Type` is trusted; the file extension
    is only a fallback.
- **System** resource: Get Version, Health Check and Get Stats.
- **Zipline Token API** credential (recommended) and **Zipline Cookie API** credential
  (username, password and optional TOTP code; 2FA accounts should use a token, because a TOTP
  code expires before the session needs renewing).
- Light and dark icon variants.
- Releases via release-it (`npm run release`), and a GitHub Actions workflow that publishes to
  npm with provenance when a version tag is pushed.

[Unreleased]: https://github.com/Womabre/n8n-nodes-zipline-api/compare/1.0.1...HEAD
[1.0.1]: https://github.com/Womabre/n8n-nodes-zipline-api/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/Womabre/n8n-nodes-zipline-api/releases/tag/1.0.0
