# frozen_string_literal: true

module Mavona
  module Evaluation
    class GraderRunner
      def initialize(root: ROOT, process_runner: ProcessRunner.new)
        @root = root
        @process_runner = process_runner
      end

      def call(task:, worktree:)
        grader = File.expand_path(task.grader, @root)
        command = [RbConfig.ruby, grader, worktree]
        result = @process_runner.call(command, chdir: @root, timeout_seconds: task.max_duration)
        payload = JSON.parse(result.stdout)
        {
          "grader_status" => normalized(payload["grader_status"], result),
          "tests_status" => normalized(payload.fetch("tests_status", "not_run"), result),
          "notes" => [payload["notes"], result.stderr.strip].reject(&:nil?).reject(&:empty?).join("\n"),
          "output" => result.stdout
        }
      rescue JSON::ParserError => error
        { "grader_status" => "error", "tests_status" => "not_run", "notes" => "invalid grader output: #{error.message}", "output" => result&.stdout.to_s }
      end

      private

      def normalized(value, process_result)
        return "error" if process_result.timed_out || process_result.exit_status.nil?
        return value if %w[passed failed not_run error].include?(value)

        "error"
      end
    end
  end
end
