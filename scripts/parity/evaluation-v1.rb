require 'json'
require 'rbconfig'
require 'ostruct'
archive = ARGV.fetch(0)
require File.join(archive, 'eval/lib/mavona/evaluation')
inputs = [
  { 'id'=>'pass', 'stdout'=>'{"grader_status":"passed","tests_status":"passed"}', 'exitCode'=>0, 'timedOut'=>false },
  { 'id'=>'failure', 'stdout'=>'{"grader_status":"failed","tests_status":"failed"}', 'exitCode'=>1, 'timedOut'=>false },
  { 'id'=>'nonzero-pass-claim', 'stdout'=>'{"grader_status":"passed","tests_status":"passed"}', 'exitCode'=>1, 'timedOut'=>false },
  { 'id'=>'not-run', 'stdout'=>'{"grader_status":"not_run","tests_status":"not_run"}', 'exitCode'=>0, 'timedOut'=>false },
  { 'id'=>'error', 'stdout'=>'{"grader_status":"error","tests_status":"error"}', 'exitCode'=>2, 'timedOut'=>false },
  { 'id'=>'timeout', 'stdout'=>'{"grader_status":"passed","tests_status":"passed"}', 'exitCode'=>nil, 'timedOut'=>true },
  { 'id'=>'malformed', 'stdout'=>'not JSON', 'exitCode'=>0, 'timedOut'=>false },
  { 'id'=>'missing-tests', 'stdout'=>'{"grader_status":"passed"}', 'exitCode'=>0, 'timedOut'=>false },
  { 'id'=>'unknown-state', 'stdout'=>'{"grader_status":"maybe"}', 'exitCode'=>0, 'timedOut'=>false }
]
observations = inputs.map do |input|
  process = OpenStruct.new(stdout:input['stdout'], stderr:'', exit_status:input['exitCode'], timed_out:input['timedOut'])
  runner = Object.new
  runner.define_singleton_method(:call) { |*args, **kwargs| process }
  observed = Mavona::Evaluation::GraderRunner.new(root:archive, process_runner:runner).call(task:OpenStruct.new(grader:'unused-fixture',max_duration:1),worktree:archive)
  { input:input, observed:observed }
end
puts JSON.pretty_generate({schemaVersion:1,sourceCommit:'fdee1136acd7863885ed20c6760f61674f7e32c5',runtime:RUBY_DESCRIPTION,scope:'Pure result normalization using recorded process-result fixtures; no grader execution',observations:observations})
