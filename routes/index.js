// /routes/authRoutes.js
import { Router } from 'express'; // <--- ESSA LINHA É CRUCIAL!
import AuthController from '../controllers/authController.js'; // Importe seu controlador de autenticação, se já tiver um
import { isAuthenticated } from '../middlewares/authMiddleware.js'; // Importe o middleware de autenticação


// Rota de teste simples
app.get('/ping', (req, res) => res.send('pong'));
export default router;