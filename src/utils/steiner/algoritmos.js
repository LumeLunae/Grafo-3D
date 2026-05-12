// Algoritmos de Árvore de Steiner: Takahashi-Matsuyama e SPH (Shortest Path Heuristic)

import { vertices, arestas, direcionado, terminais } from '../../grafo.js';
import { dijkstra } from './dijkstra.js';
import { verificarConectividadeDirecionadaTerminais } from './conectividade.js';
import { armazenarResultado } from './diagnostico.js';

/**
 * Algoritmo de Takahashi-Matsuyama para Árvore de Steiner
 * @param {Array} terminais - Array de vértices terminais
 * @returns {Object} Resultado com árvore, tempo de execução e estatísticas
 */
export function takahashiMatsuyama(terminais) {
    const inicio = performance.now();

    if (terminais.length < 2) {
        return {
            sucesso: false,
            mensagem: 'É necessário pelo menos 2 terminais',
            tempo: 0,
            arvore: { vertices: [], arestas: [] },
            custoTotal: 0
        };
    }

    // Verifica se o grafo tem arestas suficientes
    if (arestas.length === 0) {
        return {
            sucesso: false,
            mensagem: 'O grafo não possui arestas. Crie arestas conectando os vértices.',
            tempo: 0,
            arvore: { vertices: [], arestas: [] },
            custoTotal: 0
        };
    }

    // Em grafos direcionados, verifica a conectividade entre terminais
    if (direcionado) {
        const conectividade = verificarConectividadeDirecionadaTerminais(terminais);
        if (!conectividade.conectado) {
            return {
                sucesso: false,
                mensagem: conectividade.mensagem,
                tempo: 0,
                arvore: { vertices: [], arestas: [] },
                custoTotal: 0
            };
        }
        // Usa a raiz encontrada como ponto de partida
        const raiz = conectividade.raiz;
        // Começa com a raiz na árvore
        const arvoreVertices = new Set([raiz]);
        const arvoreArestas = new Set();
        const terminaisRestantes = new Set(terminais);
        let custoTotal = 0;
        let iteracoesSemProgresso = 0;
        const maxIteracoesSemProgresso = terminais.length * 2; // Limite de segurança

        // Itera até conectar todos os terminais
        while (terminaisRestantes.size > 0 && iteracoesSemProgresso < maxIteracoesSemProgresso) {
            let melhorCaminho = null;
            let menorCusto = Infinity;
            let terminalAlvo = null;
            let encontrouCaminho = false;

            // Para cada terminal não conectado, encontra o caminho mais curto até a árvore atual
            for (const terminal of terminaisRestantes) {
                // Em grafos direcionados, só tenta caminho DA árvore ATÉ o terminal
                // Tenta a partir de cada vértice da árvore
                for (const verticeArvore of arvoreVertices) {
                    const resultado = dijkstra(verticeArvore, new Set([terminal]));

                    if (resultado.custo < menorCusto && resultado.custo !== Infinity) {
                        menorCusto = resultado.custo;
                        melhorCaminho = resultado.caminho;
                        terminalAlvo = terminal;
                        encontrouCaminho = true;
                    }
                }
            }

            if (encontrouCaminho && melhorCaminho && melhorCaminho.vertices && melhorCaminho.vertices.length > 0) {
                // Adiciona vértices e arestas do caminho à árvore
                for (let i = 0; i < melhorCaminho.vertices.length; i++) {
                    arvoreVertices.add(melhorCaminho.vertices[i]);
                }

                for (const aresta of melhorCaminho.arestas) {
                    arvoreArestas.add(aresta);
                }

                custoTotal += menorCusto;
                terminaisRestantes.delete(terminalAlvo);
                iteracoesSemProgresso = 0; // Reset contador
            } else {
                iteracoesSemProgresso++;
                // Tenta conectar com qualquer vértice disponível
                if (iteracoesSemProgresso === 1) {
                    console.log('Tentando conectar terminais restantes:', terminaisRestantes.size);
                    console.log('Árvore atual:', arvoreVertices.size, 'vértices');
                }
            }
        }

        const fim = performance.now();
        const tempoExecucao = fim - inicio;

        const resultado = {
            sucesso: terminaisRestantes.size === 0,
            tempo: tempoExecucao,
            arvore: {
                vertices: Array.from(arvoreVertices),
                arestas: Array.from(arvoreArestas)
            },
            custoTotal: custoTotal,
            numVertices: arvoreVertices.size,
            numArestas: arvoreArestas.size,
            terminaisConectados: terminais.length - terminaisRestantes.size,
            terminaisTotais: terminais.length,
            mensagem: terminaisRestantes.size > 0 ?
                `Não foi possível conectar ${terminaisRestantes.size} terminal(is). Verifique se o grafo é conectado.` :
                'Todos os terminais foram conectados com sucesso.'
        };

        armazenarResultado('takahashiMatsuyama', resultado);
        return resultado;
    }

    // Começa com o primeiro terminal
    const arvoreVertices = new Set([terminais[0]]);
    const arvoreArestas = new Set();
    const terminaisRestantes = new Set(terminais.slice(1));
    let custoTotal = 0;
    let iteracoesSemProgresso = 0;
    const maxIteracoesSemProgresso = terminais.length * 2; // Limite de segurança

    // Itera até conectar todos os terminais
    while (terminaisRestantes.size > 0 && iteracoesSemProgresso < maxIteracoesSemProgresso) {
        let melhorCaminho = null;
        let menorCusto = Infinity;
        let terminalAlvo = null;
        let encontrouCaminho = false;

        // Para cada terminal não conectado, encontra o caminho mais curto até a árvore atual
        for (const terminal of terminaisRestantes) {
            // Em grafos não-direcionados, usa o comportamento normal
            const resultado = dijkstra(terminal, arvoreVertices);

            if (resultado.custo < menorCusto && resultado.custo !== Infinity) {
                menorCusto = resultado.custo;
                melhorCaminho = resultado.caminho;
                terminalAlvo = terminal;
                encontrouCaminho = true;
            }
        }

        if (encontrouCaminho && melhorCaminho && melhorCaminho.vertices && melhorCaminho.vertices.length > 0) {
            // Adiciona vértices e arestas do caminho à árvore
            for (let i = 0; i < melhorCaminho.vertices.length; i++) {
                arvoreVertices.add(melhorCaminho.vertices[i]);
            }

            for (const aresta of melhorCaminho.arestas) {
                arvoreArestas.add(aresta);
            }

            custoTotal += menorCusto;
            terminaisRestantes.delete(terminalAlvo);
            iteracoesSemProgresso = 0; // Reset contador
        } else {
            iteracoesSemProgresso++;
            // Tenta conectar com qualquer vértice disponível
            if (iteracoesSemProgresso === 1) {
                console.log('Tentando conectar terminais restantes:', terminaisRestantes.size);
                console.log('Árvore atual:', arvoreVertices.size, 'vértices');
            }
        }
    }

    const fim = performance.now();
    const tempoExecucao = fim - inicio;

    const resultado = {
        sucesso: terminaisRestantes.size === 0,
        tempo: tempoExecucao,
        arvore: {
            vertices: Array.from(arvoreVertices),
            arestas: Array.from(arvoreArestas)
        },
        custoTotal: custoTotal,
        numVertices: arvoreVertices.size,
        numArestas: arvoreArestas.size,
        terminaisConectados: terminais.length - terminaisRestantes.size,
        terminaisTotais: terminais.length,
        mensagem: terminaisRestantes.size > 0 ?
            `Não foi possível conectar ${terminaisRestantes.size} terminal(is). Verifique se o grafo é conectado.` :
            'Todos os terminais foram conectados com sucesso.'
    };

    armazenarResultado('takahashiMatsuyama', resultado);
    return resultado;
}

