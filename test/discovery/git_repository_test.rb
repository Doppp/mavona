# frozen_string_literal: true

require_relative "../test_helper"

class GitRepositoryTest < Minitest::Test
  def test_discovers_normal_repository_without_configuration
    with_repository do |repository|
      result = Mavona::Discovery::GitRepository.new(repository).inspect

      refute File.exist?(File.join(repository, ".mavona.yml"))
      assert_equal File.realpath(repository), result.fetch("root")
      assert_equal "develop", result.fetch("current_branch")
      assert_equal "develop", result.fetch("default_branch")
      assert_equal "current_branch", result.fetch("default_branch_source")
      assert_equal "clean", result.fetch("working_tree")
      assert_match(/\A[0-9a-f]{40}\z/, result.fetch("head_sha"))
    end
  end

  def test_detects_dirty_working_tree
    with_repository do |repository|
      write(repository, "app/models/new_record.rb", "class NewRecord; end\n")

      result = Mavona::Discovery::GitRepository.new(repository).inspect
      assert_equal "dirty", result.fetch("working_tree")
    end
  end

  def test_remote_symbolic_head_precedes_current_branch
    with_repository do |repository|
      run!("git", "-C", repository, "remote", "add", "upstream", "https://invalid.example/mavona.git")
      run!("git", "-C", repository, "update-ref", "refs/remotes/upstream/release", "HEAD")
      run!("git", "-C", repository, "symbolic-ref", "refs/remotes/upstream/HEAD", "refs/remotes/upstream/release")

      result = Mavona::Discovery::GitRepository.new(repository).inspect
      assert_equal "release", result.fetch("remote_default_branch")
      assert_equal "release", result.fetch("default_branch")
      assert_equal "remote", result.fetch("default_branch_source")
    end
  end

  def test_unknown_default_branch_when_detached_and_no_remote
    with_repository do |repository|
      run!("git", "-C", repository, "checkout", "--detach")

      result = Mavona::Discovery::GitRepository.new(repository).inspect
      assert_equal "unknown", result.fetch("current_branch")
      assert_equal "unknown", result.fetch("remote_default_branch")
      assert_equal "unknown", result.fetch("default_branch")
    end
  end

  def test_configuration_override_has_highest_precedence
    with_repository do |repository|
      write(repository, ".mavona.yml", "default_branch: stable\n")

      result = Mavona::Discovery::GitRepository.new(repository).inspect
      assert_equal "stable", result.fetch("default_branch")
      assert_equal "configuration", result.fetch("default_branch_source")
    end
  end
end
