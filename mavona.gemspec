# frozen_string_literal: true

require_relative "lib/mavona/version"

Gem::Specification.new do |spec|
  spec.name = "mavona"
  spec.version = Mavona::VERSION
  spec.authors = ["Mavona contributors"]
  spec.summary = "A Ruby-first Rails engineering harness for coding agents"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.2"
  spec.files = Dir["lib/**/*.rb", "exe/mavona", "README.md"]
  spec.bindir = "exe"
  spec.executables = ["mavona"]
  spec.require_paths = ["lib"]

  spec.add_development_dependency "minitest", "~> 5.0"
  spec.add_development_dependency "rake", "~> 13.0"
end
