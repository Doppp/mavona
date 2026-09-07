"""Native exact session export review, denial and preserved draft."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, signal, json
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-export-output-') as output_directory, tempfile.TemporaryDirectory(prefix='mavona-command-pty-') as directory:
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
  os.write(master,b'unfinished export draft');collect(.2);destination=pathlib.Path(output_directory)/'snapshot.json'
  for approved in [False,True]:
   os.write(master,b'\x10');collect(.2);os.write(master,b'/export');collect(.2);os.write(master,b'\r');collect(.2);os.write(master,str(destination).encode());collect(.2);os.write(master,b'\r');collect(.3);assert not destination.exists(),'Export happened before approval';os.write(master,b'\x1b[F');collect(.2);os.write(master,b'y' if approved else b'n');collect(.4)
   assert destination.exists()==approved
  exported=json.loads(destination.read_text());assert exported['format']=='mavona-session-export';assert exported['authentication']=='excluded';assert not any(e['type'].startswith('session.export.') for e in exported['events']);assert [e['payload']['text'] for e in exported['events'] if e['type']=='draft.changed'][-1]=='unfinished export draft'
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1
  os.write(master,b'\x1b[F');os.write(master,b'X');collect(.2);events=[json.loads(line) for line in logs[0].read_text().splitlines()];assert [e['payload']['status'] for e in events if e['type']=='session.export.completed']==['passed'];assert [e['payload']['text'] for e in events if e['type']=='draft.changed'][-1]=='unfinished export draftX';assert not any(e['type'] in ['task.started','provider.selected','tool.requested'] for e in events)
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native session export: exact snapshot review, denied/no-write, approved JSON, retained draft, no inference, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
