// /models/Guide.js
import { prisma } from '../config/prisma.js'; // Importa a instância do Prisma
import fs from 'fs';
import path from 'path';
import { __dirname } from '../config/paths.js'; // Ajuste o caminho

class Guide {
    // Busca guias para o carrossel (limite e ordenação)
    static async getGuidesCarousel(limit = 50) {
        return prisma.guia.findMany({
            take: limit,
            orderBy: { id: 'desc' }
        });
    }

    // Lista todas as guias
    static async getAllGuides() {
        return prisma.guia.findMany({ orderBy: { id: 'asc' } });
    }

    // Detalhe de um guia por ID
    static async getGuideById(id) {
        return prisma.guia.findUnique({ where: { id } });
    }

    // Cria um novo guia
    static async createGuide(data, imageFiles) {
        const imgs = {};
        ['imagem_principal', 'imagemSec', 'imagemTerc'].forEach(key => {
            if (imageFiles[key]) {
                const fn = imageFiles[key].name;
                imgs[key] = fn;
                imageFiles[key].mv(path.join(__dirname, 'public/imagensGuia', fn));
            }
        });

        return prisma.guia.create({
            data: {
                ...data,
                imagem_principal: imgs.imagem_principal,
                imagemsec: imgs.imagemSec || null,
                imagemterc: imgs.imagemTerc || null
            }
        });
    }

    // Remove um guia
    static async deleteGuide(id) {
        const guide = await prisma.guia.delete({ where: { id } });
        // Remove as imagens associadas ao guia
        ['imagem_principal', 'imagemsec', 'imagemterc'].forEach(k => { // Use 'imagemsec' e 'imagemterc' para corresponder ao modelo do prisma
            if (guide[k]) fs.unlinkSync(path.join(__dirname, 'public/imagensGuia', guide[k]));
        });
        return guide;
    }
}

export default Guide;