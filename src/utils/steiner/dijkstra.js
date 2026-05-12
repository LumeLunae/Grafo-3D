// Algoritmo de Dijkstra para encontrar o caminho mais curto

import { vertices, arestas, direcionado, ponderado } from '../../grafo.js';

/**
 * Algoritmo de Dijkstra para encontrar o caminho mais curto
 * @param {Object} origem - Vértice de origem
 * @param {Set} destinos - Conjunto de vértices de destino
 * @returns {Object} Caminho mais curto e custo
 */
export function dijkstra(origem, destinos) {
    // Verifica se a origem e destinos são válidos
    if (!origem || !destinos || destinos.size === 0) {
        return { custo: Infinity, caminho: { vertices: [], arestas: [] } };
    }

    // Se a origem já está nos destinos, retorna caminho vazio com custo 0
    if (destinos.has(origem)) {
        return {
            custo: 0,
            caminho: {
                vertices: [origem],
                arestas: []
            }
        };
    }

    const distancias = new Map();
    const anteriores = new Map();
    const visitados = new Set();
    const filaPrioridade = [];

    // Inicializa distâncias
    for (const v of vertices) {
        distancias.set(v, Infinity);
    }
    distancias.set(origem, 0);
    filaPrioridade.push({ vertice: origem, distancia: 0 });

    let iteracoes = 0;
    const maxIteracoes = vertices.length * vertices.length; // Limite de segurança

    while (filaPrioridade.length > 0 && iteracoes < maxIteracoes) {
        iteracoes++;

        // Remove o vértice com menor distância
        filaPrioridade.sort((a, b) => a.distancia - b.distancia);
        const { vertice: atual } = filaPrioridade.shift();

        if (visitados.has(atual)) continue;
        visitados.add(atual);

        // Se chegou a um dos destinos, reconstrói o caminho
        if (destinos.has(atual)) {
            return reconstruirCaminho(origem, atual, anteriores, distancias);
        }

        // Explora vizinhos
        const vizinhos = getVizinhos(atual);
        for (const { vertice: vizinho, aresta } of vizinhos) {
            if (visitados.has(vizinho)) continue;

            const peso = ponderado ? (aresta.userData.peso || 1) : 1;
            const novaDistancia = distancias.get(atual) + peso;

            if (novaDistancia < distancias.get(vizinho)) {
                distancias.set(vizinho, novaDistancia);
                anteriores.set(vizinho, { vertice: atual, aresta });
                filaPrioridade.push({ vertice: vizinho, distancia: novaDistancia });
            }
        }
    }

    // Não encontrou caminho
    console.log('Dijkstra: Não foi possível encontrar caminho da origem aos destinos');
    console.log('Origem:', origem.userData?.id, 'Destinos:', Array.from(destinos).map(d => d.userData?.id));
    return { custo: Infinity, caminho: { vertices: [], arestas: [] } };
}

/**
 * Reconstrói o caminho a partir dos anteriores
 */
function reconstruirCaminho(origem, destino, anteriores, distancias) {
    const caminhoVertices = [];
    const caminhoArestas = [];
    let atual = destino;
    const maxPassos = vertices.length * 2; // Limite de segurança
    let passos = 0;

    while (atual !== origem && passos < maxPassos) {
        passos++;
        caminhoVertices.unshift(atual);
        const info = anteriores.get(atual);
        if (!info) {
            console.log('Erro ao reconstruir caminho: não há anterior para', atual.userData?.id);
            break;
        }
        caminhoArestas.unshift(info.aresta);
        atual = info.vertice;
    }

    if (passos >= maxPassos) {
        console.log('Erro ao reconstruir caminho: limite de passos excedido');
        return { custo: Infinity, caminho: { vertices: [], arestas: [] } };
    }

    caminhoVertices.unshift(origem);

    return {
        custo: distancias.get(destino) || 0,
        caminho: {
            vertices: caminhoVertices,
            arestas: caminhoArestas
        }
    };
}

/**
 * Retorna os vizinhos de um vértice (respeitando a direção do grafo)
 */
export function getVizinhos(v) {
    const resultado = [];
    if (!v) return resultado;

    for (const a of arestas) {
        if (!a || !a.userData) continue;

        // Em grafos direcionados, só retorna vizinhos na direção da aresta
        // Em grafos não-direcionados, retorna vizinhos em ambas as direções
        if (a.userData.v1 === v) {
            resultado.push({ vertice: a.userData.v2, aresta: a });
        } else if (!direcionado && a.userData.v2 === v) {
            resultado.push({ vertice: a.userData.v1, aresta: a });
        }
    }
    return resultado;
}