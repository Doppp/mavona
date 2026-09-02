# frozen_string_literal: true

module Mavona
  module Evaluation
    class Run
      def initialize(catalog:, repositories: RepositoryManager.new, agent: AgentRunner.new,
        grader: GraderRunner.new(root: catalog.root), results: ResultStore.new)
        @catalog = catalog
        @repositories = repositories
        @agent = agent
        @grader = grader
        @results = results
      end

      def call(task:, condition:)
        started_wall = Time.now.utc
        started_clock = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        repository = @catalog.repositories.fetch(task.repo)
        worktree = @repositories.prepare(repository, task:, condition:)
        agent_result = @agent.call(task:, condition:, worktree:)
        files_changed = changed_files(worktree)
        grading = if agent_result.success?
          @grader.call(task:, worktree:)
        else
          { "grader_status" => "not_run", "tests_status" => "not_run", "notes" => agent_result.timed_out ? "agent timed out" : agent_result.stderr.strip }
        end
        finish(task, condition, started_wall, started_clock, agent_result, grading, files_changed)
      rescue StandardError => error
        failed = Result.new(task_id: task.id, repo: task.repo, commit: task.commit, condition:, agent: "codex",
          started_at: started_wall.iso8601, finished_at: Time.now.utc.iso8601,
          duration: Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_clock, exit_status: nil,
          grader_status: "error", tests_status: "not_run", files_changed: [], human_intervention: false,
          notes: "#{error.class}: #{error.message}")
        @results.write(failed)
        failed
      ensure
        @repositories.remove(worktree) if worktree
      end

      private

      def finish(task, condition, started_wall, started_clock, agent_result, grading, files_changed)
        result = Result.new(task_id: task.id, repo: task.repo, commit: task.commit, condition:, agent: "codex",
          started_at: started_wall.iso8601, finished_at: Time.now.utc.iso8601,
          duration: (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_clock).round(3),
          exit_status: agent_result.exit_status, grader_status: grading.fetch("grader_status"),
          tests_status: grading.fetch("tests_status"), files_changed:, human_intervention: false,
          notes: grading.fetch("notes", ""))
        @results.write(result)
        result
      end

      def changed_files(worktree)
        stdout, = Open3.capture3("git", "status", "--short", chdir: worktree)
        stdout.lines.map { |line| line[3..].strip }.sort
      end
    end
  end
end
