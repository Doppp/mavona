# frozen_string_literal: true

require_relative "support"

HiddenGrader.minitest(ARGV.fetch(0), <<~'RUBY', ruby: "3.2.1")
  require "test_helper"

  class MavonaCommentLengthTest < ActiveSupport::TestCase
    setup { @attributes = { post: posts(:one), user: users(:one) } }

    test "accepts one thousand characters and rejects one thousand and one" do
      assert Comment.new(**@attributes, body: "a" * 1_000).valid?
      assert_not Comment.new(**@attributes, body: "a" * 1_001).valid?
    end

    test "preserves presence and minimum length" do
      assert_not Comment.new(**@attributes, body: " ").valid?
      assert_not Comment.new(**@attributes, body: "four").valid?
      assert Comment.new(**@attributes, body: "five!").valid?
    end
  end
RUBY
