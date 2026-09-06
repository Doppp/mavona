# ADR 005: Bundle a Ruby grammar for native source highlighting

Status: implemented and tested on Darwin arm64.

Source presentation uses OpenTUI's existing CodeRenderable, LineNumberRenderable and TreeSitterClient worker. Rails fact extraction remains the isolated Prism probe. The source viewer does not evaluate Ruby and does not use highlighting as verification evidence.

OpenTUI 0.5.10 ships JavaScript/TypeScript parsers but no Ruby parser. Its current public filetype API accepts a local Wasm grammar and highlight query. The upstream tree-sitter-ruby v0.23.1 release provides that grammar under MIT. The release Wasm and tagged highlight query are vendored in `third_party/tree-sitter-ruby/` with the upstream licence and SHA-256/source provenance. This adds no native Node binding, parser build tool or runtime download. The pinned 2,106,352-byte Wasm is the current source-highlighting requirement, not a second semantic indexer. Upstream release metadata and the actual licence were inspected; future upgrades must recheck compatibility and preserve notices.

A real Unicode Ruby fixture produces keyword/comment captures with correct source offsets through the worker. The standalone highlighting spike ran from `/tmp` with PATH `/usr/bin:/bin`, no Bun/Node executable, and returned 12 captures. Native source PTY testing opens the real parser-backed viewer via the native fuzzy picker, preserves the composer draft, resizes and restores terminal modes. Code draws unstyled text while highlighting is pending; unsupported filetypes remain readable. NO_COLOR removes semantic colours without removing line numbers or selection markers. Other target-native platforms await execution.

Primary sources: [upstream grammar release](https://github.com/tree-sitter/tree-sitter-ruby/releases/tag/v0.23.1), [upstream highlight query](https://github.com/tree-sitter/tree-sitter-ruby/blob/v0.23.1/queries/highlights.scm). The exact downloaded URLs and byte hashes are in provenance.json; no source content is sent for highlighting.
