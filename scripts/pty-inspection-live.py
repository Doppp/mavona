"""Native live App Inspection lifecycle through the command palette."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,threading,http.server,urllib.request
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
class App(http.server.BaseHTTPRequestHandler):
 hits=0
 def do_GET(self):
  App.hits+=1;self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(b'<h1>Live browser</h1>')
 def log_message(self,*args):pass
with tempfile.TemporaryDirectory(prefix='mavona-live-inspection-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');cache=root/'Library/Caches';cache.mkdir(parents=True);(cache/'ms-playwright').symlink_to(pathlib.Path.home()/'Library/Caches/ms-playwright');subprocess.run(['git','init','-q',directory],check=True);server=http.server.ThreadingHTTPServer(('127.0.0.1',0),App);threading.Thread(target=server.serve_forever,daemon=True).start();url='http://127.0.0.1:'+str(server.server_port)
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try:output.extend(os.read(master,65536))
    except OSError:break
 def palette(command,args=None):
  os.write(master,b'\x10');collect(.15);os.write(master,command.encode());collect(.15);os.write(master,b'\r');collect(.15)
  if args is not None:os.write(master,args.encode());collect(.15);os.write(master,b'\r');collect(.25)
 def events():
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));return [] if not logs else [json.loads(line) for line in logs[0].read_text().splitlines()]
 try:
  deadline=time.monotonic()+10
  while b'runtime unchecked' not in output and time.monotonic()<deadline:collect(.1)
  assert b'runtime unchecked' in output;os.write(master,b'preserved live draft');collect(.2);palette('/inspect-app',url);assert b'Approve exact action' in output;os.write(master,b'y');
  deadline=time.monotonic()+15
  while App.hits==0 and time.monotonic()<deadline:collect(.1)
  assert App.hits>0,'Live browser did not attach';assert any(e['type']=='effect.requested' and e['payload']['kind']=='browser' for e in events());palette('/app capture');deadline=time.monotonic()+10
  while not any(e['type']=='inspection.artifact' for e in events()) and time.monotonic()<deadline:collect(.1)
  assert any(e['type']=='inspection.artifact' for e in events());palette('/app takeover');collect(.3);palette('/app resume');deadline=time.monotonic()+10
  while len([e for e in events() if e['type']=='app_observation'])<1 and time.monotonic()<deadline:collect(.1)
  palette('/app stop');deadline=time.monotonic()+10
  while not any(e['type']=='inspection.completed' for e in events()) and time.monotonic()<deadline:collect(.1)
  recorded=events();operations=[json.loads(e['payload']['event'])['operation'] for e in recorded if e['type']=='inspection.event'];assert 'capture' in operations and 'takeover' in operations and 'resume' in operations;assert [e['payload']['text'] for e in recorded if e['type']=='draft.changed'][-1]=='preserved live draft';assert not any(e['type'] in ['task.started','provider.selected','tool.requested'] for e in recorded);assert urllib.request.urlopen(url,timeout=2).status==200
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x1b');collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native live inspection: reviewed attach, capture, takeover, fresh resume, owned browser stop, attached server preservation, draft, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave);server.shutdown();server.server_close()
