// Controla a importação e exportação dos grafos 

import { vertices, arestas, direcionado, ponderado, setDirecionado, setPonderado, setSelecionado, setArestaSelecionada, proximoIdVertice } from '../grafo.js';
import { criarMeshDeNo, criar_cilindro, criarLabel, posicionarLabelPeso } from '../cena.js';
import { atualizarHUD } from './hud.js';
import { atualizarVisuaisArestas } from './visuais.js';


// Função que realiza a exportação do grafo
export function exportarGrafo() {

    // Mapeia cada mesh de vértice pro seu índice no array 
    const indiceDe = new Map();
    vertices.forEach((v, i) => indiceDe.set(v, i));

    const dados = {
        direcionado,
        ponderado,

        // Posições dos vértices
        vertices: vertices.map((v, i) => ({
            id: v.userData.id ?? i + 1,
            x: v.position.x,
            y: v.position.y,
            z: v.position.z
        })),

        arestas: arestas.map(a => ({

            v1: indiceDe.get(a.userData.v1),
            v2: indiceDe.get(a.userData.v2),
            peso: a.userData.peso ?? 1

        }))

    };

    const nome = prompt('Nome do arquivo:', 'grafo');
if (!nome) return;

const json = JSON.stringify(dados, null, 2);
const blob = new Blob([json], { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
link.setAttribute('download', nome + '.json');

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);
}

// Função que realiza a importação do grafo
export function importarGrafo(cena) {

    // Abre o seletor de arquivo nativo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', () => {
        const arquivo = input.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = (e) => _carregar(e.target.result, cena);
        leitor.readAsText(arquivo);
    });

    input.click();

}

// Função que reconstrói o grafo inteiramente
function _carregar(jsonStr, cena) {
    let dados;

    try {
        dados = JSON.parse(jsonStr);
    } catch {
        alert('Arquivo inválido');
        return;
    }

    if (!Array.isArray(dados.vertices) || !Array.isArray(dados.arestas)) {
        alert('Arquivo inválido: vértices e arestas são obrigatórios')
        return;
    }

    setSelecionado(null);
    setArestaSelecionada(null);

    // Remove todos os vértices, arestas e labels da cena
    for (const a of arestas) {
        if (a.userData.labelPeso) cena.remove(a.userData.labelPeso);
        cena.remove(a);
    }
    arestas.length = 0;

    for (const v of vertices) {
        if (v.userData.label) cena.remove(v.userData.label);
        cena.remove(v);
    }
    vertices.length = 0;

    setDirecionado(dados.direcionado ?? false);
    setPonderado(dados.ponderado ?? false);

    const meshes = [];


    // Reconstrói os vértices
    for (const vDado of dados.vertices) {
        const { id, x, y, z } = vDado;

        const esfera = criarMeshDeNo({ x, y, z });
        esfera.userData.id = id ?? proximoIdVertice();

        const label = criarLabel(esfera.userData.id);
        label.position.set(x, y + 0.4, z);

        esfera.userData.label = label;

        cena.add(esfera);
        cena.add(label);
        vertices.push(esfera);
        meshes.push(esfera);
    }

    // Reconstrói as arestas
    for (const aDado of dados.arestas) {
        const v1 = meshes[aDado.v1];
        const v2 = meshes[aDado.v2];

        if (!v1 || !v2) continue;

        const aresta = criar_cilindro(
            v1.position,
            v2.position,
            dados.direcionado,
            0
        );

        aresta.userData.v1 = v1;
        aresta.userData.v2 = v2;
        aresta.userData.peso = aDado.peso ?? 1;

        arestas.push(aresta);
        cena.add(aresta);

        posicionarLabelPeso(aresta, cena);

        if (aresta.userData.labelPeso) {
            aresta.userData.labelPeso.visible = dados.ponderado ?? false;
        }
    }

    atualizarVisuaisArestas(cena);
    atualizarHUD();
}   