// Interpreta os cliques do mouse

import { vertices, arestas, selecionado, setSelecionado, arestaSelecionada, setArestaSelecionada, direcionado, proximoIdVertice, modoTerminais, terminais, adicionarTerminal, removerTerminal } from '../grafo.js';
import { criarMeshDeNo, criar_cilindro, criarLabel, posicionarLabelPeso } from '../cena.js';
import { atualizarHUD } from '../utils/hud.js';
import { atualizarVisuaisArestas, atualizarArestasDe } from '../utils/visuais.js';
import { desmarcarTudo, setCorAresta } from '../utils/selecao.js';

// Roteia o clique do usuário
export function handleClick(event, ctx, isDouble = false) {
    if (isDouble) return criarVertice(event, ctx);
    if (event.detail === 2) return; // Evita conflito com o dblclick

    const { raycaster, camera, mouse } = ctx;

    // Converte posições do mouse para coordenadas do Three.js
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const interV = raycaster.intersectObjects(vertices);
    const interA = raycaster.intersectObjects(arestas, true); // Inclui filhos (cone/cilindro)

    if (interV.length > 0) return clicarVertice(interV[0].object, ctx);
    if (interA.length > 0) return clicarAresta(interA[0].object);

    desmarcarTudo();
}

// Função que cria um vértice na posição clicada (com snap)
function criarVertice(event, ctx) {
    const { raycaster, camera, mouse, plano, ponto, cena } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plano, ponto);

    const snap = v => Math.round(v);
    const x = snap(ponto.x);
    const z = snap(ponto.z);
    const y = ponto.y;

    // Evita sobreposição de vértices
    if (vertices.some(v => v.position.x === x && v.position.z === z && v.position.y === y)) return;

    const esfera = criarMeshDeNo({ x, y, z });

    vertices.push(esfera);
    cena.add(esfera);

    const id = proximoIdVertice();
    const label = criarLabel(id); // Evita regressão do ID após deletar um vértice intermediário
    label.position.set(x, y + 0.4, z);
    esfera.userData.id = id;

    cena.add(label);
    esfera.userData.label = label;

    atualizarHUD();
}


// Função que controla a seleção de vértices e a criação de arestas
function clicarVertice(mesh, ctx) {
    const { cena } = ctx;

    // Se estiver no modo de seleção de terminais
    if (modoTerminais) {
        if (terminais.includes(mesh)) {
            // Remove o terminal
            removerTerminal(mesh);
            mesh.material.color.set(0xff0000);
        } else {
            // Adiciona o terminal
            adicionarTerminal(mesh);
            mesh.material.color.set(0xff00ff); // Roxo para terminais
        }
        atualizarHUD();
        return;
    }

    if (arestaSelecionada) {
        setCorAresta(arestaSelecionada, 0xffffff);
        setArestaSelecionada(null);
    }

    if (!selecionado) {
        setSelecionado(mesh);
        mesh.material.color.set(0xffff00);
        return;
    }

    if (mesh === selecionado) {
        selecionado.material.color.set(0xff0000);
        setSelecionado(null);
        return;
    }

    // Impede duplicação de arestas
    const existe = arestas.some(a => {
        const m = a.userData.v1 === selecionado && a.userData.v2 === mesh;
        const o = a.userData.v1 === mesh && a.userData.v2 === selecionado;
        return direcionado ? m : (m || o);
    });

    if (!existe) {
        const a = criar_cilindro(selecionado.position, mesh.position, direcionado, 0);

        a.userData.v1 = selecionado;
        a.userData.v2 = mesh;
        a.userData.peso = 1; // Peso padrão ao criar aresta

        arestas.push(a);
        cena.add(a);

        posicionarLabelPeso(a, cena); // Cria e posiciona o sprite de peso no meio da aresta

        atualizarHUD();
        atualizarVisuaisArestas(cena); // CORREÇÃO
    }

    selecionado.material.color.set(0xff0000);
    setSelecionado(null);
}


// Função que controla a seleção de arestas
function clicarAresta(obj) {

    // Sobe até o objeto principal da aresta (group)
    while (obj && !obj.userData.v1) obj = obj.parent;

    if (selecionado) {
        selecionado.material.color.set(0xff0000);
        setSelecionado(null);
    }

    if (arestaSelecionada === obj) {
        setCorAresta(obj, 0xffffff);
        setArestaSelecionada(null);
        return;
    }

    if (arestaSelecionada) {
        setCorAresta(arestaSelecionada, 0xffffff);
    }

    setArestaSelecionada(obj);
    setCorAresta(obj, 0xffaa00);
}