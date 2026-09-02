# frozen_string_literal: true

module Mavona
  module Evaluation
    class RepositoryManager
      def initialize(cache_root: Evaluation.cache_root, process_runner: ProcessRunner.new)
        @cache_root = cache_root
        @process_runner = process_runner
      end

      def setup(repository)
        mirror = mirror_path(repository.fetch("id"))
        FileUtils.mkdir_p(File.dirname(mirror))
        unless File.directory?(mirror)
          result = run(["git", "clone", "--mirror", repository.fetch("url"), mirror], chdir: File.dirname(mirror), timeout: 600)
          raise "clone failed for #{repository.fetch('id')}: #{result.stderr}" unless result.success?
        end
        fetch = run(["git", "fetch", "--prune", "origin", repository.fetch("commit")], chdir: mirror, timeout: 300)
        raise "fetch failed for #{repository.fetch('id')}: #{fetch.stderr}" unless fetch.success?
        verify = run(["git", "cat-file", "-e", "#{repository.fetch('commit')}^{commit}"], chdir: mirror, timeout: 30)
        raise "pinned commit unavailable for #{repository.fetch('id')}" unless verify.success?
        mirror
      end

      def prepare(repository, task:, condition:)
        mirror = setup(repository)
        run_root = File.join(@cache_root, "worktrees")
        FileUtils.mkdir_p(run_root)
        worktree = Dir.mktmpdir("#{task.id}-#{condition}-", run_root)
        clone = run(["git", "clone", "--shared", "--no-checkout", mirror, worktree], chdir: run_root, timeout: 120)
        raise "worktree clone failed: #{clone.stderr}" unless clone.success?
        checkout = run(["git", "checkout", "--detach", task.commit], chdir: worktree, timeout: 60)
        raise "checkout failed: #{checkout.stderr}" unless checkout.success?
        clean = run(["git", "clean", "-ffdqx"], chdir: worktree, timeout: 60)
        raise "worktree reset failed: #{clean.stderr}" unless clean.success?
        worktree
      rescue StandardError
        FileUtils.rm_rf(worktree) if worktree
        raise
      end

      def remove(worktree)
        FileUtils.rm_rf(worktree) if worktree&.start_with?(File.join(@cache_root, "worktrees") + File::SEPARATOR)
      end

      def reset
        FileUtils.rm_rf(@cache_root)
      end

      private

      def mirror_path(id) = File.join(@cache_root, "repositories", "#{id}.git")
      def run(argv, chdir:, timeout:) = @process_runner.call(argv, chdir:, timeout_seconds: timeout)
    end
  end
end
