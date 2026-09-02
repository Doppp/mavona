# frozen_string_literal: true

require_relative "support"

HiddenGrader.rspec(ARGV.fetch(0), <<~'RUBY', ruby: "4.0.0")
  require "rails_helper"

  RSpec.describe Tag do
    it "serializes the correctly named new-user permission without losing existing fields" do
      tag = create(:tag, permit_by_new_users: false)
      json = tag.as_json.stringify_keys
      expect(json).to include("tag" => tag.tag, "description" => tag.description,
        "permit_by_new_users" => false)
      expect(json).not_to have_key("permit_by_new_user")
    end
  end
RUBY
