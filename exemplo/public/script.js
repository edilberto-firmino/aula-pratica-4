const form = document.querySelector('#cadastro');
const lista = document.querySelector('#lista');
const mensagem = document.querySelector('#mensagem');
const salvar = document.querySelector('#salvar');

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.dataset.erro = String(erro);
}

async function listar() {
  const resposta = await fetch('/api/alunos');
  if (!resposta.ok) throw new Error('Não foi possível carregar a lista.');
  const alunos = await resposta.json();
  lista.replaceChildren();
  if (alunos.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Nenhum aluno cadastrado ainda.';
    lista.append(item);
  }
  for (const aluno of alunos) {
    const item = document.createElement('li');
    item.textContent = `${aluno.nome} — ${aluno.email} — ${aluno.curso}`;
    lista.append(item);
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (salvar.disabled) return;
  salvar.disabled = true;
  avisar('Salvando…');
  try {
    const dados = Object.fromEntries(new FormData(form));
    const resposta = await fetch('/api/alunos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const resultado = await resposta.json();
    if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível cadastrar.');
    form.reset();
    avisar('Aluno cadastrado com sucesso!');
    try { await listar(); }
    catch { avisar('Cadastro salvo, mas a lista não atualizou. Clique em Atualizar lista.', true); }
  } catch (erro) {
    avisar(erro.message || 'Confira se o servidor está ligado.', true);
  } finally {
    salvar.disabled = false;
  }
});

document.querySelector('#atualizar').addEventListener('click', () => {
  listar().then(() => avisar('Lista atualizada.')).catch(erro => avisar(erro.message, true));
});
listar().catch(() => avisar('Não foi possível carregar. Confira se o servidor está ligado.', true));
