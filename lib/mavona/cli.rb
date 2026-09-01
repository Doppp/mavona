# frozen_string_literal: true

require "json"
require "optparse"

module Mavona
  class CLI
    def initialize(stdout: $stdout, stderr: $stderr)
      @stdout = stdout
      @stderr = stderr
    end

    def run(arguments)
      args = arguments.dup
      command = args.shift
      case command
      when "init"
        run_init(args)
      when "plan"
        @stderr.puts("mavona plan is deferred until Phase 0 informs planning strategy")
        2
      when "--version", "-v", "version"
        @stdout.puts(VERSION)
        0
      when "--help", "-h", nil
        @stdout.puts(help)
        0
      else
        @stderr.puts("Unknown command: #{command}")
        @stderr.puts(help)
        1
      end
    rescue OptionParser::ParseError => error
      @stderr.puts(error.message)
      1
    end

    private

    def run_init(args)
      options = { format: "json", boot: true }
      parser = OptionParser.new do |opts|
        opts.banner = "Usage: mavona init [PATH] [options]"
        opts.on("--rails-root PATH", "Select a Rails root within a monorepo") { |value| options[:rails_root] = value }
        opts.on("--format FORMAT", %w[json markdown], "Output format: json or markdown") { |value| options[:format] = value }
        opts.on("--[no-]boot", "Attempt bounded Rails boot introspection") { |value| options[:boot] = value }
      end
      parser.parse!(args)
      path = args.shift || Dir.pwd
      raise OptionParser::InvalidArgument, "unexpected arguments: #{args.join(' ')}" unless args.empty?

      report = Discovery.call(path:, rails_root: options[:rails_root], boot: options[:boot])
      @stdout.puts(options[:format] == "json" ? Discovery::Formatter.json(report) : Discovery::Formatter.markdown(report))
      { "DISCOVERED" => 0, "NEEDS_DECISION" => 2 }.fetch(report["status"], 1)
    end

    def help
      <<~HELP
        Mavona #{VERSION}

        Usage:
          mavona init [PATH] [--rails-root PATH] [--format json|markdown] [--no-boot]
          mavona plan <task>  # deferred pending Phase 0
          mavona --version
      HELP
    end
  end
end
