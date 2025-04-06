
require('dotenv').config();
const { engine } = require ('express-handlebars');
const express = require('express');
const mysql = require('mysql2');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');


// inicialização do express
const app = express();

const port = process.env.PORT || 3020;

app.use(session({
    secret: 'security', // troque por uma chave segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // se estiver usando https, defina como true
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}


// importar modulo file upload
app.use(fileUpload());

// adicionar bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// adicionar css 
app.use('/css', express.static('./css'));


// referenciar pasta img
app.use('/imagens', express.static('./imagens'));

// manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// configuração do handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

//configuração do banco de dados
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'williaw',
    database: 'veiodorio'
});

//conexão com o banco de dados
conexao.connect(function(err){
    if(err){
        console.log('Erro ao conectar ao banco de dados');
        return;
    }
    console.log('Conexão com o banco de dados estabelecida');
});

//rota principal
app.get('/', (req, res) => {
    let sqlProdutos = 'SELECT * FROM produtos ORDER BY RAND() LIMIT 50';
    let sqlGuias = 'SELECT * FROM guias ORDER BY RAND() LIMIT 50';
    conexao.query(sqlProdutos, function(err, produtosCarousel) {
        if (err) throw err;
    conexao.query(sqlGuias, function(err, guias) {
        if (err) throw err;
        res.render('home', { produtosCarousel, guias });
    });
    });
});


    // rota produtos
    app.get('/produtos', (req, res) => {
        const { categoria, busca } = req.query;
        let sql = 'SELECT * FROM produtos';
        let params = [];
        let conditions = [];
    
        if (categoria) {
            conditions.push("categoria = ?");
            params.push(categoria);
        }
        if (busca) {
            // Busca em nome, marca ou categoria
            conditions.push("(nome LIKE ? OR marca LIKE ? OR categoria LIKE ?)");
            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }
        sql += " ORDER BY marca ASC";
    
        conexao.query(sql, params, function(err, produtos) {
            if (err) throw err;
            res.render('produtos', { produtos });
        });
    });
    
    


    
app.post('/cadastrar', function(req, res) {
    // obter dados do formulario
    let nome = req.body.nome;
    let valor = req.body.valor;
    let marca = req.body.marca;
    let categoria = req.body.categoria;
    let imagem = req.files.imagem.name;

    // estrutura sql 
    let sql = `INSERT INTO produtos (nome, valor, marca, categoria, imagem) VALUES ('${nome}', '${valor}', '${marca}', '${categoria}','${imagem}')`;

    // executar o comando sql 
    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;
        
        req.files.imagem.mv(__dirname + '/imagens/'+req.files.imagem.name)
        console.log(retorno);
    });

    // retornar para a rota principal -- trocar para rota de cadastro 
    res.redirect('/cadastro');
    res.end();
});

    // rota contato 
    app.get('/contato', (req, res) => {
        res.render('contato');
    });


        

    // rota login
    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        if ((username === 'nono' || username === 'williaw') && password === 'rioveio123') {
            req.session.user = username; // Armazena o usuário na sessão
            res.redirect('/cadastro');    // Redireciona para a área admin (cadastro)
        } else {
            res.redirect('/login?error=1'); // Redireciona para login com erro
        }
    });
    
    app.get('/cadastro', isAuthenticated, (req, res) => {
         //sql 
    let sql = 'SELECT * FROM produtos';
    //executar o comando sql
    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;
        res.render('cadastro', {produtos: retorno});
    });
    
});
    
    // rota para excluir produto
    app.get('/remover/:codigo&:imagem', function(req, res){
        // sql
    let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;

    // executar o comando sql
    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;
        // remover imagem do servidor 
        fs.unlink(__dirname + '/imagens/' + req.params.imagem, (erro_imagem) => {
            if(erro_imagem) throw erro_imagem;
            console.log('Imagem removida com sucesso');
        });
    });
    res.redirect('/cadastro');
});

    // rota para editar produto
    app.get('/formularioEditar/:codigo', function(req, res){
        // sql
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;
        // executar o comando sql
    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;
        res.render('formularioEditar', {produto: retorno[0]});
        });
    });

    
    // rota para atualizar produto
    app.post('/editar', function(req, res){
        // obter dados do formulario
        let codigo = req.body.codigo;
        let nome = req.body.nome;
        let valor = req.body.valor;
        let marca = req.body.marca;
        let categoria = req.body.categoria;
        let nomeImagem = req.body.nomeImagem;
        
        //definir o tipo de edição
        try{
            // ojeto de imagem
            let imagem = req.files.imagem.name;

            // sql
            let sql = `UPDATE produtos SET nome = '${nome}', valor = '${valor}', marca = '${marca}', categoria = '${categoria}', imagem = '${imagem}' WHERE codigo = ${codigo}`;

            // executar o comando sql   
            conexao.query(sql, function(erro, retorno){
                if(erro) throw erro;
                // remover imagem do servidor 
                fs.unlink(__dirname + '/imagens/' + nomeImagem, (erro_imagem) => {
                    if(erro_imagem) throw erro_imagem;
                    console.log('Imagem removida com sucesso');
                });
            });
            // cadastro da nova imagem
            imagem.mv(__dirname + '/imagens/' + imagem.name);

        }catch(erro){
            // sql
            let sql = `UPDATE produtos SET nome = '${nome}', valor = '${valor}', marca = '${marca}', categoria = '${categoria}' WHERE codigo = ${codigo}`;

            // executar o comando sql
            conexao.query(sql, function(erro, retorno){
                if(erro) throw erro;
                
            });
        }

        // redirecionamento 
        res.redirect('/cadastro');
    });

