// Efeito especial do Konami Code

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { vertices, arestas } from '../grafo.js';

// Konami Code: ↑↑↓↓←→←→BA
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

let konamiIndex = 0;
let konamiAtivo = false;
let overlayDiv = null;
let cuboBoss = null;
let animacaoAtiva = false;
let cameraOriginal = null; // Posição original da câmera
let contextoGlobal = null; // Contexto global para acessar a câmera
let textoZeDoGrafo = null; // Overlay de texto do Zé do Grafo
let primeiraColisao = false; // Se já houve a primeira colisão
let flashDiv = null; // Overlay de flash

// Detecta o Konami Code
export function detectarKonamiCode(event) {
    if (konamiAtivo) return; // Já está ativo

    const key = event.code;

    if (key === KONAMI_CODE[konamiIndex]) {
        konamiIndex++;

        if (konamiIndex === KONAMI_CODE.length) {
            // Konami Code completo!
            konamiIndex = 0;
            ativarEfeitoKonami();
        }
    } else {
        konamiIndex = 0; // Reinicia se errar
    }
}

// Ativa o efeito do Konami Code
function ativarEfeitoKonami() {
    if (konamiAtivo) return;

    konamiAtivo = true;
    console.log('Konami Code ativado!');

    // Mostra a imagem em full screen
    mostrarImagemFullScreen();
}

// Define o contexto global (chamado do main.js)
export function setContextoKonami(ctx) {
    contextoGlobal = ctx;
    console.log('Contexto Konami definido');
}

// Mostra a imagem em full screen por 5 segundos
function mostrarImagemFullScreen() {
    // Cria o overlay se não existir
    if (!overlayDiv) {
        overlayDiv = document.createElement('div');
        overlayDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: black;
            background-image: url('./assets/Final Boss.jpeg');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;
        document.body.appendChild(overlayDiv);
    }

    // Mostra a imagem
    overlayDiv.style.display = 'block';

    // Fade in
    setTimeout(() => {
        overlayDiv.style.opacity = '1';
    }, 10);

    // Após 5 segundos, esconde a imagem e inicia o cubo
    setTimeout(() => {
        overlayDiv.style.opacity = '0';

        setTimeout(() => {
            overlayDiv.style.display = 'none';
            iniciarCuboBoss();
        }, 500);
    }, 5000);
}

// Inicia o cubo boss que apaga o grafo
function iniciarCuboBoss() {
    if (animacaoAtiva) return;

    animacaoAtiva = true;

    console.log('Iniciando cubo boss...');

    // Carrega a textura
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        './assets/Final Boss.jpeg',
        (texture) => {
            console.log('Textura carregada com sucesso!');
            criarCuboBoss(texture);
        },
        undefined,
        (error) => {
            console.error('Erro ao carregar textura:', error);
            // Cria cubo sem textura se falhar
            criarCuboBossSemTextura();
        }
    );
}

// Cria cubo sem textura (fallback)
function criarCuboBossSemTextura() {
    const cena = vertices.length > 0 ? vertices[0].parent : null;
    if (!cena) {
        console.error('Não foi possível encontrar a cena');
        resetarKonami();
        return;
    }

    console.log('Criando cubo boss sem textura...');

    // Cria cubo vermelho como fallback
    const geometry = new THREE.BoxGeometry(8, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    cuboBoss = new THREE.Mesh(geometry, material);

    cuboBoss.position.set(-30, 5, 0);
    cena.add(cuboBoss);

    console.log('Cubo boss criado e adicionado à cena');
    animarCuboBoss(cena);
}

// Cria o cubo boss
function criarCuboBoss(texture) {
    const cena = vertices.length > 0 ? vertices[0].parent : null;
    if (!cena) {
        console.error('Não foi possível encontrar a cena');
        resetarKonami();
        return;
    }

    console.log('Criando cubo boss...');

    // Salva a posição original da câmera
    if (contextoGlobal && contextoGlobal.camera) {
        cameraOriginal = contextoGlobal.camera;
        cameraOriginal.userData.posicaoOriginal = cameraOriginal.position.clone();
        console.log('Posição original da câmera salva');
    }

    // Cria o cubo com a textura em todas as faces (menor)
    const geometry = new THREE.BoxGeometry(4, 4, 4); // Cubo menor
    const material = new THREE.MeshBasicMaterial({ map: texture });
    cuboBoss = new THREE.Mesh(geometry, material);

    // Calcula o caminho que passa por todos os vértices
    const caminho = calcularCaminhoCompleto();

    if (!caminho || caminho.length === 0) {
        console.error('Não foi possível calcular caminho');
        resetarKonami();
        return;
    }

    console.log('Caminho calculado com', caminho.length, 'pontos');

    // Posiciona o cubo no início do caminho
    cuboBoss.position.copy(caminho[0]);
    cena.add(cuboBoss);

    console.log('Cubo boss criado e adicionado à cena');

    // Inicia a animação com o caminho
    animarCuboBoss(cena, caminho);
}

// Calcula um caminho que passa por todos os vértices e arestas
function calcularCaminhoCompleto() {
    if (vertices.length === 0) return null;

    // Encontra os limites do grafo
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    vertices.forEach(v => {
        minX = Math.min(minX, v.position.x);
        maxX = Math.max(maxX, v.position.x);
        minY = Math.min(minY, v.position.y);
        maxY = Math.max(maxY, v.position.y);
        minZ = Math.min(minZ, v.position.z);
        maxZ = Math.max(maxZ, v.position.z);
    });

    // Adiciona margem para garantir que passe por tudo
    const margem = 3;
    minX -= margem;
    maxX += margem;
    minY -= margem;
    maxY += margem;
    minZ -= margem;
    maxZ += margem;

    console.log('Limites do grafo:', { minX, maxX, minY, maxY, minZ, maxZ });

    // Cria um caminho em zigue-zague que cobre toda a área
    const caminho = [];
    const passos = 20; // Número de passos no caminho

    for (let i = 0; i <= passos; i++) {
        const t = i / passos;

        // Interpola em X (de um lado a outro)
        const x = minX + (maxX - minX) * t;

        // Interpola em Y (altura média)
        const y = minY + (maxY - minY) * 0.5;

        // Interpola em Z (zigue-zague)
        const z = minZ + (maxZ - minZ) * (i % 2 === 0 ? 0 : 1);

        caminho.push(new THREE.Vector3(x, y, z));
    }

    // Adiciona pontos extras para garantir cobertura completa
    for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const x = minX + (maxX - minX) * t;
        const y = minY + (maxY - minY) * t;
        const z = minZ + (maxZ - minZ) * 0.5;
        caminho.push(new THREE.Vector3(x, y, z));
    }

    return caminho;
}

