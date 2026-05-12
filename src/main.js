// Inicializa e controla todo o programa


// Importa as funções dos outros arquivos
import { atualizarHUD } from './utils/hud.js';
import { criarCena } from './cena.js';
import { handleClick } from './input/click.js';
import { handleKey } from './input/teclado.js';
import { detectarKonamiCode, setContextoKonami } from './utils/konami.js';
import { inicializarMenuOculto } from './utils/tabela-adjacencia.js';

atualizarHUD();

const contexto = criarCena(); //Cria o contexto da cena (cena, camera, grid, raycaster)

// Define o contexto para o Konami Code
setContextoKonami(contexto);

// Inicializa o menu oculto
inicializarMenuOculto();

// Loop de renderização
function animar() {
    requestAnimationFrame(animar);
    contexto.controle.update();
    contexto.renderizador.render(contexto.cena, contexto.camera);
}
animar();

// Eventos globais
window.addEventListener('click', (e) => handleClick(e, contexto));
window.addEventListener('dblclick', (e) => handleClick(e, contexto, true));
window.addEventListener('keydown', (e) => {
    handleKey(e, contexto);
    detectarKonamiCode(e); // Detecta o Konami Code
});