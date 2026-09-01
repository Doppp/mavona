# frozen_string_literal: true

require_relative "../test_helper"

class PerformanceTest < Minitest::Test
  def test_larger_generated_repository_records_discovery_timing
    with_repository do |repository|
      1_500.times do |index|
        write(repository, format("app/services/generated/service_%04d.rb", index), "class GeneratedService#{index}; end\n")
      end

      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      result = Mavona::Discovery.call(path: repository, boot: false, session_id: "init_large")
      wall_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000

      if ENV["MAVONA_BENCHMARK"] == "1"
        puts JSON.generate(
          generated_files: 1_500,
          wall_ms: wall_ms.round(3),
          discovery_ms: result.dig("timing", "total_ms"),
          stages_ms: result.dig("timing", "stages_ms")
        )
      end

      assert_equal 1_501, result.dig("inventory", "services", "count")
      assert_operator result.dig("timing", "total_ms"), :>, 0
      assert_operator result.dig("timing", "stages_ms", "inventory"), :>, 0
      assert_operator wall_ms, :<, 10_000, "generated repository discovery exceeded the regression ceiling"
    end
  end
end
