// /routes/authRoutes.js
import { Router } from 'express'; // Importa o Router do Express
import AuthController from '../controllers/authController.js'; // Importa o controlador de autenticação
import { isAuthenticated } from '../middlewares/authMiddleware.js'; // Importa o middleware de autenticação

const router = Router(); // Inicializa o router

// Rota para login
router.post('/login', AuthController.login);

// Rota para logout (requer autenticação para garantir que só usuários logados possam deslogar)
router.post('/logout', isAuthenticated, AuthController.logout);

export default router; // Exporta o router para ser usado em app.js