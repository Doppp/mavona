"""Native command palette: filtering, argument entry, draft preservation and cleanup."""
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
  os.write(master,b'unfinished task');collect(.2);os.write(master,b'\x10');collect(.2);os.write(master,b'repair');collect(.2);os.write(master,b'\r');collect(.2);os.write(master,b'0');collect(.2);os.write(master,b'\r');collect(.3)
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1,logs
  events=[json.loads(line) for line in logs[0].read_text().splitlines()];assert [e['payload']['maxAttempts'] for e in events if e['type']=='repair.policy']==[0],events
  assert [e['payload']['text'] for e in events if e['type']=='draft.changed'][-1]=='unfinished task',events
  assert not any(e['type'] in ['task.started','provider.selected','tool.requested'] for e in events)
  os.write(master,b'\x10');collect(.2);os.write(master,b'files');collect(.2);os.write(master,b'\x1b');collect(.3)
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native command PTY: Ctrl+P, filter, argument entry, preserved draft, cancel, no inference, resize, terminal cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
