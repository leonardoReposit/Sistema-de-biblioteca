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
        if (esBib) {
            document.getElementById('btnNuevo').innerHTML = '<button class="btn btn-primary" id="btnNuevoCat">+ Nueva</button>';
            document.getElementById('btnNuevoCat').addEventListener('click', function() { formulario(); });
        }
        api('/categorias').then(d => {
            datos = d;
            filtrar();
        });
    }
    function filtrar() {
        const texto = document.getElementById('buscar').value.toLowerCase();
        const estado = document.getElementById('filtroEstado').value;
        const filtrados = datos.filter(row => {
            const txt = !texto || row.Nombre.toLowerCase().includes(texto) || (row.Descripcion||'').toLowerCase().includes(texto);
            const est = estado === '' || row.Estado == estado;
            return txt && est;
        });
        let html = '<table><thead><tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Estado</th>';
        if (esBib) html += '<th>Acciones</th>';
        html += '</tr></thead><tbody>';
        filtrados.forEach(row => {
            html += `<tr><td>${row.IdCategoria}</td><td>${row.Nombre}</td><td>${row.Descripcion || '-'}</td><td><span class="status-badge ${row.Estado ? 'status-active' : 'status-inactive'}">${row.Estado ? 'Activo' : 'Inactivo'}</span></td>`;
            if (esBib) html += `<td><button class="btn-sm btn-edit" onclick="window._editCat(${row.IdCategoria})">Editar</button> <button class="btn-sm btn-del" onclick="window._delCat(${row.IdCategoria})">Eliminar</button></td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        if (filtrados.length === 0) html = '<p>No se encontraron categorias</p>';
        else if (filtrados.length < datos.length) html += '<p class="total-reg">Mostrando ' + filtrados.length + ' de ' + datos.length + ' categorias</p>';
        document.getElementById('tabla').innerHTML = html;
    }
    window._editCat = function(id) {
        const item = datos.find(d => d.IdCategoria === id);
        modal('Editar Categoria', `
            <form id="form"><label>Nombre</label><input name="Nombre" value="${item.Nombre}" required>
            <label>Descripcion</label><textarea name="Descripcion">${item.Descripcion || ''}</textarea>
            <label>Estado</label><select name="Estado"><option value="1" ${item.Estado?'selected':''}>Activo</option><option value="0" ${!item.Estado?'selected':''}>Inactivo</option></select>
            </form>`, function() {
            const data = Object.fromEntries(new FormData(document.getElementById('form')));
            api('/categorias/' + id, { method: 'PUT', body: data }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Guardado'); } else mensaje('Error: ' + r.error);
            });
        });
    };
    window._delCat = function(id) {
        modal('Confirmar', '<p>Eliminar categoria #' + id + '?</p>', function() {
            api('/categorias/' + id, { method: 'DELETE' }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Eliminado'); } else mensaje('Error: ' + r.error);
            });
        }, 'Eliminar');
    };
    function formulario() {
        modal('Nueva Categoria', `
            <form id="form"><label>Nombre</label><input name="Nombre" required>
            <label>Descripcion</label><textarea name="Descripcion"></textarea>
            </form>`, function() {
            const data = Object.fromEntries(new FormData(document.getElementById('form')));
            data.Estado = 1;
            api('/categorias', { method: 'POST', body: data }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Guardado'); } else mensaje('Error: ' + r.error);
            });
        });
    }
    function modal(titulo, contenido, onConfirm, btnText) {
        const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${titulo}</h3><span class="modal-close" id="modalClose">&times;</span></div>
            <div class="modal-body">${contenido}</div>${onConfirm ? '<div class="modal-footer"><button class="btn btn-cancel" id="modalCancel">Cancelar</button><button class="btn btn-primary" id="btnConfirm">'+(btnText||'Confirmar')+'</button></div>' : ''}</div>`;
        overlay.onclick = function(e) { if (e.target === overlay) cerrarModal(); };
        document.body.appendChild(overlay);
        document.getElementById('modalClose').onclick = cerrarModal;
        if (onConfirm) document.getElementById('btnConfirm').onclick = onConfirm;
        const cancel = document.getElementById('modalCancel');
        if (cancel) cancel.onclick = cerrarModal;
    }
    function cerrarModal() { document.querySelectorAll('.modal-overlay').forEach(function(x) { x.remove(); }); }
    function mensaje(msg) {
        const m = document.createElement('div');
        m.style.cssText = 'position:fixed;top:20px;right:20px;background:#4caf50;color:#fff;padding:10px 18px;border-radius:3px;z-index:2000;font-size:13px';
        m.textContent = msg; document.body.appendChild(m); setTimeout(function() { m.remove(); }, 2500);
    }
    cargar();
})();
