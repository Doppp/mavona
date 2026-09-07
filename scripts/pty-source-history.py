"""Native historical source, labelled selection and explicit worktree return."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, signal
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-source-pty-') as directory:
 root=pathlib.Path(directory);multiple='--multiple-roots' in sys.argv;app=root/'apps/shop' if multiple else root;(app/'config').mkdir(parents=True);(app/'config/application.rb').write_text('');(app/'app/models').mkdir(parents=True);(app/'app/models/order.rb').write_text('# 注文\nclass Order\nend\n')
 if multiple:
  (root/'apps/admin/config').mkdir(parents=True);(root/'apps/admin/config/application.rb').write_text('')
 subprocess.run(['git','init','-q',directory],check=True)
 subprocess.run(['git','-C',directory,'add','.'],check=True);subprocess.run(['git','-C',directory,'-c','user.name=Fixture','-c','user.email=fixture@invalid','-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false','commit','-qm','baseline'],check=True);(app/'app/models/order.rb').write_text('class ChangedOrder; end\n')
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
  def command(name,argument=None):
   os.write(master,b'\x10');collect(.2);os.write(master,name.encode());collect(.2);os.write(master,b'\r');collect(.2)
   if argument is not None:os.write(master,argument.encode());collect(.2);os.write(master,b'\r');collect(.3)
  revision_offset=len(output);command('/revision','HEAD');deadline=time.monotonic()+5
  while not any(marker in output[revision_offset:] for marker in (b'commit ',b'mmit ')) and time.monotonic()<deadline:collect(.1)
  assert any(marker in output[revision_offset:] for marker in (b'commit ',b'mmit ')),'Commit revision label missing';command('/select','2:2');command('/attach');command('/worktree')
  assert child.poll() is None,bytes(output).decode(errors='replace')
  assert b'order.rb' in output and b'Source' in output,bytes(output).decode(errors='replace')
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'))
  assert len(logs)==1,logs
  import json
  events=[json.loads(line) for line in logs[0].read_text().splitlines()]
  assert [event['payload']['text'] for event in events if event['type']=='draft.changed'][-1]=='unfinished task'
  if multiple:assert [event['payload']['root'] for event in events if event['type']=='rails.root.selected'][-1]=='apps/shop'
  reference=json.loads([e['payload']['reference'] for e in events if e['type']=='draft.reference.added'][-1]);assert reference['revision'].startswith('commit:') and reference['text']=='class Order';assert not any(event['type'] in ['provider.selected','tool.requested'] for event in events)
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',32,140,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2)
  os.write(master,b'\x1b');collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4)
  assert child.wait(timeout=5)==0
  assert termios.tcgetattr(slave)==original,'Terminal settings not restored'
  print('PASS native historical source: commit label, exact historical attachment, worktree return, retained draft, no inference, resize and cleanup')
 finally:
  if child.poll() is None:child.kill();child.wait()
  os.close(master);os.close(slave)
