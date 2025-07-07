// /controllers/guideController.js
import Guide from '../models/Guide.js'; // Importa o Model de Guia

class GuideController {
    static async getGuidesCarousel(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const guides = await Guide.getGuidesCarousel(limit);
            res.json(guides);
        } catch (error) {
            console.error('Erro ao buscar guias para o carrossel:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async getAllGuides(req, res) {
        try {
            const guides = await Guide.getAllGuides();
            res.json(guides);
        } catch (error) {
            console.error('Erro ao buscar todas as guias:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async getGuideById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const guide = await Guide.getGuideById(id);
            if (!guide) return res.status(404).json({ error: 'Não encontrado' });
            res.json(guide);
        } catch (error) {
            console.error('Erro ao buscar guia por ID:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async createGuide(req, res) {
        try {
            const { nome, descricao, whatsapp } = req.body;
            const newGuide = await Guide.createGuide({ nome, descricao, whatsapp }, req.files);
            res.status(201).json(newGuide);
        } catch (error) {
            console.error('Erro ao cadastrar guia:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    static async deleteGuide(req, res) {
        try {
            const id = parseInt(req.params.id);
            await Guide.deleteGuide(id);
            res.json({ ok: true, message: 'Guia removida com sucesso.' });
        } catch (error) {
            console.error('Erro ao remover guia:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
}

export default GuideController;