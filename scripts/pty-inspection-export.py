"""Native export preview, keyboard review, denial and approved portable archive."""
import re,os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,threading,http.server
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
class App(http.server.BaseHTTPRequestHandler):
 hits=0
 def do_GET(self):
  App.hits+=1;self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(b'<h1>Recorded order evidence</h1>')
 def log_message(self,*args):pass
with tempfile.TemporaryDirectory(prefix='mavona-inspection-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',directory],check=True)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),App);threading.Thread(target=server.serve_forever,daemon=True).start();export_root=tempfile.TemporaryDirectory(prefix='mavona-export-output-');destination=pathlib.Path(export_root.name)/'portable.tar.gz';data=root/'data';url='http://127.0.0.1:'+str(server.server_port)
 # Preserve the explicitly provisioned browser cache for the capture command.
 base=[binary,'app','inspect','--url',url,'--root',directory,'--data-dir',str(data)]
 review=subprocess.run(base,capture_output=True,text=True);assert review.returncode==2,review.stderr
 capture=subprocess.run(base+['--approve-flow',json.loads(review.stdout)['approval']['flowDigest']],capture_output=True,text=True);assert capture.returncode==4,capture.stderr
 result=json.loads(capture.stdout);session=result['sessionId'];inspection=result['report']['id'];previous_hits=App.hits
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary,'resume',session,'--data-dir',str(data)],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
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
  assert b'runtime unchecked' in output,'Discovery did not become ready'
  os.write(master,b'unfinished drawer draft');collect(.2);os.write(master,b'\x10');collect(.2);os.write(master,b'/app');collect(.2);os.write(master,b'\r');collect(.3)
  assert b'App Inspection' in output,'Drawer header missing';assert b'Current verification' in output,'Truth label missing'
  os.write(master,b'\x1b[6~');collect(.2);os.write(master,b'\x1b[F');collect(.2)
  assert b'Images and model' in output,'Drawer keyboard scrolling did not reach footer'
  for approved in [False,True]:
   os.write(master,b'\x10');collect(.2);os.write(master,b'/app export');collect(.2);os.write(master,b'\r');collect(.2);os.write(master,str(destination).encode());collect(.2);os.write(master,b'\r');collect(.4)
   assert not destination.exists(),'Archive written before approval'
   os.write(master,b'\x1b[6~');collect(.2);os.write(master,b'\x1b[F');collect(.2)
   visible=''.join(re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',output.decode('utf-8','replace')).split())
   assert 'noupload' in visible,'Approval could not scroll to full scope'
   os.write(master,b'y' if approved else b'n');collect(.5)
   if approved:
    deadline=time.monotonic()+10
    while not destination.exists() and time.monotonic()<deadline:collect(.1)
    assert destination.exists(),'Approved export missing'
   else:assert not destination.exists(),'Denied export wrote an archive'
  import tarfile
  with tarfile.open(destination) as archive:
   names=archive.getnames();assert 'report.html' in names and 'manifest.json' in names and 'report.json' not in names,names
  os.write(master,b'ignored while viewing');collect(.1);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x1b');collect(.3);os.write(master,b'\x1b[F');os.write(master,b'X');collect(.2)
  events=[json.loads(line) for line in (data/'sessions'/session/'events.jsonl').read_text().splitlines()];assert [e['payload']['text'] for e in events if e['type']=='draft.changed'][-1]=='unfinished drawer draftX';assert App.hits==previous_hits,'Viewing replayed browser access';assert not any(e['type']=='task.started' for e in events)
  os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native export: exact manifest scrolling, denial, approved portable archive, draft preservation, no replay, resize and terminal cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave);server.shutdown();server.server_close();export_root.cleanup()
