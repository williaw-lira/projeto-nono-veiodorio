
// app.js
require('dotenv').config();
const express    = require('express');
const { engine } = require('express-handlebars');
const { Pool }   = require('pg');
const fileUpload = require('express-fileupload');
const session    = require('express-session');
const fs         = require('fs');
const path       = require('path');

// Inicialização do Express
const app = express();

// Configuração do pool PostgreSQL
const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD || 'will',
  database: process.env.PG_DATABASE || 'veiodorio',
  port:     process.env.PG_PORT     || 5432,
  max:      10
});

// Testando conexão
pool.connect()
  .then(() => console.log('PostgreSQL conectado'))
  .catch(err => console.error('Erro ao conectar ao PostgreSQL:', err));

// Sessão
app.use(session({
  secret: 'security',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// File upload
app.use(fileUpload());

// Arquivos estáticos
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/css',       express.static(path.join(__dirname, 'css')));
app.use('/imagens',   express.static(path.join(__dirname, 'imagens')));
app.use('/imagensGuia', express.static(path.join(__dirname, 'imagensGuia')));

// Parse JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Handlebars
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// — ROTAS —
app.get('/', async (req, res, next) => {
  try {
    const produtosRes = await pool.query('SELECT * FROM produtos ORDER BY RANDOM() LIMIT 50');
    const guiasRes    = await pool.query('SELECT * FROM guias ORDER BY RANDOM() LIMIT 50');
    res.render('home', { produtosCarousel: produtosRes.rows, guias: guiasRes.rows });
  } catch (err) { next(err); }
});

app.get('/produtos', async (req, res, next) => {
  try {
    const { categoria, busca } = req.query;
    let sql = 'SELECT * FROM produtos';
    const params = [];
    const conds = [];
    if (categoria) {
      params.push(categoria);
      conds.push(`categoria = $${params.length}`);
    }
    if (busca) {
      ['nome','marca','categoria'].forEach(() => params.push(`%${busca}%`));
      const len = params.length;
      conds.push(`(nome ILIKE $${len-2} OR marca ILIKE $${len-1} OR categoria ILIKE $${len})`);
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY marca ASC';
    const result = await pool.query(sql, params);
    res.render('produtos', { produtos: result.rows });
  } catch (err) { next(err); }
});

app.get('/cadastro', isAuthenticated, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.render('cadastro', { produtos: result.rows });
  } catch (err) { next(err); }
});

app.post('/cadastrar', async (req, res, next) => {
  try {
    const { nome, valor, marca, categoria } = req.body;
    const imagem = req.files.imagem.name;
    await req.files.imagem.mv(path.join(__dirname, 'imagens', imagem));
    await pool.query(
      'INSERT INTO produtos (nome, valor, marca, categoria, imagem) VALUES ($1,$2,$3,$4,$5)',
      [nome, valor, marca, categoria, imagem]
    );
    res.redirect('/cadastro');
  } catch (err) { next(err); }
});

app.get('/remover/:codigo/:imagem', async (req, res, next) => {
  try {
    const { codigo, imagem } = req.params;
    await pool.query('DELETE FROM produtos WHERE codigo = $1', [codigo]);
    fs.unlink(path.join(__dirname, 'imagens', imagem), () => {});
    res.redirect('/cadastro');
  } catch (err) { next(err); }
});

app.get('/formularioEditar/:codigo', async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const result = await pool.query('SELECT * FROM produtos WHERE codigo = $1', [codigo]);
    res.render('formularioEditar', { produto: result.rows[0] });
  } catch (err) { next(err); }
});

app.post('/editar', async (req, res, next) => {
  try {
    const { codigo, nome, valor, marca, categoria, nomeImagem } = req.body;
    if (req.files && req.files.imagem) {
      const novaImg = req.files.imagem.name;
      await req.files.imagem.mv(path.join(__dirname, 'imagens', novaImg));
      fs.unlink(path.join(__dirname, 'imagens', nomeImagem), () => {});
      await pool.query(
        'UPDATE produtos SET nome=$1, valor=$2, marca=$3, categoria=$4, imagem=$5 WHERE codigo=$6',
        [nome, valor, marca, categoria, novaImg, codigo]
      );
    } else {
      await pool.query(
        'UPDATE produtos SET nome=$1, valor=$2, marca=$3, categoria=$4 WHERE codigo=$5',
        [nome, valor, marca, categoria, codigo]
      );
    }
    res.redirect('/cadastro');
  } catch (err) { next(err); }
});

app.get('/guiapesca', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM guias ORDER BY RANDOM() LIMIT 50');
    res.render('guiapesca', { guias: result.rows });
  } catch (err) { next(err); }
});

app.get('/guiapesca/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM guias WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Guia não encontrado.');
    const guia = result.rows[0];
    const imagensCarousel = [guia.imagem_principal, guia.imagemSec, guia.imagemTerc].filter(Boolean);
    res.render('detalheGuia', { guia, imagensCarousel });
  } catch (err) { next(err); }
});

app.get('/cadastroguia', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM guias');
    res.render('cadastroGuia', { guias: result.rows });
  } catch (err) { next(err); }
});

app.post('/cadastrarGuia', async (req, res, next) => {
  try {
    const { nome, descricao, whatsapp } = req.body;
    const guiaData = { nome, descricao, whatsapp };
    ['imagem_principal','imagemSec','imagemTerc'].forEach(key => {
      if (req.files && req.files[key]) {
        const img = req.files[key].name;
        guiaData[key] = img;
        req.files[key].mv(path.join(__dirname, 'imagensGuia', img));
      }
    });
    await pool.query(
      'INSERT INTO guias (nome, descricao, imagem_principal, imagemSec, imagemTerc, whatsapp) VALUES ($1,$2,$3,$4,$5,$6)',
      [guiaData.nome, guiaData.descricao, guiaData.imagem_principal, guiaData.imagemSec || null, guiaData.imagemTerc || null, guiaData.whatsapp]
    );
    res.redirect('/cadastroguia');
  } catch (err) { next(err); }
});

app.get('/excluirGuia/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM guias WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Guia não encontrado.');
    const guia = result.rows[0];
    ['imagem_principal','imagemSec','imagemTerc'].forEach(imgKey => {
      if (guia[imgKey]) fs.unlink(path.join(__dirname, 'imagensGuia', guia[imgKey]), () => {});
    });
    await pool.query('DELETE FROM guias WHERE id = $1', [id]);
    res.redirect('/cadastroguia');
  } catch (err) { next(err); }
});

app.get('/contato', (req, res) => res.render('contato'));
app.get('/sobre',   (req, res) => res.render('sobre'));

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if ((username==='nono'||username==='williaw') && password==='rioveio123') {
    req.session.user = username;
    res.redirect('/cadastro');
  } else {
    res.redirect('/login?error=1');
  }
});

// Servidor com tratamento de erro de porta
const PORT = process.env.PORT || 3020;
const server = app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso. Escolha outra porta ou finalize o processo que a está ocupando.`);
    process.exit(1);
  } else {
    console.error('Erro no servidor:', err);
  }
});

