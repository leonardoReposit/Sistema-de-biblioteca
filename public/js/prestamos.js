(function() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) { window.location.href = '/login.html'; return; }
    document.getElementById('userInfo').textContent = usuario.nombre + ' (' + usuario.rol + ')';
    const esBib = usuario.rol === 'Bibliotecaria';
    if (!esBib) { const l = document.getElementById('linkUsuarios'); if (l) l.style.display = 'none'; }
    document.getElementById('btnCerrarSesion').addEventListener('click', function() {
        localStorage.removeItem('usuario'); window.location.href = '/login.html';
    });
    function api(path, opts = {}) {
        opts.headers = { ...opts.headers, 'Content-Type': 'application/json', 'x-usuario': usuario.id };
        if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
        return fetch('/api' + path, opts).then(r => r.json());
    }
    let datos = [];
    document.getElementById('buscar').addEventListener('keyup', filtrar);
    document.getElementById('filtroEstado').addEventListener('change', filtrar);
    function cargar() {
        document.getElementById('tabla').innerHTML = 'Cargando...';
        const endpoint = esBib ? '/prestamos' : '/mis-prestamos';
        if (esBib) {
            document.getElementById('btnNuevo').innerHTML = '<button class="btn btn-primary" id="btnNuevoPrestamo">+ Nuevo</button>';
            document.getElementById('btnNuevoPrestamo').addEventListener('click', function() { formulario(); });
        }
        api(endpoint).then(d => {
            datos = d;
            filtrar();
        });
    }
    function filtrar() {
        const texto = document.getElementById('buscar').value.toLowerCase();
        const estado = document.getElementById('filtroEstado').value;
        const filtrados = datos.filter(row => {
            const txt = !texto || String(row.IdPrestamo).includes(texto) || (row.ClienteNombre||'').toLowerCase().includes(texto) || (row.BibliotecariaNombre||'').toLowerCase().includes(texto);
            const est = !estado || row.Estado === estado;
            return txt && est;
        });
        let html = '<table><thead><tr><th>ID</th><th>Cliente</th><th>Bibliotecaria</th><th>F.Prestamo</th><th>F.Devolucion</th><th>Estado</th>';
        if (esBib) html += '<th>Acciones</th>';
        html += '</tr></thead><tbody>';
        filtrados.forEach(row => {
            const fecP = row.FechaPrestamo ? row.FechaPrestamo.toString().split('T')[0] : '-';
            const fecD = row.FechaDevolucion ? row.FechaDevolucion.toString().split('T')[0] : '-';
            html += `<tr><td>${row.IdPrestamo}</td><td>${row.ClienteNombre}</td><td>${row.BibliotecariaNombre}</td>
                <td>${fecP}</td><td>${fecD}</td><td><span class="status-badge ${row.Estado === 'Prestado' ? 'status-loaned' : 'status-returned'}">${row.Estado}</span></td>`;
            if (esBib) html += `<td>${row.Estado === 'Prestado' ? '<button class="btn-sm btn-edit" onclick="window._devolver('+row.IdPrestamo+')">Devolver</button>' : '-'}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        if (filtrados.length === 0) html = '<p>No hay prestamos</p>';
        else if (filtrados.length < datos.length) html += '<p class="total-reg">Mostrando ' + filtrados.length + ' de ' + datos.length + ' prestamos</p>';
        document.getElementById('tabla').innerHTML = html;
    }
    window._devolver = function(id) {
        modal('Devolver Prestamo #'+id, `
            <form id="form"><label>Multa (S/)</label><input name="Multa" type="number" value="0" step="0.01">
            <label>Observacion</label><textarea name="Observacion"></textarea></form>`, function() {
            const data = Object.fromEntries(new FormData(document.getElementById('form')));
            api('/prestamos/'+id+'/devolver',{method:'PUT',body:data}).then(r => {
                if(r.ok){ cargar(); cerrarModal(); mensaje('Devuelto'); } else mensaje('Error: '+r.error);
            });
        },'Devolver');
    };
    function formulario() {
        Promise.all([api('/clientes'),api('/libros')]).then(([clientes,libros]) => {
            const cliOpts = clientes.map(c => `<option value="${c.IdUsuario}">${c.Nombres} ${c.Apellidos} (${c.DNI})</option>`).join('');
            const disp = libros.filter(l => l.Disponibles > 0);
            modal('Nuevo Prestamo', `
                <form id="form"><label>Cliente</label><select name="IdCliente">${cliOpts}</select>
                <label>Fecha Devolucion</label><input name="FechaDevolucion" type="date" required>
                <label>Libros</label><div id="librosContainer">
                    <div class="libro-row"><select class="libro-select" name="IdLibro"><option value="">Seleccionar...</option>${disp.map(l => `<option value="${l.IdLibro}">${l.Titulo} (disp: ${l.Disponibles})</option>`).join('')}</select>
                    <input name="Cantidad" type="number" value="1" min="1" style="width:60px">
                    <button type="button" class="btn-sm btn-del" id="btnRemoveRow" onclick="this.parentElement.remove()">X</button></div>
                </div>
                <button type="button" class="btn btn-sm" id="btnAgregarLibro" style="margin-top:5px">+ Agregar libro</button></form>`, function() {
                const f = document.getElementById('form');
                const rows = f.querySelectorAll('.libro-row');
                const detalle = [];
                rows.forEach(row => {
                    const sel = row.querySelector('.libro-select');
                    const cant = row.querySelector('input[name="Cantidad"]');
                    if (sel.value) detalle.push({IdLibro:parseInt(sel.value),Cantidad:parseInt(cant.value)||1});
                });
                if (detalle.length === 0) { mensaje('Agregue al menos un libro'); return; }
                api('/prestamos',{method:'POST',body:{IdCliente:parseInt(f.querySelector('select[name="IdCliente"]').value),FechaDevolucion:f.querySelector('input[name="FechaDevolucion"]').value,detalle}})
                    .then(r => { if(r.ok){ cargar(); cerrarModal(); mensaje('Prestamo #'+r.id+' creado'); } else mensaje('Error: '+r.error); });
            },'Crear Prestamo');
            document.getElementById('btnAgregarLibro').onclick = function() {
                const div = document.getElementById('librosContainer');
                const row = document.createElement('div'); row.className = 'libro-row';
                row.innerHTML = `<select class="libro-select" name="IdLibro"><option value="">Seleccionar...</option>${disp.map(l => `<option value="${l.IdLibro}">${l.Titulo} (disp: ${l.Disponibles})</option>`).join('')}</select>
                    <input name="Cantidad" type="number" value="1" min="1" style="width:60px">
                    <button type="button" class="btn-sm btn-del" onclick="this.parentElement.remove()">X</button>`;
                div.appendChild(row);
            };
        });
    }
    function modal(titulo,contenido,onConfirm,btnText) {
        const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${titulo}</h3><span class="modal-close" id="modalClose">&times;</span></div>
            <div class="modal-body">${contenido}</div>${onConfirm?'<div class="modal-footer"><button class="btn btn-cancel" id="modalCancel">Cancelar</button><button class="btn btn-primary" id="btnConfirm">'+(btnText||'Confirmar')+'</button></div>':''}</div>`;
        overlay.onclick = function(e) { if(e.target===overlay) cerrarModal(); };
        document.body.appendChild(overlay);
        document.getElementById('modalClose').onclick = cerrarModal;
        if(onConfirm) document.getElementById('btnConfirm').onclick = onConfirm;
        const cancel = document.getElementById('modalCancel');
        if(cancel) cancel.onclick = cerrarModal;
    }
    function cerrarModal() { document.querySelectorAll('.modal-overlay').forEach(function(x){x.remove();}); }
    function mensaje(msg) {
        const m = document.createElement('div');
        m.style.cssText='position:fixed;top:20px;right:20px;background:#4caf50;color:#fff;padding:10px 18px;border-radius:3px;z-index:2000;font-size:13px';
        m.textContent=msg; document.body.appendChild(m); setTimeout(function(){m.remove();},2500);
    }
    cargar();
})();
