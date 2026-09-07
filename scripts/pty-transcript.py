"""Native resumed Markdown transcript with expandable canonical tool details."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,re
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve());ansi=re.compile(rb'\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))')
with tempfile.TemporaryDirectory(prefix='mavona-transcript-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',directory],check=True);data=root/'data';session='transcript';session_dir=data/'sessions'/session;session_dir.mkdir(parents=True)
 rows=[('session.opened',{'repository':directory}),('user.message',{'text':'Explain order state'}),('assistant.delta',{'text':'## Result\n'}),('assistant.delta',{'text':'Use **Order** and `ready`.'}),('tool.requested',{'callId':'read-1','name':'read_file','arguments':'{"path":"app/models/order.rb"}'}),('tool.completed',{'callId':'read-1','result':'{"state":"passed","text":"class Order"}'}),('verification.completed',{'checkId':'test','state':'unknown','provenance':'user-approved','required':True,'result':'{"reason":"not run"}'})]
 events=[]
 for index,(kind,payload) in enumerate(rows,1):events.append({'protocolVersion':1,'eventId':'transcript-event-'+str(index),'sessionId':session,'sequence':index,'timestamp':f'2026-01-01T00:00:00.{index:03d}Z','type':kind,'schemaVersion':1,'payload':payload})
 log=session_dir/'events.jsonl';log.write_text(''.join(json.dumps(event,separators=(',',':'))+'\n' for event in events))
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
  while b'runtime unchecked' not in ansi.sub(b'',bytes(output)) and time.monotonic()<deadline:collect(.1)
  visible=ansi.sub(b'',bytes(output));assert b'Result' in visible and b'Use Order and ready.' in visible,visible.decode(errors='replace');assert b'## Result' not in visible;assert b'Tool' in visible and b'read_file' in visible and b'Verification' in visible and b'unknown' in visible;baseline_count=len(log.read_text().splitlines())
  os.write(master,b'preserved draft');collect(.2);os.write(master,b'\x10');collect(.2);os.write(master,b'/tool');collect(.2);os.write(master,b'\r');collect(.2);os.write(master,b'read-1');collect(.2);os.write(master,b'\r');collect(.4);visible=ansi.sub(b'',bytes(output));assert b'Arguments' in visible and b'class' in visible and b'Order' in visible,visible.decode(errors='replace')
  current=[json.loads(line) for line in log.read_text().splitlines()];drafts=[event['payload']['text'] for event in current if event['type']=='draft.changed'];assert drafts[-1]=='preserved draft';assert all(event['type']=='draft.changed' for event in current[baseline_count:]),current[baseline_count:]
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native transcript PTY: concealed Markdown, canonical tool/verification cards, expanded details, preserved draft, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
