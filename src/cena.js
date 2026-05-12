// Cria objetos 3D

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js'; //Importa a biblioteca gráfica
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js?module'; //Importa a biblioteca da câmera
import { ponderado, arestas } from './grafo.js';

// Função que retorna tudo necessário da cena 3d (cena, camera, renderer, raycaster...)
export function criarCena() {

    const cena = new THREE.Scene();

    //Inicia a câmera em perspectiva
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 7, 0);

    const renderizador = new THREE.WebGLRenderer({ antialias: true }); //Inicia o renderizador WebGL
    renderizador.setSize(window.innerWidth, window.innerHeight); //Resolução do renderizador
    document.body.appendChild(renderizador.domElement); //Exporta o canvas do renderizador para o html

    const controle = new OrbitControls(camera, renderizador.domElement); //Inicia o controlador da câmera

    const grid = new THREE.GridHelper(25, 25); // Define o tamanho do grid
    cena.add(grid);

    // Adiciona helper dos eixos X, Y, Z para orientação
    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.set(0, 0.1, 0); // Levemente acima do grid
    cena.add(axesHelper);

    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); //Inicia o plano invisível para o raycaster detectar onde o mouse clicou

    const raycaster = new THREE.Raycaster(); //Inicia o raycaster (detecta objetos sob o cursor)
    const mouse = new THREE.Vector2(); //Guarda as coordenadas do mouse na tela
    const ponto = new THREE.Vector3(); //Guarda o ponto 3D onde o raycaster interceptou o plano

    // Atualiza a câmera e o renderizador quando a janela é redimensionada
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderizador.setSize(window.innerWidth, window.innerHeight);
    });

    return { cena, camera, renderizador, controle, raycaster, mouse, ponto, plano, grid };
}

// Função que cria a esfera (vértice) e define sua posição
export function criarMeshDeNo(posicao) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posicao.x, posicao.y, posicao.z);

    return mesh;
}

// Função que cria o cilindro (aresta) entre dois pontos
export function criar_cilindro(pontoA, pontoB, comSeta = false, offsetLateral = 0) {

    // Define a orientação e comprimento da aresta
    const direcao = new THREE.Vector3().subVectors(pontoB, pontoA);
    const altura = direcao.length();

    // Calcula vetor perpendicular para o deslocamento lateral (evitando sobreposição)
    const perp = new THREE.Vector3()
        .crossVectors(direcao, new THREE.Vector3(0, 1, 0))
        .normalize();

    // Aplica o deslocamento
    const pA = pontoA.clone().addScaledVector(perp, offsetLateral);
    const pB = pontoB.clone().addScaledVector(perp, offsetLateral);

    // Recalcula direção e ponto médio após o deslocamento  
    const direcaoFinal = new THREE.Vector3().subVectors(pB, pA);
    const meio = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

    const geometry = new THREE.CylinderGeometry(0.05, 0.05, altura, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(meio);

    // Alinha o cilindro com a direção da aresta
    mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direcaoFinal.clone().normalize()
    );

    const grupo = new THREE.Group();
    grupo.add(mesh);

    if (comSeta) {
        const direcaoNorm = direcaoFinal.clone().normalize();
        const alturaOffs = 0.30;

        // Recua a seta para não atravessar o vértice
        const posicaoCone = new THREE.Vector3()
            .copy(pB)
            .addScaledVector(direcaoNorm, -alturaOffs);

        const geoCone = new THREE.ConeGeometry(0.12, 0.35, 8);
        const matCone = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cone = new THREE.Mesh(geoCone, matCone);
        cone.position.copy(posicaoCone);
        cone.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direcaoNorm
        );
        grupo.add(cone);
    }

    return grupo;
}

// Função que cria o texto encima do vértice (e controla a sobreposição com arestas)
export function criarLabel(numero) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'white';
    context.strokeStyle = '#00aaff'; 
    context.lineWidth = 5;
    context.font = '60px Arial';

    context.strokeText(numero, 64, 64); // borda azul
    context.fillText(numero, 64, 64);   

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,     
        depthWrite: false     
    });

    const sprite = new THREE.Sprite(material);

    sprite.scale.set(0.5, 0.5, 1);

    sprite.renderOrder = 999; // Sempre renderiza por cima

    return sprite;
}

// Função que cria o sprite de peso na aresta
export function criarLabelPeso(valor) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 128;
    canvas.height = 128;

    // Fundo levemente transparente para legibilidade
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.beginPath();
    context.roundRect(10, 30, 108, 68, 12);
    context.fill();

    // Texto do peso em amarelo para diferenciar do label do vértice
    context.fillStyle = '#ffdd00';
    context.font = 'bold 52px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(valor, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        depthWrite: false
    });

    const sprite = new THREE.Sprite(material);

    sprite.scale.set(0.5, 0.5, 1);
    sprite.renderOrder = 999;

    return sprite;
}

// Posiciona o label de peso no ponto médio da aresta e o adiciona à cena
export function posicionarLabelPeso(aresta, cena) {
    // Remove label antigo se existir
    if (aresta.userData.labelPeso) {
        cena.remove(aresta.userData.labelPeso);
    }

    const v1 = aresta.userData.v1.position;
    const v2 = aresta.userData.v2.position;

    // Verifica se existe aresta oposta (para aplicar o mesmo offset lateral do cilindro)
    const temPar = arestas.some(b =>
        b !== aresta &&
        b.userData.v1 === aresta.userData.v2 &&
        b.userData.v2 === aresta.userData.v1
    );
    const offset = temPar ? 0.15 : 0;

    // Reproduz o mesmo cálculo de offset do criar_cilindro para achar o meio real da aresta
    const direcao = new THREE.Vector3().subVectors(v2, v1);
    const perp = new THREE.Vector3()
        .crossVectors(direcao, new THREE.Vector3(0, 1, 0))
        .normalize();

    const pA = v1.clone().addScaledVector(perp, offset);
    const pB = v2.clone().addScaledVector(perp, offset);

    const meio = new THREE.Vector3()
        .addVectors(pA, pB)
        .multiplyScalar(0.5);
    meio.y += 0.3; // Levemente acima da aresta

    const label = criarLabelPeso(aresta.userData.peso);
    label.position.copy(meio);

    aresta.userData.labelPeso = label;
    label.visible = ponderado; // Só exibe se o modo ponderado estiver ativo
    cena.add(label);
}