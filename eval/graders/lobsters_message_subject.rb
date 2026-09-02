# frozen_string_literal: true

require_relative "support"

HiddenGrader.rspec(ARGV.fetch(0), <<~'RUBY', ruby: "4.0.0")
  require "rails_helper"

  RSpec.describe Message do
    it "rejects blank subjects while preserving the documented length boundary" do
      expect(build(:message, subject: " ")).not_to be_valid
      expect(build(:message, subject: "a")).to be_valid
      expect(build(:message, subject: "a" * 100)).to be_valid
      expect(build(:message, subject: "a" * 101)).not_to be_valid
    end
  end
RUBY
