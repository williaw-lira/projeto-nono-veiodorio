-- CreateTable
CREATE TABLE "produtos" (
    "codigo" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "marca" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "imagem" VARCHAR(255) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "guias" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "imagem_principal" TEXT NOT NULL,
    "imagemsec" VARCHAR(255),
    "imagemterc" VARCHAR(255),
    "whatsapp" TEXT NOT NULL,

    CONSTRAINT "guias_pkey" PRIMARY KEY ("id")
);