/**
 * Algoritmo SPH (Shortest Path Heuristic) para Árvore de Steiner
 * @param {Array} terminais - Array de vértices terminais
 * @returns {Object} Resultado com árvore, tempo de execução e estatísticas
 */
export function shortestPathHeuristic(terminais) {
    const inicio = performance.now();

    if (terminais.length < 2) {
        return {
            sucesso: false,
            mensagem: 'É necessário pelo menos 2 terminais',
            tempo: 0,
            arvore: { vertices: [], arestas: [] },
            custoTotal: 0
        };
    }

    // Verifica se o grafo tem arestas suficientes
    if (arestas.length === 0) {
        return {
            sucesso: false,
            mensagem: 'O grafo não possui arestas. Crie arestas conectando os vértices.',
            tempo: 0,
            arvore: { vertices: [], arestas: [] },
            custoTotal: 0
        };
    }

    // Em grafos direcionados, verifica a conectividade entre terminais
    if (direcionado) {
        const conectividade = verificarConectividadeDirecionadaTerminais(terminais);
        if (!conectividade.conectado) {
            return {
                sucesso: false,
                mensagem: conectividade.mensagem,
                tempo: 0,
                arvore: { vertices: [], arestas: [] },
                custoTotal: 0
            };
        }
        // Usa a raiz encontrada como ponto de partida
        const raiz = conectividade.raiz;
        // Começa com a raiz na árvore
        const arvoreVertices = new Set([raiz]);
        const arvoreArestas = new Set();
        const terminaisRestantes = new Set(terminais);
        let custoTotal = 0;
        let iteracoesSemProgresso = 0;
        const maxIteracoesSemProgresso = vertices.length * 2; // Limite de segurança

        // Itera até conectar todos os terminais
        while (terminaisRestantes.size > 0 && iteracoesSemProgresso < maxIteracoesSemProgresso) {
            let melhorCaminho = null;
            let menorCusto = Infinity;
            let verticeAlvo = null;
            let encontrouCaminho = false;

            // Encontra o vértice mais próximo da árvore atual (não apenas terminais)
            for (const v of vertices) {
                if (arvoreVertices.has(v)) continue;

                // Em grafos direcionados, só tenta caminho DA árvore ATÉ o vértice
                // Tenta a partir de cada vértice da árvore
                for (const verticeArvore of arvoreVertices) {
                    const resultado = dijkstra(verticeArvore, new Set([v]));

                    if (resultado.custo < menorCusto && resultado.custo !== Infinity) {
                        menorCusto = resultado.custo;
                        melhorCaminho = resultado.caminho;
                        verticeAlvo = v;
                        encontrouCaminho = true;
                    }
                }
            }

            if (encontrouCaminho && melhorCaminho && melhorCaminho.vertices && melhorCaminho.vertices.length > 0) {
                // Adiciona vértices e arestas do caminho à árvore
                for (let i = 0; i < melhorCaminho.vertices.length; i++) {
                    arvoreVertices.add(melhorCaminho.vertices[i]);
                }

                for (const aresta of melhorCaminho.arestas) {
                    arvoreArestas.add(aresta);
                }

                custoTotal += menorCusto;

                // Remove o vértice alvo dos terminais restantes se for um terminal
                if (terminaisRestantes.has(verticeAlvo)) {
                    terminaisRestantes.delete(verticeAlvo);
                }
                iteracoesSemProgresso = 0; // Reset contador
            } else {
                iteracoesSemProgresso++;
                // Tenta conectar com qualquer vértice disponível
                if (iteracoesSemProgresso === 1) {
                    console.log('Tentando conectar terminais restantes:', terminaisRestantes.size);
                    console.log('Árvore atual:', arvoreVertices.size, 'vértices');
                }
            }
        }

        const fim = performance.now();
        const tempoExecucao = fim - inicio;

        const resultado = {
            sucesso: terminaisRestantes.size === 0,
            tempo: tempoExecucao,
            arvore: {
                vertices: Array.from(arvoreVertices),
                arestas: Array.from(arvoreArestas)
            },
            custoTotal: custoTotal,
            numVertices: arvoreVertices.size,
            numArestas: arvoreArestas.size,
            terminaisConectados: terminais.length - terminaisRestantes.size,
            terminaisTotais: terminais.length,
            mensagem: terminaisRestantes.size > 0 ?
                `Não foi possível conectar ${terminaisRestantes.size} terminal(is). Verifique se o grafo é conectado.` :
                'Todos os terminais foram conectados com sucesso.'
        };

        armazenarResultado('sph', resultado);
        return resultado;
    }

    // Começa com o primeiro terminal
    const arvoreVertices = new Set([terminais[0]]);
    const arvoreArestas = new Set();
    const terminaisRestantes = new Set(terminais.slice(1));
    let custoTotal = 0;
    let iteracoesSemProgresso = 0;
    const maxIteracoesSemProgresso = vertices.length * 2; // Limite de segurança

    // Itera até conectar todos os terminais
    while (terminaisRestantes.size > 0 && iteracoesSemProgresso < maxIteracoesSemProgresso) {
        let melhorCaminho = null;
        let menorCusto = Infinity;
        let verticeAlvo = null;
        let encontrouCaminho = false;

        // Encontra o vértice mais próximo da árvore atual (não apenas terminais)
        for (const v of vertices) {
            if (arvoreVertices.has(v)) continue;

            // Em grafos não-direcionados, usa o comportamento normal
            const resultado = dijkstra(v, arvoreVertices);

            if (resultado.custo < menorCusto && resultado.custo !== Infinity) {
                menorCusto = resultado.custo;
                melhorCaminho = resultado.caminho;
                verticeAlvo = v;
                encontrouCaminho = true;
            }
        }

        if (encontrouCaminho && melhorCaminho && melhorCaminho.vertices && melhorCaminho.vertices.length > 0) {
            // Adiciona vértices e arestas do caminho à árvore
            for (let i = 0; i < melhorCaminho.vertices.length; i++) {
                arvoreVertices.add(melhorCaminho.vertices[i]);
            }

            for (const aresta of melhorCaminho.arestas) {
                arvoreArestas.add(aresta);
            }

            custoTotal += menorCusto;

            // Remove o vértice alvo dos terminais restantes se for um terminal
            if (terminaisRestantes.has(verticeAlvo)) {
                terminaisRestantes.delete(verticeAlvo);
            }
            iteracoesSemProgresso = 0; // Reset contador
        } else {
            iteracoesSemProgresso++;
            // Tenta conectar com qualquer vértice disponível
            if (iteracoesSemProgresso === 1) {
                console.log('Tentando conectar terminais restantes:', terminaisRestantes.size);
                console.log('Árvore atual:', arvoreVertices.size, 'vértices');
            }
        }
    }

    const fim = performance.now();
    const tempoExecucao = fim - inicio;

    const resultado = {
        sucesso: terminaisRestantes.size === 0,
        tempo: tempoExecucao,
        arvore: {
            vertices: Array.from(arvoreVertices),
            arestas: Array.from(arvoreArestas)
        },
        custoTotal: custoTotal,
        numVertices: arvoreVertices.size,
        numArestas: arvoreArestas.size,
        terminaisConectados: terminais.length - terminaisRestantes.size,
        terminaisTotais: terminais.length,
        mensagem: terminaisRestantes.size > 0 ?
            `Não foi possível conectar ${terminaisRestantes.size} terminal(is). Verifique se o grafo é conectado.` :
            'Todos os terminais foram conectados com sucesso.'
    };

    armazenarResultado('sph', resultado);
    return resultado;
}