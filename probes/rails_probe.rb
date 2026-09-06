# frozen_string_literal: true
# Mavona protocol 1. No target requires, Bundler, eval, or application boot.
require 'json'
SCHEMA = 1
PARSER_VERSION = '1.8.1'
def reply(value)
  STDOUT.write(JSON.generate(value))
end
begin
  input = STDIN.read(2 * 1024 * 1024 + 1)
  raise ArgumentError if input.bytesize > 2 * 1024 * 1024
  request = JSON.parse(input)
  raise ArgumentError unless request.is_a?(Hash) && request['schemaVersion'] == SCHEMA && %w[availability parse].include?(request['operation'])
  raise ArgumentError unless (request.keys - %w[schemaVersion operation files]).empty?
  begin
    require 'prism'
  rescue LoadError
    reply({ schemaVersion: SCHEMA, status: 'unknown', reason: 'parser_unavailable' })
    exit
  end
  unless Prism::VERSION == PARSER_VERSION
    reply({ schemaVersion: SCHEMA, status: 'unknown', reason: 'parser_version_mismatch' })
    exit
  end
  if request['operation'] == 'availability'
    raise ArgumentError if request.key?('files')
    reply({ schemaVersion: SCHEMA, status: 'passed', rubyVersion: RUBY_VERSION, parserVersion: Prism::VERSION })
    exit
  end
  files = request['files']
  raise ArgumentError unless files.is_a?(Array) && files.length.between?(1, 64)
  results = files.map do |file|
    raise ArgumentError unless file.is_a?(Hash) && file.keys.sort == %w[digest path source]
    raise ArgumentError unless file.values.all? { |value| value.is_a?(String) }
    raise ArgumentError unless file['digest'].match?(/\A[0-9a-f]{64}\z/) && file['source'].bytesize <= 1_048_576
    path = file['path']
    raise ArgumentError if path.start_with?('/') || path.include?('\\') || path.split('/').any? { |part| ['', '.', '..'].include?(part) }
    parsed = Prism.parse(file['source'])
    declarations = []
    if parsed.success?
      stack = [[parsed.value, '', false, false]]
      until stack.empty?
        node, scope, inside_method, inside_routes = stack.pop
        declaration = nil
        next_scope = scope
        next_method = inside_method
        next_routes = inside_routes
        case node
        when Prism::ClassNode, Prism::ModuleNode
          raw = node.constant_path.location.slice
          name = if raw.start_with?('::') then raw.delete_prefix('::') else [scope, raw].reject(&:empty?).join('::') end
          declaration = { kind: node.is_a?(Prism::ClassNode) ? 'class' : 'module', name: name }
          if node.is_a?(Prism::ClassNode)
            superclass = node.superclass
            declaration[:superclass] = superclass && (superclass.is_a?(Prism::ConstantReadNode) || superclass.is_a?(Prism::ConstantPathNode)) ? superclass.location.slice : nil
          end
          next_scope = name
          next_method = false
          next_routes = false
        when Prism::DefNode
          declaration = { kind: 'method', name: node.name.to_s }
          next_method = true
          next_routes = false
        when Prism::ConstantWriteNode
          declaration = { kind: 'constant', name: [scope, node.name.to_s].reject(&:empty?).join('::') }
        when Prism::ConstantPathWriteNode
          raw = node.target.location.slice
          declaration = { kind: 'constant', name: raw.start_with?('::') ? raw.delete_prefix('::') : [scope, raw].reject(&:empty?).join('::') }
        when Prism::CallNode
          name = node.name.to_s
          receiver = node.receiver
          routes = receiver.is_a?(Prism::CallNode) && receiver.name == :routes ? receiver : nil
          application = routes&.receiver
          rails = application.is_a?(Prism::CallNode) && application.name == :application ? application.receiver : nil
          next_routes = true if name == 'draw' && rails.is_a?(Prism::ConstantReadNode) && rails.name == :Rails
          if inside_routes && !inside_method && node.receiver.nil? && %w[resources resource].include?(name)
            argument = node.arguments&.arguments&.first
            literal = argument.is_a?(Prism::SymbolNode) || argument.is_a?(Prism::StringNode) ? argument.unescaped : nil
            declaration = { kind: 'route', name: literal, macro: name }
          end
          kind = if %w[belongs_to has_one has_many has_and_belongs_to_many].include?(name) then 'association'
                 elsif %w[validates validate validates_with validates_each].include?(name) then 'validation'
                 elsif name.match?(/\A(?:before|after|around)_(?:validation|save|create|update|destroy|commit|rollback|action|perform)\z/) then 'callback' end
          if kind && !inside_method && (node.receiver.nil? || node.receiver.is_a?(Prism::SelfNode))
            argument = node.arguments&.arguments&.first
            literal = argument.is_a?(Prism::SymbolNode) ? argument.unescaped : nil
            declaration = { kind: kind, name: literal, macro: name }
          end
        end
        if declaration
          declaration[:line] = node.location.start_line
          declaration[:scope] = scope
          declarations << declaration
          raise ArgumentError if declarations.length > 10_000
        end
        node.compact_child_nodes.reverse_each { |child| stack << [child, next_scope, next_method, next_routes] }
      end
    end
    { path: path, digest: file['digest'], status: parsed.success? ? 'passed' : 'failed', declarations: declarations,
      errorLines: parsed.errors.map { |error| error.location.start_line }.uniq.first(100) }
  end
  reply({ schemaVersion: SCHEMA, status: results.all? { |file| file[:status] == 'passed' } ? 'passed' : 'failed', parserVersion: Prism::VERSION, files: results })
rescue StandardError, SystemStackError
  STDERR.write('Probe request or parser failed')
  reply({ schemaVersion: SCHEMA, status: 'unknown', reason: 'probe_failed' })
  exit 1
end
