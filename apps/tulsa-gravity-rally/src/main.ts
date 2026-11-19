import './style.css';
import {HostViewController} from './ui/host-view';
import {PlayerViewController} from './ui/player-view';

function bootstrap() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const path = window.location.pathname;

  if (path.startsWith('/room/')) {
    const roomCode = path.replace('/room/', '').trim();
    const playerView = new PlayerViewController();
    void playerView.mount(appContainer, roomCode);
  } else {
    const hostView = new HostViewController();
    void hostView.mount(appContainer);
  }
}

bootstrap();
