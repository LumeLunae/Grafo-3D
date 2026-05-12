// Funções de visualização para Árvore de Steiner

import { vertices, arestas, ponderado } from '../../grafo.js';
import { setCorAresta } from '../selecao.js';

const cor_steiner = 0x00ff00; // Verde para árvore de Steiner

/**
 * Restaura o estado anterior do grafo
 */
export function restaurarEstado(cena) {
    // Restaura todos os vértices visíveis com cor vermelha
    vertices.forEach(v => {
        v.visible = true;
        v.material.color.set(0xff0000);
        if (v.userData.label) {
            v.userData.label.visible = true;
        }
    });

    // Restaura todas as arestas visíveis com cor branca
    arestas.forEach(a => {
        a.visible = true;
        setCorAresta(a, 0xffffff);
        if (a.userData.labelPeso) {
            a.userData.labelPeso.visible = ponderado;
        }
    });
}

/**
 * Aplica a árvore de Steiner ao grafo, ocultando elementos não utilizados
 */
export function aplicarArvoreSteiner(resultado, cena) {
    const { vertices: arvoreVertices, arestas: arvoreArestas } = resultado.arvore;
    const verticesSet = new Set(arvoreVertices);
    const arestasSet = new Set(arvoreArestas);

    // Oculta vértices não utilizados e destaca os utilizados
    vertices.forEach(v => {
        if (verticesSet.has(v)) {
            v.material.color.set(cor_steiner);
            v.visible = true;
            if (v.userData.label) v.userData.label.visible = true;
        } else {
            v.visible = false;
            if (v.userData.label) v.userData.label.visible = false;
        }
    });

    // Oculta arestas não utilizadas e destaca as utilizadas
    arestas.forEach(a => {
        if (arestasSet.has(a)) {
            setCorAresta(a, cor_steiner);
            a.visible = true;
            if (a.userData.labelPeso) a.userData.labelPeso.visible = ponderado;
        } else {
            a.visible = false;
            if (a.userData.labelPeso) a.userData.labelPeso.visible = false;
        }
    });
}