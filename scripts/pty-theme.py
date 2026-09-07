"""Native terminal themes: detection, explicit persistence, resize and cleanup."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,re
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
ansi=re.compile(rb'\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))')
with tempfile.TemporaryDirectory(prefix='mavona-theme-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',directory],check=True)
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','COLORFGBG':'0;15'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try: output.extend(os.read(master,65536))
    except OSError: break
 try:
  deadline=time.monotonic()+10
  while b'runtime unchecked' not in ansi.sub(b'',bytes(output)) and time.monotonic()<deadline: collect(.1)
  visible=ansi.sub(b'',bytes(output));assert b'theme light' in visible,visible.decode(errors='replace')
  for command in [b'/theme dark\r',b'/theme light\r',b'/theme no-color\r']:
   os.write(master,command);collect(.3)
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1,logs
  events=[json.loads(line) for line in logs[0].read_text().splitlines()];themes=[event['payload']['theme'] for event in events if event['type']=='terminal.theme.changed'];assert themes==['dark','light','no-color'],themes
  assert not any(event['type'] in ['task.started','provider.selected','tool.requested'] for event in events)
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);assert b'theme no-color' in ansi.sub(b'',bytes(output))
  os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native theme PTY: light detection, dark/light/no-color persistence, textual status, no inference, resize and terminal cleanup')
 finally:
  if child.poll() is None: os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
