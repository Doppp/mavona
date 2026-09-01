# frozen_string_literal: true

require "open3"

module Mavona
  module Discovery
    CommandResult = Data.define(:stdout, :stderr, :status) do
      def success?
        status.success?
      end
    end

    class Command
      def call(*argv, chdir: nil)
        options = chdir ? { chdir: chdir.to_s } : {}
        stdout, stderr, status = Open3.capture3(*argv, **options)
        CommandResult.new(stdout:, stderr:, status:)
      rescue Errno::ENOENT => error
        status = Struct.new(:success?, :exitstatus).new(false, nil)
        CommandResult.new(stdout: "", stderr: error.message, status:)
      end
    end
  end
end
