    require('dotenv').config();
    const express     = require('express');
    const mongoose    = require('mongoose');
    const fileUpload  = require('express-fileupload');
    const session     = require('express-session');
    const fs          = require('fs');
    const { engine }  = require('express-handlebars');

    // Inicialização
    const app = express();

    // Conexão MongoDB
    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/veiodorio', {
    useNewUrlParser: true,
    useUnifiedTopology: true
    })
    .then(() => console.log("MongoDB conectado"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

    // Schemas e Models
    const produtoSchema = new mongoose.Schema({
    nome: String,
    valor: Number,
    marca: String,
    categoria: String,
    imagem: String
    });
    const Produto = mongoose.model('Produto', produtoSchema);

    const guiaSchema = new mongoose.Schema({
    nome: String,
    descricao: String,
    imagem_principal: String,
    imagemSec: String,
    imagemTerc: String,
    whatsapp: String
    });
    const Guia = mongoose.model('Guia', guiaSchema);

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

    // Middlewares
    app.use(fileUpload());
    app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));
    app.use('/css', express.static('./css'));
    app.use('/imagens', express.static('./imagens'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Handlebars
    app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts'
    }));
    app.set('view engine', 'handlebars');
    app.set('views', './views');

    // — ROTAS —

    // Home: carrossel de produtos e guias
    app.get('/', async (req, res, next) => {
    try {
        const produtosCarousel = await Produto.aggregate([{ $sample: { size: 50 } }]);
        const guias            = await Guia.aggregate([{ $sample: { size: 50 } }]);
        res.render('home', { produtosCarousel, guias });
    } catch (err) { next(err); }
    });

    // Contato / Sobre
    app.get('/contato', (req, res) => res.render('contato'));
    app.get('/sobre',   (req, res) => res.render('sobre'));

    // — Produtos —
    // Lista pública de produtos com filtros
    app.get('/produtos', async (req, res, next) => {
        try {
        const { categoria, busca } = req.query;
        let filtro = {};
        if (categoria) filtro.categoria = categoria;
        if (busca) {
            filtro.$or = [
            { nome: new RegExp(busca, 'i') },
            { marca: new RegExp(busca, 'i') },
            { categoria: new RegExp(busca, 'i') }
            ];
        }
        // .lean() aqui
        const produtos = await Produto.find(filtro).sort({ marca: 1 }).lean();
        res.render('produtos', { produtos });
        } catch (err) { next(err); }
    });
    
    // Tela de cadastro/listagem (admin)
    app.get('/cadastro', isAuthenticated, async (req, res, next) => {
        try {
        // .lean() aqui também
        const produtos = await Produto.find().lean();
        res.render('cadastro', { produtos });
        } catch (err) { next(err); }
    });
    
    // Remover produto — rota exata /remover/:id/:imagem
    app.get('/remover/:id/:imagem', async (req, res, next) => {
        try {
        await Produto.findByIdAndDelete(req.params.id);
        fs.unlink(__dirname + '/imagens/' + req.params.imagem, ()=>{});
        res.redirect('/cadastro');
        } catch (err) { next(err); }
    });
    
    // Formulário de edição — rota exata /formularioEditar/:id
    app.get('/formularioEditar/:id', async (req, res, next) => {
        try {
        const produto = await Produto.findById(req.params.id).lean();
        res.render('formularioEditar', { produto });
        } catch (err) { next(err); }
    });

    // CRUD (admin)

    // Tela de cadastro/listagem
    app.get('/cadastro', isAuthenticated, async (req, res, next) => {
    try {
        const produtos = await Produto.find();
        res.render('cadastro', { produtos });
    } catch (err) { next(err); }
    });

    // Cadastrar produto
    app.post('/cadastrar', async (req, res, next) => {
    try {
        const { nome, valor, marca, categoria } = req.body;
        const imagem = req.files.imagem.name;
        await req.files.imagem.mv(__dirname + '/imagens/' + imagem);
        await Produto.create({ nome, valor, marca, categoria, imagem });
        res.redirect('/cadastro');
    } catch (err) { next(err); }
    });

    // Remover produto
    app.get('/remover/:id/:imagem', async (req, res, next) => {
    try {
        await Produto.findByIdAndDelete(req.params.id);
        fs.unlink(__dirname + '/imagens/' + req.params.imagem, () => {});
        res.redirect('/cadastro');
    } catch (err) { next(err); }
    });

    // Formulário de edição
    app.get('/formularioEditar/:id', async (req, res, next) => {
    try {
        const produto = await Produto.findById(req.params.id);
        res.render('formularioEditar', { produto });
    } catch (err) { next(err); }
    });

    // Atualizar produto
    app.post('/editar', async (req, res, next) => {
    try {
        const { id, nome, valor, marca, categoria, nomeImagem } = req.body;
        let updateData = { nome, valor, marca, categoria };
        if (req.files?.imagem) {
        const imagem = req.files.imagem.name;
        updateData.imagem = imagem;
        await req.files.imagem.mv(__dirname + '/imagens/' + imagem);
        fs.unlink(__dirname + '/imagens/' + nomeImagem, () => {});
        }
        await Produto.findByIdAndUpdate(id, updateData);
        res.redirect('/cadastro');
    } catch (err) { next(err); }
    });

    // — Guias de Pesca —

    // Lista pública / carrossel
    app.get('/guiapesca', async (req, res, next) => {
    try {
        const guias = await Guia.aggregate([{ $sample: { size: 50 } }]);
        res.render('guiapesca', { guias });
    } catch (err) { next(err); }
    });

    // Detalhe do guia (3 imagens)
    app.get('/guiapesca/:id', async (req, res, next) => {
    try {
        const guia = await Guia.findById(req.params.id);
        if (!guia) return res.status(404).send('Guia não encontrado');
        const imagensCarousel = [
        guia.imagem_principal,
        guia.imagemSec,
        guia.imagemTerc
        ].filter(Boolean);
        res.render('detalheGuia', { guia, imagensCarousel });
    } catch (err) { next(err); }
    });

    // Cadastro/listagem de guia
    app.get('/cadastroguia', isAuthenticated, async (req, res, next) => {
    try {
        const guias = await Guia.find();
        res.render('cadastroGuia', { guias });
    } catch (err) { next(err); }
    });

    // Cadastrar guia
    app.post('/cadastrarGuia', async (req, res, next) => {
    try {
        const { nome, descricao, whatsapp } = req.body;
        const guiaData = { nome, descricao, whatsapp };
        guiaData.imagem_principal = req.files.imagem_principal.name;
        await req.files.imagem_principal.mv(__dirname + '/imagens/' + guiaData.imagem_principal);
        if (req.files.imagemSec) {
        guiaData.imagemSec = req.files.imagemSec.name;
        await req.files.imagemSec.mv(__dirname + '/imagens/' + guiaData.imagemSec);
        }
        if (req.files.imagemTerc) {
        guiaData.imagemTerc = req.files.imagemTerc.name;
        await req.files.imagemTerc.mv(__dirname + '/imagens/' + guiaData.imagemTerc);
        }
        await Guia.create(guiaData);
        res.redirect('/cadastroguia');
    } catch (err) { next(err); }
    });

    // Excluir guia
    app.get('/excluirGuia/:id', async (req, res, next) => {
    try {
        const guia = await Guia.findById(req.params.id);
        if (!guia) return res.status(404).send('Guia não encontrado');
        [guia.imagem_principal, guia.imagemSec, guia.imagemTerc]
        .filter(Boolean)
        .forEach(img => fs.unlink(__dirname + '/imagens/' + img, () => {}));
        await Guia.findByIdAndDelete(req.params.id);
        res.redirect('/cadastroguia');
    } catch (err) { next(err); }
    });

    // — Login simples —
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

    // Servidor
    const PORT = process.env.PORT || 3020;
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
