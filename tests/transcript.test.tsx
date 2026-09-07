import {expect,test} from 'bun:test';
import {testRender} from '@opentui/solid';
import {Transcript} from '../packages/tui/transcript';
import type {TranscriptMessage} from '../packages/tui/transcript-items';

test('native transcript renders concealed Markdown and expanded tool and verification cards',async()=>{
 const messages:TranscriptMessage[]=[
  {id:'assistant',kind:'assistant',text:'## Result\nUse **Order** and `ready`.',streaming:false},
  {id:'tool:read',kind:'tool',text:'Tool · passed · read_file · order.rb · 3 ms · /tool read',detail:'Arguments\n{"path":"order.rb"}\n\nResult\n{"state":"passed"}',expanded:true},
  {id:'verification',kind:'verification',text:'Verification · test · unknown · user-approved'}
 ];
 const setup=await testRender(()=> <Transcript messages={()=>messages} theme={()=> 'dark'}/>,{width:80,height:24});
 try{const frame=await setup.waitForFrame(value=>value.includes('Use Order and ready.'));expect(frame).toContain('Result');expect(frame).toContain('Use Order and ready.');expect(frame).not.toContain('## Result');expect(frame).toContain('Tool · passed · read_file');expect(frame).toContain('Arguments');expect(frame).toContain('Verification · test · unknown');}
 finally{setup.renderer.destroy();}
});
