
//@autor Marcelo Diehl - DITIC-DSUP
// Calculadora de Orçamento de Engenharia (Diagnósticos, Materiais com Instalação, etc.)

// 1. ESTADO E CONFIGURAÇÕES GLOBAIS
const OrcamentoState = {
  comarcas: [],
  lotes: [],
  grupos: [],
  loteAtual: null,
};

// Cor de destaque por grupo orçamentário (reaproveita a paleta de tiposServico do script.js)
const CORES_GRUPO = ["#5F8F95", "#5B7FA6", "#A39A8A", "#8C7AAE", "#4C7F6F", "#6F7C8F"];

function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-br", { style: "currency", currency: "BRL" });
}

// 2. CARREGAMENTO DE DADOS
// Dados vêm do back-end (Spring/JPA), mantendo o mesmo formato que era usado
// nos arquivos estáticos durante o desenvolvimento apenas em front-end.
async function carregarDadosOrcamento() {
  const [comarcas, lotes, grupos] = await Promise.all([
    fetch("/api/comarcas").then(r => r.json()),
    fetch("/api/lotes").then(r => r.json()),
    fetch("/api/itens-orcamento").then(r => r.json()),
  ]);

  OrcamentoState.comarcas = comarcas.sort((a, b) =>
    a.comarca === "Porto Alegre" ? -1 : a.comarca.localeCompare(b.comarca, "pt-br")
  );
  OrcamentoState.lotes = lotes;
  OrcamentoState.grupos = grupos;

  preencherSelectComarcas();
  renderizarGrupos();
}

// Busca os preços atuais no servidor e reaplica nas linhas já renderizadas, sem tocar nas quantidades digitadas
window.atualizarPrecosOrcamento = async function () {
  try {
    const grupos = await fetch("/api/itens-orcamento").then(r => r.json());
    OrcamentoState.grupos = grupos;

    grupos.forEach(g => g.subgrupos.forEach(sg => sg.itens.forEach(item => {
      const input = document.querySelector(`.linha-item[data-codigo="${item.codigo}"] .item-qtd`);
      if (input) input.dataset.precos = JSON.stringify(item.precos);
    })));

    recalcularTudo();
  } catch (e) {
    console.error("Não foi possível atualizar os preços:", e);
  }
};

function preencherSelectComarcas() {
  const sel = document.getElementById("orc-comarca");
  if (!sel) return;
  sel.innerHTML = '<option selected disabled>Selecione a Comarca</option>';
  OrcamentoState.comarcas.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.comarca;
    opt.textContent = c.comarca;
    opt.dataset.lote = c.lote;
    opt.dataset.regiao = c.regiao;
    sel.appendChild(opt);
  });
}

// 3. RENDERIZAÇÃO DOS GRUPOS/ITENS
function renderizarGrupos() {
  const container = document.getElementById("orc-lista-grupos");
  if (!container) return;

  container.innerHTML = OrcamentoState.grupos.map((grupo, idx) => {
    const cor = CORES_GRUPO[idx % CORES_GRUPO.length];
    const totalItensGrupo = grupo.subgrupos.reduce((acc, sg) => acc + sg.itens.length, 0);

    const subgruposHtml = grupo.subgrupos.map(sg => {
      const cabecalho = sg.virtual ? "" : `<div class="subgrupo-titulo">${sg.nome}</div>`;
      const itensHtml = sg.itens.map(item => criarLinhaItem(item)).join("");
      return `<div class="subgrupo-orcamento">
        ${cabecalho}
        <div class="linha-cabecalho-item">
          <span>Item</span><span>Descrição</span><span class="text-center">Un.</span>
          <span class="text-center">Qtd.</span><span class="text-end">Valor Unitário</span><span class="text-end">Valor Total</span>
        </div>
        ${itensHtml}
      </div>`;
    }).join("");

    return `<div class="accordion-item grupo-orcamento" style="--grupo-cor: ${cor}">
      <h2 class="accordion-header">
        <button class="accordion-button ${idx === 0 ? "" : "collapsed"}" type="button"
                data-bs-toggle="collapse" data-bs-target="#orc-grupo-${grupo.codigo}">
          <span class="titulo-grupo">${grupo.codigo} - ${grupo.nome}
            <span class="badge-qtd-grupo">${totalItensGrupo} itens</span>
          </span>
          <span class="subtotal-grupo" id="subtotal-grupo-${grupo.codigo}">Sub-total: R$ 0,00</span>
          <span class="toggle-simbolo"></span>
        </button>
      </h2>
      <div id="orc-grupo-${grupo.codigo}" class="accordion-collapse collapse ${idx === 0 ? "show" : ""}">
        <div class="accordion-body p-0">${subgruposHtml}</div>
      </div>
    </div>`;
  }).join("");
}

