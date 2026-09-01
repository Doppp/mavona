# frozen_string_literal: true

require_relative "test_helper"

class EvidenceTest < Minitest::Test
  def attributes(session_id: "init_one")
    {
      session_id:,
      kind: "repository_fact",
      subject: "repository.default_branch",
      observation: "develop",
      confidence: { label: "high", score: nil, basis: "symbolic remote HEAD" },
      sources: [{ path: ".git", line: nil }],
      metadata: { source: "remote" }
    }
  end

  def test_serializes_required_envelope_with_stable_id
    first = Mavona::Evidence.new(**attributes)
    second = Mavona::Evidence.new(**attributes(session_id: "init_two").merge(metadata: { source: "remote", elapsed_ms: 12.3 }))
    parsed = JSON.parse(first.to_json)

    assert_match(/^ev_[0-9a-f]{16}$/, parsed.fetch("id"))
    assert_equal first.id, second.id
    assert_equal "init_one", parsed.fetch("session_id")
    assert_equal "high", parsed.dig("confidence", "label")
    assert_equal ".git", parsed.fetch("sources").first.fetch("path")
  end

  def test_requires_a_provenance_owner
    error = assert_raises(ArgumentError) { Mavona::Evidence.new(**attributes.merge(session_id: nil)) }
    assert_match(/task_id or session_id/, error.message)
  end


  def test_requires_a_provenance_source
    error = assert_raises(ArgumentError) { Mavona::Evidence.new(**attributes.merge(sources: [])) }
    assert_match(/provenance source/, error.message)
  end
end
