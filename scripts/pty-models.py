"""Native model picker: explicit local endpoint, metadata-only discovery, no inference."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, signal, json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
requests=[]
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  requests.append(('GET',self.path)); body=json.dumps({'data':[{'id':'fixture-beta'},{'id':'fixture-alpha'}]}).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_POST(self):
  requests.append(('POST',self.path));self.send_response(500);self.end_headers()
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 with tempfile.TemporaryDirectory(prefix='mavona-model-pty-') as directory:
  root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',directory],check=True)
  master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
  def collect(seconds):
   until=time.monotonic()+seconds
   while time.monotonic()<until:
    ready,_,_=select.select([master],[],[],.05)
    if ready:
     try: output.extend(os.read(master,65536))
     except OSError: break
  try:
   deadline=time.monotonic()+10
   while b'runtime unchecked' not in output and time.monotonic()<deadline:collect(.1)
   assert b'runtime unchecked' in output,'Renderer/discovery did not become ready'
   os.write(master,f'/connect fixture fixture-beta http://127.0.0.1:{server.server_port}/v1 local\r'.encode());collect(.4);os.write(master,b'/models\r');collect(.6)
   assert b'Models' in output,bytes(output).decode(errors='replace')
   os.write(master,b'alpha');collect(.2);os.write(master,b'\r');collect(.3)
   logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1,logs
   events=[json.loads(line) for line in logs[0].read_text().splitlines()];selected=[json.loads(event['payload']['configuration']) for event in events if event['type']=='provider.configured'];assert selected[-1]['model']=='fixture-alpha',selected
   assert requests==[('GET','/v1/models')],requests
   assert not any(event['type'] in ['task.started','provider.selected','tool.requested'] for event in events)
   fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
   print('PASS native model PTY: explicit locality, metadata-only discovery, filtered stable model choice, no inference, resize and terminal cleanup')
  finally:
   if child.poll() is None: os.killpg(child.pid,signal.SIGKILL);child.wait()
   os.close(master);os.close(slave)
finally:
 server.shutdown();server.server_close();thread.join(timeout=2)
