# frozen_string_literal: true

module Mavona
  module Evaluation
    class CLI
      def initialize(stdout: $stdout, catalog: Catalog.new, repositories: RepositoryManager.new, results: ResultStore.new)
        @stdout = stdout
        @catalog = catalog
        @repositories = repositories
        @results = results
      end

      def run_setup
        @catalog.validate!
        @catalog.repositories.each_value do |repository|
          @stdout.puts("Setting up #{repository.fetch('id')} at #{repository.fetch('commit')}...")
          task = @catalog.tasks.find { |candidate| candidate.repo == repository.fetch("id") }
          worktree = @repositories.prepare(repository, task:, condition: "setup")
          @repositories.remove(worktree)
        end
      end

      def run
        @catalog.validate!
        tasks = ENV["TASK"] ? [@catalog.task(ENV.fetch("TASK"))] : @catalog.tasks
        conditions = ENV["CONDITION"] ? [ENV.fetch("CONDITION")] : AgentRunner::CONDITIONS
        unknown = conditions - AgentRunner::CONDITIONS
        raise ArgumentError, "unknown condition: #{unknown.join(', ')}" unless unknown.empty?
        runner = Run.new(catalog: @catalog, repositories: @repositories, results: @results)
        tasks.product(conditions).each do |task, condition|
          @stdout.puts("Running #{task.id} (#{condition})...")
          result = runner.call(task:, condition:)
          @stdout.puts("#{result.grader_status}: #{result.notes}")
        end
      end

      def report
        @stdout.write(Report.new(@results.all).render)
      end

      def reset
        @repositories.reset
        @stdout.puts("Removed #{Evaluation.cache_root}")
      end
    end
  end
end
