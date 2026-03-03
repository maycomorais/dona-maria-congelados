/* ============================================================
   DOÑA MARIA — admin.js  (reescrito limpo)
   Colunas 100% alinhadas ao schema do Supabase
   ============================================================ */

/* ── SUPABASE ─────────────────────────────────────────────── */
const SUPABASE_URL = 'https://frdtjwhomeojosqygyow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZHRqd2hvbWVvam9zcXlneW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTY5MDgsImV4cCI6MjA4Nzk5MjkwOH0.viBjPZ1JH0ezDzoJo5Bb97pynZeXtfdpPSq9zfIykh8';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── ESTADO GLOBAL ────────────────────────────────────────── */
let cardapio            = [];
let pedidos             = [];
let pedidosPendentes    = [];
let motoboys            = [];
let lancamentos         = [];
let clientes            = [];
let pedidosSelecionados = new Set();
let graficoPratos       = null;

/* ── BOOT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  if (sessionStorage.getItem('donamaria_auth')) carregarDadosIniciais();
});

/* ══════════════════════════════════════════════════════════
   AUTENTICAÇÃO
   ══════════════════════════════════════════════════════════ */
function verificarAutenticacao() {
  const auth        = sessionStorage.getItem('donamaria_auth');
  const loginScreen = document.getElementById('login-screen');
  const appEl       = document.getElementById('app');
  if (!auth) {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appEl)       appEl.hidden = true;
    return;
  }
  if (loginScreen) loginScreen.style.display = 'none';
  if (appEl)       appEl.hidden = false;
  const user = JSON.parse(auth);
  const el = document.getElementById('user-email') || document.getElementById('user-name');
  if (el) el.textContent = user.nome || user.username || 'Admin';
}

async function fazerLogin() {
  const btn     = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; }
  if (errorEl) errorEl.hidden = true;

  const username = (document.getElementById('login-email')?.value || '').trim();
  const senha    = document.getElementById('login-senha')?.value || '';

  const { data, error } = await supabaseClient
    .from('usuarios').select('*')
    .eq('username', username).eq('senha', senha).maybeSingle();

  if (error || !data) {
    if (errorEl) errorEl.hidden = false;
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar'; }
    return;
  }
  sessionStorage.setItem('donamaria_auth', JSON.stringify({
    id: data.id, nome: data.nome, username: data.username, role: data.role
  }));
  verificarAutenticacao();
  await carregarDadosIniciais();
}

function fazerLogout() {
  sessionStorage.removeItem('donamaria_auth');
  verificarAutenticacao();
}

function toggleSenha(btn) {
  const input = btn.previousElementSibling || btn.parentElement.querySelector('input');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) icon.className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

/* ══════════════════════════════════════════════════════════
   NAVEGAÇÃO
   ══════════════════════════════════════════════════════════ */
function showPage(page, el) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl && el) titleEl.textContent = el.textContent.trim().replace(/\s+/g, ' ');
  const loaders = {
    'dashboard':         carregarDashboard,
    'clientes':          carregarClientes,
    'pedidos-pendentes': carregarPedidosPendentes,
    'pedidos-todos':     carregarTodosPedidos,
    'semana':            carregarSemana,
    'producao':          carregarProducao,
    'motoboys':          carregarMotoboys,
    'caixa':             carregarCaixa,
    'lancamentos':       carregarLancamentos,
    'cardapio-admin':    carregarCardapioAdmin,
  };
  if (loaders[page]) loaders[page]();
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

/* ══════════════════════════════════════════════════════════
   CARGA INICIAL
   ══════════════════════════════════════════════════════════ */
async function carregarDadosIniciais() {
  await Promise.all([
    _buscarCardapio(),
    _buscarPedidos(),
    _buscarMotoboys(),
    _buscarClientes(),
  ]);
  carregarDashboard();
}

async function _buscarCardapio() {
  const { data } = await supabaseClient.from('cardapio').select('*').order('ordem');
  cardapio = data || [];
}

async function _buscarPedidos() {
  const { data } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false });
  pedidos          = data || [];
  pedidosPendentes = pedidos.filter(p => p.status === 'pendente');
  const badge = document.getElementById('badge-pendentes');
  if (badge) {
    badge.textContent   = pedidosPendentes.length;
    badge.style.display = pedidosPendentes.length ? 'inline-flex' : 'none';
  }
}

async function _buscarMotoboys() {
  const { data } = await supabaseClient.from('motoboys').select('*').order('nome');
  motoboys = data || [];
}

