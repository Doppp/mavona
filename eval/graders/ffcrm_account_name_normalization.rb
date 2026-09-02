# frozen_string_literal: true

require_relative "support"

HiddenGrader.rspec(ARGV.fetch(0), <<~'RUBY', ruby: "4.0.2")
  require "spec_helper"

  RSpec.describe Account do
    it "strips account names before validation and persistence" do
      account = create(:account, name: "  Acme Labs  ")
      expect(account.name).to eq("Acme Labs")
      expect(account.reload.name).to eq("Acme Labs")
    end

    it "keeps whitespace-only names invalid and clean names unchanged" do
      expect(build(:account, name: "   ")).not_to be_valid
      expect(build(:account, name: "Acme Labs").tap(&:valid?).name).to eq("Acme Labs")
    end
  end
RUBY