// ------------------- Rotas de Guias de Pesca -------------------

// Rota para exibir os guias no carrossel (lista de guias)
app.get('/guiapesca', (req, res) => {
    let sql = 'SELECT * FROM guias ORDER BY RAND() LIMIT 50';
    conexao.query(sql, function(err, guias) {
        if (err) throw err;
        res.render('guiapesca', { guias });
    });
});

// Rota para exibir detalhes de um guia específico
app.get('/guiapesca/:id', (req, res) => {
    let sql = 'SELECT * FROM guias WHERE id = ?';
    conexao.query(sql, [req.params.id], function(err, results) {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(404).send('Guia não encontrado.');
        }
        let guia = results[0];
        // Cria o array de imagens para o carrossel
        let imagensCarousel = [];
        if (guia.imagem_principal) imagensCarousel.push(guia.imagem_principal);
        if (guia.imagemSec) imagensCarousel.push(guia.imagemSec);
        if (guia.imagemTerc) imagensCarousel.push(guia.imagemTerc);
        res.render('detalheGuia', { guia, imagensCarousel });
    });
});





// Rota para exibir o formulário de cadastro de guia
app.get('/cadastroguia', (req, res) => {
    let sql = 'SELECT * FROM guias';
    conexao.query(sql, function(err, guias) {
        if (err) throw err;
        res.render('cadastroGuia', { guias });
    });
});

// Rota para cadastrar um novo guia
app.post('/cadastrarGuia', (req, res) => {
    let nome = req.body.nome;
    let descricao = req.body.descricao;
    let whatsapp = req.body.whatsapp;
    let imagem_principal = req.files.imagem_principal.name;

    // Mover a imagem principal
    req.files.imagem_principal.mv(__dirname + '/imagens/' + imagem_principal, (err) => {
        if (err) console.log('Erro ao mover imagem principal', err);
    });

    // Tratamento para imagem secundária (opcional)
    let imagemSec = null;
    if (req.files.imagemSec) {
        imagemSec = req.files.imagemSec.name;
        req.files.imagemSec.mv(__dirname + '/imagens/' + imagemSec, (err) => {
            if (err) console.log('Erro ao mover imagem secundária', err);
        });
    }

    // Tratamento para imagem terciária (opcional)
    let imagemTerc = null;
    if (req.files.imagemTerc) {
        imagemTerc = req.files.imagemTerc.name;
        req.files.imagemTerc.mv(__dirname + '/imagens/' + imagemTerc, (err) => {
            if (err) console.log('Erro ao mover imagem terciária', err);
        });
    }

    let sql = "INSERT INTO guias (nome, descricao, imagem_principal, imagemSec, imagemTerc, whatsapp) VALUES (?, ?, ?, ?, ?, ?)";
    conexao.query(sql, [nome, descricao, imagem_principal, imagemSec, imagemTerc, whatsapp], (err, result) => {
        if (err) throw err;
        res.redirect('/cadastroguia');
    });
});


// excluir guia
    app.get('/excluirGuia/:id', (req, res) => {
        let id = req.params.id;
        let sql = 'SELECT * FROM guias WHERE id = ?';
        conexao.query(sql, [id], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(404).send('Guia não encontrado.');
        }
        let guia = results[0];
        // Remover imagem principal
        fs.unlink(__dirname + '/imagens/' + guia.imagem_principal, (err) => {
            if (err) console.log('Erro ao remover imagem principal', err);
        });
        // Remover imagem secundária, se existir
        if (guia.imagemSec) {
            fs.unlink(__dirname + '/imagens/' + guia.imagemSec, (err) => {
            if (err) console.log('Erro ao remover imagem secundária', err);
            });
        }
        // Excluir o registro do guia
        let delSql = 'DELETE FROM guias WHERE id = ?';
        conexao.query(delSql, [id], (err, result) => {
            if (err) throw err;
            res.redirect('/cadastroguia');
        });
        });
    });
    


// -----------------------------------------------------------------

app.get('/sobre', (req, res) => {
    res.render('sobre');
});

// Servidor
app.listen(3020, function () {
    console.log('Servidor rodando na porta 3020');
});