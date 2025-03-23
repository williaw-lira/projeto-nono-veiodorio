const { engine } = require ('express-handlebars');
const express = require('express');
const mysql = require('mysql2');

// inicialização do express
const app = express();

// adicionar bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// adicionar css 
app.use('/css', express.static('./css'));

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

//rota cadastro --- trocar para rota pricipal
app.get('/', (req, res) => {
    res.render('formulario');
}
);

app.post('/cadastrar', function(req, res) {
    console.log(req.body);
    res.send('cadastro recebido');
    res.end();
});

//servidor 
app.listen(3020, function (){
    console.log('Servidor rodando na porta 3020');
});