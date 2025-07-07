// /routes/guideRoutes.js
import { Router } from 'express';
import GuideController from '../controllers/guideController.js'; // Importa o Controller
import { isAuthenticated } from '../middlewares/authMiddleware.js'; // Importa o middleware


const router = Router();

// Carrossel de guias
router.get('/api/guias', GuideController.getGuidesCarousel);

// Lista de guias
router.get('/api/guias/all', GuideController.getAllGuides);

// Detalhe de um guia
router.get('/api/guias/:id', GuideController.getGuideById);

// Cadastrar guia (requer autenticação)
router.post('/api/guias', isAuthenticated, GuideController.createGuide);

// Remover guia (requer autenticação)
router.delete('/api/guias/:id', isAuthenticated, GuideController.deleteGuide);

export default router;