#!/bin/sh
set -eu
PATH=/usr/bin:/bin
export PATH
fail() { printf '%s\n' "$*" >&2; exit 1; }
[ "$#" -eq 2 ] || fail 'Usage: install.sh /absolute/unpacked-artifact /absolute/prefix'
artifact=$1
prefix=$2
case "$artifact:$prefix" in /*:/*) ;; *) fail 'Artifact and prefix must be absolute paths' ;; esac
[ ! -L "$artifact" ] && [ ! -L "$prefix" ] || fail 'Symlink artifact/prefix refused'
case "$(uname -s)-$(uname -m)" in Darwin-arm64) target=darwin-arm64;; Darwin-x86_64) target=darwin-x64;; Linux-x86_64) target=linux-x64;; Linux-aarch64) target=linux-arm64;; *) fail 'Unsupported native target';; esac
case "$target" in linux-*) getconf GNU_LIBC_VERSION >/dev/null 2>&1 || fail 'Linux glibc is required';; esac
for name in mavona TARGET BINARY_SHA256; do [ -f "$artifact/$name" ] && [ ! -L "$artifact/$name" ] || fail 'Artifact file missing or linked'; done
[ "$(cat "$artifact/TARGET")" = "$target" ] || fail 'Artifact does not match this native host'
expected=$(cat "$artifact/BINARY_SHA256")
case "$expected" in *[!0-9a-f]*|'') fail 'Invalid binary checksum';; esac
[ "${#expected}" -eq 64 ] || fail 'Invalid binary checksum'
checksum() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d ' ' -f 1; }
[ "$(checksum "$artifact/mavona")" = "$expected" ] || fail 'Binary checksum mismatch'
for path in "$prefix/bin" "$prefix/share" "$prefix/share/mavona"; do [ ! -L "$path" ] || fail 'Symlink installation directory refused'; done
[ ! -e "$prefix/bin/mavona" ] && [ ! -L "$prefix/bin/mavona" ] && [ ! -e "$prefix/share/mavona/BINARY_SHA256" ] || fail 'Existing installation preserved; remove it explicitly first'
mkdir -p "$prefix/bin" "$prefix/share/mavona"
temporary=$(mktemp -d "$prefix/bin/.mavona-install.XXXXXX")
trap 'rm -rf "$temporary"' EXIT HUP INT TERM
cp "$artifact/mavona" "$temporary/mavona"
chmod 755 "$temporary/mavona"
[ "$(checksum "$temporary/mavona")" = "$expected" ] || fail 'Binary changed while copying'
printf '%s\n' "$expected" > "$temporary/BINARY_SHA256"
ln "$temporary/mavona" "$prefix/bin/mavona" || fail 'Destination appeared; existing file preserved'
if ! ln "$temporary/BINARY_SHA256" "$prefix/share/mavona/BINARY_SHA256"; then
 if [ ! -L "$prefix/bin/mavona" ] && [ "$prefix/bin/mavona" -ef "$temporary/mavona" ]; then rm "$prefix/bin/mavona"; fi
 fail 'Receipt destination appeared; installation not completed'
fi
printf 'Installed %s/bin/mavona (%s). Add this bin directory to PATH explicitly.\n' "$prefix" "$target"
