const express = require('express');
const sql = require('mssql');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const config = {
    server: 'localhost',
    port: 1433,
    database: 'BibliotecaDB',
    user: 'biblioteca_user',
    password: 'Bibli0teca2024!',
    options: { encrypt: false, trustServerCertificate: true }
};

let pool;
sql.connect(config).then(p => { pool = p; console.log('BD conectada'); })
    .catch(e => { console.error('Error BD:', e.message); process.exit(1); });

const auth = (req, res, next) => {
    const user = req.headers['x-usuario'];
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    req.idUsuario = parseInt(user);
    next();
};

const soloBibliotecaria = async (req, res, next) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.idUsuario)
            .query(`SELECT r.Nombre as RolNombre FROM Usuarios u INNER JOIN Roles r ON u.IdRol = r.IdRol WHERE u.IdUsuario = @id`);
        if (r.recordset.length === 0 || r.recordset[0].RolNombre !== 'Bibliotecaria') {
            return res.status(403).json({ error: 'Solo bibliotecarias' });
        }
        next();
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const r = await pool.request()
            .input('correo', sql.VarChar, req.body.email)
            .query(`SELECT u.*, r.Nombre as RolNombre FROM Usuarios u INNER JOIN Roles r ON u.IdRol = r.IdRol WHERE u.Correo = @correo`);
        if (r.recordset.length === 0) return res.status(401).json({ error: 'Credenciales invalidas' });
        const user = r.recordset[0];
        if (user.Password !== req.body.password) return res.status(401).json({ error: 'Credenciales invalidas' });
        res.json({ ok: true, id: user.IdUsuario, nombre: user.Nombres + ' ' + user.Apellidos, rol: user.RolNombre, correo: user.Correo });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }); }
});