// Mostra o texto do Zé do Grafo
function mostrarTextoZeDoGrafo() {
    // Cria o overlay de texto se não existir
    if (!textoZeDoGrafo) {
        textoZeDoGrafo = document.createElement('div');
        textoZeDoGrafo.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 52px;
            font-weight: 900;
            color: #ff0000;
            -webkit-text-stroke: 3px #000000;
            text-stroke: 3px #000000;
            text-shadow:
                0 0 5px #ff0000,
                0 0 10px #ff0000,
                2px 2px 4px rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            text-align: center;
            white-space: nowrap;
            font-family: 'Impact', 'Arial Black', Arial, sans-serif;
            letter-spacing: 3px;
            text-transform: uppercase;
        `;

        textoZeDoGrafo.textContent = 'Esse grafo agora é propriedade do Zé do Grafo!';
        document.body.appendChild(textoZeDoGrafo);

        // Inicia animação de pulso e tremor
        iniciarAnimacaoTexto();
    }

    // Toca som de "boom"
    tocarSomBoom();

    // Mostra flash na tela
    mostrarFlash();

    // Mostra o texto
    textoZeDoGrafo.style.display = 'block';

    // Fade in
    setTimeout(() => {
        textoZeDoGrafo.style.opacity = '1';
    }, 10);
}

// Mostra flash na tela
function mostrarFlash() {
    // Cria o overlay de flash se não existir
    if (!flashDiv) {
        flashDiv = document.createElement('div');
        flashDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: white;
            z-index: 9998;
            display: none;
            opacity: 0;
            pointer-events: none;
        `;
        document.body.appendChild(flashDiv);
    }

    // Mostra o flash
    flashDiv.style.display = 'block';
    flashDiv.style.opacity = '0.8';

    // Fade out rápido
    setTimeout(() => {
        flashDiv.style.opacity = '0';
        setTimeout(() => {
            flashDiv.style.display = 'none';
        }, 200);
    }, 100);
}

// Toca som de "boom" usando Web Audio API
function tocarSomBoom() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configura o som
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Não foi possível tocar som:', error);
    }
}

// Inicia animação do texto (pulso e tremor)
function iniciarAnimacaoTexto() {
    let scale = 1;
    let direction = 1;

    function animateText() {
        if (!textoZeDoGrafo || textoZeDoGrafo.style.display === 'none') return;

        // Pulso
        scale += 0.005 * direction;
        if (scale > 1.05) direction = -1;
        if (scale < 0.95) direction = 1;

        // Tremor
        const tremorX = (Math.random() - 0.5) * 4;
        const tremorY = (Math.random() - 0.5) * 4;

        textoZeDoGrafo.style.transform = `translate(calc(-50% + ${tremorX}px), calc(-50% + ${tremorY}px)) scale(${scale})`;

        requestAnimationFrame(animateText);
    }

    animateText();
}

// Esconde o texto do Zé do Grafo
function esconderTextoZeDoGrafo() {
    if (!textoZeDoGrafo) return;

    // Fade out
    textoZeDoGrafo.style.opacity = '0';

    // Remove após o fade out
    setTimeout(() => {
        textoZeDoGrafo.style.display = 'none';
    }, 300);
}

