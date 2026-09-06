import { expect, test } from 'bun:test';
import { routeTask } from '../packages/rails/routing';
import type { RepositoryInspection } from '../packages/rails/discovery';
function inspection(files:string[], overrides:Partial<RepositoryInspection>={}):RepositoryInspection {
 return {schemaVersion:1,status:'selected',repository:'/fixture',roots:['.'],selectedRoot:'.',files,
 facts:{railsVersion:'8.1',testFrameworks:['minitest'],databaseAdapters:[],frontend:[]},runtime:'unknown',warnings:[],...overrides};
}
test('unmatched tasks need evidence rather than the observed v1 empty-scope direct route',()=>{
 const result=routeTask('Adjust frobnicator behavior',inspection(['app/models/order.rb']));
 expect(result.status).toBe('NEEDS_DECISION'); expect(result.contextPaths).toEqual([]);
});
test('explicit files produce stable direct scope and weak surface boosts cannot enter context',()=>{
 const files=['app/models/order.rb','app/models/customer.rb','test/models/order_test.rb'];
 const result=routeTask('Change app/models/order.rb',inspection(files));
 expect(result.status).toBe('PLAN_READY');
 if(result.status!=='PLAN_READY') throw Error('not ready');
 expect(result.planningMode).toBe('direct_change');
 expect(result.contextPaths).toEqual(['app/models/order.rb','test/models/order_test.rb']);
 expect(result.candidates.find(c=>c.path==='app/models/customer.rb')?.nominated).toBe(false);
 expect(routeTask('Change app/models/order.rb',inspection([...files].reverse()))).toEqual(result);
 expect(result.candidates[0]?.id).toMatch(/^impact_[a-f0-9]{16}$/);
});
test('domain words nominate Rails surfaces without substring false positives',()=>{
 const result=routeTask('Update orders',inspection(['app/models/order.rb','app/models/preorder.rb','app/controllers/orders_controller.rb']));
 expect(result.contextPaths).toEqual(['app/controllers/orders_controller.rb','app/models/order.rb']);
 expect(routeTask('Change model behavior',inspection(['app/models/order.rb'])).status).toBe('NEEDS_DECISION');
});
test('evidenced broad surface work uses lightweight planning and risk uses full planning',()=>{
 const data=inspection(['app/models/order.rb','app/controllers/orders_controller.rb','app/views/orders/show.html.erb','test/models/order_test.rb']);
 const light=routeTask('Change orders',data); const full=routeTask('Change order authorization',data);
 expect(light.status==='PLAN_READY'&&light.planningMode).toBe('lightweight_plan');
 expect(full.status==='PLAN_READY'&&full.planningMode).toBe('full_plan');
 expect(routeTask('Change payment encryption',inspection([])).status).toBe('NEEDS_DECISION');
});
test('unsupported, root selection and decomposition do not nominate context',()=>{
 expect(routeTask('Change order',inspection([],{status:'unsupported'})).status).toBe('UNSUPPORTED');
 expect(routeTask('Change order',inspection([],{status:'needs_decision',selectedRoot:null})).status).toBe('NEEDS_DECISION');
 expect(routeTask('Rewrite the entire application',inspection(['app/models/order.rb'])).status).toBe('TOO_BROAD');
 expect(()=>routeTask('  ',inspection([]))).toThrow('required');
});
test('nested roots isolate nominations and reject malformed inventory paths',()=>{
 const result=routeTask('Change orders',inspection(['apps/shop/app/models/order.rb','apps/admin/app/models/order.rb','apps/shop/../admin/app/models/order.rb','/tmp/order.rb'],{selectedRoot:'apps/shop',roots:['apps/shop','apps/admin']}));
 expect(result.contextPaths).toEqual(['apps/shop/app/models/order.rb']);
});
test('context limit is explicit and retains excluded nominated evidence for widening',()=>{
 const result=routeTask('Change orders',inspection(Array.from({length:12},(_,i)=>`app/views/orders/view_${i}.html.erb`)));
 expect(result.contextPaths).toHaveLength(8); expect(result.candidates.filter(c=>c.nominated)).toHaveLength(12);
 expect(result.contextTruncated).toBe(true);
});
