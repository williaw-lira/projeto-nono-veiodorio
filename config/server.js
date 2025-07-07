// Parsers e upload
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

// Serve conteúdos estáticos
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  →  ${req.method} ${req.url}`);
  next();
});