function criarLinhaItem(item) {
  const unidade = item.unidade || "-";
  const ehMetro = unidade.toUpperCase() === "M";
  const max = ehMetro ? "9999.99" : "9999";

  return `<div class="linha-item" data-codigo="${item.codigo}"
               data-descricao="${item.descricao.toLowerCase()}">
    <span class="item-codigo">${item.codigo}</span>
    <span class="item-descricao">${item.descricao}</span>
    <span class="item-unidade" data-unidade-padrao="${unidade}">${unidade}</span>
    <input type="text" inputmode="${ehMetro ? "decimal" : "numeric"}" autocomplete="off"
           maxlength="${ehMetro ? 7 : 4}" value="0"
           data-decimal="${ehMetro}" data-max="${max}"
           class="form-control form-control-sm item-qtd"
           data-precos='${JSON.stringify(item.precos)}'>
    <span class="item-valor-unit">-</span>
    <span class="item-valor-total">R$ 0,00</span>
  </div>`;
}

// 4. CÁLCULO DE VALORES
// Quantidade digitada (aceita vírgula ou ponto como separador decimal, só nos itens em metro)
function lerQuantidade(input) {
  return parseFloat(input.value.replace(",", ".")) || 0;
}

// UN/CJ (e demais): só inteiros de 0 a 9999. M: decimal com até 2 casas, de 0 a 9999,99.
function sanitizarQuantidade(input) {
  const ehDecimal = input.dataset.decimal === "true";
  const max = parseFloat(input.dataset.max);
  let v = input.value.replace(ehDecimal ? /[^\d.,]/g : /\D/g, "");

  if (ehDecimal) {
    const i = v.search(/[.,]/);
    if (i !== -1) {
      const separador = v[i];
      const inteira = v.slice(0, i).replace(/^0+(?=\d)/, "") || "0";
      const fracao = v.slice(i + 1).replace(/\D/g, "").slice(0, 2);
      v = inteira + separador + fracao;
    } else {
      v = v.replace(/^0+(?=\d)/, "");
    }
  } else {
    v = v.replace(/^0+(?=\d)/, "");
  }

  if (v !== "" && parseFloat(v.replace(",", ".")) > max) {
    v = String(max).replace(".", ",");
  }
  return v;
}

function obterPrecoValido(precos, lote) {
  const bruto = precos[lote - 1];
  const valor = parseFloat(bruto);
  return isNaN(valor) ? null : valor;
}

