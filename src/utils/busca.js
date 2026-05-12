// Controla o BFS e DFS, assim como suas animações

import { vertices, arestas, direcionado, selecionado, setSelecionado } from '../grafo.js';

const cor_visitado = 0x00ff88;
const cor_atual = 0xffaa00;
const cor_aresta_bfs = 0x00ccff;
const cor_aresta_dfs = 0xff44cc;
const cor_normal = 0xff0000;
const cor_aresta_pad = 0xffffff;

// Intervalo entre cada passo da animação
const intervalo = 100;

// Guarda o timeout ativo para poder cancelar
let animacaoAtiva = null;

// Interrompe a animação
export function cancelarBusca() {
    if (animacaoAtiva !== null) {
        clearTimeout(animacaoAtiva);
        animacaoAtiva = null;
    }

    vertices.forEach(v => v.material.color.set(cor_normal));
    arestas.forEach(a => setCorAresta(a, cor_aresta_pad));
}

// BFS
export function iniciarBFS(cena) {
    if (!selecionado) return;
    cancelarBusca();

    const inicio = selecionado;
    selecionado.material.color.set(cor_normal)
    setSelecionado(null);

    const passos = [];
    const visitados = new Set();
    const fila = [inicio];
    visitados.add(inicio);

    const tempoInicio = performance.now();

    while (fila.length > 0) {
        const atual = fila.shift();
        passos.push({ tipo: 'vertice', no: atual });

        const vizinhos = getVizinhos(atual);
        for (const { vertice, aresta } of vizinhos) {
            if (!visitados.has(vertice)) {
                visitados.add(vertice);
                passos.push({ tipo: 'aresta', aresta, cor: cor_aresta_bfs });
                fila.push(vertice);
            }
        }
    }

    const tempoFim = performance.now();
    const tempoExecucao = tempoFim - tempoInicio;

    console.log(`BFS executado em ${tempoExecucao.toFixed(2)}ms`);
    console.log(`Vértices visitados: ${visitados.size}`);

    animarPassos(passos, tempoExecucao, visitados.size);
}

// DFS
export function iniciarDFS(cena) {
    if (!selecionado) return;
    cancelarBusca();

    const inicio = selecionado;
    selecionado.material.color.set(cor_normal);
    setSelecionado(null);

    const passos = [];
    const visitados = new Set();
    const temposChegada = new Map(); // Mapa para armazenar tempo de chegada de cada vértice
    const temposSaida = new Map(); // Mapa para armazenar tempo de saída de cada vértice
    const pais = new Map(); // Mapa para armazenar o pai de cada vértice
    let tempo = 0; // Contador de tempo

    const tempoInicio = performance.now();

    // DFS recursivo que rastreia tempos de chegada e saída
    function dfsRecursivo(atual, arestaEntrada, pai) {
        tempo++;
        temposChegada.set(atual, tempo);
        visitados.add(atual);
        pais.set(atual, pai);

        if (arestaEntrada) passos.push({ tipo: 'aresta', aresta: arestaEntrada, cor: cor_aresta_dfs });
        passos.push({ tipo: 'vertice', no: atual });

        const vizinhos = getVizinhos(atual);
        for (const { vertice, aresta } of vizinhos) {
            if (!visitados.has(vertice)) {
                dfsRecursivo(vertice, aresta, atual);
            }
        }

        tempo++;
        temposSaida.set(atual, tempo);
    }

    dfsRecursivo(inicio, null, null);

    const tempoFim = performance.now();
    const tempoExecucao = tempoFim - tempoInicio;

    console.log(`DFS executado em ${tempoExecucao.toFixed(2)}ms`);
    console.log(`Vértices visitados: ${visitados.size}`);

    // Armazena os tempos globalmente para uso na tabela
    window.temposDFS = {
        temposChegada,
        temposSaida,
        pais,
        visitados
    };

    animarPassos(passos, tempoExecucao, visitados.size);

}

// Retorna os vizinhos de um vértice como {vertice, aresta}
function getVizinhos(v) {
    const resultado = [];
    for (const a of arestas) {
        if (a.userData.v1 === v) {
            resultado.push({ vertice: a.userData.v2, aresta: a });
        } else if (!direcionado && a.userData.v2 === v) {
            resultado.push({ vertice: a.userData.v1, aresta: a });
        }
    }
    return resultado;
}

// Executa a lista de passos com um delay
function animarPassos(passos, tempoExecucao = 0, verticesVisitados = 0) {
    let noAtual = null; // Guarda o vértice "laranja" para virar verde quando sair

    function executarPasso(i) {
        if (i >= passos.length) {
            // Animação terminou: pinta o último vértice de verde
            if (noAtual) noAtual.material.color.set(cor_visitado);
            animacaoAtiva = null;
            return;
        }

        const passo = passos[i];

        if (passo.tipo === 'vertice') {
            // O vértice anterior vira verde (já foi processado)
            if (noAtual) noAtual.material.color.set(cor_visitado);
            // O atual fica laranja (sendo processado agora)
            passo.no.material.color.set(cor_atual);
            noAtual = passo.no;
        } else if (passo.tipo === 'aresta') {
            setCorAresta(passo.aresta, passo.cor);
        }

        animacaoAtiva = setTimeout(() => executarPasso(i + 1), intervalo);
    }

    executarPasso(0);
}

// Pinta os filhos do grupo de uma aresta com uma cor
function setCorAresta(grupo, cor) {
    grupo.traverse(obj => {
        if (obj.isMesh) obj.material.color.set(cor);
    });
}