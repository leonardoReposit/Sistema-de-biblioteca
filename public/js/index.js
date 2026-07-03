(function() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) { window.location.href = '/login.html'; return; }
    document.getElementById('userInfo').textContent = usuario.nombre + ' (' + usuario.rol + ')';
    const esBib = usuario.rol === 'Bibliotecaria';
    if (!esBib) { const l = document.getElementById('linkUsuarios'); if (l) l.style.display = 'none'; }
    document.getElementById('btnCerrarSesion').addEventListener('click', function() {
        localStorage.removeItem('usuario'); window.location.href = '/login.html';
    });
    function api(path) {
        return fetch('/api' + path, { headers: { 'x-usuario': usuario.id } }).then(r => r.json());
    }
    function render() {
        const el = document.getElementById('contenido');
        if (esBib) {
            el.innerHTML = `
                <h2>Dashboard</h2>
                <div class="cards">
                    <div class="card" id="cardUsuarios"><h3>Usuarios</h3><p id="cu">-</p></div>
                    <div class="card" id="cardLibros"><h3>Libros</h3><p id="cl">-</p></div>
                    <div class="card" id="cardCategorias"><h3>Categorias</h3><p id="cc">-</p></div>
                    <div class="card" id="cardAutores"><h3>Autores</h3><p id="ca">-</p></div>
                    <div class="card" id="cardEditoriales"><h3>Editoriales</h3><p id="ce">-</p></div>
                    <div class="card" id="cardPrestamos"><h3>Prestamos</h3><p id="cp">-</p></div>
                </div>`;
            document.getElementById('cardUsuarios').addEventListener('click', function() { location='usuarios.html'; });
            document.getElementById('cardLibros').addEventListener('click', function() { location='libros.html'; });
            document.getElementById('cardCategorias').addEventListener('click', function() { location='categorias.html'; });
            document.getElementById('cardAutores').addEventListener('click', function() { location='autores.html'; });
            document.getElementById('cardEditoriales').addEventListener('click', function() { location='editoriales.html'; });
            document.getElementById('cardPrestamos').addEventListener('click', function() { location='prestamos.html'; });
            api('/usuarios').then(d => document.getElementById('cu').textContent = d.length || 0);
            api('/libros').then(d => document.getElementById('cl').textContent = d.length || 0);
            api('/categorias').then(d => document.getElementById('cc').textContent = d.length || 0);
            api('/autores').then(d => document.getElementById('ca').textContent = d.length || 0);
            api('/editoriales').then(d => document.getElementById('ce').textContent = d.length || 0);
            api('/prestamos').then(d => document.getElementById('cp').textContent = d.length || 0);
        } else {
            el.innerHTML = `
                <h2>Bienvenido, ${usuario.nombre}</h2>
                <div class="cards">
                    <div class="card"><h3>Mis Prestamos</h3><p id="mp">-</p></div>
                    <div class="card"><h3>Historial</h3><p id="mh">-</p></div>
                </div>
                <h3 style="margin:25px 0 10px;font-size:16px;color:#1b2a4a">Tus prestamos actuales</h3>
                <div id="prestamosRecientes"></div>`;
            api('/mis-prestamos').then(d => {
                document.getElementById('mp').textContent = d.length || 0;
                const activos = d.filter(p => p.Estado === 'Prestado');
                const h = document.getElementById('prestamosRecientes');
                if (activos.length === 0) { h.innerHTML = '<p style="color:#888;font-size:13px">No tienes prestamos activos</p>'; return; }
                let html = '<table><thead><tr><th>#</th><th>Fecha Prestamo</th><th>Fecha Dev.</th><th>Estado</th></tr></thead><tbody>';
                activos.forEach(p => {
                    html += `<tr><td>${p.IdPrestamo}</td><td>${p.FechaPrestamo ? p.FechaPrestamo.toString().split('T')[0] : '-'}</td><td>${p.FechaDevolucion ? p.FechaDevolucion.toString().split('T')[0] : '-'}</td><td><span class="status-badge status-loaned">${p.Estado}</span></td></tr>`;
                });
                html += '</tbody></table>';
                h.innerHTML = html;
            });
            api('/mi-historial').then(d => document.getElementById('mh').textContent = d.length || 0);
        }
    }
    render();
})();
