# frozen_string_literal: true

require "yaml"

module Mavona
  module Discovery
    class GitRepository
      UNKNOWN = "unknown"

      def initialize(path, command: Command.new)
        expanded = File.expand_path(path)
        @path = File.exist?(expanded) ? File.realpath(expanded) : expanded
        @command = command
      end

      def inspect
        root_result = git("rev-parse", "--show-toplevel")
        return unknown_repository unless root_result.success?

        root = root_result.stdout.strip
        current_branch = value_or_unknown(git("symbolic-ref", "--quiet", "--short", "HEAD"))
        sha = value_or_unknown(git("rev-parse", "HEAD"))
        status = git("status", "--porcelain=v1", "--untracked-files=normal")
        remote_default = remote_default_branch(root)
        override = configured_default_branch(root)
        default_branch, source = choose_default_branch(override, remote_default, current_branch)

        {
          "root" => root,
          "current_branch" => current_branch,
          "head_sha" => sha,
          "working_tree" => status.success? ? (status.stdout.empty? ? "clean" : "dirty") : UNKNOWN,
          "remote_default_branch" => remote_default,
          "default_branch" => default_branch,
          "default_branch_source" => source
        }
      end

      private

      def git(*arguments)
        @command.call("git", "-C", @path, *arguments)
      end

      def unknown_repository
        {
          "root" => UNKNOWN,
          "current_branch" => UNKNOWN,
          "head_sha" => UNKNOWN,
          "working_tree" => UNKNOWN,
          "remote_default_branch" => UNKNOWN,
          "default_branch" => UNKNOWN,
          "default_branch_source" => UNKNOWN
        }
      end

      def value_or_unknown(result)
        value = result.stdout.strip
        result.success? && !value.empty? ? value : UNKNOWN
      end

      def configured_default_branch(root)
        path = File.join(root, ".mavona.yml")
        return UNKNOWN unless File.file?(path)

        config = YAML.safe_load_file(path, permitted_classes: [], aliases: false) || {}
        value = config["default_branch"] || config.dig("repository", "default_branch")
        value.to_s.empty? ? UNKNOWN : value.to_s
      rescue Psych::Exception, Errno::EACCES
        UNKNOWN
      end

      def remote_default_branch(root)
        remotes = @command.call("git", "-C", root, "remote")
        return UNKNOWN unless remotes.success?

        remotes.stdout.lines.map(&:strip).reject(&:empty?).each do |remote|
          result = @command.call("git", "-C", root, "symbolic-ref", "--quiet", "--short", "refs/remotes/#{remote}/HEAD")
          next unless result.success?

          reference = result.stdout.strip
          branch = reference.delete_prefix("#{remote}/")
          return branch unless branch.empty?
        end
        UNKNOWN
      end

      def choose_default_branch(override, remote, current)
        return [override, "configuration"] unless override == UNKNOWN
        return [remote, "remote"] unless remote == UNKNOWN
        return [current, "current_branch"] unless current == UNKNOWN

        [UNKNOWN, UNKNOWN]
      end
    end
  end
end
