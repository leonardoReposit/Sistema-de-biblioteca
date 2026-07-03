CREATE DATABASE BibliotecaDB;
GO

USE BibliotecaDB;
GO

CREATE TABLE Roles
(
    IdRol INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(30) NOT NULL UNIQUE
);
GO
CREATE TABLE Usuarios
(
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,

    IdRol INT NOT NULL,

    Nombres VARCHAR(80) NOT NULL,

    Apellidos VARCHAR(80) NOT NULL,

    DNI CHAR(8) UNIQUE NOT NULL,

    Telefono VARCHAR(20),

    Correo VARCHAR(120) UNIQUE,

    Usuario VARCHAR(50) UNIQUE NOT NULL,

    Password VARCHAR(255) NOT NULL,

    Estado BIT NOT NULL DEFAULT 1,

    FechaRegistro DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Usuarios_Roles
        FOREIGN KEY(IdRol)
        REFERENCES Roles(IdRol)
);
GO
CREATE TABLE Categorias
(
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,

    Nombre VARCHAR(80) NOT NULL,

    Descripcion VARCHAR(200),

    Estado BIT DEFAULT 1
);
GO
CREATE TABLE Editoriales
(
    IdEditorial INT IDENTITY(1,1) PRIMARY KEY,

    Nombre VARCHAR(120) NOT NULL,

    Pais VARCHAR(50),

    Estado BIT DEFAULT 1
);
GO
CREATE TABLE Autores
(
    IdAutor INT IDENTITY(1,1) PRIMARY KEY,

    Nombre VARCHAR(60) NOT NULL,

    Apellido VARCHAR(60) NOT NULL,

    Nacionalidad VARCHAR(50),

    FechaNacimiento DATE,

    Estado BIT DEFAULT 1
);
GO
CREATE TABLE Libros
(
    IdLibro INT IDENTITY(1,1) PRIMARY KEY,

    IdCategoria INT NOT NULL,

    IdEditorial INT NOT NULL,

    Titulo VARCHAR(200) NOT NULL,

    ISBN VARCHAR(20) UNIQUE,

    AnioPublicacion INT,

    NumeroPaginas INT,

    Stock INT NOT NULL,

    Disponibles INT NOT NULL,

    Ubicacion VARCHAR(80),

    Imagen VARCHAR(250),

    Estado BIT DEFAULT 1,

    CONSTRAINT FK_Libros_Categorias
        FOREIGN KEY(IdCategoria)
        REFERENCES Categorias(IdCategoria),

    CONSTRAINT FK_Libros_Editoriales
        FOREIGN KEY(IdEditorial)
        REFERENCES Editoriales(IdEditorial)
);
GO
CREATE TABLE Libros_Autores
(
    IdLibro INT NOT NULL,

    IdAutor INT NOT NULL,

    PRIMARY KEY(IdLibro, IdAutor),

    CONSTRAINT FK_LibroAutor_Libro
        FOREIGN KEY(IdLibro)
        REFERENCES Libros(IdLibro),

    CONSTRAINT FK_LibroAutor_Autor
        FOREIGN KEY(IdAutor)
        REFERENCES Autores(IdAutor)
);
GO
CREATE TABLE Prestamos
(
    IdPrestamo INT IDENTITY(1,1) PRIMARY KEY,

    IdCliente INT NOT NULL,

    IdBibliotecaria INT NOT NULL,

    FechaPrestamo DATE NOT NULL,

    FechaDevolucion DATE NOT NULL,

    Estado VARCHAR(20) DEFAULT 'Prestado',

    Observacion VARCHAR(300),

    CONSTRAINT FK_Prestamo_Cliente
        FOREIGN KEY(IdCliente)
        REFERENCES Usuarios(IdUsuario),

    CONSTRAINT FK_Prestamo_Bibliotecaria
        FOREIGN KEY(IdBibliotecaria)
        REFERENCES Usuarios(IdUsuario)
);
GO
CREATE TABLE DetallePrestamo
(
    IdDetalle INT IDENTITY(1,1) PRIMARY KEY,

    IdPrestamo INT NOT NULL,

    IdLibro INT NOT NULL,

    Cantidad INT NOT NULL,

    CONSTRAINT FK_DetallePrestamo_Prestamo
        FOREIGN KEY(IdPrestamo)
        REFERENCES Prestamos(IdPrestamo),

    CONSTRAINT FK_DetallePrestamo_Libro
        FOREIGN KEY(IdLibro)
        REFERENCES Libros(IdLibro)
);
GO
CREATE TABLE HistorialPrestamos
(
    IdHistorial INT IDENTITY(1,1) PRIMARY KEY,

    IdPrestamo INT NOT NULL,

    FechaRealDevolucion DATE,

    Multa DECIMAL(10,2),

    Observacion VARCHAR(250),

    CONSTRAINT FK_Historial_Prestamo
        FOREIGN KEY(IdPrestamo)
        REFERENCES Prestamos(IdPrestamo)
);
GO