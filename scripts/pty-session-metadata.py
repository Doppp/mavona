"""Native session metadata, exact archival review and retained draft."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, signal, json
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-command-pty-') as directory:
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
  os.write(master,b'unfinished task');collect(.2)
  def command(name,argument=None):
   os.write(master,b'\x10');collect(.2);os.write(master,name.encode());collect(.2);os.write(master,b'\r');collect(.2)
   if argument is not None:os.write(master,argument.encode());collect(.2);os.write(master,b'\r');collect(.2)
  command('/rename','Invoice corrections');command('/pin-session')
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1,logs
  def events():return [json.loads(line) for line in logs[0].read_text().splitlines()]
  assert [e['payload']['title'] for e in events() if e['type']=='session.renamed']==['Invoice corrections'];assert [e['payload']['pinned'] for e in events() if e['type']=='session.pinned']==[True]
  for approved in [False,True]:
   command('/archive');os.write(master,b'\x1b[F');collect(.2);os.write(master,b'y' if approved else b'n');collect(.3)
   assert [e['payload']['archived'] for e in events() if e['type']=='session.archived']==([True] if approved else [])
  os.write(master,b'\x0f');collect(.3);os.write(master,b'Invoice');collect(.2);assert b'Invoice' in output;os.write(master,b'\x1b');collect(.2);command('/unarchive');command('/unpin-session');os.write(master,b'\x1b[F');os.write(master,b'X');collect(.2)
  assert [e['payload']['text'] for e in events() if e['type']=='draft.changed'][-1]=='unfinished taskX';assert [e['payload']['archived'] for e in events() if e['type']=='session.archived']==[True,False];assert [e['payload']['pinned'] for e in events() if e['type']=='session.pinned']==[True,False];assert not any(e['type'] in ['task.started','provider.selected','tool.requested'] for e in events())
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native session metadata: rename, pin, denied/approved archive, searchable stable session, undo archive/pin, draft, no inference, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
