(function() {
    if (localStorage.getItem('usuario')) { window.location.href = '/'; return; }
    document.getElementById('btnLogin').addEventListener('click', login);
    document.getElementById('password').addEventListener('keydown', function(e) { if (e.key === 'Enter') login(); });
    async function login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('error');
        try {
            const r = await fetch('/api/login', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({email,password})
            });
            const d = await r.json();
            if (r.ok) { localStorage.setItem('usuario',JSON.stringify(d)); window.location.href='/'; }
            else { errorEl.style.display='block'; errorEl.textContent=d.error||'Error'; }
        } catch(e) { errorEl.style.display='block'; errorEl.textContent='No se pudo conectar'; }
    }
})();