function recalcularTudo() {
  if (!OrcamentoState.loteAtual) return;
  const lote = OrcamentoState.loteAtual;
  let totalGeral = 0;

  document.querySelectorAll(".grupo-orcamento").forEach(grupoEl => {
    let subtotalGrupo = 0;

    grupoEl.querySelectorAll(".linha-item").forEach(linha => {
      const input = linha.querySelector(".item-qtd");
      const precos = JSON.parse(input.dataset.precos);
      const precoUnit = obterPrecoValido(precos, lote);
      const qtd = lerQuantidade(input);

      const spanUnit = linha.querySelector(".item-valor-unit");
      const spanTotal = linha.querySelector(".item-valor-total");
      const spanUnidade = linha.querySelector(".item-unidade");

      if (precoUnit === null) {
        linha.classList.add("indisponivel");
        input.disabled = true;
        spanUnit.textContent = "N/D";
        spanTotal.textContent = "-";
        spanUnidade.textContent = "N/A";
        return;
      }

      linha.classList.remove("indisponivel");
      input.disabled = false;
      spanUnidade.textContent = spanUnidade.dataset.unidadePadrao;
      const total = precoUnit * qtd;
      spanUnit.textContent = formatarMoeda(precoUnit);
      spanTotal.textContent = formatarMoeda(total);
      linha.classList.toggle("tem-valor", qtd > 0);

      subtotalGrupo += total;
      totalGeral += total;
    });

    const codigoGrupo = grupoEl.querySelector(".accordion-collapse").id.replace("orc-grupo-", "");
    const spanSubtotal = document.getElementById(`subtotal-grupo-${codigoGrupo}`);
    if (spanSubtotal) spanSubtotal.textContent = `Sub-total: ${formatarMoeda(subtotalGrupo)}`;
  });

  const out = document.getElementById("orc-valor-total");
  if (out) out.value = formatarMoeda(totalGeral);
}

// 5. SELEÇÃO DE COMARCA -> REGIÃO / LOTE / EMPRESA
function configurarSelecaoComarca() {
  const sel = document.getElementById("orc-comarca");
  if (!sel) return;

  sel.addEventListener("change", () => {
    const opt = sel.options[sel.selectedIndex];
    const lote = parseInt(opt.dataset.lote, 10);
    const regiao = opt.dataset.regiao;
    const infoLote = OrcamentoState.lotes.find(l => l.lote === lote);

    document.getElementById("orc-regiao").value = regiao || "";
    document.getElementById("orc-lote").value = infoLote ? `Lote ${infoLote.lote}` : "";
    document.getElementById("orc-empresa").value = infoLote ? infoLote.empresa : "";

    OrcamentoState.loteAtual = lote;
    recalcularTudo();
  });
}

// 6. LIMPEZA (acionada pelo botão no header sticky / navbar)
window.limparOrcamento = function () {
  const sel = document.getElementById("orc-comarca");
  if (!sel) return; // botão presente no header mas página de orçamento não está carregada

  sel.selectedIndex = 0; // volta para "Selecione a Comarca"
  document.getElementById("orc-regiao").value = "";
  document.getElementById("orc-lote").value = "";
  document.getElementById("orc-empresa").value = "";
  document.getElementById("orc-valor-total").value = "R$ 0,00";
  OrcamentoState.loteAtual = null;

  document.querySelectorAll(".linha-item").forEach(linha => {
    linha.classList.remove("indisponivel", "tem-valor");
    const input = linha.querySelector(".item-qtd");
    input.value = 0;
    input.disabled = false;
    const spanUnidade = linha.querySelector(".item-unidade");
    spanUnidade.textContent = spanUnidade.dataset.unidadePadrao;
    linha.querySelector(".item-valor-unit").textContent = "-";
    linha.querySelector(".item-valor-total").textContent = "R$ 0,00";
  });

  // limpa também o modal de geração de relatório
  const ticket = document.getElementById("rel-ticket");
  const tecnico = document.getElementById("rel-tecnico");
  const descricao = document.getElementById("rel-descricao");
  const contador = document.getElementById("rel-descricao-contador");
  if (ticket) ticket.value = "";
  if (tecnico) tecnico.value = "";
  if (descricao) descricao.value = "";
  if (contador) contador.textContent = "0/2000";
  document.querySelectorAll(".subtotal-grupo").forEach(s => (s.textContent = "Sub-total: R$ 0,00"));
};

