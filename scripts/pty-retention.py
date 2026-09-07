"""Native retention settings: explicit opt-in, persisted policy, no deletion or inference."""
import os,pty,subprocess,tempfile,pathlib,select,time,termios,fcntl,struct,sys,signal,json
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-retention-pty-') as directory:
 root=pathlib.Path(directory);(root/'config').mkdir();(root/'config/application.rb').write_text('');(root/'.mavona/recovery').mkdir(parents=True);retained=root/'.mavona/recovery/user-source';retained.write_text('preserve me');subprocess.run(['git','init','-q',directory],check=True)
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
  os.write(master,b'retention draft');collect(.2);os.write(master,b'\x10');collect(.2);os.write(master,b'/retention');collect(.2);os.write(master,b'\r');collect(.2);os.write(master,b'80 100 7 14 on');collect(.2);os.write(master,b'\r');collect(.4)
  logs=list(root.glob('Library/Application Support/Mavona/sessions/*/events.jsonl'))+list(root.glob('.local/share/mavona/sessions/*/events.jsonl'));assert len(logs)==1,logs;events=[json.loads(line) for line in logs[0].read_text().splitlines()];policies=[json.loads(event['payload']['policy']) for event in events if event['type']=='retention.policy.changed'];assert policies[-1]=={'version':1,'warningBytes':80,'hardBytes':100,'archiveAfterDays':7,'expireAfterDays':14,'artifactExpiry':True};assert [event['payload']['text'] for event in events if event['type']=='draft.changed'][-1]=='retention draft';assert retained.read_text()=='preserve me';assert not any(event['type'] in ['task.started','provider.selected','tool.requested','artifact.expired'] for event in events)
  fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2);os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.4);assert child.wait(timeout=5)==0;assert termios.tcgetattr(slave)==original
  print('PASS native retention PTY: explicit policy, draft and retained source preservation, no expiry/inference, resize and cleanup')
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
  os.close(master);os.close(slave)
