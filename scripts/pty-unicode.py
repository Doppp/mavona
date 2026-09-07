"""Native UTF-8 composer: committed IME text, RTL boundary, resize and cleanup."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve());committed='注文 👩🏽‍💻 e\u0301';rtl='שלום'
with tempfile.TemporaryDirectory(prefix='mavona-unicode-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',directory],check=True)
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try: output.extend(os.read(master,65536))
    except OSError: break
 def events():
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1,logs;return [json.loads(line) for line in logs[0].read_text().splitlines()]
 try:
  deadline=time.monotonic()+10
  while b'runtime unchecked' not in output and time.monotonic()<deadline: collect(.1)
  assert b'runtime unchecked' in output,'Renderer/discovery did not become ready'
  os.write(master,committed.encode());collect(.3);drafts=[event['payload']['text'] for event in events() if event['type']=='draft.changed'];assert drafts[-1]==committed,drafts[-1]
  os.write(master,b'\x03');collect(.2);os.write(master,rtl.encode());collect(.3);drafts=[event['payload']['text'] for event in events() if event['type']=='draft.changed'];assert drafts[-1]==rtl,drafts[-1]
  assert not any(event['type'] in ['task.started','provider.selected','tool.requested'] for event in events())
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native Unicode PTY: committed CJK/emoji/combining text, standalone RTL logical order, no inference, resize and terminal cleanup')
 finally:
  if child.poll() is None: os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