// Anima o cubo boss passando pelo grafo
function animarCuboBoss(cena, caminho) {
    let frame = 0;
    const totalFrames = 400; // Mais tempo para cobrir tudo
    const pontosPorFrame = caminho.length / totalFrames;

    console.log('Iniciando animação do cubo boss...');

    function animate() {
        if (frame >= totalFrames) {
            // Animação completa - remove o cubo
            console.log('Animação completa, removendo cubo...');
            if (cuboBoss && cena.children.includes(cuboBoss)) {
                cena.remove(cuboBoss);
            }
            resetarKonami();
            return;
        }

        // Calcula a posição atual no caminho
        const indice = Math.floor(frame * pontosPorFrame);
        const proximoIndice = Math.min(indice + 1, caminho.length - 1);

        if (indice < caminho.length) {
            // Interpola entre pontos consecutivos
            const t = (frame * pontosPorFrame) - indice;
            cuboBoss.position.lerpVectors(caminho[indice], caminho[proximoIndice], t);
        }

        // Rotação do cubo (apenas horizontal - eixo Y)
        cuboBoss.rotation.y += 0.08;

        // Adiciona tremor constante à câmera enquanto o cubo está ativo
        if (cameraOriginal && cameraOriginal.userData.posicaoOriginal) {
            const tremorX = (Math.random() - 0.5) * 0.05;
            const tremorY = (Math.random() - 0.5) * 0.05;
            const tremorZ = (Math.random() - 0.5) * 0.05;

            cameraOriginal.position.x = cameraOriginal.userData.posicaoOriginal.x + tremorX;
            cameraOriginal.position.y = cameraOriginal.userData.posicaoOriginal.y + tremorY;
            cameraOriginal.position.z = cameraOriginal.userData.posicaoOriginal.z + tremorZ;
        }

        // Verifica colisão com vértices e arestas
        verificarColisoes(cena);

        frame++;
        requestAnimationFrame(animate);
    }

    animate();
}

// Verifica colisões do cubo com vértices e arestas
function verificarColisoes(cena) {
    if (!cuboBoss) return;

    const cuboBox = new THREE.Box3().setFromObject(cuboBoss);
    let colisoes = 0;

    // Verifica colisão com vértices
    for (let i = vertices.length - 1; i >= 0; i--) {
        const v = vertices[i];
        const verticeBox = new THREE.Box3().setFromObject(v);

        if (cuboBox.intersectsBox(verticeBox)) {
            // Remove o vértice
            if (v.userData.label) cena.remove(v.userData.label);
            cena.remove(v);
            vertices.splice(i, 1);
            colisoes++;
        }
    }

    // Verifica colisão com arestas
    for (let i = arestas.length - 1; i >= 0; i--) {
        const a = arestas[i];
        const arestaBox = new THREE.Box3().setFromObject(a);

        if (cuboBox.intersectsBox(arestaBox)) {
            // Remove a aresta
            if (a.userData.labelPeso) cena.remove(a.userData.labelPeso);
            cena.remove(a);
            arestas.splice(i, 1);
            colisoes++;
        }
    }

    // Se houve colisões, mostra o texto e aumenta a intensidade do tremor
    if (colisoes > 0) {
        // Mostra o texto na primeira colisão
        if (!primeiraColisao) {
            primeiraColisao = true;
            mostrarTextoZeDoGrafo();
            console.log('ZÉ DO GRAFO apareceu!');
        }

        // Aumenta temporariamente a intensidade do tremor
        if (cameraOriginal) {
            const forcaExtra = Math.min(colisoes * 0.2, 0.5);

            const tremorX = (Math.random() - 0.5) * forcaExtra;
            const tremorY = (Math.random() - 0.5) * forcaExtra;
            const tremorZ = (Math.random() - 0.5) * forcaExtra;

            if (cameraOriginal.userData.posicaoOriginal) {
                cameraOriginal.position.x += tremorX;
                cameraOriginal.position.y += tremorY;
                cameraOriginal.position.z += tremorZ;
            }
        }
    }
}

// Reseta o estado do Konami Code
function resetarKonami() {
    console.log('Resetando Konami Code...');

    // Remove o cubo se ainda existir na cena
    if (cuboBoss) {
        const cena = vertices.length > 0 ? vertices[0].parent : null;
        if (cena && cena.children.includes(cuboBoss)) {
            cena.remove(cuboBoss);
            console.log('Cubo boss removido da cena');
        }
        cuboBoss = null;
    }

    // Restaura a posição original da câmera
    if (cameraOriginal && cameraOriginal.userData.posicaoOriginal) {
        cameraOriginal.position.copy(cameraOriginal.userData.posicaoOriginal);
        console.log('Câmera restaurada para posição original');
    }

    // Esconde o texto do Zé do Grafo
    esconderTextoZeDoGrafo();

    // Limpa o flash
    if (flashDiv) {
        flashDiv.style.display = 'none';
        flashDiv.style.opacity = '0';
    }

    konamiAtivo = false;
    animacaoAtiva = false;
    cameraOriginal = null;
    primeiraColisao = false;
    console.log('Konami Code finalizado e resetado!');
}