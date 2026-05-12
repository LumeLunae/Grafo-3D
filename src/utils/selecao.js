// Controla a visualização da seleção

import { selecionado, setSelecionado, arestaSelecionada, setArestaSelecionada } from '../grafo.js';

// Função que remove qualquer seleção ativa
export function desmarcarTudo() {
    if (selecionado) {
        selecionado.material.color.set(0xff0000);
        setSelecionado(null);
    }

    if (arestaSelecionada) {
        
        // Percorre todos os objetos da aresta (group)
        arestaSelecionada.traverse(o => {
            if (o.material) o.material.color.set(0xffffff);
        });
        setArestaSelecionada(null);
    }
}

// Altera a cor de todos os componentes visuais da aresta
export function setCorAresta(aresta, cor) {
    aresta.traverse(o => {
        if (o.material) o.material.color.set(cor);
    });
}