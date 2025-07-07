// /models/Product.js
import { prisma } from '../config/prisma.js'; // Importa a instância do Prisma
import fs from 'fs'; // Para manipular arquivos, pois a exclusão de imagem está ligada ao produto
import path from 'path'; // Para caminhos, também ligado ao tratamento de imagem
import { __dirname } from '../config/paths.js'; // Ajuste o caminho se você colocou em /config/paths.js

class Product {
    // Busca produtos para o carrossel (limite e ordenação)
    static async getProductsCarousel(limit = 50) {
        return prisma.produto.findMany({
            take: limit,
            orderBy: { codigo: 'desc' }
        });
    }

    // Busca produtos com filtros de categoria e busca
    static async getAllProducts(categoria, busca) {
        const where = {};
        if (categoria) where.categoria = categoria;
        if (busca) {
            where.OR = [
                { nome: { contains: busca, mode: 'insensitive' } },
                { marca: { contains: busca, mode: 'insensitive' } },
                { categoria: { contains: busca, mode: 'insensitive' } },
            ];
        }
        return prisma.produto.findMany({
            where,
            orderBy: { marca: 'asc' }
        });
    }

    // Cria um novo produto
    static async createProduct(data, imageFile) {
        const imagem = imageFile.name;
        // Salva a imagem no servidor
        await imageFile.mv(path.join(__dirname, 'public/imagens', imagem));

        return prisma.produto.create({
            data: { ...data, imagem }
        });
    }

    // Atualiza um produto existente
    static async updateProduct(codigo, data, imageFile) {
        // Se houver uma nova imagem, remove a antiga e salva a nova
        if (imageFile) {
            const novaImagem = imageFile.name;
            await imageFile.mv(path.join(__dirname, 'public/imagens', novaImagem));

            const oldProduct = await prisma.produto.findUnique({ where: { codigo } });
            if (oldProduct && oldProduct.imagem) {
                fs.unlinkSync(path.join(__dirname, 'public/imagens', oldProduct.imagem));
            }
            data.imagem = novaImagem;
        }

        return prisma.produto.update({ where: { codigo }, data });
    }

    // Remove um produto
    static async deleteProduct(codigo) {
        const product = await prisma.produto.delete({ where: { codigo } });
        // Remove a imagem associada ao produto
        if (product && product.imagem) {
            fs.unlinkSync(path.join(__dirname, 'public/imagens', product.imagem));
        }
        return product;
    }
}

export default Product;