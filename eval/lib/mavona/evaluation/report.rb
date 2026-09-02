# frozen_string_literal: true

module Mavona
  module Evaluation
    class Report
      def initialize(results)
        @results = results
      end

      def aggregate
        pairs = paired
        counts = { "baseline_verified" => 0, "mavona_verified" => 0, "baseline_only" => 0, "mavona_only" => 0, "both_pass" => 0, "both_fail" => 0 }
        pairs.each_value do |conditions|
          baseline = passed?(conditions["baseline"])
          mavona = passed?(conditions["mavona"])
          counts["baseline_verified"] += 1 if baseline
          counts["mavona_verified"] += 1 if mavona
          counts[baseline && mavona ? "both_pass" : baseline ? "baseline_only" : mavona ? "mavona_only" : "both_fail"] += 1
        end
        counts
      end

      def render
        lines = paired.sort.flat_map do |task_id, conditions|
          ["Task #{task_id}", "", "baseline: #{status(conditions['baseline'])}", "mavona:   #{status(conditions['mavona'])}", ""]
        end
        summary = aggregate.map { |key, value| "#{key.tr('_', ' ')}: #{value}" }
        (lines + summary).join("\n") + "\n"
      end

      private

      def paired
        @results.each_with_object({}) do |result, tasks|
          tasks[result.fetch("task_id")] ||= {}
          tasks[result.fetch("task_id")][result.fetch("condition")] = result
        end
      end

      def status(result) = result ? result.fetch("grader_status") : "not_run"
      def passed?(result) = status(result) == "passed"
    end
  end
end
