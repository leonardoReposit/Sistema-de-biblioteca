(function() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) { window.location.href = '/login.html'; return; }
    document.getElementById('userInfo').textContent = usuario.nombre + ' (' + usuario.rol + ')';
    const esBib = usuario.rol === 'Bibliotecaria';
    if (!esBib) { window.location.href = '/'; return; }
    document.getElementById('btnCerrarSesion').addEventListener('click', function() {
        localStorage.removeItem('usuario'); window.location.href = '/login.html';
    });
    function api(path, opts = {}) {
        opts.headers = { ...opts.headers, 'Content-Type': 'application/json', 'x-usuario': usuario.id };
        if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
        return fetch('/api' + path, opts).then(r => r.json());
    }
    let datos = [];
    let roles = [];
    document.getElementById('buscar').addEventListener('keyup', filtrar);
    document.getElementById('filtroRol').addEventListener('change', filtrar);
    document.getElementById('filtroEstado').addEventListener('change', filtrar);
    function cargar() {
        document.getElementById('tabla').innerHTML = 'Cargando...';
        document.getElementById('btnNuevo').innerHTML = '<button class="btn btn-primary" id="btnNuevoUsuario">+ Nuevo</button>';
        document.getElementById('btnNuevoUsuario').addEventListener('click', function() { formulario(); });
        Promise.all([api('/usuarios'), api('/roles')]).then(([u, r]) => {
            datos = u; roles = r;
            const selRol = document.getElementById('filtroRol');
            selRol.innerHTML = '<option value="">Todos los roles</option>';
            r.forEach(rol => {
                selRol.innerHTML += `<option value="${rol.IdRol}">${rol.Nombre}</option>`;
            });
            filtrar();
        });
    }
    function filtrar() {
        const texto = document.getElementById('buscar').value.toLowerCase();
        const rol = document.getElementById('filtroRol').value;
        const estado = document.getElementById('filtroEstado').value;
        const filtrados = datos.filter(row => {
            const nombreCompleto = (row.Nombres + ' ' + row.Apellidos).toLowerCase();
            const dni = (row.DNI || '').toLowerCase();
            const correo = (row.Correo || '').toLowerCase();
            const usu = (row.Usuario || '').toLowerCase();
            const coincideTexto = !texto || nombreCompleto.includes(texto) || dni.includes(texto) || correo.includes(texto) || usu.includes(texto);
            const coincideRol = !rol || row.IdRol == rol;
            const coincideEstado = estado === '' || row.Estado == estado;
            return coincideTexto && coincideRol && coincideEstado;
        });
        let html = '<table><thead><tr><th>ID</th><th>Nombres</th><th>DNI</th><th>Correo</th><th>Usuario</th><th>Rol</th><th>Estado</th>';
        html += '<th>Acciones</th></tr></thead><tbody>';
        filtrados.forEach(row => {
            html += `<tr>
                <td>${row.IdUsuario}</td>
                <td>${row.Nombres} ${row.Apellidos}</td>
                <td>${row.DNI}</td>
                <td>${row.Correo || '-'}</td>
                <td>${row.Usuario}</td>
                <td>${row.RolNombre}</td>
                <td><span class="status-badge ${row.Estado ? 'status-active' : 'status-inactive'}">${row.Estado ? 'Activo' : 'Inactivo'}</span></td>`;
            const noEliminar = row.IdUsuario === usuario.id ? 'disabled title="No puedes eliminarte"' : '';
            html += `<td>
                <button class="btn-sm btn-edit" onclick="window._editUsuario(${row.IdUsuario})">Editar</button>
                <button class="btn-sm btn-del" onclick="window._delUsuario(${row.IdUsuario})" ${noEliminar}>Eliminar</button>
            </td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        if (filtrados.length === 0) html = '<p>No se encontraron usuarios</p>';
        else html += '<p class="total-reg">Mostrando ' + filtrados.length + ' de ' + datos.length + ' usuarios</p>';
        document.getElementById('tabla').innerHTML = html;
    }
    function validarForm(data, id) {
        if (!data.Nombres || !data.Nombres.trim()) { mensajeError('El campo Nombres es obligatorio'); return false; }
        if (!data.Apellidos || !data.Apellidos.trim()) { mensajeError('El campo Apellidos es obligatorio'); return false; }
        if (!data.DNI || !/^\d{8}$/.test(data.DNI)) { mensajeError('El DNI debe tener exactamente 8 digitos numericos'); return false; }
        if (!data.Usuario || !data.Usuario.trim()) { mensajeError('El campo Usuario es obligatorio'); return false; }
        if (!id && (!data.Password || data.Password.length < 4)) { mensajeError('La contrasena debe tener al menos 4 caracteres'); return false; }
        if (data.Correo && data.Correo.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Correo)) { mensajeError('El formato del correo no es valido'); return false; }
        }
        return true;
    }
    window._editUsuario = function(id) {
        const item = datos.find(d => d.IdUsuario === id);
        const titulo = 'Editar Usuario';
        const opts = roles.map(r => `<option value="${r.IdRol}" ${item.IdRol === r.IdRol ? 'selected' : ''}>${r.Nombre}</option>`).join('');
        const html = `
            <form id="form">
                <div class="form-grid">
                    <div><label>Nombres *</label><input name="Nombres" value="${item.Nombres}" required></div>
                    <div><label>Apellidos *</label><input name="Apellidos" value="${item.Apellidos}" required></div>
                    <div><label>DNI *</label><input name="DNI" value="${item.DNI}" maxlength="8" required placeholder="8 digitos"></div>
                    <div><label>Telefono</label><input name="Telefono" value="${item.Telefono || ''}"></div>
                    <div><label>Correo</label><input name="Correo" type="email" value="${item.Correo || ''}" placeholder="ejemplo@correo.com"></div>
                    <div><label>Usuario *</label><input name="Usuario" value="${item.Usuario}" required></div>
                    <div><label>Password (dejar vacio para mantener)</label><input name="Password" type="password"></div>
                    <div><label>Rol *</label><select name="IdRol">${opts}</select></div>
                    <div><label>Estado</label><select name="Estado"><option value="1" ${item.Estado?'selected':''}>Activo</option><option value="0" ${!item.Estado?'selected':''}>Inactivo</option></select></div>
                </div>
                <p style="font-size:11px;color:#999;margin-top:10px">* Campos obligatorios</p>
            </form>`;
        modal(titulo, html, function() {
            const f = document.getElementById('form');
            const data = Object.fromEntries(new FormData(f));
            if (!validarForm(data, id)) return;
            if (!data.Password) delete data.Password;
            api('/usuarios/' + id, { method: 'PUT', body: data }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Guardado'); } else mensaje('Error: ' + (r.error || 'desconocido'));
            });
        }, 'Guardar');
    };
    window._delUsuario = function(id) {
        if (id === usuario.id) { mensajeError('No puedes eliminarte a ti mismo'); return; }
        modal('Confirmar', '<p>Eliminar permanentemente al usuario #' + id + '?</p><p style="font-size:12px;color:#c0392b">Esta accion no se puede deshacer</p>', function() {
            api('/usuarios/' + id, { method: 'DELETE' }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Eliminado'); }
                else mensaje('Error: ' + (r.error || 'desconocido'));
            });
        }, 'Eliminar');
    };
    function formulario() {
        const opts = roles.map(r => `<option value="${r.IdRol}">${r.Nombre}</option>`).join('');
        const html = `
            <form id="form">
                <div class="form-grid">
                    <div><label>Nombres *</label><input name="Nombres" required></div>
                    <div><label>Apellidos *</label><input name="Apellidos" required></div>
                    <div><label>DNI *</label><input name="DNI" maxlength="8" required placeholder="8 digitos"></div>
                    <div><label>Telefono</label><input name="Telefono"></div>
                    <div><label>Correo</label><input name="Correo" type="email" placeholder="ejemplo@correo.com"></div>
                    <div><label>Usuario *</label><input name="Usuario" required></div>
                    <div><label>Password *</label><input name="Password" type="password" required></div>
                    <div><label>Rol *</label><select name="IdRol">${opts}</select></div>
                </div>
                <p style="font-size:11px;color:#999;margin-top:10px">* Campos obligatorios</p>
            </form>`;
        modal('Nuevo Usuario', html, function() {
            const f = document.getElementById('form');
            const data = Object.fromEntries(new FormData(f));
            if (!validarForm(data, null)) return;
            data.Estado = 1;
            api('/usuarios', { method: 'POST', body: data }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Guardado'); } else mensaje('Error: ' + (r.error || 'desconocido'));
            });
        }, 'Crear');
    }
    function modal(titulo, contenido, onConfirm, btnText) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header"><h3>${titulo}</h3><span class="modal-close" id="modalClose">&times;</span></div>
                <div class="modal-body">${contenido}</div>
                ${onConfirm ? '<div class="modal-footer"><button class="btn btn-cancel" id="modalCancel">Cancelar</button><button class="btn btn-primary" id="btnConfirm">'+(btnText||'Confirmar')+'</button></div>' : ''}
            </div>`;
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
    function mensajeError(msg) {
        const m = document.createElement('div');
        m.style.cssText = 'position:fixed;top:20px;right:20px;background:#c0392b;color:#fff;padding:10px 18px;border-radius:3px;z-index:2000;font-size:13px';
        m.textContent = msg; document.body.appendChild(m); setTimeout(function() { m.remove(); }, 3000);
    }
    cargar();
})();
