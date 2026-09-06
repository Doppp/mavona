"""Native session switch preserves drafts and pending effects without replay."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json,uuid,sqlite3
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-session-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');subprocess.run(['git','init','-q',directory],check=True)
 data=root/('Library/Application Support/Mavona' if sys.platform=='darwin' else '.local/share/mavona');target=data/'sessions/target-saved';target.mkdir(parents=True)
 payloads=[('session.opened',{'repository':directory}),('draft.changed',{'text':'retained target draft'}),('effect.requested',{'effectId':'pending-sentinel','kind':'command'})]
 events=[dict(protocolVersion=1,eventId=str(uuid.uuid4()),sessionId='target-saved',sequence=i+1,timestamp='2026-09-07T00:00:00.000Z',type=kind,schemaVersion=1,payload=payload) for i,(kind,payload) in enumerate(payloads)]
 (target/'events.jsonl').write_text(''.join(json.dumps(e)+'\n' for e in events))
 held_writer=sqlite3.connect(target/'writer.sqlite');held_writer.execute('BEGIN EXCLUSIVE')
 master,slave=pty.openpty();original=termios.tcgetattr(slave);fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0));child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env={'PATH':'/usr/bin:/bin','HOME':directory,'TERM':'xterm-256color','NO_COLOR':'1'},start_new_session=True);output=bytearray()
 def collect(seconds):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   ready,_,_=select.select([master],[],[],.05)
   if ready:
    try:output.extend(os.read(master,65536))
    except OSError:break
 try:
  deadline=time.monotonic()+10
  while b'runtime unchecked' not in output and time.monotonic()<deadline:collect(.1)
  assert b'runtime unchecked' in output,'Renderer/discovery not ready'
  os.write(master,b'original unfinished');collect(.2);os.write(master,b'\x0f');collect(.3);os.write(master,b'target-saved');collect(.2);os.write(master,b'\r');collect(.6)
  refused=[json.loads(line) for line in (target/'events.jsonl').read_text().splitlines()];assert not any(e['type']=='session.resumed' for e in refused),'Locked target was resumed'
  held_writer.close();os.write(master,b'\r');collect(.6)
  recorded=[json.loads(line) for line in (target/'events.jsonl').read_text().splitlines()];assert any(e['type']=='session.resumed' for e in recorded),recorded;assert not any(e['type'] in ['effect.completed','task.started','provider.selected'] for e in recorded)
  assert b'target draft' in output,'Target draft was not rendered'
  os.write(master,b'\x1b[F');collect(.1);os.write(master,b'X');collect(.2)
  typed=[json.loads(line) for line in (target/'events.jsonl').read_text().splitlines()];assert [e['payload']['text'] for e in typed if e['type']=='draft.changed'][-1]=='retained target draftX',typed
  other=[p for p in (data/'sessions').glob('*/events.jsonl') if p.parent.name!='target-saved'];assert len(other)==1
  prior=[json.loads(line) for line in other[0].read_text().splitlines()];assert [e['payload']['text'] for e in prior if e['type']=='draft.changed'][-1]=='original unfinished'
  held=subprocess.run([binary,'resume','target-saved','--data-dir',str(data),'--format','json'],capture_output=True,text=True);assert held.returncode!=0,'Destination writer not held'
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.kill(child.pid,signal.SIGTERM);collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  resumed=subprocess.run([binary,'resume','target-saved','--data-dir',str(data),'--format','json'],capture_output=True,text=True);assert resumed.returncode==0,resumed.stderr;state=json.loads(resumed.stdout);assert state['effects']['pending-sentinel']=='unknown';assert state['draft']=='retained target draftX';assert state['verificationFresh'] is False
  print('PASS native session PTY: Ctrl+O, stable selection, both drafts retained, writer transferred, no effect replay, unknown pending outcome, resize and terminal cleanup')
 finally:
  held_writer.close()
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
