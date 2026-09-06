# ADR 004: Anchor approved file mutations to directory descriptors

Status: implemented on Darwin arm64; Linux path awaits target-native execution.

File mutation approval includes checkout, existing parent directory and target inode identities. Creation refuses existing targets and makes only the requested missing parent chain. Patching opens the approved single-link inode with no symlink following. Deletion moves the entry exclusively into a private recovery directory and checks the moved inode and digest; it does not unlink user bytes. All operations retain the public passed/failed/unknown distinction when paths change.

A small C function adapts variadic `openat` to a fixed signature; policy and filesystem traversal remain TypeScript. Direct fixed-argument FFI was experimentally incorrect for the mode argument on Darwin arm64. Bun's bundled TinyCC compiles the bridge without a system compiler. Explicit NUL-terminated buffers are required for its C string input. The compiled application's virtual source path was inaccessible to TinyCC, so the bounded embedded source is materialized in a private temporary directory and immediately removed after compilation. No dependency was added. `mkdirat` and exclusive rename use fixed native signatures. Linux uses glibc `renameat2`; other platforms refuse this mutation boundary.

Measured evidence: native packaged CLI tests execute real creation, patching and recoverable removal from a temporary working directory with PATH `/usr/bin:/bin`. Six tests / 27 assertions passed on Darwin arm64, Bun 1.4.2. Boundary tests exercise replaced checkout identities, outside symlinks, hardlinks, exact bytes, exclusive creation and file mode. This establishes neither Linux support nor the complete adversarial acceptance matrix.

Recovery storage lifecycle is owned by RETENTION.md. These retained files are excluded from source context and ordinary artifact expiry. An interrupted or ambiguous operation requires reconciliation; replay never repeats it.
