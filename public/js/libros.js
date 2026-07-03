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
    let libros = [], categorias = [], editoriales = [], autores = [];
    document.getElementById('buscar').addEventListener('keyup', filtrar);
    document.getElementById('filtroCategoria').addEventListener('change', filtrar);
    document.getElementById('filtroAutor').addEventListener('change', filtrar);
    document.getElementById('filtroEditorial').addEventListener('change', filtrar);
    function cargar() {
        document.getElementById('tabla').innerHTML = 'Cargando...';
        if (esBib) {
            document.getElementById('btnNuevo').innerHTML = '<button class="btn btn-primary" id="btnNuevoLibro">+ Nuevo</button>';
            document.getElementById('btnNuevoLibro').addEventListener('click', function() { formulario(); });
        }
        Promise.all([api('/libros'), api('/categorias'), api('/editoriales'), api('/autores')]).then(([l, cats, eds, auts]) => {
            libros = l; categorias = cats; editoriales = eds; autores = auts;
            const selCat = document.getElementById('filtroCategoria');
            cats.forEach(c => selCat.innerHTML += `<option value="${c.IdCategoria}">${c.Nombre}</option>`);
            const selAut = document.getElementById('filtroAutor');
            auts.forEach(a => selAut.innerHTML += `<option value="${a.IdAutor}">${a.Nombre} ${a.Apellido}</option>`);
            const selEd = document.getElementById('filtroEditorial');
            eds.forEach(e => selEd.innerHTML += `<option value="${e.IdEditorial}">${e.Nombre}</option>`);
            filtrar();
        });
    }
    function filtrar() {
        const texto = document.getElementById('buscar').value.toLowerCase();
        const catF = document.getElementById('filtroCategoria').value;
        const autF = document.getElementById('filtroAutor').value;
        const edF = document.getElementById('filtroEditorial').value;
        const filtrados = libros.filter(l => {
            if (texto && !l.Titulo.toLowerCase().includes(texto) && !(l.ISBN || '').toLowerCase().includes(texto)) return false;
            if (catF && l.IdCategoria != catF) return false;
            if (edF && l.IdEditorial != edF) return false;
            if (autF) return true;
            return true;
        });
        let html = '<table><thead><tr><th>ID</th><th>Titulo</th><th>Categoria</th><th>Editorial</th><th>Autores</th><th>ISBN</th><th>Stock</th><th>Disp.</th><th>Estado</th>';
        if (esBib) html += '<th>Acciones</th>';
        html += '</tr></thead><tbody>';
        Promise.all(filtrados.map(libro =>
            api('/libros/' + libro.IdLibro).then(det => {
                const autNames = det.autores ? det.autores.map(a => a.Nombre + ' ' + a.Apellido).join(', ') : '-';
                if (autF && !det.autores.some(a => a.IdAutor == autF)) return '';
                return `<tr><td>${det.IdLibro}</td><td>${det.Titulo}</td><td>${det.CategoriaNombre}</td><td>${det.EditorialNombre}</td>
                    <td style="font-size:12px">${autNames}</td><td>${det.ISBN || '-'}</td><td>${det.Stock}</td><td>${det.Disponibles}</td><td><span class="status-badge ${det.Estado ? 'status-active' : 'status-inactive'}">${det.Estado ? 'Activo' : 'Inactivo'}</span></td>
                    ${esBib ? `<td><button class="btn-sm btn-edit" onclick="window._editLibro(${det.IdLibro})">Editar</button> <button class="btn-sm btn-del" onclick="window._delLibro(${det.IdLibro})">Eliminar</button></td>` : (det.Disponibles > 0 ? `<td><button class="btn-sm btn-edit" onclick="window._solicitar(${det.IdLibro},'${det.Titulo.replace(/'/g, "\\'")}')">Solicitar</button></td>` : '<td>-</td>')}</tr>`;
            })
        )).then(rows => {
            const final = rows.filter(r => r !== '').join('');
            html += final + '</tbody></table>';
            if (!final) html = '<p>No se encontraron libros</p>';
            else html += '<p class="total-reg">Mostrando ' + final.split('</tr>').filter(r => r.trim()).length + ' de ' + libros.length + ' libros</p>';
            document.getElementById('tabla').innerHTML = html;
        });
    }
    window._editLibro = function(id) {
        api('/libros/' + id).then(l => { window._libroEdit = l; mostrarForm(id); });
    };
    window._delLibro = function(id) {
        modal('Confirmar', '<p>Eliminar libro #'+id+'?</p>', function() {
            api('/libros/'+id,{method:'DELETE'}).then(r => {
                if(r.ok){ cargar(); cerrarModal(); mensaje('Eliminado'); } else mensaje('Error: '+r.error);
            });
        },'Eliminar');
    };
    window._solicitar = function(id, titulo) {
        modal('Solicitar Prestamo', `
            <p style="font-size:13px;margin-bottom:10px">Libro: <strong>${titulo}</strong></p>
            <form id="formSol">
                <label>Cantidad</label><input name="Cantidad" type="number" value="1" min="1" max="3" required>
                <label>Fecha de devolucion</label><input name="FechaDevolucion" type="date" required>
            </form>`, function() {
            const f = document.getElementById('formSol');
            const data = { IdLibro: id, Cantidad: parseInt(f.querySelector('[name=Cantidad]').value) || 1, FechaDevolucion: f.querySelector('[name=FechaDevolucion]').value };
            if (!data.FechaDevolucion) { mensaje('Seleccione fecha de devolucion'); return; }
            api('/solicitar-prestamo', { method: 'POST', body: data }).then(r => {
                if (r.ok) { cargar(); cerrarModal(); mensaje('Prestamo #' + r.id + ' solicitado'); }
                else mensaje('Error: ' + (r.error || 'desconocido'));
            });
        }, 'Solicitar');
    };
    function mostrarForm(id) {
        const item = id ? window._libroEdit : null;
        const catOpts = categorias.map(c => `<option value="${c.IdCategoria}" ${item && item.IdCategoria === c.IdCategoria ? 'selected' : ''}>${c.Nombre}</option>`).join('');
        const edOpts = editoriales.map(e => `<option value="${e.IdEditorial}" ${item && item.IdEditorial === e.IdEditorial ? 'selected' : ''}>${e.Nombre}</option>`).join('');
        const autChecks = autores.map(a => `<label class="checkbox-inline"><input type="checkbox" name="autores" value="${a.IdAutor}" ${item && item.autores && item.autores.find(x => x.IdAutor === a.IdAutor) ? 'checked' : ''}> ${a.Nombre} ${a.Apellido}</label>`).join('');
        modal(id ? 'Editar Libro' : 'Nuevo Libro', `
            <form id="form"><div class="form-grid">
                <div><label>Titulo</label><input name="Titulo" value="${item ? item.Titulo : ''}" required></div>
                <div><label>ISBN</label><input name="ISBN" value="${item ? item.ISBN || '' : ''}"></div>
                <div><label>Categoria</label><select name="IdCategoria">${catOpts}</select></div>
                <div><label>Editorial</label><select name="IdEditorial">${edOpts}</select></div>
                <div><label>Anio</label><input name="AnioPublicacion" type="number" value="${item ? item.AnioPublicacion || '' : ''}"></div>
                <div><label>Paginas</label><input name="NumeroPaginas" type="number" value="${item ? item.NumeroPaginas || '' : ''}"></div>
                <div><label>Stock</label><input name="Stock" type="number" value="${item ? item.Stock : 0}" required></div>
                <div><label>Ubicacion</label><input name="Ubicacion" value="${item ? item.Ubicacion || '' : ''}"></div>
                ${id ? '<div><label>Estado</label><select name="Estado"><option value="1" '+(item.Estado?'selected':'')+'>Activo</option><option value="0" '+(!item.Estado?'selected':'')+'>Inactivo</option></select></div>' : ''}
            </div><div style="margin-top:10px"><label>Autores:</label><div class="check-group">${autChecks}</div></div></form>`, function() {
            const f = document.getElementById('form'); const fd = new FormData(f);
            const checked = Array.from(f.querySelectorAll('input[name="autores"]:checked')).map(cb => parseInt(cb.value));
            const data = { Titulo: fd.get('Titulo'), IdCategoria: parseInt(fd.get('IdCategoria')), IdEditorial: parseInt(fd.get('IdEditorial')),
                ISBN: fd.get('ISBN')||null, AnioPublicacion: fd.get('AnioPublicacion')?parseInt(fd.get('AnioPublicacion')):null,
                NumeroPaginas: fd.get('NumeroPaginas')?parseInt(fd.get('NumeroPaginas')):null, Stock: parseInt(fd.get('Stock')),
                Ubicacion: fd.get('Ubicacion')||null, autores: checked };
            if (id) data.Estado = parseInt(fd.get('Estado'));
            (id ? api('/libros/'+id,{method:'PUT',body:data}) : api('/libros',{method:'POST',body:data}))
                .then(r => { if(r.ok){ cargar(); cerrarModal(); mensaje('Guardado'); } else mensaje('Error: '+r.error); });
        }, id?'Guardar':'Crear');
    }
    function formulario() { mostrarForm(); }
    function modal(titulo, contenido, onConfirm, btnText) {
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
