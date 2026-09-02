# frozen_string_literal: true

require_relative "support"

HiddenGrader.rspec(ARGV.fetch(0), <<~'RUBY', ruby: "4.0.2")
  require "spec_helper"

  RSpec.describe AccountWebsiteJob do
    it "ignores malformed and non-HTTP website values without making requests" do
      expect(Net::HTTP).not_to receive(:get_response)
      malformed = create(:account, website: "http://[invalid")
      unsupported = create(:account, website: "mailto:team@example.com")
      expect { described_class.perform_now(malformed) }.not_to raise_error
      expect { described_class.perform_now(unsupported) }.not_to raise_error
    end
  end
RUBY
