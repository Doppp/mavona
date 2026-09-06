#!/bin/sh
set -eu
PATH=/usr/bin:/bin
export PATH
fail() { printf '%s\n' "$*" >&2; exit 1; }
[ "$#" -eq 1 ] || fail 'Usage: uninstall.sh /absolute/prefix'
prefix=$1
case "$prefix" in /*) ;; *) fail 'Prefix must be absolute';; esac
for path in "$prefix" "$prefix/bin" "$prefix/share" "$prefix/share/mavona" "$prefix/bin/mavona" "$prefix/share/mavona/BINARY_SHA256"; do [ ! -L "$path" ] || fail 'Symlink installation refused'; done
binary=$prefix/bin/mavona
receipt=$prefix/share/mavona/BINARY_SHA256
[ -f "$binary" ] && [ -f "$receipt" ] || fail 'Installation or receipt missing'
expected=$(cat "$receipt")
case "$expected" in *[!0-9a-f]*|'') fail 'Invalid receipt';; esac
[ "${#expected}" -eq 64 ] || fail 'Invalid receipt'
checksum() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d ' ' -f 1; }
[ "$(checksum "$binary")" = "$expected" ] || fail 'Modified binary preserved'
temporary=$(mktemp -d "$prefix/bin/.mavona-remove.XXXXXX")
mv "$binary" "$temporary/mavona"
if [ -L "$temporary/mavona" ] || [ ! -f "$temporary/mavona" ] || [ "$(checksum "$temporary/mavona")" != "$expected" ]; then
 if [ ! -L "$temporary/mavona" ] && [ -f "$temporary/mavona" ] && ln "$temporary/mavona" "$binary"; then rm "$temporary/mavona"; rmdir "$temporary"; fi
 fail "Binary changed during removal; retained at destination or $temporary. Inspect before retrying."
fi
rm "$temporary/mavona"
rmdir "$temporary"
[ "$(cat "$receipt")" != "$expected" ] || rm "$receipt"
printf 'Removed unchanged Mavona binary. Sessions, browser data and parent directories retained.\n'
