document.addEventListener('DOMContentLoaded', () =>{
    const selectConces = document.getElementById('filter-concesionario');
    const inputAutonomia = document.getElementById('filter-autonomia');
    const inputPlazas = document.getElementById('filter-plazas');
    const selectColor = document.getElementById('filter-color');
    const btnApply = document.getElementById('btn-apply');
    const btnClear = document.getElementById('btn-clear');
    const grid = document.getElementById('vehiculos-grid');
    const emptyMsg = document.getElementById('vehiculos-empty');
    const btnOpenAdd = document.getElementById('btn-open-add');

    const modalAddEl = document.getElementById('modalAddVehicle');
    const modalAdd = modalAddEl ? new bootstrap.Modal(modalAddEl) : null;
    const formAdd = document.getElementById('form-add-vehicle');
    const addConcesSelect = document.getElementById('add-concesionario');


    let isAdmin = false; 

    // funcion para ayudarme a crear un elemnto de forma mas agil
    function el(tag, cls) { 
        const d = document.createElement(tag); 
        if (cls) d.className = cls; 
        return d; 
    }

    async function checkRole(){
        if(!window.api || typeof window.api.whoami !== 'function')return; 
        try {
        const who = await window.api.whoami();
        if (who && who.ok && who.user) {
            isAdmin = who.user.rol === 'admin' || who.user.rol === 'administrador';
        } else isAdmin = false;
        } catch {
        isAdmin = false;
        }
        // mostramos botn de anadir si es admin
        if (isAdmin && btnOpenAdd) btnOpenAdd.classList.remove('d-none');
        else if (btnOpenAdd) btnOpenAdd.classList.add('d-none');
    }

    async function fetchConcesionarios(){
        try{
            const res = await fetch('/api/vehicles/concesionarios', {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok) throw new Error('Error al obtener concesionarios');
            const data = await res.json();
            const list = data.concesionarios || [];
            // añadimos al selector de flitro
            if (selectConces) {
                selectConces.innerHTML = '<option value="all">— Todos —</option>';
                list.forEach(c => {
                const o = document.createElement('option');
                o.value = String(c.id_concesionario);
                o.textContent = `${c.nombre} ${c.ciudad ? '- ' + c.ciudad : ''}`;
                selectConces.appendChild(o);
                });
            }
            // añadimos al select
            if (addConcesSelect) {
                addConcesSelect.innerHTML = '';
                list.forEach(c => {
                const o = document.createElement('option');
                o.value = String(c.id_concesionario);
                o.textContent = c.nombre;
                addConcesSelect.appendChild(o);
                });
            }
        }catch(err){
            console.error(err); 
            selectCont.innerHTML = '<option value="all">No se pudieron cargar concesionarios</option>';
        }
    }

    function populateColors(colors){
        if(!selectColor)return; 
        selectColor.innerHTML = '<option value="">— Cualquiera —</option>';
        const unique = Array.from(new Set(colors.map(c => (c || '').trim()).filter(Boolean)));
        unique.forEach(col => {
        const o = document.createElement('option');
        o.value = col;
        o.textContent = col;
        selectColor.appendChild(o);
        });
    }

    function renderVehiculos(list){
        if (!grid) return;
        grid.innerHTML = '';
        if (!list || list.length === 0) {
        emptyMsg.hidden = false;
        return;
        }
        emptyMsg.hidden = true;

        list.forEach(v => {
        const col = el('div', 'col-12 col-sm-6 col-md-4 col-lg-3');
        const card = el('div', 'card h-100');

        const img = el('img', 'card-img-top');
        img.alt = `${v.marca || ''} ${v.modelo || ''}`;
        img.src = v.imagen || '/img/placeholder_car.png';

        const body = el('div', 'card-body d-flex flex-column');
        const title = el('h5', 'card-title');
        title.textContent = `${v.marca || ''} ${v.modelo || ''}`;

        const info = el('p', 'card-text mb-2 small text-muted');
        info.innerHTML = `Matrícula: <strong>${v.matricula || '-'}</strong><br>
            Año: ${v.ano_matriculacion || '-'} · Plazas: ${v.numero_plazas || '-'} · ${v.autonomia_km ? v.autonomia_km + ' km' : '-'}<br>
            Color: ${v.color || '-'}<br>
            Concesionario: ${v.concesionario_nombre || '-'}`;

        const statusP = el('p', 'mt-auto mb-2');
        const badge = el('span', 'badge');
        badge.textContent = v.estado || 'desconocido';
        if (v.estado === 'disponible') badge.classList.add('bg-success');
        else if (v.estado === 'reservado') badge.classList.add('bg-warning', 'text-dark');
        else badge.classList.add('bg-secondary');

        statusP.appendChild(badge);

        const controls = el('div', 'd-grid mt-2');

        // funciom solo editable si es admin
        if (isAdmin) {
            const stateRow = el('div', 'd-flex gap-2 mb-2');
            const select = el('select', 'form-select form-select-sm');
            ['disponible', 'reservado', 'mantenimiento'].forEach(s => {
            const o = document.createElement('option');
            o.value = s; o.textContent = s;
            if (v.estado === s) o.selected = true;
            select.appendChild(o);
            });
            select.addEventListener('change', () => updateVehicleState(v.id_vehiculo || v.id || v.idVehiculo, select.value));
            stateRow.appendChild(select);

            controls.appendChild(stateRow);
        } 

        body.appendChild(title);
        body.appendChild(info);
        body.appendChild(statusP);
        body.appendChild(controls);

        card.appendChild(img);
        card.appendChild(body);
        col.appendChild(card);
        grid.appendChild(col);
        });
    }

    async function fetchVehiculos(filters = {}){
        try{
            const qs = new URLSearchParams(filters).toString();
            const res = await fetch('/api/vehicles' + (qs ? `?${qs}` : ''), { credentials: 'same-origin' });
            if (!res.ok) throw new Error('Error al cargar vehículos');
            const data = await res.json();
            const list = (data && data.ok && Array.isArray(data.vehiculos)) ? data.vehiculos : (Array.isArray(data) ? data : (data.vehiculos || []));
            renderVehiculos(list);

            const colors = list.map(v => v.color).filter(Boolean);
            populateColors(colors);
        }catch(err){
            console.error(err);
        }
    }

    async function updateVehicleState(id, newState) {
        try {
        const res = await fetch(`/api/vehicles/${id}`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: newState })
        });
        if (!res.ok) {
            const b = await res.json().catch(()=>({}));
            throw new Error((b && b.error) || 'Error actualizando estado');
        }
        // recago la lista
        await applyFilters();
        } catch (err) {
        alert('No se pudo actualizar el estado: ' + (err.message || err));
        console.error(err);
        }
    }

    async function createVehicle(payload) {
        try {
        const res = await fetch('/api/vehicles', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const b = await res.json().catch(()=>({}));
            throw new Error((b && b.error) || 'Error creando vehículo');
        }
        return await res.json();
        } catch (err) {
        throw err;
        }
    }

    async function applyFilters() {
        const q = {};
        if (selectConces && selectConces.value && selectConces.value !== 'all') q.concesionario = selectConces.value;
        if (inputAutonomia && inputAutonomia.value) q.autonomia_min = Number(inputAutonomia.value);
        if (inputPlazas && inputPlazas.value) q.plazas = Number(inputPlazas.value);
        if (selectColor && selectColor.value) q.color = selectColor.value;
        await fetchVehiculos(q);
    }

    if (btnApply) btnApply.addEventListener('click', (e) => { e.preventDefault(); applyFilters(); });
    if (btnClear) btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectConces) selectConces.value = 'all';
        if (inputAutonomia) inputAutonomia.value = '';
        if (inputPlazas) inputPlazas.value = '';
        if (selectColor) selectColor.value = '';
        applyFilters();
    });

    if (btnOpenAdd) btnOpenAdd.addEventListener('click', () => {
        if (modalAdd) modalAdd.show();
    });

    if (formAdd) {
        formAdd.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const payload = {
            matricula: document.getElementById('add-matricula').value.trim(),
            marca: document.getElementById('add-marca').value.trim(),
            modelo: document.getElementById('add-modelo').value.trim(),
            ano_matriculacion: Number(document.getElementById('add-ano').value) || null,
            numero_plazas: Number(document.getElementById('add-plazas').value) || null,
            autonomia_km: Number(document.getElementById('add-autonomia').value) || null,
            color: document.getElementById('add-color').value.trim() || null,
            imagen: document.getElementById('add-imagen').value.trim() || null,
            id_concesionario: Number(document.getElementById('add-concesionario').value) || null,
            estado: document.getElementById('add-estado').value || 'disponible'
        };

        try {
            const btn = document.getElementById('btn-add-submit');
            if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }
            await createVehicle(payload);
            if (modalAdd) modalAdd.hide();
            formAdd.reset();
            await applyFilters();
        } catch (err) {
            alert('Error al crear vehículo: ' + (err.message || err));
            console.error(err);
        } finally {
            const btn = document.getElementById('btn-add-submit');
            if (btn) { btn.disabled = false; btn.textContent = 'Crear vehículo'; }
        }
        });
    }


    (async function init() {
        await checkRole();
        await fetchConcesionarios();
        await applyFilters();
    })();
})