// 7. EVENTOS DE INPUT (DELEGAÇÃO)
function configurarEventosQuantidade() {
  document.getElementById("orc-lista-grupos")?.addEventListener("input", e => {
    if (e.target.classList.contains("item-qtd")) {
      e.target.value = sanitizarQuantidade(e.target);
      recalcularTudo();
    }
  });

  // Setas ↑/↓ do teclado somam/subtraem 1 nos itens inteiros (UN, CJ); em metro (M) não se aplica
  document.getElementById("orc-lista-grupos")?.addEventListener("keydown", e => {
    if (!e.target.classList.contains("item-qtd") || e.target.dataset.decimal === "true") return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

    e.preventDefault();
    const passo = e.key === "ArrowUp" ? 1 : -1;
    const novo = Math.min(Math.max(lerQuantidade(e.target) + passo, 0), parseFloat(e.target.dataset.max));
    e.target.value = String(novo);
    e.target.select();
    recalcularTudo();
  });

  // Ao sair do campo: vazio vira 0 e separador solto no fim ("5,") é removido
  document.getElementById("orc-lista-grupos")?.addEventListener("focusout", e => {
    if (e.target.classList.contains("item-qtd")) {
      e.target.value = e.target.value.replace(/[.,]$/, "") || "0";
      recalcularTudo();
    }
  });

  // Seleciona todo o valor ao focar, para que digitar sempre substitua em vez de concatenar (ex.: "0" + "5" = "05")
  document.getElementById("orc-lista-grupos")?.addEventListener("focusin", e => {
    if (e.target.classList.contains("item-qtd")) {
      e.target.select();
    }
  });
}

// 9. TELA DE ADMINISTRAÇÃO DE PREÇOS (pós-login) — Item x Empresa/Lote
function renderizarTabelaAdmin() {
  const container = document.getElementById("admin-tabela-precos");
  if (!container) return;

  const lotes = OrcamentoState.lotes.length ? OrcamentoState.lotes : window.__DADOS_PREVIA__?.lotes || [];
  const grupos = OrcamentoState.grupos.length ? OrcamentoState.grupos : window.__DADOS_PREVIA__?.grupos || [];

  const colunasEmpresas = lotes.map(l =>
    `<th>${l.empresa}<small>Lote ${l.lote}</small></th>`
  ).join("");

  const linhas = grupos.map(grupo => {
    const linhaGrupo = `<tr class="linha-grupo-admin"><td colspan="${3 + lotes.length}">${grupo.codigo} - ${grupo.nome}</td></tr>`;

    const linhasSubgrupos = grupo.subgrupos.map(sg => {
      const linhaSub = sg.virtual ? "" :
        `<tr class="linha-subgrupo-admin"><td colspan="${3 + lotes.length}">${sg.nome}</td></tr>`;

      const linhasItens = sg.itens.map(item => {
        const colunasPrecos = lotes.map((l, i) => {
          const bruto = item.precos[i];
          const valor = parseFloat(bruto);
          const disponivel = !isNaN(valor);
          return `<td><input type="text" inputmode="decimal" pattern="^\\d+(\\.\\d{1,2})?$"
                        class="form-control form-control-sm preco-admin" ${disponivel ? "" : "disabled"}
                        placeholder="${disponivel ? "0.00" : "N/A"}"
                        value="${disponivel ? valor.toFixed(2) : ""}"
                        data-codigo="${item.codigo}" data-lote="${l.lote}"></td>`;
        }).join("");

        return `<tr>
          <td class="col-item-codigo">${item.codigo}</td>
          <td class="col-item-descricao">${item.descricao}</td>
          <td class="col-item-unidade">${item.unidade || "-"}</td>
          ${colunasPrecos}
        </tr>`;
      }).join("");

      return linhaSub + linhasItens;
    }).join("");

    return linhaGrupo + linhasSubgrupos;
  }).join("");

  container.innerHTML = `<div class="tabela-precos-admin-wrap">
    <table class="tabela-precos-admin">
      <thead>
        <tr>
          <th>Item</th>
          <th>Descrição</th>
          <th>Un.</th>
          ${colunasEmpresas}
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  </div>`;
}

window.restaurarValoresAdmin = renderizarTabelaAdmin;

window.limparFormularioAdmin = function () {
  document.querySelectorAll(".preco-admin").forEach(i => {
    if (!i.disabled) i.value = "";
  });
};

window.addEventListener("adminPrecosCarregado", renderizarTabelaAdmin);

// 8. INICIALIZAÇÃO
window.addEventListener("orcamentoCarregado", () => {
  carregarDadosOrcamento().then(() => {
    configurarSelecaoComarca();
    configurarEventosQuantidade();
    configurarModalRelatorio();
  });
});

