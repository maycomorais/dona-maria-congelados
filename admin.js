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
let graficoFinanceiro   = null;

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

/* ── Mobile Bottom Nav ──────────────────────────────────────── */
// Retorna o botão do bottom-nav correspondente à página
function navBtn(page) {
  return document.querySelector(`.bottom-nav-btn[data-page="${page}"]`) || null;
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    closeMobileDrawer();
  } else {
    drawer.classList.add('open');
    document.getElementById('btn-mais')?.classList.add('active');
  }
}

function closeMobileDrawer() {
  document.getElementById('mobile-drawer')?.classList.remove('open');
  document.getElementById('btn-mais')?.classList.remove('active');
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
    .gte('data_lancamento', mesAtual + '-01')
    .lte('data_lancamento', mesAtual + '-31');
  const lm     = lancMes || [];
  const recBRL = lm.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_brl || 0), 0);
  const desBRL = lm.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor_brl || 0), 0);
  const recGS  = lm.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_gs  || 0), 0);
  const desGS  = lm.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor_gs  || 0), 0);

  setText('stat-saldo-brl', recBRL ? formatBRL(recBRL - desBRL) : formatGS(recGS - desGS));
  setText('stat-saldo-gs',  recBRL ? formatGS(recGS - desGS) : '');
  setText('dash-receita',   recBRL ? formatBRL(recBRL) : formatGS(recGS));
  setText('dash-despesa',   desBRL ? formatBRL(desBRL) : formatGS(desGS));
  setText('dash-saldo',     recBRL ? formatBRL(recBRL - desBRL) : formatGS(recGS - desGS));

  // Próximas entregas
  const proximas = clientes
    .filter(c => c.prox_entrega && c.status === 'ativo')
    .sort((a, b) => new Date(a.prox_entrega) - new Date(b.prox_entrega))
    .slice(0, 5);
  const divProx = document.getElementById('dash-proximas');
  if (divProx) {
    divProx.innerHTML = proximas.length
      ? `<div style="padding:4px 0">` + proximas.map(c => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid var(--borda)">
            <div><strong style="font-size:.9rem">${c.nome}</strong><br><small style="color:var(--texto-suave)">${c.plano || ''}</small></div>
            <span style="font-weight:600;color:var(--laranja);white-space:nowrap;margin-left:12px">${fmtData(c.prox_entrega)}</span>
          </div>`).join('') + `</div>`
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
  // Init gráfico financeiro com mês atual
  initGraficoFinanceiro();
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
  document.getElementById('cli-maps').value            = '';
  document.getElementById('cli-pag-status').value      = 'pago';
  document.getElementById('cli-valor-cobrar').value    = '';
  document.getElementById('cli-valor-cobrar-wrap').style.display = 'none';
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
  document.getElementById('cli-maps').value            = c.link_maps       || '';
  document.getElementById('cli-pag-status').value      = c.pag_status      || 'pago';
  document.getElementById('cli-valor-cobrar').value    = c.valor_cobrar    || '';
  document.getElementById('cli-valor-cobrar-wrap').style.display = (c.pag_status === 'receber_entrega') ? 'block' : 'none';
  document.getElementById('cli-obs').value             = c.obs             || '';
  document.getElementById('modal-cliente-titulo').textContent = 'Editar Cliente';
  document.getElementById('modal-cliente').classList.add('active');
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
    link_maps:       document.getElementById('cli-maps').value.trim()    || null,
    pag_status:      document.getElementById('cli-pag-status').value     || 'pago',
    valor_cobrar:    parseInt(document.getElementById('cli-valor-cobrar').value) || null,
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
    const incluso  = p.incluso_plano === true;
    return `<tr>
      <td><input type="checkbox" class="pedido-check" value="${p.id}" onchange="togglePedidoSelecionado('${p.id}')"></td>
      <td>${fmtDataHora(p.created_at)}</td>
      <td><strong>${p.cliente_nome}</strong>${p.cliente_tel ? `<br><small>${p.cliente_tel}</small>` : ''}${incluso ? `<br><span class="incluso-badge" style="margin-top:3px"><i class="fas fa-box"></i> Incluso no Plano</span>` : ''}</td>
      <td>${p.plano || '—'}</td>
      <td>${pratos.length}</td>
      <td>${incluso ? '<span style="color:#6b7280;font-size:.8rem">—</span>' : (totalVal ? formatGS(totalVal) : '—')}</td>
      <td>${incluso ? '<span style="color:#6b7280;font-size:.8rem">—</span>' : (p.forma_pag || '—')}</td>
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
  const p = pedidos.find(x => x.id === id);
  const { error } = await supabaseClient.from('pedidos')
    .update({ status: 'aceito', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }

  // Auto-criar cliente se não existir / marcar incluso_plano se já ativo
  if (p?.cliente_tel) {
    const tel = p.cliente_tel;
    const { data: existe } = await supabaseClient
      .from('clientes').select('id,status').eq('tel', tel).maybeSingle();
    if (!existe) {
      const { data: novoCli } = await supabaseClient.from('clientes').insert([{
        nome:            p.cliente_nome || 'Cliente',
        tel:             tel,
        plano:           p.plano || 'Individual',
        status:          'ativo',
        total_entregas:  1,
        entregas_feitas: 0,
      }]).select('id').single();
      if (novoCli?.id) {
        await supabaseClient.from('pedidos').update({ cliente_id: novoCli.id }).eq('id', id);
      }
      mostrarToast(`✅ Pedido aceito! Cliente "${p.cliente_nome}" criado.`);
    } else {
      // Cliente já existe — se ativo, marcar entrega como inclusa no plano
      if (existe.status === 'ativo') {
        await supabaseClient.from('pedidos')
          .update({ incluso_plano: true, cliente_id: existe.id }).eq('id', id);
        mostrarToast(`✅ Aceito — entrega inclusa no plano de ${p.cliente_nome}.`);
      } else {
        mostrarToast('Pedido aceito!');
      }
    }
  } else {
    mostrarToast('Pedido aceito!');
  }

  pedidosSelecionados.delete(id);
  await _buscarPedidos();
  await _buscarClientes();
  filtrarPedidosPendentes();
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

  // Auto-criar clientes novos / marcar incluso_plano para ativos
  for (const id of ids) {
    const p = pedidos.find(x => x.id === id);
    if (!p?.cliente_tel) continue;
    const { data: existe } = await supabaseClient
      .from('clientes').select('id,status').eq('tel', p.cliente_tel).maybeSingle();
    if (!existe) {
      const { data: novoCli } = await supabaseClient.from('clientes').insert([{
        nome: p.cliente_nome || 'Cliente', tel: p.cliente_tel,
        plano: p.plano || 'Individual', status: 'ativo',
        total_entregas: 1, entregas_feitas: 0,
      }]).select('id').single();
      if (novoCli?.id) await supabaseClient.from('pedidos').update({ cliente_id: novoCli.id }).eq('id', id);
    } else if (existe.status === 'ativo') {
      await supabaseClient.from('pedidos')
        .update({ incluso_plano: true, cliente_id: existe.id }).eq('id', id);
    }
  }

  mostrarToast(`${ids.length} pedido(s) aceito(s)!`);
  pedidosSelecionados.clear();
  await _buscarPedidos();
  await _buscarClientes();
  filtrarPedidosPendentes();
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
let editPratosAtual = [];

function renderizarPratosEdicao() {
  const lista = document.getElementById('edit-pratos-lista');
  if (!lista) return;
  if (!editPratosAtual.length) {
    lista.innerHTML = '<p style="color:#9ca3af;font-style:italic;padding:10px 6px;font-size:.875rem">Nenhum prato adicionado</p>';
    return;
  }
  lista.innerHTML = editPratosAtual.map((pr, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:#fff;border:1px solid #e5e4e0;border-radius:8px;margin-bottom:6px">
      <span style="flex:1;font-weight:500;font-size:.9rem">${pr.nome}</span>
      <div style="display:flex;align-items:center;gap:6px;background:#f5f4f0;border-radius:6px;padding:2px 6px">
        <button onclick="editQtd(${i},-1)" style="width:24px;height:24px;border:none;background:none;cursor:pointer;font-size:1rem;color:#6b7280;display:flex;align-items:center;justify-content:center;border-radius:4px" onmouseover="this.style.background='#e5e4e0'" onmouseout="this.style.background='none'">−</button>
        <span style="font-weight:700;min-width:22px;text-align:center;font-size:.9rem">${pr.qtd || 1}</span>
        <button onclick="editQtd(${i},1)" style="width:24px;height:24px;border:none;background:none;cursor:pointer;font-size:1rem;color:#6b7280;display:flex;align-items:center;justify-content:center;border-radius:4px" onmouseover="this.style.background='#e5e4e0'" onmouseout="this.style.background='none'">+</button>
      </div>
      <button onclick="editRemovePrato(${i})" style="width:28px;height:28px;border:1px solid #fecaca;background:#fef2f2;color:#ef4444;border-radius:6px;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center" title="Remover"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

function editQtd(idx, delta) {
  if (!editPratosAtual[idx]) return;
  editPratosAtual[idx].qtd = Math.max(1, (editPratosAtual[idx].qtd || 1) + delta);
  renderizarPratosEdicao();
}

function editRemovePrato(idx) {
  editPratosAtual.splice(idx, 1);
  renderizarPratosEdicao();
}

function adicionarPratoEdicao() {
  const sel = document.getElementById('edit-add-prato-select');
  const id  = sel?.value;
  if (!id) return;
  const prato = cardapio.find(c => c.id === id);
  if (!prato) return;
  const exist = editPratosAtual.find(p => p.id === id);
  if (exist) { exist.qtd = (exist.qtd || 1) + 1; }
  else { editPratosAtual.push({ id: prato.id, nome: prato.nome, qtd: 1, linha: prato.linha, preco: prato.preco, kcal: prato.kcal }); }
  sel.value = '';
  renderizarPratosEdicao();
}

// schema pedidos: cliente_nome, cliente_tel, plano, pratos(jsonb), observacoes, forma_pag, status
async function abrirModalEditarPedido(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-pedido-id').value    = p.id;
  document.getElementById('edit-cliente-nome').value = p.cliente_nome || '';
  document.getElementById('edit-cliente-tel').value  = p.cliente_tel  || '';
  document.getElementById('edit-plano').value        = p.plano        || '';
  document.getElementById('edit-status').value       = p.status       || 'pendente';
  document.getElementById('edit-obs').value          = p.observacoes  || '';

  // populate dish select
  const addSel = document.getElementById('edit-add-prato-select');
  if (addSel && cardapio.length) {
    addSel.innerHTML = '<option value="">Selecionar prato para adicionar...</option>' +
      cardapio.filter(c => c.ativo !== false).map(c =>
        `<option value="${c.id}">[${c.linha}] ${c.nome}</option>`).join('');
  }

  // parse existing pratos
  editPratosAtual = (Array.isArray(p.pratos) ? p.pratos : []).map(pr => ({ ...pr, qtd: pr.qtd || 1 }));
  renderizarPratosEdicao();
  document.getElementById('modal-editar-pedido').classList.add('active');
}

async function salvarEdicaoPedido() {
  const id = document.getElementById('edit-pedido-id').value;
  const { error } = await supabaseClient.from('pedidos').update({
    cliente_nome: document.getElementById('edit-cliente-nome').value,
    cliente_tel:  document.getElementById('edit-cliente-tel').value,
    plano:        document.getElementById('edit-plano').value,
    status:       document.getElementById('edit-status').value,
    pratos:       editPratosAtual,
    observacoes:  document.getElementById('edit-obs').value,
    updated_at:   new Date().toISOString(),
  }).eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Pedido atualizado!');
  fecharModal('modal-editar-pedido');
  await _buscarPedidos();
  // refresh whichever page is active
  if (document.getElementById('page-pedidos-pendentes')?.classList.contains('active')) filtrarPedidosPendentes();
  if (document.getElementById('page-pedidos-todos')?.classList.contains('active')) filtrarPedidos();
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
    const incluso = p.incluso_plano === true;

    let pagCell, valorCell, formaCell;
    if (incluso) {
      pagCell   = `<span class="incluso-badge"><i class="fas fa-box"></i> Incluso no Plano</span>`;
      valorCell = `<span style="color:#6b7280;font-size:.8rem">—</span>`;
      formaCell = `<span style="color:#6b7280;font-size:.8rem">—</span>`;
    } else {
      const pagSt  = p.pagamento_status || 'em_aberto';
      const pagCls = { pago:'pag-badge--pago', receber_entrega:'pag-badge--receber', em_aberto:'pag-badge--aberto' }[pagSt];
      pagCell   = `<select class="pag-badge ${pagCls}" onchange="salvarPagamentoStatus('${p.id}', this.value, this)">
          <option value="em_aberto" ${pagSt==='em_aberto'?'selected':''}>⏳ Em aberto</option>
          <option value="pago" ${pagSt==='pago'?'selected':''}>✅ Pago</option>
          <option value="receber_entrega" ${pagSt==='receber_entrega'?'selected':''}>💵 Receber</option>
        </select>`;
      valorCell = totalVal ? formatGS(totalVal) : '—';
      formaCell = p.forma_pag || '—';
    }

    return `<tr class="${incluso ? 'tr-incluso' : ''}">
      <td>${fmtDataHora(p.created_at)}</td>
      <td><strong>${p.cliente_nome}</strong></td>
      <td><span class="badge ${sc}">${p.status}</span></td>
      <td>${pagCell}</td>
      <td>${p.plano || '—'}</td>
      <td>${pratos.length}</td>
      <td>${valorCell}</td>
      <td>${formaCell}</td>
      <td><button class="btn btn-sm btn-outline" onclick="abrirModalEditarPedido('${p.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="excluirPedido('${p.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" class="empty-msg">Nenhum pedido.</td></tr>';
}

async function salvarPagamentoStatus(pedidoId, novoStatus, selectEl) {
  const { error } = await supabaseClient.from('pedidos')
    .update({ pagamento_status: novoStatus, updated_at: new Date().toISOString() })
    .eq('id', pedidoId);
  if (error) { mostrarToast('Erro ao salvar: ' + error.message, 'error'); return; }
  selectEl.className = 'pag-badge ' + { pago:'pag-badge--pago', receber_entrega:'pag-badge--receber', em_aberto:'pag-badge--aberto' }[novoStatus];
  const p = pedidos.find(x => x.id === pedidoId);
  if (p) p.pagamento_status = novoStatus;
  mostrarToast('Pagamento atualizado!');
}

async function excluirPedido(id) {
  if (!confirm('Excluir este pedido permanentemente?')) return;
  const { error } = await supabaseClient.from('pedidos').delete().eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Pedido excluído!');
  await _buscarPedidos();
  filtrarPedidos();
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
   LISTA DA SEMANA — redesign completo
   ══════════════════════════════════════════════════════════ */

/* ── helpers de semana ISO ── */
function getISOWeekStr(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function semanaParaDatas(semStr) {
  const [ano, ww] = semStr.split('-W');
  const year = parseInt(ano), week = parseInt(ww);
  const jan4 = new Date(year, 0, 4);
  const jan4Dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - jan4Dow + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [monday.toISOString().split('T')[0], sunday.toISOString().split('T')[0]];
}

function popularSelectSemanas(sel) {
  sel.innerHTML = '';
  const hoje = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getTime() - i * 7 * 86400000);
    const semStr = getISOWeekStr(d);
    const [de, ate] = semanaParaDatas(semStr);
    const label = `${fmtData(de)} – ${fmtData(ate)}`;
    sel.add(new Option(label, semStr));
  }
}

/* ── estado semana ── */
let semanaClientesData    = {};
let semanaClientesSel     = new Set();

async function carregarSemana() {
  const sel = document.getElementById('semana-select');
  if (!sel) return;
  if (!sel.options.length) popularSelectSemanas(sel);

  const semStr = sel.value || getISOWeekStr(new Date());
  if (!sel.value) sel.value = semStr;
  const [de, ate] = semanaParaDatas(semStr);

  const tituloEl = document.getElementById('semana-titulo');
  if (tituloEl) tituloEl.textContent = `Entregas de ${fmtData(de)} a ${fmtData(ate)}`;

  const container = document.getElementById('semana-clientes-list');
  if (!container) return;
  container.innerHTML = '<p class="empty-msg">Carregando...</p>';

  const { data, error } = await supabaseClient
    .from('pedidos')
    .select('*, clientes(nome, endereco, tel)')
    .in('status', ['aceito', 'em_producao', 'pronto', 'em_entrega', 'entregue'])
    .gte('created_at', de)
    .lte('created_at', ate + 'T23:59:59')
    .order('created_at');

  if (error) { container.innerHTML = '<p class="empty-msg">Erro ao carregar dados.</p>'; return; }
  if (!data?.length) { container.innerHTML = '<p class="empty-msg">Nenhuma entrega para esta semana.</p>'; return; }

  // Agrupar por cliente
  semanaClientesData = {};
  semanaClientesSel  = new Set();
  data.forEach(p => {
    const nome = p.clientes?.nome || p.cliente_nome || 'Sem nome';
    if (!semanaClientesData[nome]) {
      semanaClientesData[nome] = {
        nome,
        endereco: p.clientes?.endereco || '—',
        pedidos: [],
      };
    }
    semanaClientesData[nome].pedidos.push(p);
  });

  renderizarClientesSemana();
}

/* ── chave única para agrupar pratos idênticos ── */
function chaveAgrupamento(pr) {
  return pr.nome + '||' + formatarAcomp(pr);
}

function renderizarClientesSemana() {
  const container = document.getElementById('semana-clientes-list');
  if (!container) return;
  const lista = Object.values(semanaClientesData);
  if (!lista.length) { container.innerHTML = '<p class="empty-msg">Nenhuma entrega.</p>'; return; }

  container.innerHTML = lista.map((cli, idx) => {
    // Agrupar pratos idênticos (mesma proteína + mesmo acomp)
    const grupoMap = {};
    cli.pedidos.forEach(p => {
      (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
        const chave = chaveAgrupamento(pr);
        if (!grupoMap[chave]) {
          grupoMap[chave] = { pr: { ...pr }, qtd: 0, status: p.status };
        }
        grupoMap[chave].qtd += (pr.qtd || 1);
      });
    });
    const grupos = Object.values(grupoMap);
    const totalPratos = grupos.reduce((s, g) => s + g.qtd, 0);
    const isSel = semanaClientesSel.has(cli.nome);

    const badgeCls = s => ({ aceito:'badge-green', entregue:'badge-blue', em_producao:'badge-orange', pronto:'badge-orange', em_entrega:'badge-blue' }[s] || 'badge-gray');

    return `
    <div class="semana-cli-row ${isSel ? 'semana-cli-row--sel' : ''}" id="scr-${idx}">
      <div class="semana-cli-header" onclick="toggleSemanaRow(${idx})">
        <div style="display:flex;align-items:center;gap:12px">
          <input type="checkbox" class="semana-check"
            onclick="event.stopPropagation();toggleSelSemana('${esc(cli.nome)}',this)"
            ${isSel?'checked':''}
            style="width:16px;height:16px;cursor:pointer">
          <div>
            <span class="semana-cli-nome">${cli.nome}</span>
            ${cli.endereco !== '—' ? `<span class="semana-cli-end">📍 ${cli.endereco}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="badge badge-blue" style="font-size:.75rem">${totalPratos} prato${totalPratos!==1?'s':''}</span>
          <i class="fas fa-chevron-down semana-chev" id="chev-${idx}"></i>
        </div>
      </div>
      <div class="semana-cli-body" id="sbody-${idx}">
        <table style="width:100%;font-size:.875rem;border-collapse:collapse">
          <thead>
            <tr>
              <th style="padding:8px 20px;text-align:left;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#fafaf8;border-bottom:1px solid #e5e4e0">Proteína</th>
              <th style="padding:8px 20px;text-align:left;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#fafaf8;border-bottom:1px solid #e5e4e0">Acompanhamentos</th>
              <th style="padding:8px 20px;text-align:center;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#fafaf8;border-bottom:1px solid #e5e4e0;width:60px">Qtd</th>
              <th style="padding:8px 20px;text-align:left;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#fafaf8;border-bottom:1px solid #e5e4e0;width:90px">Linha</th>
            </tr>
          </thead>
          <tbody>
            ${grupos.map(g => {
              const pr = g.pr;
              const personalBadge = pr.personalizado ? ' <span style="font-size:.68rem;background:#fff7ed;color:#c2410c;padding:1px 6px;border-radius:4px;font-weight:600;vertical-align:middle">custom</span>' : '';
              return `<tr>
                <td style="padding:9px 20px;border-bottom:1px solid #f0f0ec;font-weight:600">${pr.nome}${personalBadge}</td>
                <td style="padding:9px 20px;border-bottom:1px solid #f0f0ec;color:#6b7280">${formatarAcomp(pr)}</td>
                <td style="padding:9px 20px;border-bottom:1px solid #f0f0ec;text-align:center;font-weight:700;font-size:1rem;color:#2d9b4f">${g.qtd}</td>
                <td style="padding:9px 20px;border-bottom:1px solid #f0f0ec"><span class="badge badge-gray" style="font-size:.7rem">${pr.linhaNome||pr.linha||'—'}</span></td>
              </tr>`;
            }).join('')}
            <tr style="background:#f5faf6">
              <td colspan="2" style="padding:10px 20px;font-weight:700;color:#0d2112">TOTAL</td>
              <td style="padding:10px 20px;font-weight:700;color:#2d9b4f;text-align:center">${totalPratos}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  atualizarToolbarSemana();
}

function formatarAcomp(pr) {
  const acomps = Array.isArray(pr.acompanhamentos) ? pr.acompanhamentos : [];
  const partes = acomps.map(a =>
    pr.personalizado ? `${a.nome} (${a.gramas}g)` : a.nome
  );
  if (pr.seleta !== false) {
    partes.push(pr.personalizado && pr.gramasSeleta ? `Seleta de Legumes (${pr.gramasSeleta}g)` : 'Seleta de Legumes');
  }
  if (!partes.length) return pr.seleta === false ? 'Sem acompanhamento' : 'Seleta de Legumes';
  return partes.join(' + ');
}

function toggleSemanaRow(idx) {
  const body = document.getElementById('sbody-' + idx);
  const chev = document.getElementById('chev-' + idx);
  if (!body) return;
  const open = body.style.display !== 'none' && body.style.display !== '';
  body.style.display = open ? 'none' : 'block';
  if (chev) chev.style.transform = open ? '' : 'rotate(180deg)';
}

function toggleSelSemana(nome, cb) {
  if (cb.checked) semanaClientesSel.add(nome);
  else semanaClientesSel.delete(nome);
  // update row highlight
  const lista = Object.values(semanaClientesData);
  const idx = lista.findIndex(c => c.nome === nome);
  if (idx >= 0) {
    const row = document.getElementById('scr-' + idx);
    if (row) row.classList.toggle('semana-cli-row--sel', cb.checked);
  }
  atualizarToolbarSemana();
}

function selecionarTodosSemana(checked) {
  document.querySelectorAll('.semana-check').forEach(cb => {
    cb.checked = checked;
    const nome = cb.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (nome) {
      if (checked) semanaClientesSel.add(nome);
      else semanaClientesSel.delete(nome);
    }
  });
  document.querySelectorAll('.semana-cli-row').forEach(r => r.classList.toggle('semana-cli-row--sel', checked));
  atualizarToolbarSemana();
}

function atualizarToolbarSemana() {
  const toolbar = document.getElementById('semana-toolbar');
  const cnt     = document.getElementById('semana-sel-count');
  if (!toolbar) return;
  toolbar.style.display = semanaClientesSel.size ? 'flex' : 'none';
  if (cnt) cnt.textContent = semanaClientesSel.size + ' cliente' + (semanaClientesSel.size !== 1 ? 's' : '') + ' selecionado' + (semanaClientesSel.size !== 1 ? 's' : '');
}

function mostrarResumoSelecionados() {
  const card    = document.getElementById('card-resumo-semana');
  const content = document.getElementById('resumo-semana-content');
  if (!card || !content) return;

  const selecionados = Object.values(semanaClientesData).filter(c => semanaClientesSel.has(c.nome));
  if (!selecionados.length) { mostrarToast('Nenhum cliente selecionado', 'error'); return; }

  // Consolidado (proteína): group by nome, merge qtd — mas acomp pode variar, manter distintos
  const consolidadoSimples = {};
  selecionados.forEach(cli => {
    cli.pedidos.forEach(p => {
      (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
        consolidadoSimples[pr.nome] = (consolidadoSimples[pr.nome] || 0) + (pr.qtd || 1);
      });
    });
  });
  const totalGeral = Object.values(consolidadoSimples).reduce((a, b) => a + b, 0);
  const linhas = Object.entries(consolidadoSimples).sort((a, b) => b[1] - a[1]);

  content.innerHTML = `
    <div style="padding:20px">
      <p style="font-size:.875rem;color:#6b7280;margin-bottom:16px">
        <strong>${selecionados.length}</strong> cliente${selecionados.length!==1?'s':''} · <strong>${totalGeral}</strong> prato${totalGeral!==1?'s':''} no total
      </p>
      <!-- Por cliente -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-bottom:20px">
        ${selecionados.map(cli => {
          const grupoMap = {};
          cli.pedidos.forEach(p => {
            (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
              const chave = chaveAgrupamento(pr);
              if (!grupoMap[chave]) grupoMap[chave] = { pr: { ...pr }, qtd: 0 };
              grupoMap[chave].qtd += (pr.qtd||1);
            });
          });
          const grupos = Object.values(grupoMap);
          const total = grupos.reduce((s, g) => s + g.qtd, 0);
          return `<div style="background:#f9f9f7;border:1px solid #e5e4e0;border-radius:10px;padding:14px">
            <div style="font-weight:700;font-size:.9rem;margin-bottom:10px;color:#111827">${cli.nome}</div>
            <table style="width:100%;font-size:.8rem;border-collapse:collapse">
              <thead><tr>
                <th style="text-align:center;padding:3px 0;color:#9ca3af;font-size:.72rem;text-transform:uppercase;width:32px">Qtd</th>
                <th style="text-align:left;padding:3px 6px;color:#9ca3af;font-size:.72rem;text-transform:uppercase">Proteína</th>
                <th style="text-align:left;padding:3px 6px;color:#9ca3af;font-size:.72rem;text-transform:uppercase">Acomp</th>
              </tr></thead>
              <tbody>
                ${grupos.map(g => `<tr>
                  <td style="padding:4px 0;border-bottom:1px solid #f0f0ec;text-align:center;font-weight:700;color:#2d9b4f">${g.qtd}x</td>
                  <td style="padding:4px 6px;border-bottom:1px solid #f0f0ec;font-weight:600">${g.pr.nome}</td>
                  <td style="padding:4px 6px;border-bottom:1px solid #f0f0ec;color:#6b7280;font-size:.78rem">${formatarAcomp(g.pr)}</td>
                </tr>`).join('')}
                <tr style="background:#f5faf6"><td style="padding:5px 0;font-weight:700;text-align:center">${total}</td><td style="padding:5px 0;font-weight:700" colspan="2">Total</td></tr>
              </tbody>
            </table>
          </div>`;
        }).join('')}
      </div>
      <!-- Consolidado de produção (proteína agrupada) -->
      <div style="background:#0d2112;border-radius:10px;padding:16px 20px">
        <div style="color:#d1fae5;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Consolidado de Produção</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
          ${linhas.map(([n,q]) => `<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.06);border-radius:6px;padding:8px 12px">
            <span style="color:#fff;font-size:.875rem">${n}</span>
            <span style="background:#2d9b4f;color:#fff;font-weight:700;padding:2px 10px;border-radius:12px;font-size:.8rem">${q}</span>
          </div>`).join('')}
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1);color:#6ee7b7;font-weight:700;text-align:right">
          Total: ${totalGeral} marmita${totalGeral!==1?'s':''}
        </div>
      </div>
    </div>`;

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });
}

function exportarSemanaExcel() {
  const lista = Object.values(semanaClientesData);
  if (!lista.length) { mostrarToast('Nenhum dado para exportar', 'error'); return; }

  const rows = [['Cliente','Endereço','Linha','Proteína','Acompanhamentos','Qtd','Personalizado','Status']];
  lista.forEach(cli => {
    cli.pedidos.forEach(p => {
      (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
        rows.push([
          cli.nome,
          cli.endereco,
          pr.linhaNome || pr.linha || '—',
          pr.nome,
          formatarAcomp(pr),
          pr.qtd || 1,
          pr.personalizado ? 'Sim' : 'Não',
          p.status
        ]);
      });
    });
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
  baixarCSV(csv, 'lista_semana');
  mostrarToast('Exportado!');
}

function imprimirListaSemana() {
  const lista = Object.values(semanaClientesData);
  if (!lista.length) { mostrarToast('Nenhum dado para imprimir', 'error'); return; }
  const titulo = document.getElementById('semana-titulo')?.textContent || 'Lista da Semana';

  let html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Doña Maria — ${titulo}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 14mm 18mm; color: #111; font-size: 16px; }
    h1 { font-size: 22px; margin-bottom: 2px; }
    .sub { color: #666; font-size: 13px; margin-bottom: 26px; }
    .cli { margin-bottom: 28px; page-break-inside: avoid; }
    .cli-nome { font-size: 17px; font-weight: bold; margin-bottom: 2px; }
    .cli-end { font-size: 13px; color: #888; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    th { background: #f0f0e8; padding: 5px 10px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
    td { padding: 6px 10px; border-bottom: 1px solid #e8e8e0; vertical-align: top; }
    .qty { font-weight: bold; color: #1a6b2e; text-align: center; }
    .prot { font-weight: 600; }
    .acomp { color: #555; }
    .custom { font-size: 11px; background: #fff7ed; color: #c2410c; padding: 1px 5px; border-radius: 3px; }
    .total-row { background: #f5fff5; font-weight: bold; }
    @media print { body { padding: 8mm 12mm; } }
  </style></head><body>
  <h1>🍽 Doña Maria</h1>
  <div class="sub">${titulo} &nbsp;·&nbsp; Impresso em ${new Date().toLocaleString('pt-BR')}</div>`;

  lista.forEach(cli => {
    // Group identical dishes
    const grupoMap = {};
    cli.pedidos.forEach(p => {
      (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
        const chave = chaveAgrupamento(pr);
        if (!grupoMap[chave]) grupoMap[chave] = { pr: { ...pr }, qtd: 0 };
        grupoMap[chave].qtd += (pr.qtd || 1);
      });
    });
    const grupos = Object.values(grupoMap);
    const total = grupos.reduce((s, g) => s + g.qtd, 0);

    html += `<div class="cli">
      <div class="cli-nome">${cli.nome}</div>
      ${cli.endereco !== '—' ? `<div class="cli-end">📍 ${cli.endereco}</div>` : ''}
      <table>
        <thead><tr><th style="width:50px">Qtd</th><th>Proteína</th><th>Acompanhamentos</th></tr></thead>
        <tbody>
          ${grupos.map(g => `<tr>
            <td class="qty">${g.qtd}x</td>
            <td class="prot">${g.pr.nome}${g.pr.personalizado?' <span class="custom">custom</span>':''}</td>
            <td class="acomp">${formatarAcomp(g.pr)}</td>
          </tr>`).join('')}
          <tr class="total-row"><td class="qty">${total}</td><td colspan="2">Total</td></tr>
        </tbody>
      </table>
    </div>`;
  });

  html += `</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

/* ══════════════════════════════════════════════════════════
   PRODUÇÃO DO SÁBADO
   ══════════════════════════════════════════════════════════ */

// Fator de cocção por tipo de proteína (peso cru ÷ fator = peso cozido necessário)
const FATOR_COCCAO = {
  frango:      1.35,  // frango cozido perde ~26%
  bovina:      1.30,  // bovina cozida perde ~23%
  suino:       1.28,
  peixe:       1.25,
  default:     1.30,
};
// Mapeamento de nome de prato → tipo de proteína (por palavras-chave)
function tipoProteinaFromNome(nome) {
  const n = nome.toLowerCase();
  if (/frango|peito|sobrecoxa|coxa|asa|panqueca de frango|escondidinho.*(frango)/i.test(n)) return 'frango';
  if (/suino|suíno|lombo|costelinha|bisteca|carré|iscas/i.test(n)) return 'suino';
  if (/peixe|tilapia|salmão|atum|bacalhau/i.test(n)) return 'peixe';
  if (/carne|bovina|patinho|picadinho|alcatra|costela|moida|moída|panela|strogon|almondega/i.test(n)) return 'bovina';
  return 'default';
}

// Peso base de proteína por prato (gramas cruas necessárias por unidade)
const PESO_BASE_PROTEINA = 170; // g cru padrão por marmita

let producaoData = []; // guarda os pedidos da semana para insumos

async function carregarProducao() {
  const sel = document.getElementById('prod-semana-select');
  if (sel && !sel.options.length) popularSelectSemanas(sel);
  const semStr = sel?.value || getISOWeekStr(new Date());
  if (sel && !sel.value) sel.value = semStr;
  const [de, ate] = semanaParaDatas(semStr);

  const { data } = await supabaseClient.from('pedidos').select('pratos')
    .in('status', ['aceito','em_producao','pronto','em_entrega'])
    .gte('created_at', de).lte('created_at', ate + 'T23:59:59');

  producaoData = data || [];

  // Contagem com linha
  const contagemMap = {};
  producaoData.forEach(p => {
    (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
      if (!contagemMap[pr.nome]) {
        contagemMap[pr.nome] = { qtd: 0, linha: pr.linhaNome || pr.linha || '—' };
      }
      contagemMap[pr.nome].qtd += (pr.qtd || 1);
    });
  });
  const itens = Object.entries(contagemMap)
    .map(([nome, v]) => ({ nome, qtd: v.qtd, linha: v.linha }))
    .sort((a, b) => b.qtd - a.qtd);

  const totalMarmitas = itens.reduce((s, it) => s + it.qtd, 0);
  setText('prod-total-marmitas', totalMarmitas + ' marmitas');

  const grid = document.getElementById('grid-producao');
  if (grid) grid.innerHTML = itens.map(it =>
    `<div class="card" style="padding:16px;text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:#e76f51">${it.qtd}</div>
      <div style="font-size:.85rem;font-weight:600;margin-top:4px">${it.nome}</div>
      ${it.linha !== '—' ? `<div style="font-size:.75rem;color:#9ca3af;margin-top:2px">${it.linha}</div>` : ''}
    </div>`).join('') || '<p class="empty-msg">Nenhum pedido aceito.</p>';

  const tbody = document.getElementById('tbody-producao');
  if (tbody) tbody.innerHTML = itens.map(it =>
    `<tr>
      <td>${it.nome}</td>
      <td>${it.linha}</td>
      <td><strong>${it.qtd}</strong></td>
    </tr>`).join('');

  // Calcular insumos por proteína
  const insumos = {};
  producaoData.forEach(p => {
    (Array.isArray(p.pratos) ? p.pratos : []).forEach(pr => {
      const tipo = tipoProteinaFromNome(pr.nome);
      const fator = FATOR_COCCAO[tipo];
      const pesoCru = pr.personalizado && pr.gramasProteina ? pr.gramasProteina * fator : PESO_BASE_PROTEINA * fator;
      const chave = `${pr.nome}__${tipo}`;
      if (!insumos[chave]) insumos[chave] = { nome: pr.nome, tipo, fatorCoccao: fator, qtd: 0, totalCru: 0 };
      const qtd = pr.qtd || 1;
      insumos[chave].qtd += qtd;
      insumos[chave].totalCru += pesoCru * qtd;
    });
  });

  const tbodyInsumos = document.getElementById('tbody-insumos');
  if (tbodyInsumos) {
    const insumosArr = Object.values(insumos).sort((a, b) => b.totalCru - a.totalCru);
    tbodyInsumos.innerHTML = insumosArr.map(ins =>
      `<tr>
        <td><strong>${ins.nome}</strong></td>
        <td><span class="badge badge-gray" style="font-size:.72rem">${ins.tipo}</span></td>
        <td style="text-align:center">${ins.qtd}</td>
        <td style="text-align:center">${ins.fatorCoccao.toFixed(2)}x</td>
        <td style="font-weight:700;color:#2d9b4f;text-align:right">${(ins.totalCru / 1000).toFixed(2)} kg</td>
        <td style="color:#6b7280;text-align:right">${Math.round(ins.totalCru)} g</td>
      </tr>`).join('') || '<tr><td colspan="6" class="empty-msg">Sem dados</td></tr>';
    const totalKg = Object.values(insumos).reduce((s, ins) => s + ins.totalCru, 0);
    document.getElementById('insumos-total-kg') && (document.getElementById('insumos-total-kg').textContent = (totalKg/1000).toFixed(2) + ' kg total (proteínas)');
  }
}

function imprimirProducao() {
  const itens = [];
  document.querySelectorAll('#tbody-producao tr').forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length >= 3) itens.push({ nome: tds[0].textContent, linha: tds[1].textContent, qtd: tds[2].textContent });
  });
  if (!itens.length) { mostrarToast('Sem dados para imprimir', 'error'); return; }

  const titulo = document.getElementById('prod-semana-select');
  const semTxt = titulo?.options[titulo.selectedIndex]?.text || '';
  const data = new Date().toLocaleString('pt-BR');
  const total = itens.reduce((s, it) => s + parseInt(it.qtd) || 0, 0);

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Produção — Doña Maria</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 14mm 18mm; font-size: 16px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 2px; }
    .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    th { background: #f0f0e8; padding: 6px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 7px 12px; border-bottom: 1px solid #e8e8e0; }
    .qty { font-weight: bold; color: #1a6b2e; text-align: center; width: 70px; }
    .total-row { background: #f0fff4; font-weight: bold; }
    @media print { body { padding: 8mm 12mm; } }
  </style></head><body>
  <h1>🍽 Produção do Sábado</h1>
  <div class="sub">Doña Maria &nbsp;·&nbsp; ${semTxt} &nbsp;·&nbsp; ${data}</div>
  <table>
    <thead><tr><th>Proteína</th><th>Linha</th><th style="text-align:center">Qtd</th></tr></thead>
    <tbody>
      ${itens.map(it => `<tr><td>${it.nome}</td><td>${it.linha}</td><td class="qty">${it.qtd}</td></tr>`).join('')}
      <tr class="total-row"><td colspan="2">TOTAL</td><td class="qty">${total}</td></tr>
    </tbody>
  </table>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

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

  // Buscar link_maps dos clientes pelos pedidos
  const clientesTels = pedidosRota.map(p => p.cliente_tel).filter(Boolean);
  let mapsMap = {};
  if (clientesTels.length) {
    const { data: cliData } = await supabaseClient
      .from('clientes').select('tel,link_maps').in('tel', clientesTels);
    (cliData || []).forEach(c => { if (c.link_maps) mapsMap[c.tel] = c.link_maps; });
  }

  const dataBr = new Date().toLocaleDateString('pt-BR');
  let msg = `*🛵 ROTA DOÑA MARIA — ${dataBr}*\n\n`;
  pedidosRota.forEach((p, i) => {
    const maps = mapsMap[p.cliente_tel];
    msg += `*${i+1}. ${p.cliente_nome}*\n`;
    msg += `📞 ${p.cliente_tel || '—'}\n`;
    if (maps) msg += `📍 ${maps}\n`;
    msg += `\n`;
  });
  msg += `Total: ${pedidosRota.length} entrega${pedidosRota.length !== 1 ? 's' : ''}`;

  const tel = motoboy?.telefone?.replace(/\D/g, '');
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');

  mostrarToast('Rota enviada ao motoboy!');
  fecharModal('modal-criar-rota');
  pedidosSelecionados.clear();
  await _buscarPedidos();
  filtrarPedidosPendentes();
}

/* ══════════════════════════════════════════════════════════
   ROTA SEMANA — enviar motoboy por clientes selecionados
   ══════════════════════════════════════════════════════════ */
function abrirModalRotaSemana() {
  if (!semanaClientesSel.size) { mostrarToast('Selecione pelo menos 1 cliente', 'error'); return; }
  // Populate motoboys dropdown
  const sel = document.getElementById('rota-semana-motoboy');
  sel.innerHTML = '<option value="">Selecione...</option>';
  motoboys.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.textContent = m.nome;
    sel.appendChild(opt);
  });
  document.getElementById('rota-semana-preview').style.display = 'none';
  document.getElementById('modal-rota-semana').classList.add('active');
}

function _buildMsgRotaSemana() {
  const dataBr = new Date().toLocaleDateString('pt-BR');
  const clisSel = Object.values(semanaClientesData).filter(c => semanaClientesSel.has(c.nome));
  let msg = `🛵 *ROTA DOÑA MARIA — ${dataBr}*\n\n`;
  clisSel.forEach((cli, i) => {
    const totalPratos = cli.pedidos.reduce((s, p) => {
      return s + (Array.isArray(p.pratos) ? p.pratos.reduce((ss, pr) => ss + (pr.qtd || 1), 0) : 0);
    }, 0);
    const totalVal = cli.pedidos.reduce((s, p) => {
      return s + (Array.isArray(p.pratos) ? p.pratos.reduce((ss, pr) => ss + (pr.precoItem || 0), 0) : 0);
    }, 0);
    // Buscar dados do cliente em memória
    const cliObj = clientes.find(c => c.nome === cli.nome) || {};
    const pagSt = cliObj.pag_status || 'em_aberto';
    const formaPag = cli.pedidos[0]?.forma_pag || '';
    let infoCobranca = '';
    if (pagSt === 'pago') {
      infoCobranca = '✅ *PAGO*';
    } else if (pagSt === 'receber_entrega') {
      const valor = cliObj.valor_cobrar ? `₲ ${cliObj.valor_cobrar.toLocaleString('es-PY')}` : (totalVal ? `₲ ${totalVal.toLocaleString('es-PY')}` : '—');
      const forma = { efetivo_gs: 'Efectivo ₲', efetivo_brl: 'Efectivo R$', pix: 'Pix', tarjeta: 'Tarjeta', cartao: 'Tarjeta', transferencia: 'Transferencia' }[formaPag] || formaPag || 'Efectivo';
      infoCobranca = `💵 *COBRAR NA ENTREGA: ${valor}* (${forma})`;
    } else {
      infoCobranca = '⏳ Em aberto — confirmar antes de entregar';
    }

    msg += `*${i + 1}. ${cli.nome}*\n`;
    msg += `📦 ${totalPratos} prato${totalPratos !== 1 ? 's' : ''}\n`;
    if (cliObj.tel) msg += `📞 ${cliObj.tel}\n`;
    if (cliObj.link_maps) msg += `📍 ${cliObj.link_maps}\n`;
    else if (cliObj.endereco) msg += `📍 ${cliObj.endereco}\n`;
    msg += `${infoCobranca}\n\n`;
  });
  msg += `Total: ${clisSel.length} entrega${clisSel.length !== 1 ? 's' : ''}`;
  return msg;
}

function previewRotaSemana() {
  const prev = document.getElementById('rota-semana-preview');
  prev.textContent = _buildMsgRotaSemana();
  prev.style.display = 'block';
}

async function enviarRotaSemana() {
  const motoboyId = document.getElementById('rota-semana-motoboy').value;
  if (!motoboyId) { mostrarToast('Selecione um motoboy', 'error'); return; }
  const motoboy = motoboys.find(m => m.id === motoboyId);
  const msg = _buildMsgRotaSemana();
  const tel = motoboy?.telefone?.replace(/\D/g, '');
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  fecharModal('modal-rota-semana');
  mostrarToast('Rota enviada ao motoboy!');
}

/* ── Toggle valor_cobrar no modal de cliente ──────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const pagSel = document.getElementById('cli-pag-status');
  if (pagSel) {
    pagSel.addEventListener('change', () => {
      const wrap = document.getElementById('cli-valor-cobrar-wrap');
      if (wrap) wrap.style.display = pagSel.value === 'receber_entrega' ? 'block' : 'none';
    });
  }
});

/* ══════════════════════════════════════════════════════════
   GRÁFICO FINANCEIRO — Receitas vs Despesas com comparação
   ══════════════════════════════════════════════════════════ */
function toggleComparacaoPeriodo() {
  const checked = document.getElementById('graf-comparar').checked;
  const wrap = document.getElementById('graf-comparacao-wrap');
  if (wrap) wrap.style.display = checked ? 'flex' : 'none';
}

async function carregarGraficoFinanceiro() {
  const d1ini = document.getElementById('graf-data-inicio')?.value;
  const d1fim = document.getElementById('graf-data-fim')?.value;
  const agrup = document.getElementById('graf-agrupamento')?.value || 'mes';
  const comparar = document.getElementById('graf-comparar')?.checked;
  const d2ini = document.getElementById('graf-data2-inicio')?.value;
  const d2fim = document.getElementById('graf-data2-fim')?.value;

  if (!d1ini || !d1fim) { mostrarToast('Selecione o período', 'error'); return; }

  const p1 = await _buscarDadosFinanceiros(d1ini, d1fim, agrup);

  let datasets = [
    {
      label: `Receitas ${fmtPeriodoLabel(d1ini, d1fim)}`,
      data: p1.labels.map((_, i) => p1.receitas[i]),
      backgroundColor: 'rgba(45,155,79,0.7)',
      borderColor: '#2d9b4f',
      borderWidth: 1.5,
      borderRadius: 5,
    },
    {
      label: `Despesas ${fmtPeriodoLabel(d1ini, d1fim)}`,
      data: p1.labels.map((_, i) => p1.despesas[i]),
      backgroundColor: 'rgba(220,38,38,0.6)',
      borderColor: '#dc2626',
      borderWidth: 1.5,
      borderRadius: 5,
    }
  ];
  let labels = p1.labels;

  if (comparar && d2ini && d2fim) {
    const p2 = await _buscarDadosFinanceiros(d2ini, d2fim, agrup);
    // Merge labels
    const allLabels = [...new Set([...p1.labels, ...p2.labels])].sort();
    labels = allLabels;
    const getVal = (labelsArr, vals, lbl) => {
      const i = labelsArr.indexOf(lbl); return i >= 0 ? vals[i] : 0;
    };
    datasets = [
      { label: `Receitas ${fmtPeriodoLabel(d1ini, d1fim)}`, data: allLabels.map(l => getVal(p1.labels, p1.receitas, l)), backgroundColor: 'rgba(45,155,79,0.7)', borderColor: '#2d9b4f', borderWidth: 1.5, borderRadius: 4 },
      { label: `Despesas ${fmtPeriodoLabel(d1ini, d1fim)}`, data: allLabels.map(l => getVal(p1.labels, p1.despesas, l)), backgroundColor: 'rgba(220,38,38,0.55)', borderColor: '#dc2626', borderWidth: 1.5, borderRadius: 4 },
      { label: `Receitas ${fmtPeriodoLabel(d2ini, d2fim)}`, data: allLabels.map(l => getVal(p2.labels, p2.receitas, l)), backgroundColor: 'rgba(59,130,246,0.65)', borderColor: '#3b82f6', borderWidth: 1.5, borderRadius: 4 },
      { label: `Despesas ${fmtPeriodoLabel(d2ini, d2fim)}`, data: allLabels.map(l => getVal(p2.labels, p2.despesas, l)), backgroundColor: 'rgba(249,115,22,0.6)', borderColor: '#f97316', borderWidth: 1.5, borderRadius: 4 },
    ];
    // Resumo comparação
    _renderGraficoResumo(p1, d1ini, d1fim, p2, d2ini, d2fim);
  } else {
    _renderGraficoResumo(p1, d1ini, d1fim, null, null, null);
  }

  const ctx = document.getElementById('chart-financeiro');
  if (!ctx) return;
  if (graficoFinanceiro) graficoFinanceiro.destroy();
  graficoFinanceiro = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 12 } } } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => formatGS(v).replace('₲ ', '₲') } },
        x: { grid: { display: false } }
      }
    }
  });
}

async function _buscarDadosFinanceiros(dataIni, dataFim, agrup) {
  const { data } = await supabaseClient.from('lancamentos')
    .select('tipo, valor_gs, valor_brl, data_lancamento')
    .gte('data_lancamento', dataIni)
    .lte('data_lancamento', dataFim)
    .order('data_lancamento');

  const buckets = {};
  (data || []).forEach(l => {
    const label = _bucketLabel(l.data_lancamento, agrup);
    if (!buckets[label]) buckets[label] = { receita: 0, despesa: 0 };
    const val = l.valor_gs || Math.round((l.valor_brl || 0) * 7700);
    if (l.tipo === 'receita') buckets[label].receita += val;
    else buckets[label].despesa += val;
  });

  const labels = Object.keys(buckets).sort();
  return {
    labels,
    receitas: labels.map(l => buckets[l].receita),
    despesas: labels.map(l => buckets[l].despesa),
    totalReceita: Object.values(buckets).reduce((s, b) => s + b.receita, 0),
    totalDespesa: Object.values(buckets).reduce((s, b) => s + b.despesa, 0),
  };
}

function _bucketLabel(dateStr, agrup) {
  if (!dateStr) return '—';
  if (agrup === 'dia') return dateStr.slice(0, 10);
  if (agrup === 'semana') {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().slice(0, 10);
  }
  return dateStr.slice(0, 7); // mes
}

function fmtPeriodoLabel(ini, fim) {
  const fmtD = d => d ? d.slice(5).replace('-', '/') : '';
  return `(${fmtD(ini)}–${fmtD(fim)})`;
}

function _renderGraficoResumo(p1, d1ini, d1fim, p2, d2ini, d2fim) {
  const wrap = document.getElementById('grafico-resumo-wrap');
  if (!wrap) return;
  const fmt = v => formatGS(v);
  const saldo1 = p1.totalReceita - p1.totalDespesa;
  let html = `<div class="grafico-resumo">
    <div class="gr-col">
      <span class="gr-label">Receitas ${fmtPeriodoLabel(d1ini, d1fim)}</span>
      <strong class="gr-val gr-rec">${fmt(p1.totalReceita)}</strong>
    </div>
    <div class="gr-col">
      <span class="gr-label">Despesas ${fmtPeriodoLabel(d1ini, d1fim)}</span>
      <strong class="gr-val gr-desp">${fmt(p1.totalDespesa)}</strong>
    </div>
    <div class="gr-col">
      <span class="gr-label">Saldo</span>
      <strong class="gr-val ${saldo1 >= 0 ? 'gr-rec' : 'gr-desp'}">${fmt(saldo1)}</strong>
    </div>`;
  if (p2) {
    const saldo2 = p2.totalReceita - p2.totalDespesa;
    const diffRec = p2.totalReceita - p1.totalReceita;
    const diffDesp = p2.totalDespesa - p1.totalDespesa;
    html += `
    <div class="gr-sep"></div>
    <div class="gr-col">
      <span class="gr-label">Receitas ${fmtPeriodoLabel(d2ini, d2fim)}</span>
      <strong class="gr-val" style="color:#3b82f6">${fmt(p2.totalReceita)}</strong>
      <small class="${diffRec >= 0 ? 'gr-diff-pos' : 'gr-diff-neg'}">${diffRec >= 0 ? '▲' : '▼'} ${fmt(Math.abs(diffRec))}</small>
    </div>
    <div class="gr-col">
      <span class="gr-label">Despesas ${fmtPeriodoLabel(d2ini, d2fim)}</span>
      <strong class="gr-val" style="color:#f97316">${fmt(p2.totalDespesa)}</strong>
      <small class="${diffDesp <= 0 ? 'gr-diff-pos' : 'gr-diff-neg'}">${diffDesp >= 0 ? '▲' : '▼'} ${fmt(Math.abs(diffDesp))}</small>
    </div>
    <div class="gr-col">
      <span class="gr-label">Saldo P2</span>
      <strong class="gr-val ${saldo2 >= 0 ? 'gr-rec' : 'gr-desp'}">${fmt(saldo2)}</strong>
    </div>`;
  }
  html += '</div>';
  wrap.innerHTML = html;
}

/* ── Init gráfico com mês atual ─────────────────────────── */
function initGraficoFinanceiro() {
  const hoje = new Date();
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
  const elIni = document.getElementById('graf-data-inicio');
  const elFim = document.getElementById('graf-data-fim');
  if (elIni) elIni.value = ini;
  if (elFim) elFim.value = fim;
  carregarGraficoFinanceiro();
}

/* ══════════════════════════════════════════════════════════
   CAIXA DO MÊS
   ══════════════════════════════════════════════════════════ */
async function carregarCaixa() {
  const sel = document.getElementById('filtro-mes-caixa');
  // Populate if only the placeholder option exists
  if (sel && sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Selecione o mês...</option>';
    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const val = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      sel.add(new Option(label.charAt(0).toUpperCase() + label.slice(1), val));
    }
    // Default to current month
    if (!sel.value) sel.selectedIndex = 1;
  }
  const mes = sel?.value || new Date().toISOString().slice(0, 7);
  if (!mes) { return; } // nothing selected yet

  const { data } = await supabaseClient.from('lancamentos').select('*, clientes(nome)')
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
  if (tbody) tbody.innerHTML = lista.map(l => {
    const nomeCliente = l.clientes?.nome || '—';
    return `<tr>
    <td>${fmtData(l.data_lancamento)}</td>
    <td><span class="badge badge-${l.tipo === 'receita' ? 'green' : 'red'}">${l.tipo}</span></td>
    <td>${l.categoria}</td>
    <td>${l.descricao}</td>
    <td>${l.forma_pagamento || '—'}</td>
    <td class="${l.valor_brl ? 'td-receita' : ''}">${formatBRL(l.valor_brl)}</td>
    <td class="${l.valor_gs ? 'td-receita' : ''}">${formatGS(l.valor_gs)}</td>
    <td>${nomeCliente}</td>
    <td>
      <div class="td-actions">
        <button class="btn btn-sm btn-outline" onclick="editarLancamento('${l.id}')" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="excluirLancamentoCaixa('${l.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
      </div>
    </td>
  </tr>`;
  }).join('') || '<tr><td colspan="9" class="empty-msg">Nenhum lançamento neste mês.</td></tr>';
}

async function excluirLancamentoCaixa(id) {
  if (!confirm('Excluir este lançamento?')) return;
  const { error } = await supabaseClient.from('lancamentos').delete().eq('id', id);
  if (error) { mostrarToast('Erro: ' + error.message, 'error'); return; }
  mostrarToast('Excluído!');
  carregarCaixa();
  if (document.getElementById('page-dashboard')?.classList.contains('active')) carregarDashboard();
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
  // Atualiza o dashboard e caixa se estiverem visíveis
  if (document.getElementById('page-dashboard')?.classList.contains('active')) carregarDashboard();
  if (document.getElementById('page-caixa')?.classList.contains('active')) carregarCaixa();
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