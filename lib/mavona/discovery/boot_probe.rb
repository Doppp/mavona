# frozen_string_literal: true

require "rbconfig"
require "tempfile"
require "timeout"

module Mavona
  module Discovery
    class BootProbe
      PROBE = "STDOUT.write('mavona_boot_ok')"

      def initialize(timeout_seconds: 5)
        @timeout_seconds = timeout_seconds
      end

      def call(rails_root)
        executable = File.join(rails_root, "bin/rails")
        return unknown("bin/rails is unavailable") unless File.file?(executable)

        started = monotonic
        stdout = Tempfile.new("mavona-boot-stdout")
        stderr = Tempfile.new("mavona-boot-stderr")
        pid = Process.spawn(RbConfig.ruby, "bin/rails", "runner", PROBE,
          chdir: rails_root, out: stdout, err: stderr, pgroup: true)
        status = nil
        Timeout.timeout(@timeout_seconds) { _, status = Process.wait2(pid) }
        stdout.rewind
        stderr.rewind
        output = stdout.read
        error = stderr.read
        {
          "status" => status.success? && output.include?("mavona_boot_ok") ? "passed" : "failed",
          "command" => "bin/rails runner <probe>",
          "exit_status" => status.exitstatus,
          "error" => error.empty? ? nil : error.lines.first(10).join.strip,
          "elapsed_ms" => elapsed_ms(started)
        }
      rescue Timeout::Error
        terminate(pid)
        failed("Rails boot probe timed out", started)
      rescue SystemCallError => error
        failed(error.message, started)
      ensure
        stdout&.close!
        stderr&.close!
      end

      private

      def unknown(reason)
        { "status" => "unknown", "command" => "unknown", "exit_status" => nil, "error" => reason, "elapsed_ms" => 0.0 }
      end

      def failed(reason, started)
        { "status" => "failed", "command" => "bin/rails runner <probe>", "exit_status" => nil, "error" => reason, "elapsed_ms" => elapsed_ms(started) }
      end

      def terminate(pid)
        return unless pid

        Process.kill("TERM", -pid)
        Process.wait(pid)
      rescue Errno::ESRCH, Errno::ECHILD
        nil
      end

      def monotonic
        Process.clock_gettime(Process::CLOCK_MONOTONIC)
      end

      def elapsed_ms(started)
        ((monotonic - started) * 1000).round(3)
      end
    end
  end
end