// 8.1 RELATÓRIO EM PDF (gerado pelo modal aberto no ícone de impressão do header)
function configurarModalRelatorio() {
  const descricao = document.getElementById("rel-descricao");
  const contador = document.getElementById("rel-descricao-contador");
  if (descricao && contador) {
    descricao.addEventListener("input", () => {
      contador.textContent = `${descricao.value.length}/2000`;
    });
  }

  // Ticket: somente números (vale também para texto colado)
  document.getElementById("rel-ticket")?.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
}

function coletarItensSelecionadosParaRelatorio() {
  const grupos = [];
  document.querySelectorAll(".grupo-orcamento").forEach(grupoEl => {
    const tituloGrupo = grupoEl.querySelector(".titulo-grupo");
    const nomeGrupo = tituloGrupo ? tituloGrupo.textContent.replace(/\s+/g, " ").trim() : "";
    const itens = [];
    grupoEl.querySelectorAll(".linha-item.tem-valor").forEach(linha => {
      itens.push({
        codigo: linha.querySelector(".item-codigo").textContent.trim(),
        descricao: linha.querySelector(".item-descricao").textContent.trim(),
        unidade: linha.querySelector(".item-unidade").textContent.trim(),
        quantidade: lerQuantidade(linha.querySelector(".item-qtd")).toLocaleString("pt-br", { maximumFractionDigits: 2 }),
        valorUnit: linha.querySelector(".item-valor-unit").textContent.trim(),
        valorTotal: linha.querySelector(".item-valor-total").textContent.trim()
      });
    });
    if (itens.length) grupos.push({ grupo: nomeGrupo, itens });
  });
  return grupos;
}

