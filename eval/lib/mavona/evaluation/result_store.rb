# frozen_string_literal: true

module Mavona
  module Evaluation
    class ResultStore
      def initialize(directory: File.join(Evaluation.cache_root, "results"))
        @directory = directory
      end

      def write(result)
        FileUtils.mkdir_p(@directory)
        path = File.join(@directory, "#{result.task_id}--#{result.condition}.json")
        File.write(path, JSON.pretty_generate(result.to_h) + "\n")
        path
      end

      def write_artifact(task_id:, condition:, name:, content:)
        unless name.match?(/\A[a-z0-9][a-z0-9.-]*\z/)
          raise ArgumentError, "invalid artifact name: #{name.inspect}"
        end

        directory = File.join(@directory, "#{task_id}--#{condition}")
        FileUtils.mkdir_p(directory)
        path = File.join(directory, name)
        File.write(path, content.to_s)
        path
      end

      def all
        Dir[File.join(@directory, "*.json")].sort.map { |path| JSON.parse(File.read(path)) }
      end
    end
  end
end
