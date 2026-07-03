USE BibliotecaDB;
GO



    -- 1. Inserción de Roles
    INSERT INTO Roles (Nombre) VALUES 
    ('Bibliotecaria'),
    ('Cliente');

    -- 2. Inserción de Usuarios
    INSERT INTO Usuarios (IdRol, Nombres, Apellidos, DNI, Telefono, Correo, Usuario, Password) VALUES
    (1, 'María', 'Gómez',   '74581236', '987654321', 'maria@biblioteca.com', 'maria', '123456'),
    (1, 'Ana',   'Torres',  '74125896', '965874123', 'ana@biblioteca.com',   'ana',   '123456'),
    (2, 'Carlos','Ramírez', '71589632', '954123678', 'carlos@gmail.com',     'carlos','123456'),
    (2, 'Luis',  'Fernández','72589631', '987451236', 'luis@gmail.com',     'luis',  '123456'),
    (2, 'Sofía', 'Pérez',   '73569841', '912345678', 'sofia@gmail.com',    'sofia', '123456');
       INSERT INTO Usuarios (IdRol, Nombres, Apellidos, DNI, Telefono, Correo, Usuario, Password) VALUES
       (1, 'leonardo', 'Maldonado',   '111221', '999888777', 'leonardo@gmail.com','leonardo', '123456');

    -- 3. Inserción de Categorías
    INSERT INTO Categorias (Nombre, Descripcion) VALUES
    ('Novela',      'Libros de ficción'),
    ('Tecnología',  'Programación y sistemas'),
    ('Historia',    'Historia Universal'),
    ('Matemática',  'Álgebra, cálculo y geometría'),
    ('Infantil',    'Libros para niños');

    -- 4. Inserción de Editoriales
    INSERT INTO Editoriales (Nombre, Pais) VALUES
    ('Planeta',     'España'),
    ('Santillana',  'España'),
    ('Pearson',     'Estados Unidos'),
    ('McGraw Hill', 'Estados Unidos'),
    ('Alfaguara',   'México');

    -- 5. Inserción de Autores
    INSERT INTO Autores (Nombre, Apellido, Nacionalidad, FechaNacimiento) VALUES
    ('Gabriel', 'García Márquez', 'Colombia',       '1927-03-06'),
    ('Mario',   'Vargas Llosa',   'Perú',           '1936-03-28'),
    ('Robert',  'Martin',         'Estados Unidos', '1952-12-05'),
    ('Thomas',  'Cormen',         'Estados Unidos', '1956-01-01'),
    ('Julio',   'Verne',          'Francia',        '1828-02-08');
GO
INSERT INTO Libros
(IdCategoria, IdEditorial, Titulo, ISBN, AnioPublicacion,
NumeroPaginas, Stock, Disponibles, Ubicacion, Imagen)
VALUES
--------------------------------------------------
-- CATEGORIA 1 : NOVELA (Gabriel García Márquez)
--------------------------------------------------
(1,1,'Cien años de soledad','978000000001',1967,496,10,10,'A-01','cien_anos.jpg'),
(1,1,'El otoño del patriarca','978000000002',1975,320,10,10,'A-02','otono.jpg'),
(1,1,'Crónica de una muerte anunciada','978000000003',1981,160,10,10,'A-03','cronica.jpg'),
(1,1,'El amor en los tiempos del cólera','978000000004',1985,380,10,10,'A-04','colera.jpg'),
(1,1,'Memoria de mis putas tristes','978000000005',2004,140,10,10,'A-05','memoria.jpg'),

--------------------------------------------------
-- CATEGORIA 2 : TECNOLOGÍA (Robert Martin)
--------------------------------------------------
(2,3,'Clean Code','978000000006',2008,464,10,10,'B-01','clean_code.jpg'),
(2,3,'Clean Architecture','978000000007',2017,432,10,10,'B-02','clean_architecture.jpg'),
(2,3,'Agile Software Development','978000000008',2002,552,10,10,'B-03','agile.jpg'),
(2,3,'The Clean Coder','978000000009',2011,256,10,10,'B-04','clean_coder.jpg'),
(2,3,'Clean Agile','978000000010',2019,288,10,10,'B-05','clean_agile.jpg'),

