# frozen_string_literal: true

module Mavona
  module Evaluation
    Result = Data.define(
      :task_id, :repo, :commit, :condition, :agent, :started_at, :finished_at, :duration,
      :exit_status, :grader_status, :tests_status, :files_changed, :human_intervention, :notes
    ) do
      STATES = %w[passed failed not_run error].freeze

      def initialize(**attributes)
        %i[grader_status tests_status].each do |field|
          raise ArgumentError, "invalid #{field}" unless STATES.include?(attributes.fetch(field))
        end
        super
      end

      def to_h
        members.to_h { |name| [name.to_s, public_send(name)] }
      end
    end
  end
end
