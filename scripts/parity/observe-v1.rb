# Read-only observer of the archived v1 implementation. Never invokes Verifier#run or app boot.
require 'json'
require 'shellwords'
archive, root, requested, task = ARGV
$LOAD_PATH.unshift(File.join(archive, 'lib'))
require 'mavona'
begin
  discovery = Mavona::Discovery.call(path: requested, boot: false)
  selected = discovery.dig('rails', 'selected_root')
  analysis_root = selected && selected != 'unknown' ? File.expand_path(selected, root) : root
  analysis = Mavona::TaskAnalyzer.new(root: analysis_root).call(task: task, discovery: discovery)
  verifier = Mavona::Verifier.new(root: analysis_root, configuration: nil, analysis: analysis, discovery: discovery)
  recommendations = analysis['status'] == 'PLAN_READY' ? verifier.send(:inferred_commands) : {}
  recommendations = recommendations.transform_values { |command| command.is_a?(Array) ? command : Shellwords.split(command) }
  puts JSON.generate({runtime: RUBY_DESCRIPTION, discovery: discovery, analysis: analysis, verifier_recommendations: recommendations, app_boot: 'not_run', verification_execution: 'not_run'})
rescue StandardError => error
  puts JSON.generate({runtime: RUBY_DESCRIPTION, discovery: defined?(discovery) ? discovery : nil, error: {class: error.class.name, message: error.message}, app_boot: 'not_run', verification_execution: 'not_run'})
  exit 1
end
