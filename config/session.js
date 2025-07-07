app.use(session({
  secret: process.env.SECRET_KEY || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));