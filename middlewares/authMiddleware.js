// /middlewares/authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Acesso não autorizado' });
    }
};

export { isAuthenticated };