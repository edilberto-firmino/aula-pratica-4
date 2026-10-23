const express = require('express');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const app = express();
const db = new DatabaseSync(path.join(__dirname, 'cadastros.db'));
db.exec(`CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL CHECK(length(trim(nome)) BETWEEN 2 AND 80),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  curso TEXT NOT NULL CHECK(length(trim(curso)) BETWEEN 2 AND 80)
)`);
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/alunos', (req, res) => {
  res.json(db.prepare('SELECT id, nome, email, curso FROM alunos ORDER BY id DESC').all());
});
app.post('/api/alunos', (req, res) => {
  const dados = req.body;
  if (!dados || ['nome', 'email', 'curso'].some(campo => typeof dados[campo] !== 'string')) {
    return res.status(400).json({ erro: 'Nome, e-mail e curso devem ser textos.' });
  }
  const nome = dados.nome.trim();
  const email = dados.email.trim().toLowerCase();
  const curso = dados.curso.trim();
  if (nome.length < 2 || nome.length > 80 || curso.length < 2 || curso.length > 80) {
    return res.status(400).json({ erro: 'Nome e curso precisam ter de 2 a 80 caracteres.' });
  }
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: 'Informe um e-mail válido com até 120 caracteres.' });
  }
  try {
    const resultado = db.prepare('INSERT INTO alunos (nome, email, curso) VALUES (?, ?, ?)').run(nome, email, curso);
    res.status(201).json({ id: Number(resultado.lastInsertRowid), nome, email, curso });
  } catch (erro) {
    if (erro.code?.startsWith('ERR_SQLITE') && erro.message.includes('UNIQUE')) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    throw erro;
  }
});
app.use((erro, req, res, next) => {
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  if (erro.type === 'entity.too.large') return res.status(413).json({ erro: 'Corpo muito grande.' });
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno. Confira o terminal do servidor.' });
});
app.listen(3000, '127.0.0.1', () => console.log('Abra http://127.0.0.1:3000'));
