import { expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { inspectRepository } from '../packages/rails/discovery';
import { routeTask } from '../packages/rails/routing';
import { parseRubyFiles } from '../packages/rails/probe';
const root=resolve(import.meta.dir,'../fixtures/rails-dogfood');
test('canonical fixture discovery and routing nominate Rails order surfaces without boot',async()=>{
 const inspection=await inspectRepository(root);expect(inspection.status).toBe('selected');expect(inspection.facts.railsVersion).toBe('8.1.3.1');expect(inspection.facts.frontend).toContain('turbo-rails');expect(inspection.facts.frontend).toContain('stimulus-rails');
 const route=routeTask('Let customers reschedule an order',inspection);expect(route.status).toBe('PLAN_READY');expect(route.candidates.some(candidate=>candidate.nominated&&candidate.path.endsWith('/app/models/order.rb'))).toBe(true);expect(route.candidates.some(candidate=>candidate.nominated&&candidate.path.endsWith('/app/controllers/orders_controller.rb'))).toBe(true);expect(route.candidates.some(candidate=>candidate.nominated&&candidate.path.endsWith('/app/views/orders/show.html.erb'))).toBe(true);
});
test('canonical model exposes syntactic association and validation facts without Rails boot',async()=>{
 const structure=await parseRubyFiles(root,['app/models/order.rb']);expect(structure.status).toBe('passed');expect(structure.files[0]?.declarations.some(declaration=>declaration.kind==='association'&&declaration.name==='customer')).toBe(true);expect(structure.files[0]?.declarations.some(declaration=>declaration.kind==='validation'&&declaration.name==='scheduled_in_future')).toBe(true);
});
