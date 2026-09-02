# frozen_string_literal: true

require "fileutils"
require "json"
require "open3"
require "securerandom"
require "shellwords"
require "timeout"
require "time"
require "yaml"

require_relative "../../../lib/mavona"
require_relative "evaluation/task_definition"
require_relative "evaluation/catalog"
require_relative "evaluation/process_runner"
require_relative "evaluation/repository_manager"
require_relative "evaluation/agent_runner"
require_relative "evaluation/grader_runner"
require_relative "evaluation/result"
require_relative "evaluation/result_store"
require_relative "evaluation/report"
require_relative "evaluation/run"
require_relative "evaluation/cli"

module Mavona
  module Evaluation
    ROOT = File.expand_path("../..", __dir__)
    PROJECT_ROOT = File.expand_path("..", ROOT)

    def self.cache_root
      File.expand_path(ENV.fetch("MAVONA_EVAL_CACHE", ".mavona/eval"), PROJECT_ROOT)
    end
  end
end
