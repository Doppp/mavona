# frozen_string_literal: true

require_relative "support"

HiddenGrader.rspec(ARGV.fetch(0), <<~'RUBY', ruby: "4.0.0")
  require "rails_helper"

  RSpec.describe NotifyMessageJob, type: :job do
    it "does not duplicate the notification or email when retried" do
      recipient = build(:user)
      recipient.settings["email_messages"] = true
      recipient.save!
      message = create(:message, recipient: recipient)

      expect do
        described_class.perform_now(message)
        described_class.perform_now(message)
      end.to change { recipient.notifications.count }.by(1)
        .and change { ActionMailer::Base.deliveries.count }.by(1)
    end
  end
RUBY
