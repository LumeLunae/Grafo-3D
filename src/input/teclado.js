// Interpreta os cliques do teclado

import { vertices, arestas, selecionado, setSelecionado, arestaSelecionada, setArestaSelecionada, direcionado, setDirecionado, ponderado, setPonderado, verticeMovendo, setVerticeMovendo, modoTerminais, setModoTerminais, terminais, limparTerminais } from '../grafo.js';
import { atualizarHUD } from '../utils/hud.js';
import { atualizarVisuaisArestas, atualizarArestasDe } from '../utils/visuais.js';
import { criar_cilindro, posicionarLabelPeso } from '../cena.js';
import { importarGrafo, exportarGrafo } from '../utils/imex.js';
import { iniciarBFS, iniciarDFS, cancelarBusca } from '../utils/busca.js';
import { takahashiMatsuyama, shortestPathHeuristic, aplicarArvoreSteiner, restaurarEstado, limparResultadosSteiner, diagnosticarGrafo, compararAlgoritmos } from '../utils/steiner/index.js';

// Função que trata atalhos do teclado
export function handleKey(event, ctx) {
    const { grid, plano, cena } = ctx;

    // Shift + setas: move o vértice horizontalmente (X e Z) 
    if (event.shiftKey && verticeMovendo) {
        let dx = 0, dz = 0;
        if (event.key === 'ArrowUp') dz = -1;
        if (event.key === 'ArrowDown') dz = 1;
        if (event.key === 'ArrowLeft') dx = -1;
        if (event.key === 'ArrowRight') dx = 1;

        if (dx !== 0 || dz !== 0) {

            // Evita mover para cima de outro vértice existente
            const novoX = verticeMovendo.position.x + dx;
            const novoZ = verticeMovendo.position.z + dz;
            const colide = vertices.some(v =>
                v !== verticeMovendo &&
                v.position.x === novoX &&
                v.position.y === verticeMovendo.position.y &&
                v.position.z === novoZ
            );

            if (!colide) {
                verticeMovendo.position.x = novoX;
                verticeMovendo.position.z = novoZ;
                if (verticeMovendo.userData.label) {
                    verticeMovendo.userData.label.position.x = novoX;
                    verticeMovendo.userData.label.position.z = novoZ;
                }
                atualizarArestasDe(verticeMovendo, cena);
            }
            return;
        }
    }

    // Setas sem Shift: move o grid verticalmente 
    if (event.key === 'ArrowUp') {
        if (verticeMovendo) {
            const novoY = verticeMovendo.position.y + 1;
            const colide = vertices.some(v =>
                v !== verticeMovendo &&
                v.position.x === verticeMovendo.position.x &&
                v.position.y === novoY &&
                v.position.z === verticeMovendo.position.z
            );
            if (!colide) {
                verticeMovendo.position.y = novoY;
                if (verticeMovendo.userData.label) verticeMovendo.userData.label.position.y = novoY + 0.4;
                atualizarArestasDe(verticeMovendo, cena);
            }
        }
        grid.position.y += 1;
    }

    if (event.key === 'ArrowDown') {
        if (verticeMovendo) {
            const novoY = verticeMovendo.position.y - 1;
            const colide = vertices.some(v =>
                v !== verticeMovendo &&
                v.position.x === verticeMovendo.position.x &&
                v.position.y === novoY &&
                v.position.z === verticeMovendo.position.z
            );
            if (!colide) {
                verticeMovendo.position.y = novoY;
                if (verticeMovendo.userData.label) verticeMovendo.userData.label.position.y = novoY + 0.4;
                atualizarArestasDe(verticeMovendo, cena);
            }
        }
        grid.position.y -= 1;
    }

    // Mantém o plano alinhado com o grid
    plano.constant = -grid.position.y;

    // Alterna o modo mover no vértice selecionado
    if (event.key === 'm') {
        if (verticeMovendo) {
            // Já estava em modo mover: cancela, volta para amarelo (selecionado)
            verticeMovendo.material.color.set(0xffff00);
            setVerticeMovendo(null);
        } else if (selecionado) {
            // Entra em modo mover: fica azul para indicar
            selecionado.material.color.set(0x4488ff);
            setVerticeMovendo(selecionado);
            setSelecionado(null);
        }
        atualizarHUD();
    }

    // Alterna o modo direcionado
    if (event.key === 'd') {
        setDirecionado(!direcionado);

        // Ao voltar para não-direcionado, remove arestas duplicadas
        if (!direcionado) {

            const remover = new Set();

            for (let i = 0; i < arestas.length; i++) {
                const a = arestas[i];
                if (remover.has(a)) continue;

                const oposta = arestas.find(b =>
                    b !== a &&
                    b.userData.v1 === a.userData.v2 &&
                    b.userData.v2 === a.userData.v1
                );

                if (oposta) {
                    if (oposta.userData.labelPeso) cena.remove(oposta.userData.labelPeso);
                    cena.remove(oposta);
                    remover.add(oposta);

                    const idx = arestas.indexOf(oposta);
                    if (idx !== -1) arestas.splice(idx, 1);
                }
            }
        }

        // Faz com que o não direcionado se torne bidirecional
        else if (direcionado) {
            const snapshot = [...arestas];

            snapshot.forEach(a => {
                const jaExiste = arestas.some(b =>
                    b.userData.v1 === a.userData.v2 &&
                    b.userData.v2 === a.userData.v1
                );

                if (!jaExiste) {
                    const reversa = criar_cilindro(
                        a.userData.v2.position,
                        a.userData.v1.position,
                        true,
                        0
                    );

                    reversa.userData.v1 = a.userData.v2;
                    reversa.userData.v2 = a.userData.v1;
                    reversa.userData.peso = a.userData.peso; // Herda o peso da aresta original

                    arestas.push(reversa);
                    cena.add(reversa);
                    posicionarLabelPeso(reversa, cena); // Cria o label de peso para a reversa
                }
            });
        }

        atualizarHUD();
        atualizarVisuaisArestas(cena);
    }

    // Remove elemento selecionado (bloqueado no modo mover)
    if (event.key === 'Delete' && !verticeMovendo) deletarSelecionado(cena);

    // Alterna o modo ponderado — mostra ou esconde os labels de peso
    if (event.key === 'p') {
        setPonderado(!ponderado);

        // Percorre todas as arestas e mostra/esconde o label de peso
        arestas.forEach(a => {
            if (a.userData.labelPeso) {
                a.userData.labelPeso.visible = ponderado;
            }
        });

        atualizarHUD();
    }

    // Edita o peso da aresta selecionada
    if (event.key === 'e' && arestaSelecionada) {
        const input = prompt('Novo peso da aresta:', arestaSelecionada.userData.peso);

        // Cancela se o usuário fechou o prompt ou deixou vazio
        if (input === null || input.trim() === '') return;

        const valor = Number(input);

        // Rejeita valores não numéricos
        if (isNaN(valor)) return;

        arestaSelecionada.userData.peso = valor;
        posicionarLabelPeso(arestaSelecionada, cena); // Atualiza o sprite com o novo valor
    }

    if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault(); // impede salvar página
        exportarGrafo();
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        importarGrafo(cena);
    }

    // Diagnóstico do grafo (tecla i sem Ctrl)
    if (event.key.toLowerCase() === 'i' && !event.ctrlKey) {
        const diagnostico = diagnosticarGrafo();
        console.log('Diagnóstico do grafo:', diagnostico);

        let mensagem = `=== Diagnóstico do Grafo ===\n\n`;
        mensagem += `Vértices: ${diagnostico.vertices}\n`;
        mensagem += `Arestas: ${diagnostico.arestas}\n`;
        mensagem += `Ponderado: ${diagnostico.ponderado ? 'Sim' : 'Não'}\n`;
        mensagem += `Direcionado: ${diagnostico.direcionado ? 'Sim' : 'Não'}\n`;
        mensagem += `Terminais selecionados: ${diagnostico.terminais}\n\n`;
        mensagem += `=== Conectividade ===\n`;
        mensagem += `${diagnostico.conectividade.mensagem}\n`;
        mensagem += `Vértices visitados: ${diagnostico.conectividade.verticesVisitados}/${diagnostico.conectividade.verticesTotais}\n`;

        if (diagnostico.verticesIsolados.length > 0) {
            mensagem += `\n⚠️ Vértices isolados (sem conexões): ${diagnostico.verticesIsolados.join(', ')}\n`;
        }

        if (!diagnostico.conectividade.conectado) {
            mensagem += `\n⚠️ O grafo está desconexo! Os algoritmos Steiner podem não funcionar corretamente.\n`;
            mensagem += `Dica: Crie arestas para conectar todos os componentes do grafo.\n`;
        }

        alert(mensagem);
    }

    // BFS a partir do vértice selecionado
    if (event.key.toLowerCase() === 'b') {
        iniciarBFS(cena);
    }

    // DFS a partir do vértice selecionado
    if (event.key.toLowerCase() === 'f') {
        iniciarDFS(cena);
    }

    // Cancela a busca em curso e restaura as cores
    if (event.key === 'Escape') {
        cancelarBusca();
        // Cancela modo de terminais se estiver ativo
        if (modoTerminais) {
            setModoTerminais(false);
            // Restaura cores dos terminais
            terminais.forEach(t => {
                t.material.color.set(0xff0000);
            });
            limparTerminais();
            atualizarHUD();
        }
    }

    // Modo de seleção de terminais para Steiner
    if (event.key.toLowerCase() === 't') {
        setModoTerminais(!modoTerminais);
        if (!modoTerminais) {
            // Saiu do modo, limpa terminais
            terminais.forEach(t => {
                t.material.color.set(0xff0000);
            });
            limparTerminais();
        }
        atualizarHUD();
    }

    // Executa Takahashi-Matsuyama
    if (event.key === '1') {
        if (terminais.length < 2) {
            alert('Selecione pelo menos 2 terminais (pressione T e clique nos vértices)');
            return;
        }
        cancelarBusca();
        const resultado = takahashiMatsuyama(terminais);
        if (resultado.sucesso) {
            aplicarArvoreSteiner(resultado, cena);
            console.log('Takahashi-Matsuyama:', resultado);
            alert(`Takahashi-Matsuyama concluído!\nTempo: ${resultado.tempo.toFixed(2)}ms\nCusto: ${resultado.custoTotal}\nVértices: ${resultado.numVertices}\nArestas: ${resultado.numArestas}`);
        } else {
            alert(`Erro: ${resultado.mensagem}\n\nTerminais conectados: ${resultado.terminaisConectados}/${resultado.terminaisTotais}\nDica: Verifique se todos os terminais estão conectados por arestas no grafo.`);
        }
        atualizarHUD();
    }

    // Executa SPH (Shortest Path Heuristic)
    if (event.key === '2') {
        if (terminais.length < 2) {
            alert('Selecione pelo menos 2 terminais (pressione T e clique nos vértices)');
            return;
        }
        cancelarBusca();
        const resultado = shortestPathHeuristic(terminais);
        if (resultado.sucesso) {
            aplicarArvoreSteiner(resultado, cena);
            console.log('SPH:', resultado);
            alert(`SPH concluído!\nTempo: ${resultado.tempo.toFixed(2)}ms\nCusto: ${resultado.custoTotal}\nVértices: ${resultado.numVertices}\nArestas: ${resultado.numArestas}`);
        } else {
            alert(`Erro: ${resultado.mensagem}\n\nTerminais conectados: ${resultado.terminaisConectados}/${resultado.terminaisTotais}\nDica: Verifique se todos os terminais estão conectados por arestas no grafo.`);
        }
        atualizarHUD();
    }

    // Compara os dois algoritmos
    if (event.key === '3') {
        const comparacao = compararAlgoritmos();
        if (comparacao) {
            alert(`Comparação de Algoritmos:\n\nTakahashi-Matsuyama:\nTempo: ${comparacao.takahashiMatsuyama.tempo.toFixed(2)}ms\nCusto: ${comparacao.takahashiMatsuyama.custo}\n\nSPH:\nTempo: ${comparacao.sph.tempo.toFixed(2)}ms\nCusto: ${comparacao.sph.custo}\n\nVencedor Tempo: ${comparacao.vencedorTempo}\nVencedor Custo: ${comparacao.vencedorCusto}`);
        } else {
            alert('Execute ambos os algoritmos primeiro (teclas 1 e 2)');
        }
        atualizarHUD();
    }

    // Restaura o grafo original (tecla R)
    if (event.key.toLowerCase() === 'r') {
        restaurarEstado(cena);
        limparResultadosSteiner();
        atualizarHUD();
        console.log('Grafo restaurado para o estado original');
    }

}


