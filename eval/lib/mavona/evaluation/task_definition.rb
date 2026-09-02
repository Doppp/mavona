# frozen_string_literal: true

require "pathname"

module Mavona
  module Evaluation
    class TaskDefinition
      REQUIRED = %w[id repo commit prompt budget grader].freeze
      SHA = /\A[0-9a-f]{40}\z/

      attr_reader :path

      def self.load(path)
        new(YAML.safe_load_file(path, permitted_classes: [], aliases: false), path:)
      end

      def initialize(attributes, path: nil)
        @attributes = attributes || {}
        @path = path
        validate!
      end

      def [](key)
        @attributes.fetch(key.to_s)
      end

      def id = self["id"]
      def repo = self["repo"]
      def commit = self["commit"]
      def prompt = self["prompt"]
      def grader = self["grader"]
      def max_duration = self["budget"].fetch("max_duration_seconds")

      private

      def validate!
        missing = REQUIRED.reject { |key| @attributes.key?(key) }
        raise ArgumentError, "missing required fields: #{missing.join(', ')}" unless missing.empty?
        raise ArgumentError, "id must contain only lowercase letters, digits, dashes, or underscores" unless id.match?(/\A[a-z0-9_-]+\z/)
        raise ArgumentError, "commit must be a full 40-character SHA" unless commit.match?(SHA)
        raise ArgumentError, "prompt must not be empty" if prompt.strip.empty?
        unless self["budget"].is_a?(Hash) && max_duration.is_a?(Integer) && max_duration.positive?
          raise ArgumentError, "budget.max_duration_seconds must be a positive integer"
        end
        raise ArgumentError, "grader must be a relative path" if Pathname.new(grader).absolute? || grader.split(File::SEPARATOR).include?("..")
      end
    end
  end
end
