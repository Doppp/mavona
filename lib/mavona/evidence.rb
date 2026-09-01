# frozen_string_literal: true

require "digest"
require "json"

module Mavona
  class Evidence
    KINDS = %w[repository_fact convention impact verifier_recommendation legibility].freeze
    LABELS = %w[high medium low unknown].freeze

    attr_reader :id

    def initialize(kind:, subject:, observation:, confidence:, sources:, task_id: nil, session_id: nil, metadata: {})
      raise ArgumentError, "kind must be one of #{KINDS.join(', ')}" unless KINDS.include?(kind.to_s)
      raise ArgumentError, "confidence label is invalid" unless LABELS.include?(confidence.fetch(:label, confidence["label"]).to_s)
      raise ArgumentError, "task_id or session_id is required" if blank?(task_id) && blank?(session_id)
      raise ArgumentError, "at least one provenance source is required" if Array(sources).empty?

      @payload = {
        "task_id" => task_id,
        "session_id" => session_id,
        "kind" => kind.to_s,
        "subject" => subject.to_s,
        "observation" => observation,
        "confidence" => stringify_keys(confidence),
        "sources" => Array(sources).map { |source| stringify_keys(source) },
        "metadata" => stringify_keys(metadata)
      }
      identity = @payload.reject { |key, _| %w[task_id session_id metadata].include?(key) }
      @id = "ev_#{Digest::SHA256.hexdigest(JSON.generate(canonical(identity)))[0, 16]}"
    end

    def to_h
      { "id" => id }.merge(@payload)
    end

    def to_json(*args)
      JSON.generate(to_h, *args)
    end

    private

    def blank?(value)
      value.nil? || value.to_s.empty?
    end

    def stringify_keys(value)
      case value
      when Hash
        value.each_with_object({}) { |(key, nested), result| result[key.to_s] = stringify_keys(nested) }
      when Array
        value.map { |nested| stringify_keys(nested) }
      else
        value
      end
    end

    def canonical(value)
      case value
      when Hash
        value.keys.sort.each_with_object({}) { |key, result| result[key] = canonical(value[key]) }
      when Array
        value.map { |nested| canonical(nested) }
      else
        value
      end
    end
  end
end
