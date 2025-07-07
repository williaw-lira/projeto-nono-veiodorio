// app.js
import 'dotenv/config'; // Garante que as variáveis de ambiente sejam carregadas primeiro
import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import path from 'path'; // Necessário para servir estáticos

// Importações das configurações globais e middlewares
import { __dirname } from './config/paths.js'; // Se você separou __dirname
import { isAuthenticated } from './middlewares/authMiddleware.js'; // Se precisar no app.js globalmente
import { prisma } from './config/prisma.js'; // A instância do prisma, para garantir que ela é inicializada

// Importa as rotas específicas
import productRoutes from './routes/productRoutes.js';
import guideRoutes from './routes/guideRoutes.js';
import authRoutes from './routes/authRoutes.js'; // Se você separar as rotas de auth

const app = express();

// --- Configurações e Middlewares Globais ---

// Middleware de sessão (pode ser movido para /config/session.js e importado)
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

// Middleware de log (pode ser movido para /middlewares/logMiddleware.js ou /config/server.js)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()}  →  ${req.method} ${req.url}`);
    next();
});

// --- Inclusão das Rotas ---
app.use(productRoutes); // Use as rotas de produto
app.use(guideRoutes);   // Use as rotas de guia
app.use(authRoutes);    // Use as rotas de autenticação (se já tiver refatorado elas)

// Rota de teste simples (pode ir para /routes/index.js)
app.get('/ping', (req, res) => res.send('pong'));




// Inicia servidor
const PORT = process.env.PORT || 3020;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// Garante que o PrismaClient se desconecte quando o aplicativo fechar
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});