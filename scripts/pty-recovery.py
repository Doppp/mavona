"""Native agent deletion followed by reviewed terminal restoration without inference."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,threading,http.server,hashlib
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve());original_source=b'# retained user change\nclass Order; end\n'
class Provider(http.server.BaseHTTPRequestHandler):
 calls=0
 def do_POST(self):
  json.loads(self.rfile.read(int(self.headers['Content-Length'])));Provider.calls+=1
  tool={'tool_calls':[{'index':0,'id':'delete-order','type':'function','function':{'name':'delete_file','arguments':json.dumps({'path':'app/models/order.rb','beforeDigest':hashlib.sha256(original_source).hexdigest()})}}]} if Provider.calls==1 else {'content':'Deletion retained; correctness unknown.'}
  body=('data: '+json.dumps({'choices':[{'delta':tool,'finish_reason':None}]})+'\n\ndata: '+json.dumps({'choices':[{'delta':{},'finish_reason':'tool_calls' if Provider.calls==1 else 'stop'}]})+'\n\ndata: [DONE]\n\n').encode();self.send_response(200);self.send_header('Content-Type','text/event-stream');self.end_headers();self.wfile.write(body)
 def log_message(self,*args):pass
with tempfile.TemporaryDirectory(prefix='mavona-recovery-pty-') as directory:
 base=pathlib.Path(directory);root=base/'repo';(root/'config').mkdir(parents=True);(root/'config/application.rb').write_text('');(root/'app/models').mkdir(parents=True);source=root/'app/models/order.rb';source.write_bytes(original_source);source.chmod(0o755);subprocess.run(['git','init','-q',str(root)],check=True);data=base/'data'
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Provider);threading.Thread(target=server.serve_forever,daemon=True).start()
 deleted=subprocess.run([binary,'run','Delete order model','--root',str(root),'--data-dir',str(data),'--provider','fixture','--model','test','--endpoint','http://127.0.0.1:'+str(server.server_port)+'/v1','--locality','local','--trust-model-tools','--allow-write','app/models/order.rb'],capture_output=True,text=True);assert deleted.returncode==4,deleted.stderr;session=json.loads(deleted.stdout)['sessionId'];assert not source.exists();requests=Provider.calls;assert requests==2
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary,'resume',session,'--data-dir',str(data)],cwd=root,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try:output.extend(os.read(master,65536))
    except OSError:break
 try:
  deadline=time.monotonic()+10
  while b'runtime unchecked' not in output and time.monotonic()<deadline:collect(.1)
  assert b'runtime unchecked' in output,'Discovery did not become ready';os.write(master,b'retained restoration draft');collect(.2)
  for approved in [False,True]:
   os.write(master,b'\x10');collect(.2);os.write(master,b'/recover');collect(.2);os.write(master,b'\r');collect(.3);os.write(master,b'\r');collect(.4)
   assert not source.exists(),'Source restored before approval';assert b'Approve exact action' in output
   os.write(master,b'\x1b[F');collect(.2);os.write(master,b'y' if approved else b'n');collect(.5)
   if approved:
    deadline=time.monotonic()+10
    while not source.exists() and time.monotonic()<deadline:collect(.1)
    assert source.read_bytes()==original_source;assert source.stat().st_mode&0o777==0o755
   else:assert not source.exists(),'Denied restoration moved source'
  os.write(master,b'\x1b[F');os.write(master,b'X');collect(.2);events=[json.loads(line) for line in (data/'sessions'/session/'events.jsonl').read_text().splitlines()];assert [e['payload']['text'] for e in events if e['type']=='draft.changed'][-1]=='retained restoration draftX';assert [e['payload']['state'] for e in events if e['type']=='source.recovery.completed']==['passed'];assert Provider.calls==requests,'Restoration made inference requests'
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native recovery: actual deletion, stable picker, denied/approved restoration, preserved bytes/mode/draft, no inference, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave);server.shutdown();server.server_close()