--------------------------------------------------
-- CATEGORIA 3 : HISTORIA (Mario Vargas Llosa)
--------------------------------------------------
(3,5,'La guerra del fin del mundo','978000000011',1981,600,10,10,'C-01','guerra.jpg'),
(3,5,'El sueño del celta','978000000012',2010,450,10,10,'C-02','celta.jpg'),
(3,5,'Conversación en La Catedral','978000000013',1969,720,10,10,'C-03','catedral.jpg'),
(3,5,'La fiesta del Chivo','978000000014',2000,500,10,10,'C-04','chivo.jpg'),
(3,5,'Tiempos recios','978000000015',2019,360,10,10,'C-05','tiempos.jpg'),

--------------------------------------------------
-- CATEGORIA 4 : MATEMÁTICA (Thomas Cormen)
--------------------------------------------------
(4,4,'Introduction to Algorithms','978000000016',2009,1312,10,10,'D-01','algorithms.jpg'),
(4,4,'Algorithms Unlocked','978000000017',2013,240,10,10,'D-02','unlocked.jpg'),
(4,4,'Algorithms Workbook','978000000018',2015,380,10,10,'D-03','workbook.jpg'),
(4,4,'Algorithm Design Basics','978000000019',2017,450,10,10,'D-04','design.jpg'),
(4,4,'Advanced Algorithms','978000000020',2020,520,10,10,'D-05','advanced.jpg'),

--------------------------------------------------
-- CATEGORIA 5 : INFANTIL (Julio Verne)
--------------------------------------------------
(5,2,'Viaje al centro de la Tierra','978000000021',1864,350,10,10,'E-01','centro.jpg'),
(5,2,'La vuelta al mundo en 80 días','978000000022',1872,300,10,10,'E-02','80dias.jpg'),
(5,2,'Veinte mil leguas de viaje submarino','978000000023',1870,420,10,10,'E-03','20000leguas.jpg'),
(5,2,'La isla misteriosa','978000000024',1874,500,10,10,'E-04','isla.jpg'),
(5,2,'Cinco semanas en globo','978000000025',1863,280,10,10,'E-05','globo.jpg');
go
INSERT INTO Libros_Autores (IdLibro, IdAutor)
VALUES

-- Gabriel García Márquez
(1,1),(2,1),(3,1),(4,1),(5,1),

-- Robert Martin
(6,3),(7,3),(8,3),(9,3),(10,3),

-- Mario Vargas Llosa
(11,2),(12,2),(13,2),(14,2),(15,2),

-- Thomas Cormen
(16,4),(17,4),(18,4),(19,4),(20,4),

-- Julio Verne
(21,5),(22,5),(23,5),(24,5),(25,5);
INSERT INTO Prestamos
(IdCliente, IdBibliotecaria, FechaPrestamo, FechaDevolucion, Estado, Observacion)
VALUES
(3,1,'2026-07-01','2026-07-08','Prestado','Entrega normal'),
(4,2,'2026-06-25','2026-07-02','Devuelto','Devuelto a tiempo'),
(5,1,'2026-06-20','2026-06-27','Devuelto','Sin observaciones'),
(3,2,'2026-06-15','2026-06-22','Devuelto','Entrega con retraso'),
(4,1,'2026-07-02','2026-07-09','Prestado','Nuevo préstamo');
go
INSERT INTO DetallePrestamo
(IdPrestamo, IdLibro, Cantidad)
VALUES
(1,1,1),
(2,6,1),
(3,11,1),
(4,16,1),
(5,21,1);
INSERT INTO HistorialPrestamos
(IdPrestamo, FechaRealDevolucion, Multa, Observacion)
VALUES
(1,NULL,NULL,'Aún no devuelve el libro'),
(2,'2026-07-02',0.00,'Devuelto correctamente'),
(3,'2026-06-27',0.00,'Entrega puntual'),
(4,'2026-06-24',15.00,'Retraso de dos días'),
(5,NULL,NULL,'Préstamo vigente');