// Atualiza a interface

import { vertices, arestas, direcionado, ponderado, verticeMovendo, modoTerminais, terminais } from '../grafo.js';
import { getResultadosSteiner, compararAlgoritmos } from './steiner/index.js';

// Função que conta vértices, arestas, modo e atalhos do teclado
export function atualizarHUD() {
    const hud = document.getElementById('hud');

    // Obtém resultados de comparação se disponíveis
    const comparacao = compararAlgoritmos();
    let comparacaoHTML = '';

    if (comparacao) {
        comparacaoHTML = `
            <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;">
                <strong style="color: #00ff00;">Comparação de Algoritmos:</strong><br>
                <span style="color: #ffaa00;">Takahashi-Matsuyama:</span> ${comparacao.takahashiMatsuyama.tempo.toFixed(2)}ms | Custo: ${comparacao.takahashiMatsuyama.custo}<br>
                <span style="color: #00ccff;">SPH:</span> ${comparacao.sph.tempo.toFixed(2)}ms | Custo: ${comparacao.sph.custo}<br>
                <strong>Vencedor Tempo:</strong> ${comparacao.vencedorTempo}<br>
                <strong>Vencedor Custo:</strong> ${comparacao.vencedorCusto}
            </div>
        `;
    }

    hud.innerHTML = `
        <div>
            <strong>Vértices:</strong> ${vertices.length}<br>
            <strong>Arestas:</strong> ${arestas.length}<br>
            <strong>Modo:</strong> ${direcionado ? 'Direcionado' : 'Não-direcionado'}<br>
            <strong>Ponderado:</strong> ${ponderado ? 'Sim' : 'Não'}<br>
            <strong>Mover:</strong> ${verticeMovendo ? 'Ativo' : 'Inativo'}<br>
            <strong>Terminais:</strong> ${terminais.length} ${modoTerminais ? '(Selecionando...)' : ''}
        </div>
        <div style="margin-top: 10px;">
            <strong>Eixos:</strong> <span style="color: #ff4444;">X</span> <span style="color: #44ff44;">Y</span> <span style="color: #4444ff;">Z</span>
        </div>
        <div style="margin-top: 10px;">
            <strong>Controles:</strong><br>
            ↑ / ↓ - mover plano<br>
            Shift + ↑↓ ← → - mover vértice<br>
            D - alternar modo direcionado<br>
            P - alternar modo ponderado<br>
            M - ativar/desativar mover<br>
            E - editar peso da aresta<br>
            Ctrl + S - exportar grafo<br>
            Ctrl + I - importar grafo<br>
            B - BFS (vértice selecionado)<br>
            F - DFS (vértice selecionado)<br>
            T - selecionar terminais Steiner<br>
            1 - Takahashi-Matsuyama<br>
            2 - SPH (Shortest Path Heuristic)<br>
            3 - Comparar algoritmos<br>
            R - restaurar grafo original<br>
            Esc - cancelar busca/terminais<br>
            Delete - remover selecionado<br>
        </div>
        ${comparacaoHTML}
    `;
}