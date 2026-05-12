// Funções de verificação de conectividade para grafos

import { vertices, arestas, direcionado } from '../../grafo.js';
import { dijkstra } from './dijkstra.js';

/**
 * Verifica se existe caminho direcionado entre dois vértices
 */
function existeCaminhoDirecionado(origem, destino) {
    const resultado = dijkstra(origem, new Set([destino]));
    return resultado.custo !== Infinity;
}

/**
 * Verifica a conectividade direcionada entre todos os terminais
 * Em grafos direcionados, verifica se existe um vértice que pode alcançar todos os terminais
 */
export function verificarConectividadeDirecionadaTerminais(terminais) {
    if (terminais.length < 2) {
        return { conectado: true, mensagem: 'Menos de 2 terminais' };
    }

    // Em grafos direcionados, precisamos encontrar um vértice que possa alcançar todos os terminais
    // Tenta cada vértice como potencial raiz
    for (const v of vertices) {
        let podeAlcançarTodos = true;

        for (const terminal of terminais) {
            if (!existeCaminhoDirecionado(v, terminal)) {
                podeAlcançarTodos = false;
                break;
            }
        }

        if (podeAlcançarTodos) {
            return { conectado: true, mensagem: 'Todos os terminais podem ser alcançados', raiz: v };
        }
    }

    return {
        conectado: false,
        mensagem: 'Não existe um vértice que possa alcançar todos os terminais. Em grafos direcionados, todos os terminais devem ser alcançáveis a partir de um vértice comum.'
    };
}

/**
 * Verifica se o grafo é conectado usando BFS
 * @returns {Object} Resultado da verificação
 */
export function verificarConectividade() {
    if (vertices.length === 0) {
        return { conectado: true, componentes: 0, mensagem: 'Grafo vazio' };
    }

    if (arestas.length === 0) {
        return {
            conectado: vertices.length <= 1,
            componentes: vertices.length,
            mensagem: vertices.length > 1 ? 'Grafo desconexo: não há arestas conectando os vértices' : 'Grafo com um único vértice'
        };
    }

    const visitados = new Set();
    const fila = [vertices[0]];
    visitados.add(vertices[0]);

    const { getVizinhos } = require('./dijkstra.js');

    while (fila.length > 0) {
        const atual = fila.shift();
        const vizinhos = getVizinhos(atual);

        for (const { vertice: vizinho } of vizinhos) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                fila.push(vizinho);
            }
        }
    }

    const conectado = visitados.size === vertices.length;
    const componentes = vertices.length - visitados.size + 1;

    return {
        conectado,
        componentes,
        verticesVisitados: visitados.size,
        verticesTotais: vertices.length,
        mensagem: conectado ? 'Grafo conectado' : `Grafo desconexo: ${componentes} componentes encontrados`
    };
}