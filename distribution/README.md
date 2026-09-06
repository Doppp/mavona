# Local native artifact preparation

This produces unsigned development artifacts. It does not publish a release or satisfy full v0.1 acceptance. See [the release ledger](../docs/RELEASE_ACCEPTANCE.md) for actual platform and product evidence.

From the repository, after installing the pinned development dependencies:

```sh
bun run typecheck
bun run build
bun scripts/package.ts --output /absolute/new-artifact-directory
```

The output directory must not exist. Build provenance binds the native binary to authored application/probe/build/installer inputs, the Git commit and dirty-state fingerprints, toolchain, target and lockfile. Packaging refuses stale records or changed binary bytes. Installed dependency contents are identified through package metadata and the lockfile; they are not independently attested. Concurrent source changes during compilation refuse a build record. Artifacts are not claimed reproducible or signed.

The directory contains a target-labelled archive, SHA256SUMS, provenance, an SPDX2.3 inventory and a Homebrew formula input. The inventory includes installed npm runtime/build packages and Bun. It explicitly does not enumerate all third-party internals embedded within Bun; full bundled-notice review remains required before distribution. Its format follows the [official SPDX2.3 schema](https://github.com/spdx/spdx-spec/blob/v2.3/schemas/spdx-schema.json). License declarations come from installed metadata; conclusions remain NOASSERTION.

Verify SHA256SUMS with `shasum -a256 -c SHA256SUMS` on macOS or `sha256sum -c SHA256SUMS` on Linux, then unpack the archive. Review the included release ledger and provenance. Run:

```sh
/bin/sh /absolute/unpacked-artifact/install.sh /absolute/unpacked-artifact /absolute/install-prefix
/absolute/install-prefix/bin/mavona --version
```

The local installer checks the host, glibc on Linux, source files and binary checksum. It refuses an existing binary/receipt and linked installation directories. It installs only the binary and checksum receipt; add the bin directory to PATH explicitly. It does not download browsers, models or Rails dependencies, modify shell profiles, start services or send telemetry.

To remove that installation:

```sh
/bin/sh /absolute/unpacked-artifact/uninstall.sh /absolute/install-prefix
```

Removal refuses a modified or linked binary, checks bytes after moving into a private holding directory, and preserves an entry that changes during removal. Sessions, browser installations, credentials and parent directories remain. Inspect a reported holding directory before manually reconciling an interrupted removal. Upgrading requires explicit removal of the unchanged old binary followed by installation; no silent overwrite occurs.

The Homebrew `.rb.in` is a preparation input, with the actual archive hash and a placeholder URL. It is not an installable published formula. Substitute an authorized artifact URL only after release review, enforce its single target and test Homebrew installation on that native platform before claiming support.

Signing/notarization are not performed. Release owners must supply the relevant signing identity and credentials, validate Bun/OpenTUI entitlements and a supported distribution/notarization container, sign the final bytes, and regenerate checksums/provenance for those bytes. Do not treat the unsigned local archive or syntax-checked formula as notarization evidence. macOS x64 and Linux x64/arm64 require their own native build and complete checks; this repository's local evidence currently covers Darwin arm64.
