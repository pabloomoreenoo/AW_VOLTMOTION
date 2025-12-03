const api = {

    async register(data){
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        }); 
        return res.json(); 
    },

    async login(data){
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        }); 
        return res.json(); 
    },

    async whoami() {
        const res = await fetch('/api/auth/whoami', {
            method: 'GET'
        });
        return res.json();
    },

    async logout() {
        const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
        });
        return res.json();
    },

    async getVehiculos(query = {}){
        const qs = new URLSearchParams(query).toString(); 
        const res = await fetch('/api/vehicles' + (qs ? `?${qs}` : ''), { credentials: 'same-origin' });
        return res.ok ? res.json() : Promise.reject(await res.json());
    },

    async createReserva(payload){
        const res = await fetch('/api/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        return res.json(); 
    },

    async uploadJSON(file){
        const fd = new FormData(); 
        fd.append('file', file);
        const res = await fetch('/api/admin/cargar-json', {
        method: 'POST',
        credentials: 'same-origin',
        body: fd
        });
        return res.json(); 
    },

    async getPrefs() {
        const res = await fetch('/api/accessibility/prefs', { credentials: 'same-origin' });
        return res.json();
    },

    async setPrefs(prefs){
        const res = await fetch('/api/accesibility/prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(prefs)
        }); 
        return res.json(); 
    }
}; 

window.api = api; 