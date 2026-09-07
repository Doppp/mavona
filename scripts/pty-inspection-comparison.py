"""Native capture-pair picker and immutable local comparison without browser replay."""
import re,os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,threading,http.server,urllib.request
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
class App(http.server.BaseHTTPRequestHandler):
 hits=0;shifted=False
 def do_GET(self):
  App.hits+=1;self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(('<h1 style="margin-left:'+('100' if App.shifted else '0')+'px">Order layout</h1>').encode())
 def log_message(self,*args):pass
with tempfile.TemporaryDirectory(prefix='mavona-comparison-pty-') as directory:
 base=pathlib.Path(directory);root=base/'repo';(root/'config').mkdir(parents=True);(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',str(root)],check=True);data=base/'data'
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),App);threading.Thread(target=server.serve_forever,daemon=True).start();flow=root/'flow.json';flow.write_text(json.dumps({'version':1,'url':'http://127.0.0.1:'+str(server.server_port),'viewport':{'width':640,'height':480},'steps':[{'op':'capture'}]}))
 command=[binary,'app','run','--flow',str(flow),'--root',str(root),'--data-dir',str(data)];preview=subprocess.run(command,capture_output=True,text=True);assert preview.returncode==2,preview.stderr;first=subprocess.run(command+['--approve-flow',json.loads(preview.stdout)['approval']['flowDigest']],capture_output=True,text=True);assert first.returncode==4,first.stderr;before=json.loads(first.stdout);session=before['sessionId'];App.shifted=True
 command=[binary,'app','rerun','--session',session,'--inspection',before['report']['id'],'--data-dir',str(data)];preview=subprocess.run(command,capture_output=True,text=True);assert preview.returncode==2,preview.stderr;second=subprocess.run(command+['--approve-rerun',json.loads(preview.stdout)['review']['id']],capture_output=True,text=True);assert second.returncode==4,second.stderr;after=json.loads(second.stdout);previous_hits=App.hits;before_id=before['report']['artifacts'][0]['id'];after_id=after['report']['artifacts'][0]['id']
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary,'resume',session,'--data-dir',str(data)],cwd=root,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try:output.extend(os.read(master,65536))
    except OSError:break
 def clean():return re.sub(rb'\s+',b'',re.sub(rb'\x1b\[[0-?]*[ -/]*[@-~]',b'',output))
 try:
  deadline=time.monotonic()+10
  while b'runtime unchecked' not in output and time.monotonic()<deadline:collect(.1)
  assert b'runtime unchecked' in output;os.write(master,b'comparison draft');collect(.2);os.write(master,b'\x10');collect(.2);os.write(master,b'/app compare');collect(.2);os.write(master,b'\r');collect(.2);os.write(master,before_id.encode());collect(.2);os.write(master,b'\r');collect(.2);os.write(master,after_id.encode());collect(.2);os.write(master,b'\r');collect(.5)
  urls=re.findall(rb'http://127\.0\.0\.1:\d+/[a-f0-9-]+/report\.html',clean());assert urls,'Comparison viewer URL missing';url=urls[-1].decode();html=urllib.request.urlopen(url).read();assert b'Visual comparison: unknown' in html and before_id.encode() in html and after_id.encode() in html and b'Overlay captures' in html;assert App.hits==previous_hits,'Comparison replayed browser actions'
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x1b');collect(.2);os.write(master,b'\x1b[F');os.write(master,b'X');collect(.2);events=[json.loads(line) for line in (data/'sessions'/session/'events.jsonl').read_text().splitlines()];assert [e['payload']['text'] for e in events if e['type']=='draft.changed'][-1]=='comparison draftX';assert not any(e['type']=='task.started' for e in events)
  os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  try:urllib.request.urlopen(url,timeout=1);raise AssertionError('Viewer survived terminal exit')
  except OSError:pass
  print('PASS native comparison: two real captures, exact picker IDs, unknown truth, immutable viewer, no replay/inference, draft, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave);server.shutdown();server.server_close()
