# frozen_string_literal: true

require "json"

prompt = $stdin.read
File.write("agent_observation.json", JSON.generate(
  "prompt" => prompt,
  "visible_files" => Dir.glob("**/*", File::FNM_DOTMATCH).reject { |path| path.start_with?(".git/") }.sort
))

implementation = if ENV.fetch("MAVONA_EVAL_CONDITION") == "mavona" && prompt.include?("Repository evidence:")
  "class Account; validates :name, presence: true; end\n"
else
  "class Account; end\n"
end
File.write("app/models/account.rb", implementation)
