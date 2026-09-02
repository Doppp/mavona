# frozen_string_literal: true

require_relative "support"

HiddenGrader.rspec(ARGV.fetch(0), <<~'RUBY', ruby: "4.0.2")
  require "spec_helper"

  RSpec.describe Task do
    it "treats SQL LIKE metacharacters as literal task-name characters" do
      literal = create(:task, name: "Alpha_Beta")
      create(:task, name: "AlphaXBeta")
      percent = create(:task, name: "Budget%Review")
      create(:task, name: "BudgetQReview")

      expect(Task.text_search("Alpha_Beta")).to contain_exactly(literal)
      expect(Task.text_search("Budget%Review")).to contain_exactly(percent)
    end
  end
RUBY
