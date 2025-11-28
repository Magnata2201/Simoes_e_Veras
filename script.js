document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES GERAIS ---
    const vendaForm = document.getElementById('vendaForm');
    const dateInput = document.getElementById('dateInput');
    const clearDateBtn = document.getElementById('clearDateBtn');
    const exporTotalBtn = document.getElementById('exporTotalBtn');
    const totalVendasDisplay = document.getElementById('totalVendas');
    const valorTotalElement = document.getElementById('valorTotal');
    const totalTitle = document.getElementById('totalTitle');
    const backupBtn = document.getElementById('backupBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const restoreFile = document.getElementById('restoreFile');
    
    // --- CAMPOS DE VENDA ---
    const produtoInput = document.getElementById('produto'); 
    const listaProdutosDataList = document.getElementById('listaProdutos'); 
    const tipoVendaSelect = document.getElementById('tipo_venda'); 
    const precoUnitarioInput = document.getElementById('preco_unitario'); 
    const quantidadeInput = document.getElementById('quantidade'); 
    const valorTotalDisplay = document.getElementById('valor_total_display'); 
    const formaPagamentoSelect = document.getElementById('forma_pagamento'); 
    
    // --- MODAIS E BOTÕES DE VENDA ---
    const pagosModal = document.getElementById('pagosModal');
    const pendentesModal = document.getElementById('pendentesModal');
    const openPagosModalBtn = document.getElementById('openPagosModalBtn');
    const openPendentesModalBtn = document.getElementById('openPendentesModalBtn');

    // --- MODAL E BOTÕES DE GASTOS ---
    const gastoModal = document.getElementById('gastoModal');
    const openGastoModalBtn = document.getElementById('openGastoModalBtn'); 
    const gastoForm = document.getElementById('gastoForm');
    const gastosLista = document.getElementById('gastosLista');
    const valorTotalGastosElement = document.getElementById('valorTotalGastos');
    const gastoDateDisplay = document.getElementById('gastoDateDisplay');

    // --- NOVOS SELETORES (ESTOQUE) ---
    const estoqueModal = document.getElementById('estoqueModal');
    const openEstoqueModalBtn = document.getElementById('openEstoqueModalBtn');
    const estoqueForm = document.getElementById('estoqueForm');
    const listaEstoqueContainer = document.getElementById('listaEstoqueContainer');
    const searchEstoque = document.getElementById('searchEstoque');
    const dataProdutoEstoque = document.getElementById('dataProdutoEstoque');
    const fornecedorEstoque = document.getElementById('fornecedorEstoque'); 
    

    // FILTROS MODAIS
    const pagosSearchInput = document.getElementById('pagosSearchInput');
    const pagosDateInput = document.getElementById('pagosDateInput');
    const pagosClearDateBtn = document.getElementById('pagosClearDateBtn');
    const cuponsPagosModalContainer = document.getElementById('cuponsPagosModalContainer');
    const pendentesSearchInput = document.getElementById('pendentesSearchInput');
    const pendentesDateInput = document.getElementById('pendentesDateInput');
    const pendentesClearDateBtn = document.getElementById('pendentesClearDateBtn');
    const cuponsPendentesModalContainer = document.getElementById('cuponsPendentesModalContainer');
    
    // --- GERENCIAMENTO DE DADOS (localStorage) ---
    const getCupons = () => JSON.parse(localStorage.getItem('cupons')) || [];
    const salvarCupons = (cupons) => localStorage.setItem('cupons', JSON.stringify(cupons));
    const getGastos = () => JSON.parse(localStorage.getItem('gastos')) || [];
    const salvarGastos = (gastos) => localStorage.setItem('gastos', JSON.stringify(gastos));
    // O array produtos armazena TODAS as entradas de estoque (ID, nome e fornecedor)
    const getProdutos = () => JSON.parse(localStorage.getItem('produtos')) || [];
    const salvarProdutos = (produtos) => localStorage.setItem('produtos', JSON.stringify(produtos));
    
    const getISODate = (date) => date.toISOString().split('T')[0];

    // --- LÓGICA DE VENDAS E CÁLCULOS ---
    const calcularTotal = () => {
        const precoUnitario = parseFloat(precoUnitarioInput.value) || 0;
        const quantidade = parseFloat(quantidadeInput.value) || 0;
        const total = precoUnitario * quantidade;
        valorTotalDisplay.value = total.toFixed(2).replace('.', ',');
        document.getElementById('valor').value = total.toFixed(2);
    };

    const updateVendaLabels = () => {
        const tipo = tipoVendaSelect.value;
        let precoLabel = 'R$/Kg';
        let qtdLabel = 'Peso (Kg)';

        switch(tipo) {
            case 'caixa':
                precoLabel = 'R$/Cx';
                qtdLabel = 'Caixas';
                break;
            case 'unidade':
                precoLabel = 'R$/Pç';
                qtdLabel = 'Unidades (Pç)';
                break;
        }

        document.querySelector('label[for="preco_unitario"]').textContent = `Preço (${precoLabel}):`;
        precoUnitarioInput.placeholder = precoLabel;
        document.querySelector('label[for="quantidade"]').textContent = `Quantidade (${qtdLabel}):`;
        quantidadeInput.placeholder = qtdLabel;

        calcularTotal();
    };

    // FUNÇÃO ATUALIZADA: Soma o estoque total de um produto para exibição no datalist
    const updateProdutosDatalist = () => {
        const produtos = getProdutos();
        listaProdutosDataList.innerHTML = '';
        
        // 1. Agrupar por nome para somar o estoque total
        const totaisAgrupados = produtos.reduce((acc, prod) => {
            if (!acc[prod.nome]) {
                acc[prod.nome] = { totalQtd: 0, tipo: prod.tipo };
            }
            acc[prod.nome].totalQtd += parseFloat(prod.quantidade);
            // Usa o último tipo cadastrado para a label
            acc[prod.nome].tipo = prod.tipo; 
            return acc;
        }, {});
        
        // 2. Criar as options do datalist com o total
        Object.keys(totaisAgrupados).forEach(nome => {
            const prod = totaisAgrupados[nome];
            const option = document.createElement('option');
            option.value = nome;
            const tipoLabel = prod.tipo === 'peso' ? 'Kg' : prod.tipo === 'caixa' ? 'Cx' : 'Un';
            option.label = `Disp: ${prod.totalQtd.toFixed(2)} ${tipoLabel}`; 
            listaProdutosDataList.appendChild(option);
        });
    };

    // Preenchimento automático ao selecionar produto
    produtoInput.addEventListener('change', () => {
        const nomeDigitado = produtoInput.value.trim().toLowerCase();
        const produtos = getProdutos();
        // Encontra a primeira (ou qualquer) entrada para pegar o tipo
        const produtoEncontrado = produtos.find(p => p.nome.toLowerCase() === nomeDigitado); 
        
        if (produtoEncontrado) {
            tipoVendaSelect.value = produtoEncontrado.tipo;
            updateVendaLabels();
        }
    });

    const renderizarTotais = (filterDate = getISODate(new Date())) => {
        const cupons = getCupons();
        const cuponsFiltrados = cupons.filter(cupom => {
            if (!cupom.isoDate) return false;
            return getISODate(new Date(cupom.isoDate)) === filterDate;
        });

        renderizarGastos(filterDate); 
        atualizarTotalVendas(cuponsFiltrados, filterDate);
        dateInput.value = filterDate;
    };

    // --- LÓGICA DE ESTOQUE (CADASTRO E VISUALIZAÇÃO) ---
    // FUNÇÃO ATUALIZADA: Agrupa por produto e lista entradas individuais com fornecedor e quantidade atual
    const renderizarEstoque = () => {
        listaEstoqueContainer.innerHTML = '';
        const termo = searchEstoque.value.toLowerCase();
        let produtos = getProdutos();
        
        // Ordena por nome e depois por data de entrada (do mais novo para o mais antigo)
        produtos.sort((a, b) => {
            const nomeCompare = a.nome.localeCompare(b.nome);
            if (nomeCompare !== 0) return nomeCompare;
            // Ordena do mais novo para o mais antigo para melhor visualização
            return new Date(b.dataEntrada) - new Date(a.dataEntrada); 
        });

        // Filtra pelo nome ou fornecedor
        const produtosFiltrados = produtos.filter(p => 
            p.nome.toLowerCase().includes(termo) || p.fornecedor.toLowerCase().includes(termo)
        );

        if(produtosFiltrados.length === 0) {
            listaEstoqueContainer.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">Nenhum produto encontrado.</p>';
            return;
        }

        // 1. Agrupar para calcular o total por produto
        const totaisPorProduto = produtosFiltrados.reduce((acc, prod) => {
            if (!acc[prod.nome]) {
                acc[prod.nome] = { totalQtd: 0, tipo: prod.tipo };
            }
            acc[prod.nome].totalQtd += parseFloat(prod.quantidade);
            return acc;
        }, {});
        
        let ultimoNome = '';

        produtosFiltrados.forEach(prod => {
            const div = document.createElement('div');
            div.className = 'estoque-item';
            
            const quantidadeAtual = parseFloat(prod.quantidade);
            let badgeClass = 'badge-estoque';
            if(quantidadeAtual <= 0) badgeClass += ' zerado';
            else if(quantidadeAtual < 10 && prod.tipo !== 'caixa') badgeClass += ' baixo'; 
            else if(quantidadeAtual < 3 && prod.tipo === 'caixa') badgeClass += ' baixo';


            let dataFormatada = '-';
            if(prod.dataEntrada) {
                const parts = prod.dataEntrada.split('-'); 
                if(parts.length === 3) dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            
            const tipoLabel = prod.tipo === 'peso' ? 'Kg' : prod.tipo === 'caixa' ? 'Cx' : 'Un';
            
            let headerHTML = '';
            // Exibe o cabeçalho do produto com o TOTAL
            if (prod.nome !== ultimoNome) { 
                const total = totaisPorProduto[prod.nome];
                const totalLabel = total.tipo === 'peso' ? 'Kg' : total.tipo === 'caixa' ? 'Cx' : 'Un';
                headerHTML = `
                    <div class="estoque-total-header">
                        <strong>${prod.nome}</strong> 
                        <span class="total-badge-estoque">TOTAL: ${total.totalQtd.toFixed(2)} ${totalLabel}</span>
                    </div>
                `;
                ultimoNome = prod.nome;
            }

            // A linha de estoque individual (Fornecedor e Qtd Atual)
            div.innerHTML = `
                ${headerHTML}
                <div class="estoque-info" data-id="${prod.id}">
                    <div class="estoque-details">
                        <span>${prod.fornecedor}</span>
                        <span>Entrada: ${dataFormatada}</span>
                    </div>
                    <div style="text-align:right; display:flex; align-items:center;">
                        <span class="${badgeClass}">${quantidadeAtual.toFixed(2)} ${tipoLabel}</span>
                        <button class="btn-delete-estoque" data-id="${prod.id}" title="Excluir Entrada"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            listaEstoqueContainer.appendChild(div);
        });

        document.querySelectorAll('.btn-delete-estoque').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Deleta pelo ID único, e não pelo nome
                const id = e.currentTarget.getAttribute('data-id'); 
                const produtoNome = produtos.find(p => p.id === id)?.nome || 'esta entrada';
                if(confirm(`Deseja excluir a entrada de estoque de "${produtoNome}"?`)) {
                    const novosProdutos = getProdutos().filter(p => p.id !== id); // Filtra por ID
                    salvarProdutos(novosProdutos);
                    renderizarEstoque();
                    updateProdutosDatalist();
                }
            });
        });
    };

    // FUNÇÃO ATUALIZADA: Cria uma nova entrada de estoque para cada submissão, registrando o fornecedor.
    estoqueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nomeProdutoEstoque').value.trim();
        const fornecedor = document.getElementById('fornecedorEstoque').value.trim(); 
        const qtd = parseFloat(document.getElementById('qtdProdutoEstoque').value);
        const tipo = document.getElementById('tipoProdutoEstoque').value;
        const data = document.getElementById('dataProdutoEstoque').value;

        if(!nome || !fornecedor || isNaN(qtd) || qtd <= 0) { 
            alert('Por favor, preencha todos os campos obrigatórios corretamente e adicione uma quantidade maior que zero.');
            return;
        }

        let produtos = getProdutos();

        // Novo produto/entrada de estoque
        produtos.push({
            id: 'ESTOQUE-' + Date.now(), // Adiciona um ID único para permitir múltiplas entradas
            nome: nome,
            fornecedor: fornecedor, 
            quantidade: qtd,
            tipo: tipo,
            dataEntrada: data
        });

        salvarProdutos(produtos);
        renderizarEstoque();
        updateProdutosDatalist();
        estoqueForm.reset();
        document.getElementById('dataProdutoEstoque').value = getISODate(new Date());
        alert(`Entrada de estoque de "${nome}" (Fornecedor: ${fornecedor}) adicionada!`);
    });

    searchEstoque.addEventListener('input', renderizarEstoque);

    // --- AÇÕES DE CUPOM ---
    const handleCupomAction = (e) => {
        const target = e.target;
        const cupomId = target.getAttribute('data-id');
        if (!cupomId) return;

        if (target.classList.contains('btn-quitar')) {
            quitarCupom(cupomId);
        } else if (target.classList.contains('btn-delete')) {
            if (confirm(`Tem certeza que deseja apagar o cupom ${cupomId}? A quantidade NÃO retornará ao estoque automaticamente.`)) {
                let cupons = getCupons();
                cupons = cupons.filter(cupom => cupom.id !== cupomId);
                salvarCupons(cupons);
                
                const cupom = getCupons().find(c => c.id === cupomId) || {status: target.closest('[data-status]').getAttribute('data-status')};
                const currentStatus = cupom.status === 'aprazo' ? 'aprazo' : 'pago';
                
                if (currentStatus === 'aprazo' && pendentesModal.style.display === 'flex') applyPendentesFilters();
                else if ((currentStatus === 'avista' || currentStatus === 'pago') && pagosModal.style.display === 'flex') applyPagosFilters();
                
                renderizarTotais(dateInput.value);
            }
        } else if (target.classList.contains('btn-print')) {
            prepararEImprimirCupom(cupomId);
        } else if (target.classList.contains('btn-download')) {
            baixarCupomComoPDF(cupomId);
        }
    };

    const renderizarCuponsModal = (status, container, searchInput, dateInput, isAllDates = false) => {
        container.innerHTML = '<p style="text-align: center; margin-top: 30px;">Carregando cupons...</p>';
        const cupons = getCupons();
        const termoBusca = searchInput.value.toUpperCase().trim();
        const filterDate = dateInput.value;

        const cuponsFiltrados = cupons.filter(cupom => {
            const statusMatch = status === 'aprazo' ? cupom.status === 'aprazo' : (cupom.status === 'avista' || cupom.status === 'pago');
            if (!statusMatch) return false;
            if (!isAllDates && filterDate) {
                if (!cupom.isoDate) return false;
                if (getISODate(new Date(cupom.isoDate)) !== filterDate) return false;
            }
            const idCupom = cupom.id.toUpperCase();
            const cliente = cupom.cliente.toUpperCase();
            const produto = cupom.produto.toUpperCase();
            const motoristaPlaca = (cupom.motorista?.toUpperCase() || '') + (cupom.placa?.toUpperCase() || '');
            return idCupom.includes(termoBusca) || cliente.includes(termoBusca) || produto.includes(termoBusca) || motoristaPlaca.includes(termoBusca);
        });

        cuponsFiltrados.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
        container.innerHTML = '';

        if (cuponsFiltrados.length === 0) {
            container.innerHTML = `<p style="text-align: center; margin-top: 30px;">Nenhum cupom encontrado.</p>`;
            return;
        }

        cuponsFiltrados.forEach(cupom => {
            const cupomCard = document.createElement('div');
            cupomCard.className = 'cupom-card';
            cupomCard.setAttribute('data-id', cupom.id);
            cupomCard.setAttribute('data-status', cupom.status); 
            
            const tipoLabel = cupom.tipo_label || 'Kg';
            const statusDisplay = cupom.status === 'aprazo' ? 
                `<span style="color:var(--danger-color);">A PRAZO (PENDENTE)</span>` : 
                `<span style="color:var(--success-color);">PAGO</span>`;
            
            let acoesHTML = `
                <button class="btn-action btn-print" data-id="${cupom.id}">Reimprimir</button>
                <button class="btn-action btn-download" data-id="${cupom.id}">Baixar</button>
            `;
            if (cupom.status === 'aprazo') acoesHTML += `<button class="btn-action btn-success btn-quitar" data-id="${cupom.id}">QUITAR</button>`;
            
            let extraInfoHTML = '';
            if (cupom.motorista || cupom.placa) {
                extraInfoHTML = `<div class="cupom-extra-info"><p><strong>Motorista:</strong> ${cupom.motorista || 'N/A'} | <strong>Placa:</strong> ${cupom.placa || 'N/A'}</p></div>`;
            }
            
            cupomCard.innerHTML = `
                <div class="cupom-info">
                    <p><strong>ID:</strong> <span>${cupom.id}</span></p>
                    <p><strong>Cliente:</strong> <span>${cupom.cliente}</span></p>
                    <p><strong>Status:</strong> ${statusDisplay}</p>
                    <p><strong>Produto:</strong> <span>${cupom.produto}</span></p>
                    <p><strong>Preço/Item:</strong> <span>R$ ${Number(cupom.preco_unitario || 0).toFixed(2).replace('.', ',')} / ${tipoLabel}</span></p>
                    <p><strong>Quantidade:</strong> <span>${Number(cupom.quantidade || 0).toFixed(2).replace('.', ',')} ${tipoLabel}</span></p>
                    <p><strong>Valor Total:</strong> <span>R$ ${Number(cupom.valor || 0).toFixed(2).replace('.', ',')}</span></p>
                    <p><small>${cupom.data}</small></p>
                </div>
                <div class="cupom-actions">
                    ${acoesHTML}
                    <button class="btn-action btn-delete" data-id="${cupom.id}">Apagar</button>
                </div>
                ${extraInfoHTML}
            `;
            container.appendChild(cupomCard);
        });
        container.querySelectorAll('.btn-action').forEach(btn => {
            btn.removeEventListener('click', handleCupomAction); 
            btn.addEventListener('click', handleCupomAction);    
        });
    };

    const quitarCupom = (id) => {
        let cupons = getCupons();
        const cupomIndex = cupons.findIndex(c => c.id === id);
        if (cupomIndex > -1) {
            if (confirm(`Tem certeza que deseja marcar o cupom ${id} como PAGO/QUITADO?`)) {
                cupons[cupomIndex].status = 'pago'; 
                salvarCupons(cupons);
                renderizarTotais(dateInput.value); 
                if (pendentesModal.style.display === 'flex') applyPendentesFilters(); 
                if (pagosModal.style.display === 'flex') applyPagosFilters(); 
                alert(`Cupom ${id} quitado e marcado como PAGO!`);
            }
        } else {
            alert("Cupom não encontrado!");
        }
    };
    
    const renderizarGastos = (filterDate) => {
        gastosLista.innerHTML = '';
        const gastos = getGastos();
        
        const gastosFiltrados = gastos.filter(gasto => {
            if (!gasto.isoDate) return false;
            return getISODate(new Date(gasto.isoDate)) === filterDate;
        });

        const totalGastos = gastosFiltrados.reduce((acc, gasto) => acc + (parseFloat(gasto.valor) || 0), 0);
        valorTotalGastosElement.textContent = `R$ ${totalGastos.toFixed(2).replace('.', ',')}`;
        
        const [ano, mes, dia] = filterDate.split('-');
        gastoDateDisplay.textContent = `${dia}/${mes}/${ano}`;

        if (gastosFiltrados.length === 0) {
            gastosLista.innerHTML = '<p>Nenhuma despesa registrada neste dia.</p>';
            return;
        }

        gastosFiltrados.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
        gastosFiltrados.forEach(gasto => {
            const gastoItem = document.createElement('div');
            gastoItem.className = 'gasto-item';
            gastoItem.innerHTML = `
                <p><strong>${gasto.descricao}</strong>: R$ ${Number(gasto.valor).toFixed(2).replace('.', ',')}</p>
                <button class="btn-action btn-delete-gasto" data-id="${gasto.id}">Apagar</button>
            `;
            gastosLista.appendChild(gastoItem);
        });
    };

    const atualizarTotalVendas = (cuponsFiltrados, filterDate) => {
        const cuponsPagos = cuponsFiltrados.filter(c => c.status !== 'aprazo');
        const totalBruto = cuponsPagos.reduce((acc, cupom) => acc + (parseFloat(cupom.valor) || 0), 0);
        
        const gastos = getGastos();
        const gastosDoDia = gastos.filter(gasto => {
            if (!gasto.isoDate) return false;
            return getISODate(new Date(gasto.isoDate)) === filterDate;
        });
        const totalGastos = gastosDoDia.reduce((acc, gasto) => acc + (parseFloat(gasto.valor) || 0), 0);
        const lucroLiquido = totalBruto - totalGastos;
        const totalAReceber = cuponsFiltrados
            .filter(c => c.status === 'aprazo')
            .reduce((acc, cupom) => acc + (parseFloat(cupom.valor) || 0), 0);
        
        valorTotalElement.innerHTML = `
            <p>Bruto (Vendas Pagas): <strong>R$ ${totalBruto.toFixed(2).replace('.', ',')}</strong></p>
            <p style="color: var(--danger-color);">Despesas: <strong>R$ ${totalGastos.toFixed(2).replace('.', ',')}</strong></p>
            <hr>
            <p>Líquido (Lucro): <strong style="font-size: 1.2rem; color: ${lucroLiquido >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">R$ ${lucroLiquido.toFixed(2).replace('.', ',')}</strong></p>
            <hr>
            <p style="color: var(--primary-color);">A Receber (A Prazo): <strong>R$ ${totalAReceber.toFixed(2).replace('.', ',')}</strong></p>
        `;

        const hoje = getISODate(new Date());
        if (filterDate === hoje) totalTitle.textContent = 'Total do Dia (Lucro Líquido)';
        else {
            const [ano, mes, dia] = filterDate.split('-');
            totalTitle.textContent = `Total (${dia}/${mes}/${ano})`;
        }
    };
    
    // --- SUBMISSÃO DE VENDA (TRAVA SE SEM ESTOQUE) ---
    vendaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const now = new Date();
        
        const nomeProduto = document.getElementById('produto').value.trim();
        const qtdVendida = parseFloat(document.getElementById('quantidade').value) || 0;
        const tipoVenda = document.getElementById('tipo_venda').value;
        const tipoLabel = tipoVenda === 'peso' ? 'Kg' : tipoVenda === 'caixa' ? 'Caixa' : 'Unidade';
        
        // 1. Lógica de Abatimento do Estoque (RIGOROSA - FIFO)
        let produtos = getProdutos();
        // Encontra todas as entradas de estoque para o produto vendido
        const estoqueProduto = produtos.filter(p => p.nome.toLowerCase() === nomeProduto.toLowerCase());

        // SE O PRODUTO NÃO EXISTE
        if (estoqueProduto.length === 0) {
            alert(`ERRO: O produto "${nomeProduto}" não está cadastrado no estoque! Cadastre-o antes de vender.`);
            return; // TRAVA A VENDA
        }

        // Soma o estoque total disponível
        const estoqueTotal = estoqueProduto.reduce((sum, item) => sum + parseFloat(item.quantidade), 0);
        
        // SE A QUANTIDADE FOR INSUFICIENTE
        if (estoqueTotal < qtdVendida) {
            alert(`ERRO: Estoque insuficiente para "${nomeProduto}"! Disponível: ${estoqueTotal.toFixed(2)}. Tentativa de venda: ${qtdVendida.toFixed(2)}.`);
            return; // TRAVA A VENDA
        }

        // SE PASSOU, ABATE DO ESTOQUE, priorizando abater das entradas mais antigas (FIFO - First In, First Out)
        let restanteParaAbater = qtdVendida;

        // Ordena as entradas por data, do mais antigo para o mais novo
        const entradasOrdenadas = estoqueProduto.sort((a, b) => new Date(a.dataEntrada) - new Date(b.dataEntrada));

        for (const entrada of entradasOrdenadas) {
            if (restanteParaAbater <= 0) break;
            
            const estoqueDisponivelNaEntrada = parseFloat(entrada.quantidade);
            // Encontra o índice da entrada original no array `produtos` para modificação
            const index = produtos.findIndex(p => p.id === entrada.id); 

            if (index === -1) continue; 

            if (estoqueDisponivelNaEntrada >= restanteParaAbater) {
                // Abate o restante e termina
                produtos[index].quantidade = estoqueDisponivelNaEntrada - restanteParaAbater;
                restanteParaAbater = 0;
            } else {
                // Zera o estoque desta entrada e continua para a próxima
                produtos[index].quantidade = 0;
                restanteParaAbater -= estoqueDisponivelNaEntrada;
            }
        }

        salvarProdutos(produtos);
        renderizarEstoque(); // Atualiza a visualização do estoque
        updateProdutosDatalist();

        // 2. Registro da Venda
        const cupom = {
            id: 'CUPOM-' + Date.now(),
            data: now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }),
            isoDate: now.toISOString(),
            produto: nomeProduto,
            cliente: document.getElementById('cliente').value.trim(),
            tipo_venda: tipoVenda,
            preco_unitario: parseFloat(document.getElementById('preco_unitario').value) || 0,
            quantidade: qtdVendida,
            status: document.getElementById('forma_pagamento').value, 
            tipo_label: tipoLabel,
            valor: parseFloat(document.getElementById('valor').value) || 0, 
            motorista: document.getElementById('motorista').value.trim(),
            placa: document.getElementById('placa').value.trim(),
        };
        
        const cupons = getCupons();
        cupons.push(cupom);
        salvarCupons(cupons);
        
        renderizarTotais(getISODate(now)); 
        prepararEImprimirCupom(cupom.id);
        vendaForm.reset();
        updateVendaLabels();
    });

    gastoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const now = new Date();
        const gasto = {
            id: 'GASTO-' + Date.now(),
            descricao: document.getElementById('descricaoGasto').value.trim(),
            valor: parseFloat(document.getElementById('valorGasto').value) || 0,
            isoDate: now.toISOString(),
        };
        const gastos = getGastos();
        gastos.push(gasto);
        salvarGastos(gastos);
        
        renderizarGastos(getISODate(now));
        renderizarTotais(dateInput.value || getISODate(now));
        gastoForm.reset();
    });

    gastosLista.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-delete-gasto')) {
            const gastoId = target.getAttribute('data-id');
            if (confirm(`Tem certeza que deseja apagar a despesa ${gastoId}?`)) {
                let gastos = getGastos();
                gastos = gastos.filter(gasto => gasto.id !== gastoId);
                salvarGastos(gastos);
                const dataAtual = dateInput.value || getISODate(new Date());
                renderizarGastos(dataAtual);
                renderizarTotais(dataAtual);
            }
        }
    });

    const prepararEImprimirCupom = (id) => {
        const cupom = getCupons().find(c => c.id === id);
        if (!cupom) return alert("Cupom não encontrado!");
        
        const precoFormatado = (cupom.preco_unitario || 0).toFixed(2).replace('.', ',');
        const quantidadeFormatada = (cupom.quantidade || 0).toFixed(2).replace('.', ',');
        const statusDisplay = cupom.status === 'aprazo' ? 'A PRAZO (PENDENTE)' : 'PAGO';
        const tipoLabel = cupom.tipo_label || 'Kg';

        document.getElementById('print-id').textContent = cupom.id;
        document.getElementById('print-data').textContent = cupom.data;
        document.getElementById('print-cliente').textContent = cupom.cliente;
        document.getElementById('print-produto').textContent = cupom.produto;
        document.getElementById('print-tipo-qtd').textContent = `${quantidadeFormatada} ${tipoLabel}`; 
        document.getElementById('print-preco-unitario').textContent = `R$ ${precoFormatado} / ${tipoLabel}`; 
        document.getElementById('print-status').textContent = statusDisplay;
        document.getElementById('print-valor').textContent = (cupom.valor || 0).toFixed(2).replace('.', ',');
        
        setTimeout(() => { window.print(); }, 50); 
    };

    const baixarCupomComoPDF = async (id) => {
        const cupom = getCupons().find(c => c.id === id);
        if (!cupom) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); 
        let y = 10; const lineHeight = 5; const margin = 5;
        const precoFormatado = (cupom.preco_unitario || 0).toFixed(2).replace('.', ',');
        const quantidadeFormatada = (cupom.quantidade || 0).toFixed(2).replace('.', ',');
        const statusDisplay = cupom.status === 'aprazo' ? 'A PRAZO (PENDENTE)' : 'PAGO';

        doc.setFontSize(14);
        doc.text('COMPROVANTE DE VENDA', 40, y, { align: 'center' }); y += lineHeight + 5;
        doc.setFontSize(10);
        doc.text('-----------------------------------', 40, y, { align: 'center' }); y += lineHeight;
        doc.text(`ID: ${cupom.id}`, margin, y); y += lineHeight;
        doc.text(`Data/Hora: ${cupom.data}`, margin, y); y += lineHeight;
        doc.text(`Cliente: ${cupom.cliente}`, margin, y); y += lineHeight;
        doc.text('-----------------------------------', 40, y, { align: 'center' }); y += lineHeight + 2;
        doc.text(`Produto: ${cupom.produto}`, margin, y); y += lineHeight;
        doc.text(`Quantidade: ${quantidadeFormatada} ${cupom.tipo_label}`, margin, y); y += lineHeight; 
        doc.text(`Preço/${cupom.tipo_label}: R$ ${precoFormatado}`, margin, y); y += lineHeight; 
        doc.text(`Status: ${statusDisplay}`, margin, y); y += lineHeight + 3;
        doc.setFontSize(12);
        doc.text(`VALOR TOTAL: R$ ${(cupom.valor || 0).toFixed(2).replace('.', ',')}`, margin, y); y += lineHeight + 5;
        doc.setFontSize(10);
        doc.text('-----------------------------------', 40, y, { align: 'center' }); y += lineHeight;
        doc.text('Obrigado pela preferência!', 40, y, { align: 'center' }); y += lineHeight + 5;
        doc.text('Assinatura do Cliente:', 40, y, { align: 'center' }); y += 10;
        doc.text('______________________________', 40, y, { align: 'center' });
        doc.save(`cupom-${cupom.id}.pdf`);
    };

    const baixarBackup = () => {
        const cupons = getCupons();
        const gastos = getGastos(); 
        const produtos = getProdutos(); // Inclui o estoque e fornecedores
        const dataToSave = { cupons: cupons, gastos: gastos, produtos: produtos };
        
        const dataStr = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        
        a.href = url;
        a.download = `backup_simoes_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Backup dos dados baixado com sucesso!');
    };

    const restaurarBackup = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!confirm("ATENÇÃO: A restauração apagará todos os dados atuais e os substituirá. Deseja continuar?")) {
            restoreFile.value = ''; 
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.cupons && Array.isArray(data.cupons)) {
                    salvarCupons(data.cupons);
                    if (data.gastos && Array.isArray(data.gastos)) salvarGastos(data.gastos);
                    else salvarGastos([]); 
                    
                    if (data.produtos && Array.isArray(data.produtos)) salvarProdutos(data.produtos); // Restaura o estoque e fornecedores
                    else salvarProdutos([]);

                    renderizarTotais();
                    updateProdutosDatalist(); 
                    alert('Restauração de backup concluída com sucesso!');
                } else {
                    throw new Error('Formato de arquivo inválido.');
                }
            } catch (error) {
                alert('Erro ao processar backup. Verifique se o arquivo está no formato JSON correto.');
                console.error(error);
            } finally { restoreFile.value = ''; }
        };
        reader.readAsText(file);
    };

    precoUnitarioInput.addEventListener('input', calcularTotal);
    quantidadeInput.addEventListener('input', calcularTotal);
    tipoVendaSelect.addEventListener('change', updateVendaLabels);
    vendaForm.addEventListener('reset', () => { setTimeout(calcularTotal, 50); });

    backupBtn.addEventListener('click', baixarBackup);
    restoreBtn.addEventListener('click', () => { restoreFile.click(); });
    restoreFile.addEventListener('change', restaurarBackup);
    exporTotalBtn.addEventListener('click', () => { totalVendasDisplay.classList.toggle('show'); });
    
    dateInput.addEventListener('change', () => renderizarTotais(dateInput.value));
    clearDateBtn.addEventListener('click', () => renderizarTotais());

    openGastoModalBtn.addEventListener('click', () => {
        gastoModal.style.display = 'flex'; 
        renderizarGastos(dateInput.value || getISODate(new Date()));
    });
    
    // ESTOQUE MODAL LISTENERS
    openEstoqueModalBtn.addEventListener('click', () => {
        estoqueModal.style.display = 'flex'; 
        dataProdutoEstoque.value = getISODate(new Date());
        renderizarEstoque();
    });

    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.addEventListener('click', () => { btn.closest('.modal').style.display = 'none'; });
    });
    
    window.addEventListener('click', (event) => {
        if (event.target == gastoModal) gastoModal.style.display = 'none';
        if (event.target == pendentesModal) pendentesModal.style.display = 'none';
        if (event.target == pagosModal) pagosModal.style.display = 'none';
        if (event.target == estoqueModal) estoqueModal.style.display = 'none';
    });

    const applyPendentesFilters = () => {
        const isAllDates = pendentesDateInput.value === '';
        renderizarCuponsModal('aprazo', cuponsPendentesModalContainer, pendentesSearchInput, pendentesDateInput, isAllDates);
    };
    openPendentesModalBtn.addEventListener('click', () => {
        pendentesModal.style.display = 'flex'; 
        pendentesDateInput.value = ''; 
        applyPendentesFilters(); 
    });
    pendentesSearchInput.addEventListener('input', applyPendentesFilters);
    pendentesDateInput.addEventListener('change', applyPendentesFilters);
    pendentesClearDateBtn.addEventListener('click', () => {
        pendentesDateInput.value = '';
        applyPendentesFilters();
    });

    const applyPagosFilters = () => {
        const isAllDates = pagosDateInput.value === '';
        renderizarCuponsModal('pago', cuponsPagosModalContainer, pagosSearchInput, pagosDateInput, isAllDates);
    };
    openPagosModalBtn.addEventListener('click', () => {
        pagosModal.style.display = 'flex'; 
        pagosDateInput.value = ''; 
        applyPagosFilters(); 
    });
    pagosSearchInput.addEventListener('input', applyPagosFilters);
    pagosDateInput.addEventListener('change', applyPagosFilters);
    pagosClearDateBtn.addEventListener('click', () => {
        pagosDateInput.value = '';
        applyPagosFilters();
    });

    // INICIALIZAÇÃO
    updateVendaLabels(); 
    calcularTotal(); 
    renderizarTotais(); 
    updateProdutosDatalist(); 
});