// USUARIOS
app.get('/api/usuarios', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`SELECT u.*, r.Nombre as RolNombre FROM Usuarios u INNER JOIN Roles r ON u.IdRol = r.IdRol ORDER BY u.IdUsuario`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.get('/api/usuarios/:id', auth, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`SELECT u.*, r.Nombre as RolNombre FROM Usuarios u INNER JOIN Roles r ON u.IdRol = r.IdRol WHERE u.IdUsuario = @id`);
        if (r.recordset.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(r.recordset[0]);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.post('/api/usuarios', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { IdRol, Nombres, Apellidos, DNI, Telefono, Correo, Usuario, Password } = req.body;
        const r = await pool.request()
            .input('IdRol', sql.Int, IdRol).input('Nombres', sql.VarChar, Nombres).input('Apellidos', sql.VarChar, Apellidos)
            .input('DNI', sql.Char(8), DNI).input('Telefono', sql.VarChar, Telefono || null).input('Correo', sql.VarChar, Correo || null)
            .input('Usuario', sql.VarChar, Usuario).input('Password', sql.VarChar, Password)
            .query(`INSERT INTO Usuarios (IdRol,Nombres,Apellidos,DNI,Telefono,Correo,Usuario,Password) OUTPUT INSERTED.IdUsuario VALUES (@IdRol,@Nombres,@Apellidos,@DNI,@Telefono,@Correo,@Usuario,@Password)`);
        res.json({ ok: true, id: r.recordset[0].IdUsuario });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.put('/api/usuarios/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { IdRol, Nombres, Apellidos, DNI, Telefono, Correo, Usuario, Password, Estado } = req.body;
        const r = await pool.request()
            .input('id', sql.Int, req.params.id).input('IdRol', sql.Int, IdRol).input('Nombres', sql.VarChar, Nombres)
            .input('Apellidos', sql.VarChar, Apellidos).input('DNI', sql.Char(8), DNI).input('Telefono', sql.VarChar, Telefono || null)
            .input('Correo', sql.VarChar, Correo || null).input('Usuario', sql.VarChar, Usuario).input('Password', sql.VarChar, Password)
            .input('Estado', sql.Bit, Estado)
            .query(`UPDATE Usuarios SET IdRol=@IdRol,Nombres=@Nombres,Apellidos=@Apellidos,DNI=@DNI,Telefono=@Telefono,Correo=@Correo,Usuario=@Usuario,Password=@Password,Estado=@Estado WHERE IdUsuario=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.delete('/api/usuarios/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Usuarios WHERE IdUsuario=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// AUTORES
app.get('/api/autores', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`SELECT * FROM Autores ORDER BY IdAutor`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.post('/api/autores', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { Nombre, Apellido, Nacionalidad, FechaNacimiento } = req.body;
        const r = await pool.request()
            .input('Nombre', sql.VarChar, Nombre).input('Apellido', sql.VarChar, Apellido)
            .input('Nacionalidad', sql.VarChar, Nacionalidad || null).input('FechaNacimiento', sql.Date, FechaNacimiento || null)
            .query(`INSERT INTO Autores (Nombre,Apellido,Nacionalidad,FechaNacimiento) OUTPUT INSERTED.IdAutor VALUES (@Nombre,@Apellido,@Nacionalidad,@FechaNacimiento)`);
        res.json({ ok: true, id: r.recordset[0].IdAutor });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.put('/api/autores/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { Nombre, Apellido, Nacionalidad, FechaNacimiento, Estado } = req.body;
        const r = await pool.request()
            .input('id', sql.Int, req.params.id).input('Nombre', sql.VarChar, Nombre).input('Apellido', sql.VarChar, Apellido)
            .input('Nacionalidad', sql.VarChar, Nacionalidad || null).input('FechaNacimiento', sql.Date, FechaNacimiento || null)
            .input('Estado', sql.Bit, Estado)
            .query(`UPDATE Autores SET Nombre=@Nombre,Apellido=@Apellido,Nacionalidad=@Nacionalidad,FechaNacimiento=@FechaNacimiento,Estado=@Estado WHERE IdAutor=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.delete('/api/autores/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Autores WHERE IdAutor=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// CATEGORIAS
app.get('/api/categorias', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`SELECT * FROM Categorias ORDER BY IdCategoria`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.post('/api/categorias', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { Nombre, Descripcion } = req.body;
        const r = await pool.request()
            .input('Nombre', sql.VarChar, Nombre).input('Descripcion', sql.VarChar, Descripcion || null)
            .query(`INSERT INTO Categorias (Nombre,Descripcion) OUTPUT INSERTED.IdCategoria VALUES (@Nombre,@Descripcion)`);
        res.json({ ok: true, id: r.recordset[0].IdCategoria });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.put('/api/categorias/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { Nombre, Descripcion, Estado } = req.body;
        const r = await pool.request()
            .input('id', sql.Int, req.params.id).input('Nombre', sql.VarChar, Nombre)
            .input('Descripcion', sql.VarChar, Descripcion || null).input('Estado', sql.Bit, Estado)
            .query(`UPDATE Categorias SET Nombre=@Nombre,Descripcion=@Descripcion,Estado=@Estado WHERE IdCategoria=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.delete('/api/categorias/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Categorias WHERE IdCategoria=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// EDITORIALES
app.get('/api/editoriales', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`SELECT * FROM Editoriales ORDER BY IdEditorial`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.post('/api/editoriales', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { Nombre, Pais } = req.body;
        const r = await pool.request()
            .input('Nombre', sql.VarChar, Nombre).input('Pais', sql.VarChar, Pais || null)
            .query(`INSERT INTO Editoriales (Nombre,Pais) OUTPUT INSERTED.IdEditorial VALUES (@Nombre,@Pais)`);
        res.json({ ok: true, id: r.recordset[0].IdEditorial });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.put('/api/editoriales/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { Nombre, Pais, Estado } = req.body;
        const r = await pool.request()
            .input('id', sql.Int, req.params.id).input('Nombre', sql.VarChar, Nombre)
            .input('Pais', sql.VarChar, Pais || null).input('Estado', sql.Bit, Estado)
            .query(`UPDATE Editoriales SET Nombre=@Nombre,Pais=@Pais,Estado=@Estado WHERE IdEditorial=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.delete('/api/editoriales/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Editoriales WHERE IdEditorial=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// LIBROS
app.get('/api/libros', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`
            SELECT l.*, c.Nombre as CategoriaNombre, e.Nombre as EditorialNombre
            FROM Libros l
            INNER JOIN Categorias c ON l.IdCategoria = c.IdCategoria
            INNER JOIN Editoriales e ON l.IdEditorial = e.IdEditorial
            ORDER BY l.IdLibro`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.get('/api/libros/:id', auth, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`
            SELECT l.*, c.Nombre as CategoriaNombre, e.Nombre as EditorialNombre
            FROM Libros l
            INNER JOIN Categorias c ON l.IdCategoria = c.IdCategoria
            INNER JOIN Editoriales e ON l.IdEditorial = e.IdEditorial
            WHERE l.IdLibro = @id`);
        if (r.recordset.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const libro = r.recordset[0];
        const a = await pool.request().input('id', sql.Int, req.params.id)
            .query(`SELECT a.* FROM Autores a INNER JOIN Libros_Autores la ON a.IdAutor = la.IdAutor WHERE la.IdLibro = @id`);
        libro.autores = a.recordset;
        res.json(libro);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.post('/api/libros', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { IdCategoria, IdEditorial, Titulo, ISBN, AnioPublicacion, NumeroPaginas, Stock, Ubicacion, autores } = req.body;
        const r = await pool.request()
            .input('IdCategoria', sql.Int, IdCategoria).input('IdEditorial', sql.Int, IdEditorial)
            .input('Titulo', sql.VarChar, Titulo).input('ISBN', sql.VarChar, ISBN || null)
            .input('AnioPublicacion', sql.Int, AnioPublicacion || null).input('NumeroPaginas', sql.Int, NumeroPaginas || null)
            .input('Stock', sql.Int, Stock || 0).input('Ubicacion', sql.VarChar, Ubicacion || null)
            .query(`INSERT INTO Libros (IdCategoria,IdEditorial,Titulo,ISBN,AnioPublicacion,NumeroPaginas,Stock,Disponibles,Ubicacion) OUTPUT INSERTED.IdLibro VALUES (@IdCategoria,@IdEditorial,@Titulo,@ISBN,@AnioPublicacion,@NumeroPaginas,@Stock,@Stock,@Ubicacion)`);
        const idLibro = r.recordset[0].IdLibro;
        if (autores && autores.length > 0) {
            for (const idAutor of autores) {
                await pool.request().input('idLibro', sql.Int, idLibro).input('idAutor', sql.Int, idAutor)
                    .query(`INSERT INTO Libros_Autores (IdLibro,IdAutor) VALUES (@idLibro,@idAutor)`);
            }
        }
        res.json({ ok: true, id: idLibro });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.put('/api/libros/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { IdCategoria, IdEditorial, Titulo, ISBN, AnioPublicacion, NumeroPaginas, Stock, Ubicacion, Estado } = req.body;
        await pool.request()
            .input('id', sql.Int, req.params.id).input('IdCategoria', sql.Int, IdCategoria).input('IdEditorial', sql.Int, IdEditorial)
            .input('Titulo', sql.VarChar, Titulo).input('ISBN', sql.VarChar, ISBN || null)
            .input('AnioPublicacion', sql.Int, AnioPublicacion || null).input('NumeroPaginas', sql.Int, NumeroPaginas || null)
            .input('Stock', sql.Int, Stock).input('Ubicacion', sql.VarChar, Ubicacion || null).input('Estado', sql.Bit, Estado)
            .query(`UPDATE Libros SET IdCategoria=@IdCategoria,IdEditorial=@IdEditorial,Titulo=@Titulo,ISBN=@ISBN,AnioPublicacion=@AnioPublicacion,NumeroPaginas=@NumeroPaginas,Stock=@Stock,Ubicacion=@Ubicacion,Estado=@Estado WHERE IdLibro=@id`);
        await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Libros_Autores WHERE IdLibro=@id`);
        if (req.body.autores && req.body.autores.length > 0) {
            for (const idAutor of req.body.autores) {
                await pool.request().input('idLibro', sql.Int, req.params.id).input('idAutor', sql.Int, idAutor)
                    .query(`INSERT INTO Libros_Autores (IdLibro,IdAutor) VALUES (@idLibro,@idAutor)`);
            }
        }
        res.json({ ok: true });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.delete('/api/libros/:id', auth, soloBibliotecaria, async (req, res) => {
    try {
        await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Libros_Autores WHERE IdLibro=@id`);
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`DELETE FROM Libros WHERE IdLibro=@id`);
        res.json({ ok: true, affected: r.rowsAffected[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// PRESTAMOS
app.get('/api/prestamos', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`
            SELECT p.*, 
                   c.Nombres + ' ' + c.Apellidos as ClienteNombre,
                   b.Nombres + ' ' + b.Apellidos as BibliotecariaNombre
            FROM Prestamos p
            INNER JOIN Usuarios c ON p.IdCliente = c.IdUsuario
            INNER JOIN Usuarios b ON p.IdBibliotecaria = b.IdUsuario
            ORDER BY p.IdPrestamo DESC`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.get('/api/prestamos/:id', auth, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id).query(`
            SELECT p.*, 
                   c.Nombres + ' ' + c.Apellidos as ClienteNombre,
                   b.Nombres + ' ' + b.Apellidos as BibliotecariaNombre
            FROM Prestamos p
            INNER JOIN Usuarios c ON p.IdCliente = c.IdUsuario
            INNER JOIN Usuarios b ON p.IdBibliotecaria = b.IdUsuario
            WHERE p.IdPrestamo = @id`);
        if (r.recordset.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const prestamo = r.recordset[0];
        const d = await pool.request().input('id', sql.Int, req.params.id).query(`
            SELECT d.*, l.Titulo as LibroTitulo, l.ISBN
            FROM DetallePrestamo d INNER JOIN Libros l ON d.IdLibro = l.IdLibro WHERE d.IdPrestamo = @id`);
        prestamo.detalle = d.recordset;
        res.json(prestamo);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.post('/api/prestamos', auth, soloBibliotecaria, async (req, res) => {
    try {
        const { IdCliente, FechaDevolucion, detalle } = req.body;
        const trx = pool.transaction();
        await trx.begin();
        try {
            const r = await trx.request()
                .input('IdCliente', sql.Int, IdCliente).input('IdBibliotecaria', sql.Int, req.idUsuario)
                .input('FechaPrestamo', sql.Date, new Date()).input('FechaDevolucion', sql.Date, new Date(FechaDevolucion))
                .query(`INSERT INTO Prestamos (IdCliente,IdBibliotecaria,FechaPrestamo,FechaDevolucion) OUTPUT INSERTED.IdPrestamo VALUES (@IdCliente,@IdBibliotecaria,@FechaPrestamo,@FechaDevolucion)`);
            const idPrestamo = r.recordset[0].IdPrestamo;
            for (const item of detalle) {
                await trx.request().input('IdPrestamo', sql.Int, idPrestamo).input('IdLibro', sql.Int, item.IdLibro)
                    .input('Cantidad', sql.Int, item.Cantidad)
                    .query(`INSERT INTO DetallePrestamo (IdPrestamo,IdLibro,Cantidad) VALUES (@IdPrestamo,@IdLibro,@Cantidad)`);
                await trx.request().input('IdLibro', sql.Int, item.IdLibro).input('Cantidad', sql.Int, item.Cantidad)
                    .query(`UPDATE Libros SET Disponibles = Disponibles - @Cantidad WHERE IdLibro = @IdLibro`);
            }
            await trx.commit();
            res.json({ ok: true, id: idPrestamo });
        } catch (e) { await trx.rollback(); throw e; }
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// SOLICITAR PRESTAMO (cliente)
app.post('/api/solicitar-prestamo', auth, async (req, res) => {
    try {
        const { IdLibro, Cantidad, FechaDevolucion } = req.body;
        const bib = await pool.request()
            .query(`SELECT TOP 1 IdUsuario FROM Usuarios WHERE IdRol = 1 AND Estado = 1 ORDER BY IdUsuario`);
        if (bib.recordset.length === 0) return res.status(400).json({ error: 'No hay bibliotecarias disponibles' });
        const idBib = bib.recordset[0].IdUsuario;
        const trx = pool.transaction();
        await trx.begin();
        try {
            const r = await trx.request()
                .input('IdCliente', sql.Int, req.idUsuario).input('IdBibliotecaria', sql.Int, idBib)
                .input('FechaPrestamo', sql.Date, new Date()).input('FechaDevolucion', sql.Date, new Date(FechaDevolucion))
                .query(`INSERT INTO Prestamos (IdCliente,IdBibliotecaria,FechaPrestamo,FechaDevolucion) OUTPUT INSERTED.IdPrestamo VALUES (@IdCliente,@IdBibliotecaria,@FechaPrestamo,@FechaDevolucion)`);
            const idPrestamo = r.recordset[0].IdPrestamo;
            await trx.request().input('IdPrestamo', sql.Int, idPrestamo).input('IdLibro', sql.Int, IdLibro)
                .input('Cantidad', sql.Int, Cantidad || 1)
                .query(`INSERT INTO DetallePrestamo (IdPrestamo,IdLibro,Cantidad) VALUES (@IdPrestamo,@IdLibro,@Cantidad)`);
            await trx.request().input('IdLibro', sql.Int, IdLibro).input('Cantidad', sql.Int, Cantidad || 1)
                .query(`UPDATE Libros SET Disponibles = Disponibles - @Cantidad WHERE IdLibro = @IdLibro`);
            await trx.commit();
            res.json({ ok: true, id: idPrestamo });
        } catch (e) { await trx.rollback(); throw e; }
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});
app.put('/api/prestamos/:id/devolver', auth, soloBibliotecaria, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.params.id)
            .query(`UPDATE Prestamos SET Estado='Devuelto' WHERE IdPrestamo=@id`);
        const det = await pool.request().input('id', sql.Int, req.params.id)
            .query(`SELECT IdLibro, Cantidad FROM DetallePrestamo WHERE IdPrestamo=@id`);
        for (const item of det.recordset) {
            await pool.request().input('idLibro', sql.Int, item.IdLibro).input('cant', sql.Int, item.Cantidad)
                .query(`UPDATE Libros SET Disponibles = Disponibles + @cant WHERE IdLibro = @idLibro`);
        }
        const { Multa, Observacion } = req.body;
        await pool.request().input('IdPrestamo', sql.Int, req.params.id)
            .input('FechaRealDevolucion', sql.Date, new Date()).input('Multa', sql.Decimal(10,2), Multa || 0)
            .input('Observacion', sql.VarChar, Observacion || null)
            .query(`INSERT INTO HistorialPrestamos (IdPrestamo,FechaRealDevolucion,Multa,Observacion) VALUES (@IdPrestamo,@FechaRealDevolucion,@Multa,@Observacion)`);
        res.json({ ok: true });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// HISTORIAL
app.get('/api/historial', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`
            SELECT h.*, p.FechaPrestamo, p.FechaDevolucion, p.Estado as PrestamoEstado,
                   c.Nombres + ' ' + c.Apellidos as ClienteNombre,
                   b.Nombres + ' ' + b.Apellidos as BibliotecariaNombre
            FROM HistorialPrestamos h
            INNER JOIN Prestamos p ON h.IdPrestamo = p.IdPrestamo
            INNER JOIN Usuarios c ON p.IdCliente = c.IdUsuario
            INNER JOIN Usuarios b ON p.IdBibliotecaria = b.IdUsuario
            ORDER BY h.IdHistorial DESC`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// MIS PRESTAMOS (cliente ve solo los suyos)
app.get('/api/mis-prestamos', auth, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.idUsuario).query(`
            SELECT p.*, 
                   c.Nombres + ' ' + c.Apellidos as ClienteNombre,
                   b.Nombres + ' ' + b.Apellidos as BibliotecariaNombre
            FROM Prestamos p
            INNER JOIN Usuarios c ON p.IdCliente = c.IdUsuario
            INNER JOIN Usuarios b ON p.IdBibliotecaria = b.IdUsuario
            WHERE p.IdCliente = @id
            ORDER BY p.IdPrestamo DESC`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// MI HISTORIAL (cliente ve solo el suyo)
app.get('/api/mi-historial', auth, async (req, res) => {
    try {
        const r = await pool.request().input('id', sql.Int, req.idUsuario).query(`
            SELECT h.*, p.FechaPrestamo, p.FechaDevolucion, p.Estado as PrestamoEstado,
                   c.Nombres + ' ' + c.Apellidos as ClienteNombre,
                   b.Nombres + ' ' + b.Apellidos as BibliotecariaNombre
            FROM HistorialPrestamos h
            INNER JOIN Prestamos p ON h.IdPrestamo = p.IdPrestamo
            INNER JOIN Usuarios c ON p.IdCliente = c.IdUsuario
            INNER JOIN Usuarios b ON p.IdBibliotecaria = b.IdUsuario
            WHERE p.IdCliente = @id
            ORDER BY h.IdHistorial DESC`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// ROLES (para combos)
app.get('/api/roles', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`SELECT * FROM Roles ORDER BY IdRol`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// CLIENTES (para combo de prestamos - solo rol Cliente)
app.get('/api/clientes', auth, async (req, res) => {
    try {
        const r = await pool.request().query(`SELECT IdUsuario, Nombres, Apellidos, DNI FROM Usuarios WHERE IdRol = 2 AND Estado = 1 ORDER BY Nombres`);
        res.json(r.recordset);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));
