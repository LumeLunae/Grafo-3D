// Controla a exibição da tabela de adjacência

import { vertices, arestas, direcionado, ponderado } from '../grafo.js';

// Inicializa o menu oculto
export function inicializarMenuOculto() {
    const btnMenu = document.getElementById('btn-menu');
    const menuOpcoes = document.getElementById('menu-opcoes');
    const btnTabela = document.getElementById('btn-tabela-adjacencia');
    const btnTabelaDFS = document.getElementById('btn-tabela-dfs');
    const modal = document.getElementById('modal-tabela');
    const modalDFS = document.getElementById('modal-tabela-dfs');
    const closeBtn = document.querySelector('.close');
    const closeBtnDFS = document.querySelector('.close-dfs');

    // Toggle do menu
    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        menuOpcoes.classList.toggle('show');
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!menuOpcoes.contains(e.target) && e.target !== btnMenu) {
            menuOpcoes.classList.remove('show');
        }
    });

    // Abre a tabela de adjacência
    btnTabela.addEventListener('click', () => {
        gerarTabelaAdjacencia();
        modal.style.display = 'block';
        menuOpcoes.classList.remove('show');
    });

    // Abre a tabela de tempos DFS
    btnTabelaDFS.addEventListener('click', () => {
        gerarTabelaTemposDFS();
        modalDFS.style.display = 'block';
        menuOpcoes.classList.remove('show');
    });

    // Fecha o modal de adjacência
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Fecha o modal de DFS
    closeBtnDFS.addEventListener('click', () => {
        modalDFS.style.display = 'none';
    });

    // Fecha o modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
        if (e.target === modalDFS) {
            modalDFS.style.display = 'none';
        }
    });
}

// Gera a tabela de adjacência
function gerarTabelaAdjacencia() {
    const container = document.getElementById('tabela-container');

    if (vertices.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #aaa;">Nenhum vértice no grafo.</p>';
        return;
    }

    // Ordena vértices por ID
    const verticesOrdenados = [...vertices].sort((a, b) => {
        const idA = a.userData.id || 0;
        const idB = b.userData.id || 0;
        return idA - idB;
    });

    // Cria a tabela
    let html = '<table class="tabela-adjacencia">';
    html += '<thead><tr><th></th>';

    // Cabeçalho com os vértices
    verticesOrdenados.forEach(v => {
        html += `<th>${v.userData.id || '?'}</th>`;
    });

    html += '</tr></thead><tbody>';

    // Linhas da tabela
    verticesOrdenados.forEach(vOrigem => {
        html += `<tr><th>${vOrigem.userData.id || '?'}</th>`;

        verticesOrdenados.forEach(vDestino => {
            const conexao = encontrarConexao(vOrigem, vDestino);

            if (conexao) {
                if (ponderado && conexao.peso !== undefined) {
                    html += `<td>${conexao.peso}</td>`;
                } else {
                    html += '<td>1</td>';
                }
            } else {
                html += '<td>-</td>';
            }
        });

        html += '</tr>';
    });

    html += '</tbody></table>';

    container.innerHTML = html;
}

// Encontra a conexão entre dois vértices
function encontrarConexao(v1, v2) {
    for (const aresta of arestas) {
        if (aresta.userData.v1 === v1 && aresta.userData.v2 === v2) {
            return {
                peso: aresta.userData.peso,
                direcao: 'v1->v2'
            };
        }

        // Em grafos não-direcionados, verifica também a direção oposta
        if (!direcionado && aresta.userData.v1 === v2 && aresta.userData.v2 === v1) {
            return {
                peso: aresta.userData.peso,
                direcao: 'v2->v1'
            };
        }
    }

    return null;
}

// Gera a tabela de tempos do DFS
function gerarTabelaTemposDFS() {
    const container = document.getElementById('tabela-dfs-container');

    if (!window.temposDFS) {
        container.innerHTML = '<p style="text-align: center; color: #aaa;">Execute o DFS primeiro (pressione F com um vértice selecionado).</p>';
        return;
    }

    const { temposChegada, temposSaida, pais, visitados } = window.temposDFS;

    if (visitados.size === 0) {
        container.innerHTML = '<p style="text-align: center; color: #aaa;">Nenhum vértice visitado.</p>';
        return;
    }

    // Ordena vértices por tempo de chegada
    const verticesOrdenados = [...visitados].sort((a, b) => {
        const tempoA = temposChegada.get(a) || 0;
        const tempoB = temposChegada.get(b) || 0;
        return tempoA - tempoB;
    });

    // Cria a tabela
    let html = '<table class="tabela-tempos-dfs">';
    html += '<thead><tr><th>Vértice</th><th>Pai</th><th>Tempo de Chegada</th><th>Tempo de Saída</th></tr></thead><tbody>';

    // Linhas da tabela
    verticesOrdenados.forEach(v => {
        const id = v.userData.id || '?';
        const pai = pais.get(v);
        const paiId = pai ? (pai.userData.id || '?') : '-';
        const tempoChegada = temposChegada.get(v) || '-';
        const tempoSaida = temposSaida.get(v) || '-';

        html += `<tr><td>${id}</td><td>${paiId}</td><td>${tempoChegada}</td><td>${tempoSaida}</td></tr>`;
    });

    html += '</tbody></table>';

    container.innerHTML = html;
}