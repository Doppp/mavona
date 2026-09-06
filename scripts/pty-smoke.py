"""Native packaged PTY smoke; no providers, isolated HOME and Git fixture."""
import os, pty, subprocess, tempfile, pathlib, select, time, termios, fcntl, struct, sys, signal
binary = str(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist/mavona').resolve())
with tempfile.TemporaryDirectory(prefix='mavona-pty-') as directory:
    root=pathlib.Path(directory); (root/'config').mkdir(); (root/'config/application.rb').write_text('raise "must not boot"')
    subprocess.run(['git','init','-q',directory],check=True)
    master,slave=pty.openpty(); original=termios.tcgetattr(slave)
    fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',24,80,0,0))
    env={'PATH':'/usr/bin:/bin','HOME':directory,'XDG_DATA_HOME':str(root/'data'),'TERM':'xterm-256color','NO_COLOR':'1'}
    child=subprocess.Popen([binary],cwd=directory,stdin=slave,stdout=slave,stderr=slave,env=env,start_new_session=True)
    output=bytearray()
    def collect(seconds):
        until=time.monotonic()+seconds
        while time.monotonic()<until:
            ready,_,_=select.select([master],[],[],0.05)
            if ready:
                try: output.extend(os.read(master,65536))
                except OSError: break
    try:
        collect(1)
        assert child.poll() is None, bytes(output).decode(errors='replace')
        os.write(master,b'/help\r');collect(.3)
        os.write(master,b'\x1b[200~line one\nline two\x1b[201~');collect(.2)
        fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',18,60,0,0));os.kill(child.pid,signal.SIGWINCH);collect(.2)
        os.write(master,b'\x03');collect(.1);os.write(master,b'\x03');collect(.5)
        code=child.wait(timeout=5)
        assert code==0, (code,bytes(output).decode(errors='replace'))
        assert b'Mavona' in output, 'No rendered product header'
        assert termios.tcgetattr(slave)==original, 'Terminal settings not restored'
        print('PASS native packaged PTY: startup, input, paste, resize, Ctrl+C cleanup; exit 0')
    finally:
        if child.poll() is None: child.kill();child.wait()
        os.close(master);os.close(slave)
