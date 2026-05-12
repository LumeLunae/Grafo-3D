// Gerencia o estado do grafo: lista de vértices, arestas e seleção

export const vertices = []; //Array de todos os meshes de vértices na cena
export const arestas = []; //Array de todos os meshes de arestas na cena
export let selecionado = null; //Vértice atualmente selecionado
export let arestaSelecionada = null //Aresta atualmente selecionada
export let direcionado = false;
export let ponderado = false; // Quando true, exibe e considera os pesos das arestas
export let verticeMovendo = null; // Vértice atualmente em modo mover (azul)
export let modoTerminais = false; // Modo de seleção de terminais para Steiner
export const terminais = []; // Array de vértices terminais selecionados

// Função que cria um ID que nunca regride (útil ao deletar um vértice de id intermediário)
let _proximoId = 1;
export function proximoIdVertice() {
    return _proximoId++;
}

// Funções usadas para controlar o estado sem acessar diretamente
export function setDirecionado(valor) {
    direcionado = valor;
}

export function setPonderado(valor) {
    ponderado = valor;
}

export function setVerticeMovendo(mesh) {
    verticeMovendo = mesh;
}

export function setSelecionado(mesh) {
    selecionado = mesh;
}

export function setArestaSelecionada(mesh) {
    arestaSelecionada = mesh;
}

export function setModoTerminais(valor) {
    modoTerminais = valor;
}

export function adicionarTerminal(mesh) {
    if (!terminais.includes(mesh)) {
        terminais.push(mesh);
    }
}

export function removerTerminal(mesh) {
    const index = terminais.indexOf(mesh);
    if (index > -1) {
        terminais.splice(index, 1);
    }
}

export function limparTerminais() {
    terminais.length = 0;
}