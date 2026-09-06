"""Actual Vim handoff from the packaged TUI, isolated fixture/home, no inference."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, json, signal
binary=str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
cancel_mode=len(sys.argv)>2 and sys.argv[2]=='--cancel'
with tempfile.TemporaryDirectory(prefix='mavona-editor-pty-') as directory:
    base=pathlib.Path(directory);root=base/'repo';home=base/'home'
    (root/'config').mkdir(parents=True);(root/'app/models').mkdir(parents=True);home.mkdir()
    (root/'config/application.rb').write_text('raise "must not boot"')
    source=root/'app/models/order.rb';source.write_text('class Order\nend\n')
    subprocess.run(['git','init','-q',str(root)],check=True)
    master,slave=pty.openpty();original=termios.tcgetattr(slave)
    fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0))
    def own_terminal():
        os.setsid();fcntl.ioctl(0,termios.TIOCSCTTY,0)
    env={'PATH':'/usr/bin:/bin','HOME':str(home),'XDG_DATA_HOME':str(home/'data'),'TERM':'xterm-256color','NO_COLOR':'1'}
    guardian="import subprocess,termios,sys,signal; signal.signal(signal.SIGINT,lambda *_:None); before=termios.tcgetattr(0); child=subprocess.run([sys.argv[1]]); assert termios.tcgetattr(0)==before, 'Terminal settings not restored'; print('GUARDIAN_TERMIOS_RESTORED',flush=True); sys.exit(child.returncode)"
    child=subprocess.Popen([sys.executable,'-c',guardian,binary],cwd=root,stdin=slave,stdout=slave,stderr=slave,env=env,preexec_fn=own_terminal)
    output=bytearray()
    def collect(seconds):
        until=time.monotonic()+seconds
        while time.monotonic()<until:
            ready,_,_=select.select([master],[],[],.05)
            if ready:
                try:output.extend(os.read(master,65536))
                except OSError:break
    def send(text,seconds=.4):os.write(master,text.encode());collect(seconds)
    try:
        collect(1);assert child.poll() is None
        send('/open app/models/order.rb\r')
        send('/editor terminal ["/usr/bin/vi","-u","NONE","-U","NONE","-N","{path}"]\r')
        send('/edit\r');send('y',1)
        if cancel_mode:
            owner=json.loads(next(home.rglob('writer.lock')).read_text())
            os.kill(owner['pid'],signal.SIGINT);collect(1.5)
        else:send(":0put ='saved by editor'\r:wq\r",1)
        assert source.read_text()==('class Order\nend\n' if cancel_mode else 'saved by editor\nclass Order\nend\n'),bytes(output).decode(errors='replace')
        send('/close\r')
        events=[json.loads(line) for path in home.rglob('events.jsonl') for line in path.read_text().splitlines()]
        assert any(e['type']=='repository.snapshot' and e['payload']['reason']=='editor-return' for e in events),'No reconciled editor return'
        if cancel_mode:assert any(e['type']=='effect.completed' and e['payload']['state']=='unknown' for e in events),'Cancelled editor effect was not unknown'
        assert any(e['type']=='verification.invalidated' for e in events),'Prior evidence was not invalidated'
        send('\x03',.1);send('\x03',.5);code=child.wait(timeout=5);assert code==0,(code,bytes(output[-2000:]).decode(errors='replace'))
        assert b'GUARDIAN_TERMIOS_RESTORED' in output,'No observed terminal restoration before session teardown'
        print('PASS native Vim PTY: exact approval, terminal suspend/'+('SIGINT cancel' if cancel_mode else 'save')+'/return, repository reconciliation, cleanup')
    finally:
        if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
        os.close(master);os.close(slave)
