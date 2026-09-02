# frozen_string_literal: true

require_relative "support"

HiddenGrader.minitest(ARGV.fetch(0), <<~'RUBY', ruby: "3.2.1")
  require "test_helper"

  class MavonaPostTitleNormalizationTest < ActiveSupport::TestCase
    test "strips titles and enforces case-insensitive uniqueness" do
      user = users(:one)
      post = Post.create!(user: user, title: "  Useful Rails Notes  ")
      assert_equal "Useful Rails Notes", post.title
      assert_equal "Useful Rails Notes", post.reload.title
      assert_not Post.new(user: user, title: "useful rails notes").valid?
    end

    test "preserves blank and minimum-length validation" do
      user = users(:one)
      assert_not Post.new(user: user, title: "     ").valid?
      assert_not Post.new(user: user, title: " four ").valid?
      assert Post.new(user: user, title: " five ").valid?
    end
  end
RUBY
