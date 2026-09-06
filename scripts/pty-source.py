"""Native source/picker smoke with an isolated Rails fixture and no provider."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, signal
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-source-pty-') as directory:
 root=pathlib.Path(directory);multiple='--multiple-roots' in sys.argv;app=root/'apps/shop' if multiple else root;(app/'config').mkdir(parents=True);(app/'config/application.rb').write_text('');(app/'app/models').mkdir(parents=True);(app/'app/models/order.rb').write_text('# 注文\nclass Order\nend\n')
 if multiple:
  (root/'apps/admin/config').mkdir(parents=True);(root/'apps/admin/config/application.rb').write_text('')
 subprocess.run(['git','init','-q',directory],check=True)
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0))
 child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try:output.extend(os.read(master,65536))
    except OSError:break
 try:
  collect(1)
  if multiple:
   assert b'Rails roots' in output,bytes(output).decode(errors='replace')
   os.write(master,b'shop\r');collect(.3)
  os.write(master,b'unfinished task');collect(.2);os.write(master,b'\x10');collect(.2);os.write(master,b'files');collect(.2);os.write(master,b'\r');collect(.3);os.write(master,b'amord');collect(.2);os.write(master,b'\r');collect(.6)
  assert child.poll() is None,bytes(output).decode(errors='replace')
  assert b'order.rb' in output and b'Source' in output,bytes(output).decode(errors='replace')
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'))
  assert len(logs)==1,logs
  import json
  events=[json.loads(line) for line in logs[0].read_text().splitlines()]
  assert [event['payload']['text'] for event in events if event['type']=='draft.changed'][-1]=='unfinished task'
  if multiple:assert [event['payload']['root'] for event in events if event['type']=='rails.root.selected'][-1]=='apps/shop'
  assert not any(event['type'] in ['provider.selected','tool.requested'] for event in events)
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',32,140,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2)
  os.write(master,b'\x1b');collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4)
  assert child.wait(timeout=5)==0
  assert termios.tcgetattr(slave)==original,'Terminal settings not restored'
  print('PASS native source PTY: fuzzy picker, Ruby/Unicode snapshot, unchanged draft, no inference, resize, cleanup')
 finally:
  if child.poll() is None:child.kill();child.wait()
  os.close(master);os.close(slave)
