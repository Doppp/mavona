# frozen_string_literal: true

require "securerandom"

require_relative "discovery/command"
require_relative "discovery/git_repository"
require_relative "discovery/rails_roots"
require_relative "discovery/instructions"
require_relative "discovery/project_profile"
require_relative "discovery/component_inventory"
require_relative "discovery/boot_probe"
require_relative "discovery/formatter"

module Mavona
  module Discovery
    PROFILE_FIELDS = %w[
      project_type ruby_version rails_version bundler_version database_adapter schema_format
      test_framework job_backend frontend_approach lint_security_tools ci_commands
      safe_test_commands safe_boot_commands
    ].freeze

    module_function

    def call(path: Dir.pwd, rails_root: nil, boot: true, session_id: nil, command: Command.new, boot_probe: BootProbe.new)
      requested_path = File.expand_path(path)
      session_id ||= "init_#{SecureRandom.hex(8)}"
      timings = {}
      total_started = monotonic

      repository = timed(timings, "repository") { GitRepository.new(requested_path, command:).inspect }
      if repository["root"] == "unknown"
        evidence = evidence_for(session_id, "repository", "Git repository", "unknown", requested_path, "unknown",
          metadata: { "reason" => "git rev-parse could not identify a repository" })
        return report("UNSUPPORTED", repository, empty_rails, [], unknown_profile, empty_inventory,
          unknown_boot("repository unavailable"), [evidence], timings, total_started, session_id)
      end

      root = repository.fetch("root")
      rails = timed(timings, "rails_roots") do
        RailsRoots.new(root, requested_path:, explicit_root: rails_root).inspect
      end
      instructions = timed(timings, "instructions") { Instructions.new(root).inspect }
      selected = absolute_selected_root(root, rails["selected_root"])
      profile = timed(timings, "profile") { selected ? ProjectProfile.new(selected).inspect : unknown_profile }
      inventory = timed(timings, "inventory") { selected ? ComponentInventory.new(selected).inspect : empty_inventory }
      boot_result = timed(timings, "boot") do
        if !boot
          unknown_boot("boot probe disabled")
        elsif selected
          boot_probe.call(selected)
        else
          unknown_boot("Rails root is not selected")
        end
      end

      status = rails["status"] == "NEEDS_DECISION" ? "NEEDS_DECISION" : "DISCOVERED"
      evidence = build_evidence(session_id, root, repository, rails, instructions, profile, boot_result)
      report(status, repository, rails, instructions, profile, inventory, boot_result, evidence,
        timings, total_started, session_id)
    end

    def build_evidence(session_id, root, repository, rails, instructions, profile, boot_result)
      items = repository.map do |subject, observation|
        evidence_for(session_id, "repository.#{subject}", subject.tr("_", " "), observation, ".git", observation == "unknown" ? "unknown" : "high")
      end
      items << evidence_for(session_id, "rails.roots", "Rails roots", rails["candidate_roots"], root, rails["candidate_roots"].empty? ? "unknown" : "high",
        metadata: { "selection_status" => rails["status"], "reason" => rails["reason"] })
      instructions.each do |instruction|
        items << evidence_for(session_id, "instruction.#{instruction['path']}", "Scoped repository instruction",
          { "path" => instruction["path"], "scope" => instruction["scope"] }, instruction["path"], "high")
      end
      profile.each do |subject, observation|
        items << evidence_for(session_id, "profile.#{subject}", subject.tr("_", " "), observation,
          rails["selected_root"], observation == "unknown" ? "unknown" : "high", kind: "repository_fact")
      end
      boot_label = boot_result["status"] == "unknown" ? "unknown" : "high"
      items << evidence_for(session_id, "rails.boot", "Rails boot introspection", boot_result["status"],
        rails["selected_root"], boot_label, metadata: boot_result.reject { |key, _| key == "error" })
      if boot_result["status"] == "failed"
        items << evidence_for(session_id, "legibility.rails_boot", "Rails boot unavailable",
          "Static discovery completed; boot-derived facts remain unknown", rails["selected_root"], "high",
          kind: "legibility", metadata: { "error" => boot_result["error"] })
      end
      items.map(&:to_h)
    end

    def evidence_for(session_id, subject, label, observation, source_path, confidence_label, kind: "repository_fact", metadata: {})
      Evidence.new(
        session_id:,
        kind:,
        subject:,
        observation:,
        confidence: { label: confidence_label, score: nil, basis: label },
        sources: [{ path: source_path.to_s.empty? ? "unknown" : source_path, line: nil }],
        metadata:
      )
    end

    def report(status, repository, rails, instructions, profile, inventory, boot, evidence, timings, total_started, session_id)
      timings["total"] = elapsed_ms(total_started)
      {
        "schema_version" => VERSION,
        "session_id" => session_id,
        "status" => status,
        "repository" => repository,
        "rails" => rails,
        "instructions" => instructions,
        "profile" => profile,
        "inventory" => inventory,
        "boot" => boot,
        "evidence" => evidence,
        "timing" => {
          "total_ms" => timings["total"],
          "stages_ms" => timings.reject { |key, _| key == "total" }
        }
      }
    end

    def timed(timings, name)
      started = monotonic
      yield
    ensure
      timings[name] = elapsed_ms(started)
    end

    def monotonic
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end

    def elapsed_ms(started)
      ((monotonic - started) * 1000).round(3)
    end

    def absolute_selected_root(repository_root, selected)
      return nil if selected == "unknown"

      selected == "." ? repository_root : File.join(repository_root, selected)
    end

    def empty_rails
      { "candidate_roots" => [], "selected_root" => "unknown", "status" => "unknown", "reason" => "repository unavailable" }
    end

    def unknown_profile
      PROFILE_FIELDS.to_h { |field| [field, "unknown"] }
    end

    def empty_inventory
      ComponentInventory::PATTERNS.keys.to_h { |name| [name, { "count" => 0, "paths" => [] }] }.merge(
        "schema_tables" => { "count" => 0, "names" => [], "source" => "unknown" },
        "custom_autoload_eager_load_paths" => { "count" => 0, "entries" => [] }
      )
    end

    def unknown_boot(reason)
      { "status" => "unknown", "command" => "unknown", "exit_status" => nil, "error" => reason, "elapsed_ms" => 0.0 }
    end
  end
end
