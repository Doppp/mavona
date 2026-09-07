"""Native new/fork/switch lifecycle preserves source drafts and transfers writer ownership."""
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
  os.write(master,b'unfinished original');collect(.2)
  def logs():return list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'))
  original_log=logs()[0];original_id=original_log.parent.name
  def command(name):
   os.write(master,b'\x10');collect(.2);os.write(master,name.encode());collect(.2);os.write(master,b'\r');collect(.6)
  command('/fork');assert len(logs())==2;fork_log=next(path for path in logs() if path!=original_log);fork_id=fork_log.parent.name
  os.write(master,b'\x1b[F');os.write(master,b' fork edit');collect(.2)
  def events(path):return [json.loads(line) for line in path.read_text().splitlines()]
  assert [e['payload']['text'] for e in events(fork_log) if e['type']=='draft.changed'][-1]=='unfinished original fork edit'
  assert [e['payload']['text'] for e in events(original_log) if e['type']=='draft.changed'][-1]=='unfinished original'
  command('/new');assert len(logs())==3;fresh=next(path for path in logs() if path not in [original_log,fork_log]);os.write(master,b'fresh draft');collect(.2);assert [e['payload']['text'] for e in events(fresh) if e['type']=='draft.changed'][-1]=='fresh draft'
  os.write(master,b'\x0f');collect(.3);os.write(master,original_id.encode());collect(.2);os.write(master,b'\r');collect(.6);os.write(master,b'\x1b[F');os.write(master,b' restored');collect(.2)
  assert [e['payload']['text'] for e in events(original_log) if e['type']=='draft.changed'][-1]=='unfinished original restored'
  assert [e['payload']['text'] for e in events(fork_log) if e['type']=='draft.changed'][-1]=='unfinished original fork edit'
  assert not any(e['type'] in ['task.started','provider.selected','tool.requested'] for path in logs() for e in events(path))
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native session creation: fork/new, independent preserved drafts, stable-ID resume, writer transfer, no inference, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
