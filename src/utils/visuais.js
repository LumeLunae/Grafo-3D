// Controla todas as alterações visuais em vértices e arestas

import { arestas, direcionado } from '../grafo.js';
import { criar_cilindro, posicionarLabelPeso } from '../cena.js';

// Função que recria todas as arestas da cena
export function atualizarVisuaisArestas(cena) {
    for (let i = 0; i < arestas.length; i++) {
        const a = arestas[i];

        const v1 = a.userData.v1;
        const v2 = a.userData.v2;
        const peso = a.userData.peso; // Preserva o peso ao recriar

        const temPar = arestas.some(b =>
            b !== a &&
            b.userData.v1 === v2 &&
            b.userData.v2 === v1
        );

        const offset = (direcionado && temPar) ? 0.15 : 0;

        // Remove a aresta e seu label de peso da cena antes de recriar
        if (a.userData.labelPeso) cena.remove(a.userData.labelPeso);
        cena.remove(a);

        const novo = criar_cilindro(v1.position, v2.position, direcionado, offset);
        novo.userData.v1 = v1;
        novo.userData.v2 = v2;
        novo.userData.peso = peso; // Transfere o peso para a nova aresta

        arestas[i] = novo;
        cena.add(novo);

        posicionarLabelPeso(novo, cena); // Reposiciona o label de peso no meio da nova aresta
    }
}

// Função que recria apenas as arestas conectadas a um vértice específico
export function atualizarArestasDe(vertice, cena) {
    for (let i = 0; i < arestas.length; i++) {
        const a = arestas[i];

        // Ignora arestas que não envolvem o vértice sendo movido
        if (a.userData.v1 !== vertice && a.userData.v2 !== vertice) continue;

        const v1 = a.userData.v1;
        const v2 = a.userData.v2;
        const peso = a.userData.peso; // Preserva o peso ao recriar

        const temPar = arestas.some(b =>
            b !== a &&
            b.userData.v1 === v2 &&
            b.userData.v2 === v1
        );

        const offset = (direcionado && temPar) ? 0.15 : 0;

        // Remove a aresta e seu label de peso da cena antes de recriar
        if (a.userData.labelPeso) cena.remove(a.userData.labelPeso);
        cena.remove(a);

        const novo = criar_cilindro(v1.position, v2.position, direcionado, offset);
        novo.userData.v1 = v1;
        novo.userData.v2 = v2;
        novo.userData.peso = peso; // Transfere o peso para a nova aresta

        arestas[i] = novo;
        cena.add(novo);

        posicionarLabelPeso(novo, cena); // Reposiciona o label de peso no meio da nova aresta
    }
}