window.gerarRelatorioPDF = function () {
  const gruposComItens = coletarItensSelecionadosParaRelatorio();
  if (gruposComItens.length === 0) {
    Swal.fire({
      icon: "info",
      title: "Nada para gerar",
      text: "Nenhum item selecionado no orçamento.",
      confirmButtonColor: "#474f5c"
    });
    return;
  }

  const ticket = document.getElementById("rel-ticket").value.trim();
  const tecnico = document.getElementById("rel-tecnico").value.trim();
  const descricao = document.getElementById("rel-descricao").value.trim();

  if (!window.jspdf) {
    Swal.fire({
      icon: "error",
      title: "Erro ao gerar PDF",
      text: "Não foi possível carregar o gerador de PDF. Tente novamente em instantes.",
      confirmButtonColor: "#474f5c"
    });
    return;
  }

  const comarcaSel = document.getElementById("orc-comarca");
  const comarca = comarcaSel.selectedOptions[0] ? comarcaSel.selectedOptions[0].textContent : "-";
  const regiao = document.getElementById("orc-regiao").value || "-";
  const lote = document.getElementById("orc-lote").value || "-";
  const empresa = document.getElementById("orc-empresa").value || "-";
  const valorOrcamento = document.getElementById("orc-valor-total").value || "-";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margem = 40;
  const largura = doc.internal.pageSize.getWidth();
  const MARCA_INSTITUCIONAL = "TJRS - DIPRED-DMAN";
  const CORE_PRIMARIA = [71, 79, 92];
  const CORE_TEXTO = [45, 50, 59];
  const CORE_MUTED = [130, 136, 145];

  function campo(label, valor, x, yy) {
    doc.setFont("helvetica", "bold");
    const labelTxt = `${label}: `;
    doc.text(labelTxt, x, yy);
    const larguraLabel = doc.getTextWidth(labelTxt);
    doc.setFont("helvetica", "normal");
    doc.text(String(valor), x + larguraLabel, yy);
  }

  // Faixa institucional no topo da página
  doc.setFillColor(...CORE_PRIMARIA);
  doc.rect(0, 0, largura, 6, "F");
  let y = 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...CORE_PRIMARIA);
  doc.text(MARCA_INSTITUCIONAL, margem, y);
  y += 8;
  doc.setDrawColor(...CORE_PRIMARIA);
  doc.setLineWidth(1.2);
  doc.line(margem, y, margem + 70, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...CORE_TEXTO);
  doc.text("Relatório de Medição e Orçamento", margem, y);
  y += 16;
  doc.setDrawColor(220);
  doc.setLineWidth(0.75);
  doc.line(margem, y, largura - margem, y);
  y += 22;

  doc.setFontSize(10);
  doc.setTextColor(...CORE_TEXTO);
  campo("Nº do Ticket", ticket || "-", margem, y);
  campo("Técnico Responsável", tecnico || "-", margem + 220, y);
  y += 18;

  campo("Comarca", comarca, margem, y);
  campo("Região", regiao, margem + 220, y);
  campo("Lote", lote, margem + 320, y);
  y += 16;

  campo("Empresa Contratada", empresa, margem, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORE_PRIMARIA);
  doc.text(`Valor Total do Orçamento: ${valorOrcamento}`, margem + 220, y);
  doc.setTextColor(...CORE_TEXTO);
  doc.setFont("helvetica", "normal");
  y += 18;

  if (descricao) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CORE_TEXTO);
    doc.text("Descrição do Atendimento:", margem, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    const linhas = doc.splitTextToSize(descricao, largura - margem * 2);
    doc.text(linhas, margem, y);
    y += linhas.length * 12 + 6;
  }

  y += 10;

  const corpoTabela = [];
  gruposComItens.forEach(g => {
    corpoTabela.push([{
      content: g.grupo,
      colSpan: 6,
      styles: { fillColor: [230, 232, 235], textColor: [71, 79, 92], fontStyle: "bold", halign: "left" }
    }]);
    g.itens.forEach(i => {
      corpoTabela.push([i.codigo, i.descricao, i.unidade, i.quantidade, i.valorUnit, i.valorTotal]);
    });
  });

  doc.autoTable({
    startY: y,
    margin: { left: margem, right: margem, bottom: 40 },
    head: [["Item", "Descrição", "Un.", "Qtd.", "Valor Unitário", "Valor Total"]],
    body: corpoTabela,
    styles: { fontSize: 8, cellPadding: 4, valign: "middle" },
    headStyles: { fillColor: [71, 79, 92], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 35, halign: "center" },
      4: { cellWidth: 70, halign: "right" },
      5: { cellWidth: 70, halign: "right" }
    },
    didDrawPage: () => {
      const dataStr = new Date().toLocaleDateString("pt-br");
      const alturaPagina = doc.internal.pageSize.getHeight();
      const yRodape = alturaPagina - 22;

      doc.setDrawColor(220);
      doc.setLineWidth(0.75);
      doc.line(margem, yRodape - 12, largura - margem, yRodape - 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...CORE_PRIMARIA);
      doc.text(MARCA_INSTITUCIONAL, margem, yRodape);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...CORE_MUTED);
      doc.text(dataStr, largura - margem, yRodape, { align: "right" });
    }
  });

  const nomeArquivo = ticket
    ? `Relatório de Medição e Orçamento - Ticket ${ticket}.pdf`
    : "Relatório de Medição e Orçamento.pdf";
  doc.save(nomeArquivo);

  const modalEl = document.getElementById("modalRelatorio");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
};


// 10. EASTER EGG (oculto - não é um recurso documentado do sistema)
//@autor Marcelo Diehl - DITIC-DSUP
// EASTER EGG: 3 cliques no nome do autor (créditos) abrem um mini "Asteroids"

