# frozen_string_literal: true

module Mavona
  module Evaluation
    ProcessResult = Data.define(:stdout, :stderr, :exit_status, :timed_out) do
      def success? = !timed_out && exit_status == 0
    end

    class ProcessRunner
      def call(argv, chdir:, timeout_seconds:, stdin_data: nil, environment: {})
        stdout = +""
        stderr = +""
        status = nil
        timed_out = false

        clean_environment = ENV.keys.grep(/\ABUNDLE/).to_h { |key| [key, nil] }
          .merge("RUBYOPT" => nil, "RUBYLIB" => nil, "GEM_HOME" => nil, "GEM_PATH" => nil,
            "RB_USER_INSTALL" => nil)
          .merge(environment)
        Open3.popen3(clean_environment, *argv, chdir:) do |stdin, out, err, wait|
          stdin.write(stdin_data) if stdin_data
          stdin.close
          readers = [Thread.new { out.read }, Thread.new { err.read }]
          begin
            Timeout.timeout(timeout_seconds) { status = wait.value }
          rescue Timeout::Error
            timed_out = true
            Process.kill("TERM", wait.pid)
            begin
              Timeout.timeout(5) { status = wait.value }
            rescue Timeout::Error
              Process.kill("KILL", wait.pid)
              status = wait.value
            end
          rescue Interrupt
            Process.kill("TERM", wait.pid)
            raise
          ensure
            stdout = readers[0].value
            stderr = readers[1].value
          end
        end

        ProcessResult.new(stdout:, stderr:, exit_status: status&.exitstatus, timed_out:)
      rescue Errno::ENOENT => error
        ProcessResult.new(stdout: "", stderr: error.message, exit_status: nil, timed_out: false)
      end
    end
  end
end
