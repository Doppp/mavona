# frozen_string_literal: true

require "json"

module Mavona
  class AgentPrompt
    POLICY = <<~PROMPT.freeze
      You are modifying an existing Ruby on Rails application.

      Follow the application's existing conventions. When they do not decide the approach, prefer standard Rails mechanisms and the integrated Rails stack. Introduce new abstractions only when justified by the task or existing architecture.
      Make the smallest complete change required by the task. Preserve behavior outside the requested scope.

      Use the supplied repository evidence. Mavona will independently verify the resulting repository state.
    PROMPT

    def self.render(task:, evidence:)
      raise ArgumentError, "task is required" if task.to_s.strip.empty?
      raise ArgumentError, "evidence must be a hash or array" unless evidence.is_a?(Hash) || evidence.is_a?(Array)

      <<~PROMPT
        #{POLICY.rstrip}

        Task:
        #{task.to_s.strip}

        Repository evidence:
        #{JSON.pretty_generate(evidence)}
      PROMPT
    end
  end
end
