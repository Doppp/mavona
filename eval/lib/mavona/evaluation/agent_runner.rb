# frozen_string_literal: true

module Mavona
  module Evaluation
    class AgentRunner
      CONDITIONS = %w[baseline mavona].freeze

      def initialize(process_runner: ProcessRunner.new, command: nil)
        @process_runner = process_runner
        @command = command || Shellwords.split(ENV.fetch("MAVONA_EVAL_AGENT_COMMAND", "codex exec --ephemeral --sandbox workspace-write --ignore-user-config -"))
      end

      def call(task:, condition:, worktree:)
        raise ArgumentError, "unknown condition: #{condition}" unless CONDITIONS.include?(condition)

        prompt = condition == "baseline" ? task.prompt : mavona_prompt(task, worktree)
        @process_runner.call(@command, chdir: worktree, timeout_seconds: task.max_duration, stdin_data: prompt,
          environment: { "MAVONA_EVAL_CONDITION" => condition })
      end

      private

      def mavona_prompt(task, worktree)
        discovery = Mavona::Discovery.call(path: worktree, boot: false, session_id: "eval_#{task.id}")
        Mavona::AgentPrompt.render(task: task.prompt, evidence: discovery)
      end
    end
  end
end
