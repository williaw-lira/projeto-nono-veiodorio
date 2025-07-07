// /controllers/authController.js

class AuthController {
    static async login(req, res) {
        const { username, password } = req.body;

        // A lógica de autenticação está aqui:
        // Por enquanto, é a sua checagem de usuário/senha hardcoded.
        if ((username === 'nono' || username === 'williaw') && password === 'rioveio123') {
            req.session.user = username; // Armazena o usuário na sessão
            return res.json({ ok: true, message: 'Login realizado com sucesso!' });
        }
        res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    static async logout(req, res) {
        // Destrói a sessão do usuário
        req.session.destroy((err) => {
            if (err) {
                console.error('Erro ao destruir sessão:', err);
                return res.status(500).json({ error: 'Erro ao fazer logout.' });
            }
            res.json({ ok: true, message: 'Logout realizado com sucesso!' });
        });
    }
}

export default AuthController;