// /controllers/productController.js
import Product from '../models/Product.js'; // Importa o Model de Produto

class ProductController {
    static async getProductsCarousel(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const products = await Product.getProductsCarousel(limit);
            res.json(products);
        } catch (error) {
            console.error('Erro ao buscar produtos para o carrossel:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async getAllProducts(req, res) {
        try {
            const { categoria, busca } = req.query;
            const products = await Product.getAllProducts(categoria, busca);
            res.json(products);
        } catch (error) {
            console.error('Erro ao buscar todos os produtos:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async createProduct(req, res) {
        try {
            const { nome, valor, marca, categoria } = req.body;
            // Validação básica se a imagem existe
            if (!req.files || !req.files.imagem) {
                return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
            }
            const product = await Product.createProduct({ nome, valor: parseFloat(valor), marca, categoria }, req.files.imagem);
            res.status(201).json(product); // 201 Created
        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async updateProduct(req, res) {
        try {
            const codigo = parseInt(req.params.codigo);
            const { nome, valor, marca, categoria } = req.body;
            const data = { nome, valor: parseFloat(valor), marca, categoria };
            const imageFile = req.files ? req.files.imagem : null; // Verifica se há uma imagem no request

            const updatedProduct = await Product.updateProduct(codigo, data, imageFile);
            res.json(updatedProduct);
        } catch (error) {
            console.error('Erro ao editar produto:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const codigo = parseInt(req.params.codigo);
            await Product.deleteProduct(codigo);
            res.json({ ok: true, message: 'Produto removido com sucesso.' });
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
}

export default ProductController;