// Função que remove aresta ou vértice selecionado
function deletarSelecionado(cena) {

    if (arestaSelecionada) {
        const a = arestaSelecionada;

        // Remove o label de peso junto com a aresta
        if (a.userData.labelPeso) cena.remove(a.userData.labelPeso);
        cena.remove(a);
        arestas.splice(arestas.indexOf(a), 1);

        // Se o grafo é não-direcionado, remove a aresta oposta se existir
        if (!direcionado) {
            const oposta = arestas.find(b =>
                b.userData.v1 === a.userData.v2 &&
                b.userData.v2 === a.userData.v1
            );

            if (oposta) {
                if (oposta.userData.labelPeso) cena.remove(oposta.userData.labelPeso);
                cena.remove(oposta);
                const idx = arestas.indexOf(oposta);
                if (idx !== -1) arestas.splice(idx, 1);
            }
        }

        setArestaSelecionada(null);
        atualizarHUD();
    }

    else if (selecionado) {
        const v = selecionado;

        // remove label
        if (v.userData.label) {
            cena.remove(v.userData.label);
        }

        // remove todas as arestas conectadas
        const conectadas = arestas.filter(a =>
            a.userData.v1 === v || a.userData.v2 === v
        );

        conectadas.forEach(a => {
            if (a.userData.labelPeso) cena.remove(a.userData.labelPeso);
            cena.remove(a);
            arestas.splice(arestas.indexOf(a), 1);
        });

        // remove vértice
        cena.remove(v);
        vertices.splice(vertices.indexOf(v), 1);

        setSelecionado(null);
        atualizarHUD();
    }
}