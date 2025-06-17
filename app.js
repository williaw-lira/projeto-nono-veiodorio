import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL,  { ssl: 'verify-full' });

// ===== Restaurando __filename e __dirname em módulo ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// importa todo o módulo e extrai PrismaClient
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();

// Middleware de autenticação
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Acesso não autorizado' });
  }
};

app.use(session({
  secret: process.env.SECRET_KEY || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Parsers e upload
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

// Serve conteúdos estáticos
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// — ROTAS DE API —
// Carrossel de produtos
app.get('/api/produtos', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const rows = await prisma.produto.findMany({
    take: limit,
    orderBy: { codigo: 'desc' }
  });
  res.json(rows);
});

// Lista filtrada de produtos
app.get('/api/produtos/all', async (req, res) => {
  const { categoria, busca } = req.query;
  const where = {};
  if (categoria) where.categoria = categoria;
  if (busca) where.OR = [
    { nome:      { contains: busca, mode: 'insensitive' } },
    { marca:     { contains: busca, mode: 'insensitive' } },
    { categoria: { contains: busca, mode: 'insensitive' } },
  ];
  const rows = await prisma.produto.findMany({
    where,
    orderBy: { marca: 'asc' }
  });
  res.json(rows);
});

// Cadastrar produto
app.post('/api/produtos', isAuthenticated, async (req, res) => {
  const { nome, valor, marca, categoria } = req.body;
  const imagem = req.files.imagem.name;
  await req.files.imagem.mv(path.join(__dirname, 'public/imagens', imagem));
  const prod = await prisma.produto.create({
    data: { nome, valor: parseFloat(valor), marca, categoria, imagem }
  });
  res.json(prod);
});

// Editar produto
app.put('/api/produtos/:codigo', isAuthenticated, async (req, res) => {
  const codigo = parseInt(req.params.codigo);
  const { nome, valor, marca, categoria } = req.body;
  const data = { nome, valor: parseFloat(valor), marca, categoria };
  if (req.files && req.files.imagem) {
    const nova = req.files.imagem.name;
    await req.files.imagem.mv(path.join(__dirname, 'public/imagens', nova));
    const old = await prisma.produto.findUnique({ where: { codigo } });
    fs.unlinkSync(path.join(__dirname, 'public/imagens', old.imagem));
    data.imagem = nova;
  }
  const upd = await prisma.produto.update({ where: { codigo }, data });
  res.json(upd);
});

// Remover produto
app.delete('/api/produtos/:codigo', isAuthenticated, async (req, res) => {
  const codigo = parseInt(req.params.codigo);
  const prod = await prisma.produto.delete({ where: { codigo } });
  fs.unlinkSync(path.join(__dirname, 'public/imagens', prod.imagem));
  res.json({ ok: true });
});

// Carrossel de guias
app.get('/api/guias', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const rows = await prisma.guia.findMany({
    take: limit,
    orderBy: { id: 'desc' }
  });
  res.json(rows);
});

// Lista de guias
app.get('/api/guias/all', async (req, res) => {
  const rows = await prisma.guia.findMany({ orderBy: { id: 'asc' } });
  res.json(rows);
});

// Detalhe de um guia
app.get('/api/guias/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const g = await prisma.guia.findUnique({ where: { id } });
  if (!g) return res.status(404).json({ error: 'Não encontrado' });
  res.json(g);
});

// Cadastrar guia
app.post('/api/guias', isAuthenticated, async (req, res) => {
  const { nome, descricao, whatsapp } = req.body;
  const imgs = {};
  ['imagem_principal','imagemSec','imagemTerc'].forEach(key => {
    if (req.files[key]) {
      const fn = req.files[key].name;
      imgs[key] = fn;
      req.files[key].mv(path.join(__dirname, 'public/imagensGuia', fn));
    }
  });
  const guia = await prisma.guia.create({
    data: {
      nome,
      descricao,
      whatsapp,
      imagem_principal: imgs.imagem_principal,
      imagemsec: imgs.imagemSec || null,
      imagemterc: imgs.imagemTerc || null
    }
  });
  res.json(guia);
});

// Remover guia
app.delete('/api/guias/:id', isAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);
  const g = await prisma.guia.delete({ where: { id } });
  ['imagem_principal','imagemSec','imagemTerc'].forEach(k => {
    if (g[k]) fs.unlinkSync(path.join(__dirname, 'public/imagensGuia', g[k]));
  });
  res.json({ ok: true });
});

// Autenticação
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if ((username === 'nono' || username === 'williaw') && password === 'rioveio123') {
    req.session.user = username;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Credenciais inválidas' });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Rota de teste simples
app.get('/ping', (req, res) => res.send('pong'));

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  →  ${req.method} ${req.url}`);
  next();
});

// Inicia servidor
const PORT = process.env.PORT || 3020;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