async function _buscarClientes() {
  // schema: id, nome, tel, plano, total_entregas, entregas_feitas,
  //         prox_entrega, endereco, status, linha_pref, obs, link_maps
  const { data } = await supabaseClient.from('clientes').select('*').order('nome');
  clientes = data || [];
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════ */
async function carregarDashboard() {
  setText('stat-clientes', clientes.filter(c => c.status === 'ativo').length);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const { data: entSemana } = await supabaseClient
    .from('entregas').select('id')
    .gte('data_entrega', inicioSemana.toISOString().split('T')[0]);
  setText('stat-entregas', (entSemana || []).length);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const { data: lancMes } = await supabaseClient
    .from('lancamentos').select('tipo,valor_brl,valor_gs')
    .gte('data_lancamento', mesAtual + '-01');
  const lm     = lancMes || [];
  const recBRL = lm.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_brl || 0), 0);
  const desBRL = lm.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor_brl || 0), 0);
  const recGS  = lm.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_gs  || 0), 0);
  const desGS  = lm.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor_gs  || 0), 0);

  setText('stat-saldo-brl', formatBRL(recBRL - desBRL));
  setText('stat-saldo-gs',  formatGS(recGS  - desGS));
  setText('dash-receita',   formatBRL(recBRL));
  setText('dash-despesa',   formatBRL(desBRL));
  setText('dash-saldo',     formatBRL(recBRL - desBRL));

  // Próximas entregas
  const proximas = clientes
    .filter(c => c.prox_entrega && c.status === 'ativo')
    .sort((a, b) => new Date(a.prox_entrega) - new Date(b.prox_entrega))
    .slice(0, 5);
  const divProx = document.getElementById('dash-proximas');
  if (divProx) {
    divProx.innerHTML = proximas.length
      ? proximas.map(c => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0ebe7">
            <span><strong>${c.nome}</strong><br><small style="color:#6b5a4f">${c.plano || ''}</small></span>
            <span style="font-weight:600;color:#e76f51">${fmtData(c.prox_entrega)}</span>
          </div>`).join('')
      : '<p class="empty-msg">Nenhuma entrega próxima</p>';
  }

  // Gráfico pratos mais vendidos
  const pratosCount = {};
  pedidos.filter(p => ['aceito','entregue'].includes(p.status)).forEach(p => {
    (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
      pratosCount[pr.nome] = (pratosCount[pr.nome] || 0) + (pr.qtd || 1);
    });
  });
  const top = Object.entries(pratosCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const ctx = document.getElementById('chart-pratos-vendidos');
  if (ctx && top.length) {
    if (graficoPratos) graficoPratos.destroy();
    graficoPratos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: top.map(t => t[0]),
        datasets: [{ data: top.map(t => t[1]), backgroundColor: ['#e76f51','#2a9d8f','#f4a261','#e9c46a','#264653'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }
}

/* ══════════════════════════════════════════════════════════
   CLIENTES
   schema: nome, tel, plano, total_entregas, entregas_feitas,
           prox_entrega, endereco, status, linha_pref, obs, link_maps
   ══════════════════════════════════════════════════════════ */
async function carregarClientes() {
  await _buscarClientes();
  renderizarClientes(clientes);
}

function filtrarClientes(term) {
  const lower = (term || '').toLowerCase();
  renderizarClientes(lower ? clientes.filter(c => c.nome?.toLowerCase().includes(lower)) : clientes);
}

function bolinhasEntregas(feitas, total) {
  const max = Math.max(total || 0, feitas || 0);
  if (max === 0) return '<span style="color:#bbb">—</span>';
  return Array.from({ length: max }, (_, i) =>
    `<span style="font-size:14px;color:${i < feitas ? '#e76f51' : '#ddd'};margin-right:2px">${i < feitas ? '●' : '○'}</span>`
  ).join('');
}

function renderizarClientes(lista) {
  const tbody = document.getElementById('tbody-clientes');
  if (!tbody) return;
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.nome}</strong>${c.tel ? `<br><small class="td-sub">${c.tel}</small>` : ''}</td>
      <td>${c.plano || '—'}</td>
      <td>${bolinhasEntregas(c.entregas_feitas, c.total_entregas)}</td>
      <td>${c.prox_entrega ? fmtData(c.prox_entrega) : '—'}</td>
      <td><span class="badge badge-${c.status === 'ativo' ? 'green' : 'gray'}">${c.status || 'ativo'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editarCliente('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-primary" onclick="abrirModalEntrega('${c.id}','${esc(c.nome)}')" title="Registrar entrega"><i class="fas fa-motorcycle"></i></button>
        <button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="excluirCliente('${c.id}','${esc(c.nome)}')" title="Excluir"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty-msg">Nenhum cliente.</td></tr>';
}

async function excluirCliente(id, nome) {
  if (!confirm(`Excluir permanentemente "${nome}"?\n\nEsta ação não pode ser desfeita.`)) return;
  // Remove entregas vinculadas primeiro (FK constraint)
  await supabaseClient.from('entregas').delete().eq('cliente_id', id);
  const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
  if (error) { mostrarToast('Erro ao excluir: ' + error.message, 'error'); return; }
  mostrarToast(`"${nome}" excluído.`);
  await _buscarClientes();
  renderizarClientes(clientes);
}

function abrirModalCliente() {
  document.getElementById('cli-id').value              = '';
  document.getElementById('cli-nome').value            = '';
  document.getElementById('cli-tel').value             = '';
  document.getElementById('cli-plano').value           = 'Mensal';
  document.getElementById('cli-linha').value           = 'Mista';
  document.getElementById('cli-total-entregas').value  = '4';
  document.getElementById('cli-entregas-feitas').value = '0';
  document.getElementById('cli-prox-entrega').value    = '';
  document.getElementById('cli-status').value          = 'ativo';
  document.getElementById('cli-endereco').value        = '';
  document.getElementById('cli-obs').value             = '';
  document.getElementById('modal-cliente-titulo').textContent = 'Novo Cliente';
  document.getElementById('modal-cliente').classList.add('active');
}

async function editarCliente(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cli-id').value              = c.id;
  document.getElementById('cli-nome').value            = c.nome            || '';
  document.getElementById('cli-tel').value             = c.tel             || '';
  document.getElementById('cli-plano').value           = c.plano           || 'Mensal';
  document.getElementById('cli-linha').value           = c.linha_pref      || 'Mista';
  document.getElementById('cli-total-entregas').value  = c.total_entregas  ?? 4;
  document.getElementById('cli-entregas-feitas').value = c.entregas_feitas ?? 0;
  document.getElementById('cli-prox-entrega').value    = c.prox_entrega    || '';
  document.getElementById('cli-status').value          = c.status          || 'ativo';
  document.getElementById('cli-endereco').value        = c.endereco        || '';
  document.getElementById('cli-obs').value             = c.obs             || '';
  document.getElementById('modal-cliente-titulo').textContent = 'Editar Cliente';

  // Injeta (ou atualiza) a seção de pedidos da semana no modal
  const modalBox = document.querySelector('#modal-cliente .modal-box');
  let secao = document.getElementById('cli-pratos-semana-section');
  if (modalBox && !secao) {
    secao = document.createElement('div');
    secao.id = 'cli-pratos-semana-section';
    secao.style.cssText = 'margin-top:20px;border-top:1px solid #f0ebe7;padding-top:16px';
    secao.innerHTML = '<div style="font-weight:600;color:#3d2c24;margin-bottom:10px">'
      + '<i class="fas fa-utensils" style="color:#e76f51;margin-right:6px"></i>Pedidos da Semana</div>'
      + '<div id="cli-pratos-semana-corpo" style="font-size:13px;color:#6b5a4f">Carregando...</div>';
    modalBox.insertBefore(secao, modalBox.querySelector('.modal-actions'));
  } else if (document.getElementById('cli-pratos-semana-corpo')) {
    document.getElementById('cli-pratos-semana-corpo').textContent = 'Carregando...';
  }

  document.getElementById('modal-cliente').classList.add('active');
  _carregarPratosCliente(c.id);
}

async function _carregarPratosCliente(clienteId) {
  const corpo = document.getElementById('cli-pratos-semana-corpo');
  if (!corpo) return;

  // Intervalo da semana atual (seg → dom)
  const agora = new Date();
  const seg   = new Date(agora); seg.setDate(agora.getDate() - ((agora.getDay() + 6) % 7));
  const dom   = new Date(seg);   dom.setDate(seg.getDate() + 6);
  const de    = seg.toISOString().split('T')[0];
  const ate   = dom.toISOString().split('T')[0];

  let { data } = await supabaseClient
    .from('pedidos').select('id, created_at, status, pratos, plano')
    .eq('cliente_id', clienteId)
    .gte('created_at', de).lte('created_at', ate + 'T23:59:59')
    .order('created_at', { ascending: false });

  let titulo = de + ' → ' + ate;

  // Se não encontrou nada esta semana, mostra os 3 mais recentes
  if (!data || !data.length) {
    const res = await supabaseClient
      .from('pedidos').select('id, created_at, status, pratos, plano')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false }).limit(3);
    data  = res.data;
    titulo = 'Últimos pedidos';
  }

  if (!data || !data.length) {
    corpo.innerHTML = '<span style="color:#bbb">Nenhum pedido encontrado para este cliente.</span>';
    return;
  }

  const cores = { pendente:'#f4a261', aceito:'#2a9d8f', entregue:'#264653',
    recusado:'#e74c3c', em_entrega:'#1e40af', em_producao:'#7c3aed', cancelado:'#999' };

  corpo.innerHTML = '<div style="color:#999;margin-bottom:8px;font-size:12px">' + titulo + '</div>' +
    data.map(p => {
      const pratos = Array.isArray(p.pratos) ? p.pratos : [];
      const cor    = cores[p.status] || '#999';
      return '<div style="background:#fef9f5;border-radius:8px;padding:10px 12px;margin-bottom:8px;border-left:3px solid ' + cor + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
        + '<span style="font-weight:600">' + fmtData(p.created_at.split('T')[0]) + '</span>'
        + '<span style="background:' + cor + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:11px">' + p.status + '</span>'
        + '</div>'
        + (pratos.length
          ? pratos.map(pr => '<div style="padding:2px 0 2px 4px">• ' + pr.nome + (pr.qtd > 1 ? ' <strong>x' + pr.qtd + '</strong>' : '') + '</div>').join('')
          : '<div style="color:#bbb;font-style:italic">Sem pratos registrados</div>')
        + '</div>';
    }).join('');
}

function atualizarEntregasPlano() {
  const map   = { Individual: 1, Semanal: 4, FDS: 8, Mensal: 16 };
  const plano = document.getElementById('cli-plano')?.value;
  const el    = document.getElementById('cli-total-entregas');
  if (el && map[plano]) el.value = map[plano];
}

async function salvarCliente() {
  const id      = document.getElementById('cli-id').value;
  const payload = {
    nome:            document.getElementById('cli-nome').value.trim(),
    tel:             document.getElementById('cli-tel').value.trim()  || null,
    plano:           document.getElementById('cli-plano').value,
    linha_pref:      document.getElementById('cli-linha').value,
    total_entregas:  parseInt(document.getElementById('cli-total-entregas').value)  || 0,
    entregas_feitas: parseInt(document.getElementById('cli-entregas-feitas').value) || 0,
    prox_entrega:    document.getElementById('cli-prox-entrega').value || null,
    status:          document.getElementById('cli-status').value,
    endereco:        document.getElementById('cli-endereco').value.trim() || null,
    obs:             document.getElementById('cli-obs').value.trim()      || null,
  };
  if (!payload.nome) { mostrarToast('Nome é obrigatório', 'error'); return; }
  const { error } = id
    ? await supabaseClient.from('clientes').update(payload).eq('id', id)
    : await supabaseClient.from('clientes').insert([payload]);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Cliente salvo!');
  fecharModal('modal-cliente');
  await _buscarClientes();
  renderizarClientes(clientes);
}

/* ── ENTREGA ──────────────────────────────────────────────── */
// schema entregas: cliente_id, data_entrega, numero_entrega, obs
function abrirModalEntrega(clienteId, clienteNome) {
  document.getElementById('ent-cli-id').value             = clienteId;
  document.getElementById('ent-cliente-nome').textContent = clienteNome;
  document.getElementById('ent-data').value               = hoje();
  document.getElementById('ent-obs').value                = '';
  document.getElementById('modal-entrega').classList.add('active');
}

async function confirmarEntrega() {
  const clienteId = document.getElementById('ent-cli-id').value;
  const dataEnt   = document.getElementById('ent-data').value;
  const obs       = document.getElementById('ent-obs').value.trim() || null;
  if (!dataEnt) { mostrarToast('Selecione a data', 'error'); return; }

  const { count } = await supabaseClient
    .from('entregas').select('id', { count: 'exact', head: true })
    .eq('cliente_id', clienteId);

  const { error } = await supabaseClient.from('entregas').insert([{
    cliente_id:     clienteId,
    data_entrega:   dataEnt,
    numero_entrega: (count || 0) + 1,
    obs,
  }]);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }

  const cli = clientes.find(c => c.id === clienteId);
  if (cli) {
    await supabaseClient.from('clientes')
      .update({ entregas_feitas: (cli.entregas_feitas || 0) + 1 })
      .eq('id', clienteId);
  }

  mostrarToast('Entrega registrada!');
  fecharModal('modal-entrega');
  await _buscarClientes();
  renderizarClientes(clientes);
}

/* ══════════════════════════════════════════════════════════
   PEDIDOS PENDENTES
   ══════════════════════════════════════════════════════════ */
async function carregarPedidosPendentes() {
  await _buscarPedidos();
  filtrarPedidosPendentes();
}

function filtrarPedidosPendentes() {
  const busca = (document.getElementById('filtro-pendente-cliente')?.value || '').toLowerCase();
  let lista = pedidosPendentes;
  if (busca) lista = lista.filter(p =>
    p.cliente_nome?.toLowerCase().includes(busca) || p.cliente_tel?.includes(busca));
  renderizarPedidosPendentes(lista);
}

function renderizarPedidosPendentes(lista) {
  const tbody   = document.getElementById('tbody-pendentes');
  const totalEl = document.getElementById('total-pendentes');
  if (totalEl) totalEl.textContent = lista.length + ' pedido' + (lista.length !== 1 ? 's' : '');
  if (!tbody) return;
  tbody.innerHTML = lista.map(p => {
    const pratos   = Array.isArray(p.pratos) ? p.pratos : [];
    const totalVal = pratos.reduce((s, pr) => s + (pr.precoItem || 0), 0);
    return `<tr>
      <td><input type="checkbox" class="pedido-check" value="${p.id}" onchange="togglePedidoSelecionado('${p.id}')"></td>
      <td>${fmtDataHora(p.created_at)}</td>
      <td><strong>${p.cliente_nome}</strong>${p.cliente_tel ? `<br><small>${p.cliente_tel}</small>` : ''}</td>
      <td>${p.plano || '—'}</td>
      <td>${pratos.length}</td>
      <td>${totalVal ? formatGS(totalVal) : '—'}</td>
      <td>${p.forma_pag || '—'}</td>
      <td>
        <button class="btn btn-sm" style="background:#2a9d8f;color:#fff" onclick="aceitarPedido('${p.id}')"><i class="fas fa-check"></i></button>
        <button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="recusarPedido('${p.id}')"><i class="fas fa-times"></i></button>
        <button class="btn btn-sm btn-outline" onclick="abrirModalEditarPedido('${p.id}')"><i class="fas fa-edit"></i></button>
      </td></tr>`;
  }).join('') || '<tr><td colspan="8" class="empty-msg">Nenhum pedido pendente.</td></tr>';
  const batch = document.getElementById('batch-actions-pendentes');
  if (batch) batch.hidden = pedidosSelecionados.size === 0;
}

async function aceitarPedido(id) {
  const { error } = await supabaseClient.from('pedidos')
    .update({ status: 'aceito', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Pedido aceito!');
  carregarPedidosPendentes();
}

async function recusarPedido(id) {
  if (!confirm('Recusar este pedido?')) return;
  const { error } = await supabaseClient.from('pedidos')
    .update({ status: 'recusado', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Pedido recusado');
  carregarPedidosPendentes();
}

function togglePedidoSelecionado(id) {
  pedidosSelecionados.has(id) ? pedidosSelecionados.delete(id) : pedidosSelecionados.add(id);
  const cnt   = document.getElementById('selected-count');
  if (cnt) cnt.textContent = pedidosSelecionados.size + ' selecionado(s)';
  const batch = document.getElementById('batch-actions-pendentes');
  if (batch) batch.hidden = pedidosSelecionados.size === 0;
}

function toggleSelectAllPendentes(cb) {
  const checked = cb ? cb.checked : false;
  document.querySelectorAll('.pedido-check').forEach(el => {
    el.checked = checked;
    checked ? pedidosSelecionados.add(el.value) : pedidosSelecionados.delete(el.value);
  });
  const cnt = document.getElementById('selected-count');
  if (cnt) cnt.textContent = pedidosSelecionados.size + ' selecionado(s)';
  const batch = document.getElementById('batch-actions-pendentes');
  if (batch) batch.hidden = pedidosSelecionados.size === 0;
}

async function aceitarPedidosBatch() {
  if (!pedidosSelecionados.size) return;
  const ids = [...pedidosSelecionados];
  const { error } = await supabaseClient.from('pedidos')
    .update({ status: 'aceito', updated_at: new Date().toISOString() }).in('id', ids);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast(ids.length + ' pedido(s) aceito(s)!');
  pedidosSelecionados.clear();
  carregarPedidosPendentes();
}

async function recusarPedidosBatch() {
  if (!pedidosSelecionados.size) return;
  if (!confirm('Recusar todos os selecionados?')) return;
  const ids = [...pedidosSelecionados];
  const { error } = await supabaseClient.from('pedidos')
    .update({ status: 'recusado', updated_at: new Date().toISOString() }).in('id', ids);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast(ids.length + ' pedido(s) recusado(s)');
  pedidosSelecionados.clear();
  carregarPedidosPendentes();
}

/* ── EDITAR PEDIDO ────────────────────────────────────────── */
// schema pedidos: cliente_nome, cliente_tel, plano, pratos(jsonb), observacoes, forma_pag, status
async function abrirModalEditarPedido(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-pedido-id').value    = p.id;
  document.getElementById('edit-cliente-nome').value = p.cliente_nome || '';
  document.getElementById('edit-cliente-tel').value  = p.cliente_tel  || '';
  document.getElementById('edit-plano').value        = p.plano        || '';
  document.getElementById('edit-status').value       = p.status       || 'pendente';
  document.getElementById('edit-pratos').value       = JSON.stringify(p.pratos || [], null, 2);
  document.getElementById('edit-obs').value          = p.observacoes  || '';
  document.getElementById('modal-editar-pedido').classList.add('active');
}

async function salvarEdicaoPedido() {
  const id = document.getElementById('edit-pedido-id').value;
  let pratos;
  try { pratos = JSON.parse(document.getElementById('edit-pratos').value); }
  catch { mostrarToast('JSON dos pratos inválido', 'error'); return; }
  const { error } = await supabaseClient.from('pedidos').update({
    cliente_nome: document.getElementById('edit-cliente-nome').value,
    cliente_tel:  document.getElementById('edit-cliente-tel').value,
    plano:        document.getElementById('edit-plano').value,
    status:       document.getElementById('edit-status').value,
    pratos,
    observacoes:  document.getElementById('edit-obs').value,
    updated_at:   new Date().toISOString(),
  }).eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Pedido atualizado!');
  fecharModal('modal-editar-pedido');
  carregarPedidosPendentes();
}

/* ══════════════════════════════════════════════════════════
   TODOS OS PEDIDOS
   ══════════════════════════════════════════════════════════ */
async function carregarTodosPedidos() {
  await _buscarPedidos();
  filtrarPedidos();
}

function filtrarPedidos() {
  const busca    = (document.getElementById('filtro-pedido-cliente')?.value  || '').toLowerCase();
  const status   = document.getElementById('filtro-pedido-status')?.value    || '';
  const dtInicio = document.getElementById('filtro-pedido-data-inicio')?.value;
  const dtFim    = document.getElementById('filtro-pedido-data-fim')?.value;
  let lista = [...pedidos];
  if (busca)    lista = lista.filter(p => p.cliente_nome?.toLowerCase().includes(busca));
  if (status)   lista = lista.filter(p => p.status === status);
  if (dtInicio) lista = lista.filter(p => p.created_at >= dtInicio);
  if (dtFim)    lista = lista.filter(p => p.created_at <= dtFim + 'T23:59:59');
  const tbody = document.getElementById('tbody-todos-pedidos');
  if (!tbody) return;
  tbody.innerHTML = lista.map(p => {
    const pratos   = Array.isArray(p.pratos) ? p.pratos : [];
    const totalVal = pratos.reduce((s, pr) => s + (pr.precoItem || 0), 0);
    const sc = { pendente:'badge-orange', aceito:'badge-green', recusado:'badge-red',
      entregue:'badge-blue', cancelado:'badge-gray' }[p.status] || 'badge-gray';
    return `<tr>
      <td>${fmtDataHora(p.created_at)}</td>
      <td><strong>${p.cliente_nome}</strong></td>
      <td><span class="badge ${sc}">${p.status}</span></td>
      <td>${p.plano || '—'}</td>
      <td>${pratos.length}</td>
      <td>${totalVal ? formatGS(totalVal) : '—'}</td>
      <td>${p.forma_pag || '—'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="abrirModalEditarPedido('${p.id}')"><i class="fas fa-edit"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="empty-msg">Nenhum pedido.</td></tr>';
}

function exportarPedidosExcel() {
  const csv = [
    ['Data','Cliente','Tel','Plano','Pratos','Total','Pagamento','Status'].join(';'),
    ...pedidos.map(p => {
      const pratos = Array.isArray(p.pratos) ? p.pratos : [];
      return [fmtDataHora(p.created_at), p.cliente_nome, p.cliente_tel, p.plano,
        pratos.map(pr => pr.nome).join(' | '),
        pratos.reduce((s, pr) => s + (pr.precoItem || 0), 0),
        p.forma_pag, p.status].join(';');
    })
  ].join('\n');
  baixarCSV(csv, 'pedidos');
}

function imprimirEtiquetas() {
  const aceitos = pedidos.filter(p => p.status === 'aceito');
  if (!aceitos.length) { mostrarToast('Nenhum pedido aceito', 'error'); return; }
  const html = aceitos.map(p => {
    const pratos = (Array.isArray(p.pratos) ? p.pratos : [])
      .map(pr => `<div>${pr.nome} x${pr.qtd || 1}</div>`).join('');
    return `<div class="et"><b>${p.cliente_nome}</b><br>${pratos}<br>${p.cliente_tel || ''}</div>`;
  }).join('');
  const w = window.open('', '_blank');
  w.document.write(`<html><head><style>.et{border:1px solid #000;padding:10px;margin:10px;width:80mm;page-break-inside:avoid}</style></head><body>${html}</body></html>`);
  w.print();
}

/* ══════════════════════════════════════════════════════════
   LISTA DA SEMANA
   ══════════════════════════════════════════════════════════ */
async function carregarSemana() {
  const tbody = document.getElementById('tbody-semana');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">Carregando...</td></tr>';
  const { data, error } = await supabaseClient
    .from('pedidos').select('*, clientes(nome, endereco)')
    .in('status', ['aceito','em_producao','pronto','em_entrega'])
    .order('created_at');
  if (error) { tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar</td></tr>'; return; }
  tbody.innerHTML = (data || []).map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td>${p.clientes?.nome || p.cliente_nome || '—'}</td>
    <td>${p.plano || '—'}</td>
    <td>${fmtDataHora(p.created_at)}</td>
    <td>${p.clientes?.endereco || '—'}</td>
    <td>—</td>
    <td><span class="badge">${p.status}</span></td>
    <td>${p.observacoes || ''}</td>
  </tr>`).join('') || '<tr><td colspan="8" class="empty-msg">Nenhuma entrega.</td></tr>';
}

function imprimirListaSemana() { window.print(); }

/* ══════════════════════════════════════════════════════════
   PRODUÇÃO DO SÁBADO
   ══════════════════════════════════════════════════════════ */
async function carregarProducao() {
  const { data } = await supabaseClient.from('pedidos').select('pratos').eq('status', 'aceito');
  const contagem = {};
  (data || []).forEach(p => {
    (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
      contagem[pr.nome] = (contagem[pr.nome] || 0) + (pr.qtd || 1);
    });
  });
  const itens = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  setText('prod-total-marmitas', itens.reduce((s, [, q]) => s + q, 0) + ' marmitas');
  const grid = document.getElementById('grid-producao');
  if (grid) grid.innerHTML = itens.map(([nome, qtd]) =>
    `<div class="card" style="padding:16px;text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:#e76f51">${qtd}</div>
      <div style="font-size:.9rem;margin-top:4px">${nome}</div>
    </div>`).join('') || '<p class="empty-msg">Nenhum pedido aceito.</p>';
  const tbody = document.getElementById('tbody-producao');
  if (tbody) tbody.innerHTML = itens.map(([nome, qtd]) =>
    `<tr><td>${nome}</td><td>—</td><td><strong>${qtd}</strong></td></tr>`).join('');
}

function imprimirProducao() { window.print(); }

/* ══════════════════════════════════════════════════════════
   MOTOBOYS — schema: nome, telefone, ativo
   ══════════════════════════════════════════════════════════ */
async function carregarMotoboys() {
  await _buscarMotoboys();
  renderizarMotoboys();
}

function renderizarMotoboys() {
  const tbody = document.getElementById('tbody-motoboys');
  if (!tbody) return;
  tbody.innerHTML = motoboys.map(m => `<tr>
    <td><strong>${m.nome}</strong></td>
    <td>${m.telefone || '—'}</td>
    <td><span class="badge badge-${m.ativo ? 'green' : 'gray'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
    <td><button class="btn btn-sm btn-outline" onclick="editarMotoboy('${m.id}')"><i class="fas fa-edit"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="4" class="empty-msg">Nenhum motoboy.</td></tr>';
  const sel = document.getElementById('rota-motoboy');
  if (sel) sel.innerHTML = '<option value="">Selecione...</option>' +
    motoboys.filter(m => m.ativo).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
}

function abrirModalMotoboy() {
  document.getElementById('motoboy-id').value       = '';
  document.getElementById('motoboy-nome').value     = '';
  document.getElementById('motoboy-telefone').value = '';
  document.getElementById('modal-motoboy-titulo').textContent = 'Novo Motoboy';
  document.getElementById('modal-motoboy').classList.add('active');
}

async function editarMotoboy(id) {
  const m = motoboys.find(x => x.id === id);
  if (!m) return;
  document.getElementById('motoboy-id').value       = m.id;
  document.getElementById('motoboy-nome').value     = m.nome;
  document.getElementById('motoboy-telefone').value = m.telefone || '';
  document.getElementById('modal-motoboy-titulo').textContent = 'Editar Motoboy';
  document.getElementById('modal-motoboy').classList.add('active');
}

async function salvarMotoboy() {
  const id      = document.getElementById('motoboy-id').value;
  const payload = {
    nome:     document.getElementById('motoboy-nome').value.trim(),
    telefone: document.getElementById('motoboy-telefone').value.trim(),
    ativo:    true,
  };
  if (!payload.nome) { mostrarToast('Nome obrigatório', 'error'); return; }
  const { error } = id
    ? await supabaseClient.from('motoboys').update(payload).eq('id', id)
    : await supabaseClient.from('motoboys').insert([payload]);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Motoboy salvo!');
  fecharModal('modal-motoboy');
  carregarMotoboys();
}

/* ── CRIAR ROTA ───────────────────────────────────────────── */
// schema rotas_entrega: motoboy_id, pedidos_ids(ARRAY), data_rota, status
function abrirModalCriarRota() {
  document.getElementById('modal-criar-rota').classList.add('active');
}

async function criarRotaEntrega() {
  const motoboyId = document.getElementById('rota-motoboy').value;
  if (!motoboyId)               { mostrarToast('Selecione um motoboy', 'error'); return; }
  if (!pedidosSelecionados.size) { mostrarToast('Selecione pedidos primeiro', 'error'); return; }
  const ids         = [...pedidosSelecionados];
  const motoboy     = motoboys.find(m => m.id === motoboyId);
  const pedidosRota = pedidos.filter(p => ids.includes(p.id));

  const { error } = await supabaseClient.from('rotas_entrega').insert([{
    motoboy_id:  motoboyId,
    pedidos_ids: ids,
    data_rota:   hoje(),
    status:      'pendente',
  }]);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }

  await supabaseClient.from('pedidos')
    .update({ status: 'em_entrega', updated_at: new Date().toISOString() }).in('id', ids);

  let msg = `*ROTA DOÑA MARIA - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
  pedidosRota.forEach((p, i) => { msg += `${i+1}. *${p.cliente_nome}*\n📞 ${p.cliente_tel || '—'}\n\n`; });
  const tel = motoboy?.telefone?.replace(/\D/g, '');
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');

  mostrarToast('Rota criada!');
  fecharModal('modal-criar-rota');
  pedidosSelecionados.clear();
  carregarPedidosPendentes();
}

/* ══════════════════════════════════════════════════════════
   CAIXA DO MÊS
   ══════════════════════════════════════════════════════════ */
async function carregarCaixa() {
  const sel = document.getElementById('filtro-mes-caixa');
  if (sel && sel.options.length === 0) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const val = d.toISOString().slice(0, 7);
      sel.add(new Option(d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), val));
    }
  }
  const mes = sel?.value || new Date().toISOString().slice(0, 7);
  const { data } = await supabaseClient.from('lancamentos').select('*')
    .gte('data_lancamento', mes + '-01')
    .lte('data_lancamento', mes + '-31')
    .order('data_lancamento');
  const lista  = data || [];
  const recBRL = lista.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_brl || 0), 0);
  const desBRL = lista.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor_brl || 0), 0);
  const recGS  = lista.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_gs  || 0), 0);
  const desGS  = lista.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor_gs  || 0), 0);
  setText('caixa-receita-brl', formatBRL(recBRL));
  setText('caixa-receita-gs',  formatGS(recGS));
  setText('caixa-despesa-brl', formatBRL(desBRL));
  setText('caixa-despesa-gs',  formatGS(desGS));
  setText('caixa-saldo-brl',   formatBRL(recBRL - desBRL));
  setText('caixa-saldo-gs',    formatGS(recGS  - desGS));
  const tbody = document.getElementById('tbody-caixa');
  if (tbody) tbody.innerHTML = lista.map(l => `<tr>
    <td>${fmtData(l.data_lancamento)}</td>
    <td><span class="badge badge-${l.tipo === 'receita' ? 'green' : 'red'}">${l.tipo}</span></td>
    <td>${l.categoria}</td>
    <td>${l.descricao}</td>
    <td>${l.forma_pagamento || '—'}</td>
    <td>${formatBRL(l.valor_brl)}</td>
    <td>${formatGS(l.valor_gs)}</td>
    <td>—</td>
  </tr>`).join('') || '<tr><td colspan="8" class="empty-msg">Nenhum lançamento.</td></tr>';
}

function exportarCaixaExcel() { mostrarToast('Em breve', 'info'); }

/* ══════════════════════════════════════════════════════════
   LANÇAMENTOS
   schema: tipo(receita|despesa), categoria, descricao,
           forma_pagamento, valor_brl, valor_gs, data_lancamento, cliente_id
   ══════════════════════════════════════════════════════════ */
async function carregarLancamentos() {
  const selMes = document.getElementById('filtro-mes-lanc');
  if (selMes && selMes.options.length <= 1) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const val = d.toISOString().slice(0, 7);
      selMes.add(new Option(d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), val));
    }
  }
  const mes       = selMes?.value       || '';
  const tipo      = document.getElementById('filtro-tipo-lanc')?.value      || '';
  const categoria = document.getElementById('filtro-categoria-lanc')?.value || '';
  let query = supabaseClient.from('lancamentos').select('*')
    .order('data_lancamento', { ascending: false });
  if (mes)      { query = query.gte('data_lancamento', mes + '-01').lte('data_lancamento', mes + '-31'); }
  if (tipo)      query = query.eq('tipo', tipo);
  if (categoria) query = query.eq('categoria', categoria);
  const { data, error } = await query;
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  lancamentos = data || [];
  const tbody = document.getElementById('tbody-lancamentos');
  if (!tbody) return;
  tbody.innerHTML = lancamentos.map(l => `<tr>
    <td>${fmtData(l.data_lancamento)}</td>
    <td><span class="badge badge-${l.tipo === 'receita' ? 'green' : 'red'}">${l.tipo}</span></td>
    <td>${l.categoria}</td>
    <td>${l.descricao}</td>
    <td>${l.forma_pagamento || '—'}</td>
    <td>${formatBRL(l.valor_brl)}</td>
    <td>${formatGS(l.valor_gs)}</td>
    <td>—</td>
    <td>
      <button class="btn btn-sm btn-outline" onclick="editarLancamento('${l.id}')"><i class="fas fa-edit"></i></button>
      <button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="excluirLancamento('${l.id}')"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`).join('') || '<tr><td colspan="9" class="empty-msg">Nenhum lançamento.</td></tr>';
}

function exportarLancamentosExcel() { mostrarToast('Em breve', 'info'); }

function abrirModalLancamento() {
  delete document.getElementById('modal-lancamento').dataset.editId;
  document.getElementById('lanc-tipo').value      = 'receita';
  document.getElementById('lanc-categoria').value = 'Vendas';
  document.getElementById('lanc-desc').value      = '';
  document.getElementById('lanc-valor-brl').value = '';
  document.getElementById('lanc-valor-gs').value  = '';
  document.getElementById('lanc-forma').value     = 'efetivo_brl';
  document.getElementById('lanc-data').value      = hoje();
  const sel = document.getElementById('lanc-cliente');
  if (sel) sel.innerHTML = '<option value="">— Sem vínculo —</option>' +
    clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  document.getElementById('modal-lancamento').classList.add('active');
}

async function salvarLancamento() {
  const modal  = document.getElementById('modal-lancamento');
  const editId = modal.dataset.editId;
  const payload = {
    tipo:            document.getElementById('lanc-tipo').value,
    categoria:       document.getElementById('lanc-categoria').value,
    descricao:       document.getElementById('lanc-desc').value.trim(),
    forma_pagamento: document.getElementById('lanc-forma').value,
    valor_brl:       parseFloat(document.getElementById('lanc-valor-brl').value) || 0,
    valor_gs:        parseInt(document.getElementById('lanc-valor-gs').value)    || 0,
    data_lancamento: document.getElementById('lanc-data').value,
    cliente_id:      document.getElementById('lanc-cliente').value || null,
  };
  if (!payload.descricao)       { mostrarToast('Descrição obrigatória', 'error'); return; }
  if (!payload.data_lancamento) { mostrarToast('Data obrigatória', 'error');      return; }
  const { error } = editId
    ? await supabaseClient.from('lancamentos').update(payload).eq('id', editId)
    : await supabaseClient.from('lancamentos').insert([payload]);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Lançamento salvo!');
  fecharModal('modal-lancamento');
  carregarLancamentos();
}

async function editarLancamento(id) {
  const l = lancamentos.find(x => x.id === id);
  if (!l) return;
  document.getElementById('lanc-tipo').value      = l.tipo;
  document.getElementById('lanc-categoria').value = l.categoria;
  document.getElementById('lanc-desc').value      = l.descricao;
  document.getElementById('lanc-valor-brl').value = l.valor_brl || '';
  document.getElementById('lanc-valor-gs').value  = l.valor_gs  || '';
  document.getElementById('lanc-forma').value     = l.forma_pagamento || 'efetivo_brl';
  document.getElementById('lanc-data').value      = l.data_lancamento;
  const sel = document.getElementById('lanc-cliente');
  if (sel) sel.innerHTML = '<option value="">— Sem vínculo —</option>' +
    clientes.map(c => `<option value="${c.id}" ${c.id === l.cliente_id ? 'selected' : ''}>${c.nome}</option>`).join('');
  document.getElementById('modal-lancamento').dataset.editId = id;
  document.getElementById('modal-lancamento').classList.add('active');
}

async function excluirLancamento(id) {
  if (!confirm('Excluir este lançamento?')) return;
  const { error } = await supabaseClient.from('lancamentos').delete().eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Excluído!');
  carregarLancamentos();
}

/* ══════════════════════════════════════════════════════════
   CARDÁPIO
   schema: nome, linha, img_url, ingredientes, alergenos,
           kcal, tipo_nutri, preco, ativo, ordem
   ══════════════════════════════════════════════════════════ */
async function carregarCardapioAdmin() {
  await _buscarCardapio();
  filtrarCardapio();
}

function filtrarCardapio() {
  const linha = document.getElementById('filtro-linha-cardapio')?.value || '';
  const nome  = (document.getElementById('filtro-nome-cardapio')?.value || '').toLowerCase();
  let lista = [...cardapio];
  if (linha) lista = lista.filter(c => c.linha === linha);
  if (nome)  lista = lista.filter(c => c.nome?.toLowerCase().includes(nome));
  const tbody = document.getElementById('tbody-cardapio-admin');
  if (!tbody) return;
  tbody.innerHTML = lista.map(c => `<tr>
    <td>${c.img_url ? `<img src="${c.img_url}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'">` : '—'}</td>
    <td><strong>${c.nome}</strong></td>
    <td><span class="badge badge-blue">${c.linha}</span></td>
    <td>${formatGS(c.preco)}</td>
    <td>${c.kcal || '—'}</td>
    <td><span class="badge badge-${c.ativo ? 'green' : 'gray'}">${c.ativo ? 'Ativo' : 'Inativo'}</span></td>
    <td><button class="btn btn-sm btn-outline" onclick="editarPrato('${c.id}')"><i class="fas fa-edit"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="7" class="empty-msg">Nenhum prato.</td></tr>';
}

function abrirModalPratoAdmin() {
  document.getElementById('prato-admin-id').value           = '';
  document.getElementById('prato-admin-nome').value         = '';
  document.getElementById('prato-admin-linha').value        = 'Tradicional';
  document.getElementById('prato-admin-preco').value        = '';
  document.getElementById('prato-admin-kcal').value         = '';
  document.getElementById('prato-admin-tipo-nutri').value   = 'frango';
  document.getElementById('prato-admin-ingredientes').value = '';
  document.getElementById('prato-admin-alergenos').value    = '';
  document.getElementById('prato-admin-img').value          = '';
  document.getElementById('modal-prato-admin-titulo').textContent = 'Novo Prato';
  document.getElementById('modal-prato-admin').classList.add('active');
}

async function editarPrato(id) {
  const c = cardapio.find(x => x.id === id);
  if (!c) return;
  document.getElementById('prato-admin-id').value           = c.id;
  document.getElementById('prato-admin-nome').value         = c.nome;
  document.getElementById('prato-admin-linha').value        = c.linha       || 'Tradicional';
  document.getElementById('prato-admin-preco').value        = c.preco       || '';
  document.getElementById('prato-admin-kcal').value         = c.kcal        || '';
  document.getElementById('prato-admin-tipo-nutri').value   = c.tipo_nutri  || 'frango';
  document.getElementById('prato-admin-ingredientes').value = c.ingredientes || '';
  document.getElementById('prato-admin-alergenos').value    = c.alergenos   || '';
  document.getElementById('prato-admin-img').value          = c.img_url     || '';
  document.getElementById('modal-prato-admin-titulo').textContent = 'Editar Prato';
  document.getElementById('modal-prato-admin').classList.add('active');
}

async function salvarPratoAdmin() {
  const id      = document.getElementById('prato-admin-id').value;
  const payload = {
    nome:         document.getElementById('prato-admin-nome').value.trim(),
    linha:        document.getElementById('prato-admin-linha').value,
    preco:        parseInt(document.getElementById('prato-admin-preco').value) || 30000,
    kcal:         parseInt(document.getElementById('prato-admin-kcal').value)  || 0,
    tipo_nutri:   document.getElementById('prato-admin-tipo-nutri').value,
    ingredientes: document.getElementById('prato-admin-ingredientes').value.trim() || null,
    alergenos:    document.getElementById('prato-admin-alergenos').value.trim()    || null,
    img_url:      document.getElementById('prato-admin-img').value.trim()          || null,
    ativo:        true,
  };
  if (!payload.nome) { mostrarToast('Nome obrigatório', 'error'); return; }
  const { error } = id
    ? await supabaseClient.from('cardapio').update(payload).eq('id', id)
    : await supabaseClient.from('cardapio').insert([payload]);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Prato salvo!');
  fecharModal('modal-prato-admin');
  carregarCardapioAdmin();
}

/* ══════════════════════════════════════════════════════════
   UTILITÁRIOS
   ══════════════════════════════════════════════════════════ */
function fecharModal(id) {
  if (id) { document.getElementById(id)?.classList.remove('active'); return; }
  document.querySelectorAll('.modal-overlay, .modal').forEach(m => m.classList.remove('active'));
}

function mostrarToast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.className   = `toast ${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) fecharModal();
});

function setText(id, val)   { const el = document.getElementById(id); if (el) el.textContent = val; }
function hoje()              { return new Date().toISOString().split('T')[0]; }
function fmtData(d)          { return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'; }
function fmtDataHora(d)      { return d ? new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'; }
function formatBRL(v)        { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatGS(v)         { return v ? '₲ ' + Math.round(v).toLocaleString('es-PY') : '₲ 0'; }
function esc(s)              { return (s || '').replace(/'/g, "\\'"); }
function debounce(fn, ms)    { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function baixarCSV(csv, nome) {
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `${nome}_${hoje()}.csv`;
  a.click();
}