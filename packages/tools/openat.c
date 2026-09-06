/* Fixed-signature bridge: Darwin arm64 passes openat's variadic mode on the stack.
 * Keep the platform C compiler ABI here; all policy and filesystem logic is TS. */
extern int openat(int directory, const char *path, int flags, ...);
int mavona_openat(int directory, const char *path, int flags, unsigned int mode) {
    return openat(directory, path, flags, mode);
}
