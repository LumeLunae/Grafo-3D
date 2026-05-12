// Funções de diagnóstico e comparação para Árvore de Steiner

import { vertices, arestas, ponderado, direcionado, terminais } from '../../grafo.js';
import { verificarConectividade } from './conectividade.js';
import { getVizinhos } from './dijkstra.js';

// Armazena resultados para comparação
let resultadosSteiner = {
    takahashiMatsuyama: null,
    sph: null
};

/**
 * Diagnóstico do grafo para identificar problemas
 * @returns {Object} Informações de diagnóstico
 */
export function diagnosticarGrafo() {
    const info = {
        vertices: vertices.length,
        arestas: arestas.length,
        ponderado,
        direcionado,
        terminais: terminais.length,
        conectividade: verificarConectividade(),
        graus: new Map()
    };

    // Calcula grau de cada vértice
    for (const v of vertices) {
        const vizinhos = getVizinhos(v);
        info.graus.set(v, vizinhos.length);
    }

    // Encontra vértices isolados
    info.verticesIsolados = [];
    for (const [v, grau] of info.graus) {
        if (grau === 0) {
            info.verticesIsolados.push(v.userData?.id || 'sem ID');
        }
    }

    return info;
}

/**
 * Compara os resultados dos dois algoritmos
 */
export function compararAlgoritmos() {
    const tm = resultadosSteiner.takahashiMatsuyama;
    const sph = resultadosSteiner.sph;

    if (!tm || !sph) {
        return null;
    }

    return {
        takahashiMatsuyama: {
            tempo: tm.tempo,
            custo: tm.custoTotal,
            vertices: tm.numVertices,
            arestas: tm.numArestas,
            sucesso: tm.sucesso
        },
        sph: {
            tempo: sph.tempo,
            custo: sph.custoTotal,
            vertices: sph.numVertices,
            arestas: sph.numArestas,
            sucesso: sph.sucesso
        },
        vencedorTempo: tm.tempo < sph.tempo ? 'Takahashi-Matsuyama' :
                      sph.tempo < tm.tempo ? 'SPH' : 'Empate',
        vencedorCusto: tm.custoTotal < sph.custoTotal ? 'Takahashi-Matsuyama' :
                       sph.custoTotal < tm.custoTotal ? 'SPH' : 'Empate',
        diferencaTempo: Math.abs(tm.tempo - sph.tempo),
        diferencaCusto: Math.abs(tm.custoTotal - sph.custoTotal)
    };
}

/**
 * Retorna os resultados armazenados para comparação
 */
export function getResultadosSteiner() {
    return resultadosSteiner;
}

/**
 * Limpa os resultados armazenados
 */
export function limparResultadosSteiner() {
    resultadosSteiner = {
        takahashiMatsuyama: null,
        sph: null
    };
}

/**
 * Armazena o resultado de um algoritmo
 */
export function armazenarResultado(algoritmo, resultado) {
    if (algoritmo === 'takahashiMatsuyama') {
        resultadosSteiner.takahashiMatsuyama = resultado;
    } else if (algoritmo === 'sph') {
        resultadosSteiner.sph = resultado;
    }
}