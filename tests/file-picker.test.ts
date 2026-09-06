import {test,expect} from 'bun:test';import {fuzzyFiles} from '../packages/tools/file-picker';
test('fuzzy Rails picker ranks path boundaries and preserves stable identities across queries',()=>{
 const paths=['app/models/order.rb','app/controllers/admin/orders_controller.rb','app/models/customer.rb','app/views/orders/show.html.erb','app/models/注文.rb'];const result=fuzzyFiles(paths,'amord');expect(result[0]?.path).toBe('app/models/order.rb');expect(fuzzyFiles(paths,'注文')[0]?.path).toBe('app/models/注文.rb');expect(fuzzyFiles(paths,'order').find(item=>item.path==='app/models/order.rb')?.id).toBe(result[0]?.id);expect(fuzzyFiles(paths,'doesnotexist')).toEqual([]);expect(fuzzyFiles(paths,'',2)).toHaveLength(2);
});
