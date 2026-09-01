# frozen_string_literal: true

require "pathname"

module Mavona
  module Discovery
    class RailsRoots
      IGNORED_SEGMENTS = %w[.git vendor node_modules tmp log].freeze

      def initialize(repository_root, requested_path:, explicit_root: nil)
        @repository_root = canonical(repository_root)
        @requested_path = canonical(requested_path)
        @explicit_root = explicit_root && canonical(File.expand_path(explicit_root, @repository_root))
      end

      def inspect
        roots = candidates
        selected, reason = select(roots)
        status = if selected
          "selected"
        elsif @explicit_root
          "NEEDS_DECISION"
        elsif roots.length > 1
          "NEEDS_DECISION"
        else
          "unknown"
        end

        {
          "candidate_roots" => roots.map { |root| relative(root) },
          "selected_root" => selected ? relative(selected) : "unknown",
          "status" => status,
          "reason" => reason
        }
      end

      private

      def candidates
        pattern = File.join(@repository_root, "**", "config", "application.rb")
        Dir.glob(pattern, File::FNM_DOTMATCH).filter_map do |application|
          root = File.dirname(File.dirname(application))
          next if ignored?(root)

          root
        end.uniq.sort
      end

      def ignored?(path)
        relative(path).split(File::SEPARATOR).any? { |segment| IGNORED_SEGMENTS.include?(segment) }
      end

      def select(roots)
        if @explicit_root
          match = roots.find { |root| File.expand_path(root) == @explicit_root }
          return [match, match ? "explicit Rails root" : "explicit Rails root is not a discovered candidate"]
        end
        return [roots.first, "single Rails root"] if roots.one?
        return [nil, "no Rails root discovered"] if roots.empty?

        scoped = roots.select { |root| within?(@requested_path, root) }
        return [scoped.max_by(&:length), "working directory scopes Rails root"] if scoped.any?

        [nil, "multiple Rails roots require explicit scope"]
      end

      def within?(path, directory)
        Pathname.new(path).ascend.any? { |ancestor| ancestor.to_s == directory }
      end

      def relative(path)
        value = Pathname.new(path).relative_path_from(Pathname.new(@repository_root)).to_s
        value == "." ? "." : value
      end

      def canonical(path)
        expanded = File.expand_path(path)
        File.exist?(expanded) ? File.realpath(expanded) : expanded
      end
    end
  end
end
