# frozen_string_literal: true

require "pathname"

module Mavona
  module Discovery
    class Instructions
      NAMES = %w[AGENTS.md CLAUDE.md GEMINI.md README.md CONTRIBUTING.md].freeze
      IGNORED_SEGMENTS = %w[.git vendor node_modules tmp log].freeze

      def initialize(repository_root)
        @repository_root = File.expand_path(repository_root)
      end

      def inspect
        Dir.glob(File.join(@repository_root, "**", "{#{NAMES.join(',')}}"), File::FNM_DOTMATCH).sort.filter_map do |path|
          relative = Pathname.new(path).relative_path_from(Pathname.new(@repository_root)).to_s
          next if relative.split(File::SEPARATOR).any? { |segment| IGNORED_SEGMENTS.include?(segment) }

          directory = File.dirname(relative)
          {
            "path" => relative,
            "scope" => directory == "." ? "." : directory,
            "kind" => File.basename(path).delete_suffix(".md").downcase,
            "source" => { "path" => relative, "line" => 1 }
          }
        end
      end
    end
  end
end
