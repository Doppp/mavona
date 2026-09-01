# Discovery fixture repositories

The discovery tests build isolated, temporary Git repositories through `RepositoryFixtures` in `test_helper.rb`. Each repository receives its own branch, commit, Rails tree, and optional remote/default-branch or boot-failure state.

Generated variants cover ordinary Rails layout, absent Mavona configuration, dirty state, detached HEAD, symbolic remote HEAD, scoped instructions, boot failure, multi-app roots, and a 1,500-file scaling fixture. Building them at test time preserves real Git behavior without storing nested `.git` directories or requiring network access.
