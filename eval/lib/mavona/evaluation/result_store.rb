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

      def all
        Dir[File.join(@directory, "*.json")].sort.map { |path| JSON.parse(File.read(path)) }
      end
    end
  end
end
