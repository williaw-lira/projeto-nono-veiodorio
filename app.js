require('dotenv').config();
const { engine } = require ('express-handlebars');
const express = require('express');
const mysql = require('mysql2');
const fileUpload = require('express-fileupload');
const session = require('express-session');

// inicialização do express
const app = express();


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

//rota principal/ cadastro --- trocar para rota pricipal e criar nova de cadatro = FORMULARIO
app.get('/', (req, res) => {
    res.render('home');
    
});

//app.get('/cadastro', (req, res) => {

app.get('/produtos', (req, res) => {
    //sql 
    let sql = 'SELECT * FROM produtos';
    //executar o comando sql
    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;
        res.render('produtos', {produtos: retorno});
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
    res.redirect('/');
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
    

//servidor 
app.listen(3020, function (){
    console.log('Servidor rodando na porta 3020');
});
