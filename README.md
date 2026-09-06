# Mavona

A Rails-specific coding harness being rewritten in TypeScript 7, Bun and OpenTUI/Solid.

**Development status:** v0.1 is incomplete. This checkout contains the maintained product contracts and the beginning of the replacement implementation. There is no supported v0.1 release or installation claim yet. The previous Ruby implementation remains in Git history at `fdee113`.

Mavona's required workflow is Inspect → Focus → Plan when warranted → Change → Verify. It will provide source viewing, explicit model/locality selection, policy-bound tools, durable sessions and full Rails browser inspection. Planned capabilities are not verified features; see the [acceptance ledger](docs/RELEASE_ACCEPTANCE.md).

## Development

Use Bun 1.4.2 and the exact dependencies in the lockfile. TypeScript 7 strict mode checks application code. Development commands are added alongside working slices; packaged executables and clean-install instructions remain pending acceptance.

## Maintained contracts

- [Implementation plan](docs/IMPLEMENTATION_PLAN.md) and [release acceptance](docs/RELEASE_ACCEPTANCE.md)
- [Product requirements](docs/specs/PRD.md) and [architecture](docs/specs/ARCHITECTURE.md)
- [Terminal/source UX](docs/specs/TUI_SPEC.md) and [App Inspection](docs/specs/APP_INSPECTION_SPEC.md)
- [Providers and locality](docs/specs/PROVIDERS.md), [trust boundaries](docs/specs/THREAT_MODEL.md) and [retention](docs/specs/RETENTION.md)
- [Rewrite parity](docs/specs/PARITY.md), [evaluation](docs/specs/BENCHMARKS.md), [preview policy](docs/specs/PREVIEW_POLICY.md) and [glossary](docs/specs/GLOSSARY.md)

Input mockups and historical review material are design inputs outside tracked source. The maintained UX contracts capture the required conversation, code review and App Inspection workflows.

## License

[MIT](LICENSE) — Copyright (c) 2026 Daryl Yeo.
