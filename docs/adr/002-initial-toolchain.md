# Initial toolchain and static executable

Status: accepted for initial development; full packaging acceptance pending.

On 2026-09-06 the npm registry manifests selected Bun 1.4.2 (MIT), TypeScript 7.0.2 (Apache-2.0) and @types/bun 1.4.1 (MIT). Bun was absent from PATH; a private development installation is at `/tmp/mavona-toolchain/node_modules/.bin`. The first `bun run build` failed with exit 127 because the script's shell could not find Bun. Adding that installation to PATH corrected it; no stack substitution was made.

`bun run typecheck` runs TypeScript 7 strict with unchecked indexed access and exact optional properties. No TypeScript compiler API is used. Installed TypeScript exposes experimental API paths; the application does not depend on their compatibility. JSX transformation will use OpenTUI's maintained Babel plugin.

`bun run build` compiled the static inspection CLI on Darwin arm64. `env -i PATH=/usr/bin:/bin dist/mavona --version` printed `mavona 0.1.0-dev.1`, exit 0. This establishes only the initial executable, not renderer/SQLite/browser assets, signing, clean installation or other-platform support.

OpenTUI Core and Solid 0.5.10 are the next integration candidates. Solid declares exact solid-js 1.9.12; do not install the newer 1.9.15 peer. Core declares web-tree-sitter 0.25.10. Registry releases were 2026-09-01, with MIT licenses; standalone docs describe embedding native/parser assets. Pinning alone does not verify that path.

Sources: [OpenTUI standalone](https://opentui.com/docs/reference/standalone-executables/), [OpenTUI Solid](https://opentui.com/packages/opentui-solid/), [TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), npm package manifests fetched 2026-09-06. Preserve dependency notices in installed/build distribution materials.