(function () {
  let cliques = [];

  window.registrarCliqueEasterEgg = function () {
    const agora = Date.now();
    cliques.push(agora);
    cliques = cliques.filter(t => agora - t < 1500);
    if (cliques.length >= 3) {
      cliques = [];
      window.abrirEasterEggAsteroids();
    }
  };

  window.abrirEasterEggAsteroids = function () {
    if (document.getElementById("easter-egg-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "easter-egg-overlay";
    overlay.innerHTML = `
      <div class="easter-egg-caixa">
        <div class="easter-egg-topo">
          <span>☄️ Asteroides do DIPRED-DMAN</span>
          <button type="button" id="easter-egg-fechar" aria-label="Fechar">&times;</button>
        </div>
        <div class="easter-egg-placar">
          <span>Pontos: <b id="easter-egg-pontos">0</b></span>
          <span id="easter-egg-vidas">Vidas: ❤️❤️❤️</span>
        </div>
        <canvas id="easter-egg-canvas" width="400" height="320"></canvas>
        <p class="easter-egg-instrucoes">← → gira · ↑ propulsiona · espaço atira · esc sai</p>
        <div id="easter-egg-fim" class="easter-egg-fim d-none">
          <p id="easter-egg-fim-texto"></p>
          <button type="button" id="easter-egg-reiniciar" class="btn btn-secondary btn-sm">Jogar de novo</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById("easter-egg-fechar").onclick = fecharJogo;
    document.getElementById("easter-egg-reiniciar").onclick = () => iniciarJogo();

    const canvas = document.getElementById("easter-egg-canvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    const TURN = 0.06, THRUST = 0.12, ATRITO = 0.988, VEL_TIRO = 5.5, COOLDOWN_TIRO = 260;

    let nave, tiros, asteroides, pontos, vidas, nivel, teclas, rodando, animId, ultimoTiro, invulneravelAte;

    function novaNave() {
      return { x: W / 2, y: H / 2, ang: -Math.PI / 2, vx: 0, vy: 0, r: 10 };
    }

    function criarAsteroide(x, y, raio) {
      const velocidade = 0.6 + Math.random() * 0.8;
      const dir = Math.random() * Math.PI * 2;
      const pontosForma = [];
      const nVert = 8 + Math.floor(Math.random() * 4);
      for (let i = 0; i < nVert; i++) {
        pontosForma.push(0.75 + Math.random() * 0.5);
      }
      return {
        x, y, r: raio,
        vx: Math.cos(dir) * velocidade,
        vy: Math.sin(dir) * velocidade,
        forma: pontosForma,
        rot: Math.random() * Math.PI * 2,
        velRot: (Math.random() - 0.5) * 0.02
      };
    }

    function novaOnda() {
      const qtd = 3 + nivel;
      asteroides = [];
      for (let i = 0; i < qtd; i++) {
        let x, y;
        do {
          x = Math.random() * W;
          y = Math.random() * H;
        } while (Math.hypot(x - nave.x, y - nave.y) < 80);
        asteroides.push(criarAsteroide(x, y, 30));
      }
    }

    function iniciarJogo() {
      pontos = 0;
      vidas = 3;
      nivel = 1;
      teclas = {};
      rodando = true;
      ultimoTiro = 0;
      invulneravelAte = Date.now() + 1500;
      nave = novaNave();
      tiros = [];
      atualizarPlacar();
      document.getElementById("easter-egg-fim").classList.add("d-none");
      novaOnda();
      if (animId) cancelAnimationFrame(animId);
      loop();
    }

    function atualizarPlacar() {
      document.getElementById("easter-egg-pontos").textContent = pontos;
      document.getElementById("easter-egg-vidas").textContent = "Vidas: " + "❤️".repeat(Math.max(vidas, 0));
    }

    function envolver(o) {
      if (o.x < -o.r) o.x = W + o.r;
      if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r;
      if (o.y > H + o.r) o.y = -o.r;
    }

    function desenharNave() {
      const piscando = Date.now() < invulneravelAte && Math.floor(Date.now() / 100) % 2 === 0;
      if (piscando) return;
      ctx.save();
      ctx.translate(nave.x, nave.y);
      ctx.rotate(nave.ang);
      ctx.strokeStyle = "#e8e8e8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-9, 7);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-9, -7);
      ctx.closePath();
      ctx.stroke();
      if (teclas["ArrowUp"] || teclas["w"]) {
        ctx.strokeStyle = "#A35B5B";
        ctx.beginPath();
        ctx.moveTo(-5, 3);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-5, -3);
        ctx.stroke();
      }
      ctx.restore();
    }

    function desenharAsteroide(a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.strokeStyle = "#5F8F95";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const n = a.forma.length;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        const raio = a.r * a.forma[i];
        const px = Math.cos(ang) * raio, py = Math.sin(ang) * raio;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function loop() {
      if (!rodando) return;
      ctx.clearRect(0, 0, W, H);

      if (teclas["ArrowLeft"] || teclas["a"]) nave.ang -= TURN;
      if (teclas["ArrowRight"] || teclas["d"]) nave.ang += TURN;
      if (teclas["ArrowUp"] || teclas["w"]) {
        nave.vx += Math.cos(nave.ang) * THRUST;
        nave.vy += Math.sin(nave.ang) * THRUST;
      }
      nave.vx *= ATRITO; nave.vy *= ATRITO;
      nave.x += nave.vx; nave.y += nave.vy;
      envolver(nave);
      desenharNave();

      ctx.fillStyle = "#5B7FA6";
      tiros.forEach(t => {
        t.x += t.vx; t.y += t.vy; t.vida--;
        envolver(t);
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      tiros = tiros.filter(t => t.vida > 0);

      asteroides.forEach(a => {
        a.x += a.vx; a.y += a.vy; a.rot += a.velRot;
        envolver(a);
        desenharAsteroide(a);
      });

      // colisão tiro x asteroide
      const novosAsteroides = [];
      asteroides.forEach(a => {
        let atingido = null;
        for (const t of tiros) {
          if (Math.hypot(t.x - a.x, t.y - a.y) < a.r) { atingido = t; break; }
        }
        if (atingido) {
          atingido.vida = 0;
          pontos += a.r >= 30 ? 20 : a.r >= 16 ? 50 : 100;
          atualizarPlacar();
          if (a.r >= 16) {
            novosAsteroides.push(criarAsteroide(a.x, a.y, a.r / 2));
            novosAsteroides.push(criarAsteroide(a.x, a.y, a.r / 2));
          }
        } else {
          novosAsteroides.push(a);
        }
      });
      asteroides = novosAsteroides;
      tiros = tiros.filter(t => t.vida > 0);

      // colisão nave x asteroide
      if (Date.now() > invulneravelAte) {
        for (const a of asteroides) {
          if (Math.hypot(nave.x - a.x, nave.y - a.y) < a.r + nave.r * 0.6) {
            vidas--;
            atualizarPlacar();
            if (vidas <= 0) return fimDeJogo();
            nave = novaNave();
            invulneravelAte = Date.now() + 1500;
            break;
          }
        }
      }

      if (asteroides.length === 0) {
        nivel++;
        novaOnda();
      }

      animId = requestAnimationFrame(loop);
    }

    function atirar() {
      const agora = Date.now();
      if (agora - ultimoTiro < COOLDOWN_TIRO) return;
      ultimoTiro = agora;
      tiros.push({
        x: nave.x + Math.cos(nave.ang) * 12,
        y: nave.y + Math.sin(nave.ang) * 12,
        vx: Math.cos(nave.ang) * VEL_TIRO + nave.vx,
        vy: Math.sin(nave.ang) * VEL_TIRO + nave.vy,
        vida: 55
      });
    }

    function fimDeJogo() {
      rodando = false;
      document.getElementById("easter-egg-fim").classList.remove("d-none");
      document.getElementById("easter-egg-fim-texto").textContent = `Fim de jogo. Pontuação: ${pontos} (onda ${nivel})`;
    }

    function teclaBaixo(e) {
      teclas[e.key] = true;
      if (e.key === " ") { e.preventDefault(); if (rodando) atirar(); }
      if (e.key === "Escape") fecharJogo();
    }
    function teclaCima(e) { teclas[e.key] = false; }

    document.addEventListener("keydown", teclaBaixo);
    document.addEventListener("keyup", teclaCima);

    function fecharJogo() {
      rodando = false;
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener("keydown", teclaBaixo);
      document.removeEventListener("keyup", teclaCima);
      overlay.remove();
    }

    iniciarJogo();
  };
})();
