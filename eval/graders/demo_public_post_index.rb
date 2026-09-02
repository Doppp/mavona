# frozen_string_literal: true

require_relative "support"

HiddenGrader.minitest(ARGV.fetch(0), <<~'RUBY', ruby: "3.2.1")
  require "test_helper"

  class MavonaPublicPostIndexTest < ActionDispatch::IntegrationTest
    test "shows only published posts newest first" do
      user = users(:one)
      older = Post.create!(user: user, title: "Older published", published_at: 2.days.ago)
      newer = Post.create!(user: user, title: "Newer published", published_at: 1.hour.ago)
      future = Post.create!(user: user, title: "Future scheduled", published_at: 1.day.from_now)
      draft = Post.create!(user: user, title: "Never published", published_at: nil)

      get posts_url
      assert_response :success
      assert_includes response.body, older.title
      assert_includes response.body, newer.title
      assert_not_includes response.body, future.title
      assert_not_includes response.body, draft.title
      assert_operator response.body.index(newer.title), :<, response.body.index(older.title)
    end

    test "retains the fifty-post cap" do
      user = users(:one)
      51.times { |index| Post.create!(user: user, title: "Published item #{index}", published_at: index.minutes.ago) }
      get posts_url
      assert_not_includes response.body, "Published item 50"
      assert_includes response.body, "Published item 0"
    end
  end
RUBY
