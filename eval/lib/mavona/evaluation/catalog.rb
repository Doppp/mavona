# frozen_string_literal: true

require "pathname"

module Mavona
  module Evaluation
    class Catalog
      attr_reader :root

      def initialize(root: ROOT)
        @root = root
      end

      def repositories
        @repositories ||= YAML.safe_load_file(File.join(root, "repos.yml"), permitted_classes: [], aliases: false)
          .fetch("repositories").to_h { |repository| [repository.fetch("id"), repository] }
      end

      def tasks
        @tasks ||= Dir[File.join(root, "tasks", "*.yml")].sort.map { |path| TaskDefinition.load(path) }
      end

      def task(id)
        tasks.find { |candidate| candidate.id == id } || raise(ArgumentError, "unknown evaluation task: #{id}")
      end

      def validate!
        raise ArgumentError, "evaluation catalog must define exactly 3 repositories" unless repositories.size == 3
        raise ArgumentError, "evaluation catalog must define exactly 9 tasks" unless tasks.size == 9
        tasks.each do |task|
          repository = repositories[task.repo] || raise(ArgumentError, "#{task.id}: unknown repository #{task.repo}")
          raise ArgumentError, "#{task.id}: commit does not match repository pin" unless repository.fetch("commit") == task.commit
          grader = File.expand_path(task.grader, root)
          unless grader.start_with?(File.join(root, "graders") + File::SEPARATOR) && File.file?(grader)
            raise ArgumentError, "#{task.id}: grader must exist below eval/graders"
          end
        end
        true
      end
    end
  end
end
