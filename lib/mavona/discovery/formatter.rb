# frozen_string_literal: true

require "json"

module Mavona
  module Discovery
    module Formatter
      module_function

      def json(report)
        JSON.pretty_generate(report)
      end

      def markdown(report)
        repository = report.fetch("repository")
        rails = report.fetch("rails")
        profile = report.fetch("profile")
        <<~MARKDOWN
          # Mavona discovery

          Status: `#{report.fetch("status")}`

          ## Repository

          - Root: `#{repository.fetch("root")}`
          - Current branch: `#{repository.fetch("current_branch")}`
          - Default branch: `#{repository.fetch("default_branch")}` (#{repository.fetch("default_branch_source")})
          - Working tree: `#{repository.fetch("working_tree")}`

          ## Rails

          - Candidate roots: #{rails.fetch("candidate_roots").map { |root| "`#{root}`" }.join(", ")}
          - Selected root: `#{rails.fetch("selected_root")}`
          - Rails version: `#{profile.fetch("rails_version", "unknown")}`
          - Boot introspection: `#{report.dig("boot", "status")}`

          Discovery time: #{report.dig("timing", "total_ms")} ms
        MARKDOWN
      end
    end
  end
end
