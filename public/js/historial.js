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
    let datos = [];
    document.getElementById('buscar').addEventListener('keyup', filtrar);
    function cargar() {
        document.getElementById('tabla').innerHTML = 'Cargando...';
        const endpoint = esBib ? '/historial' : '/mi-historial';
        api(endpoint).then(d => {
            datos = d;
            filtrar();
        });
    }
    function filtrar() {
        const texto = document.getElementById('buscar').value.toLowerCase();
        const filtrados = datos.filter(row => {
            return !texto || String(row.IdHistorial).includes(texto) || String(row.IdPrestamo).includes(texto) || (row.ClienteNombre||'').toLowerCase().includes(texto) || (row.BibliotecariaNombre||'').toLowerCase().includes(texto) || (row.Observacion||'').toLowerCase().includes(texto);
        });
        let html = '<table><thead><tr><th>ID</th><th>Prestamo</th><th>Cliente</th><th>Bibliotecaria</th><th>F.Prestamo</th><th>F.Devolucion</th><th>F.Real Dev.</th><th>Multa</th><th>Observacion</th></tr></thead><tbody>';
        filtrados.forEach(row => {
            html += `<tr><td>${row.IdHistorial}</td><td>${row.IdPrestamo}</td><td>${row.ClienteNombre}</td><td>${row.BibliotecariaNombre}</td>
                <td>${row.FechaPrestamo?row.FechaPrestamo.toString().split('T')[0]:'-'}</td>
                <td>${row.FechaDevolucion?row.FechaDevolucion.toString().split('T')[0]:'-'}</td>
                <td>${row.FechaRealDevolucion?row.FechaRealDevolucion.toString().split('T')[0]:'-'}</td>
                <td>${row.Multa?'S/ '+parseFloat(row.Multa).toFixed(2):'-'}</td>
                <td>${row.Observacion||'-'}</td></tr>`;
        });
        html += '</tbody></table>';
        if (filtrados.length === 0) html = '<p>No hay historial</p>';
        else if (filtrados.length < datos.length) html += '<p class="total-reg">Mostrando ' + filtrados.length + ' de ' + datos.length + ' registros</p>';
        document.getElementById('tabla').innerHTML = html;
    }
    cargar();
})();
