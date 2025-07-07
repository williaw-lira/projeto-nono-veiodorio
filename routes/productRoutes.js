// /routes/productRoutes.js
import { Router } from 'express';
import ProductController from '../controllers/productController.js'; // Importa o Controller
import { isAuthenticated } from '../middlewares/authMiddleware.js'; // Importa o middleware de autenticação

const router = Router();

// Carrossel de produtos
router.get('/api/produtos', ProductController.getProductsCarousel);

// Lista filtrada de produtos
router.get('/api/produtos/all', ProductController.getAllProducts);

// Cadastrar produto (requer autenticação)
router.post('/api/produtos', isAuthenticated, ProductController.createProduct);

// Editar produto (requer autenticação)
router.put('/api/produtos/:codigo', isAuthenticated, ProductController.updateProduct);

// Remover produto (requer autenticação)
router.delete('/api/produtos/:codigo', isAuthenticated, ProductController.deleteProduct);

export default router;