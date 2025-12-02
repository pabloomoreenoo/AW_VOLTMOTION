document.addEventListener('DOMContentLoaded', () =>{
    const selectCont = document.getElementById('select-concesionario'); 
    const inputAutonomia = document.getElementById('input-autonomia');
    const inputPlazas = document.getElementById('input-plazas');
    const selectColor = document.getElementById('select-color');
    const btnFilter = document.getElementById('btn-filter');
    const grid = document.getElementById('vehiculos-grid'); 
    const emptyMsg = document.getElementById('vehiculos-empty'); 
    const btnRefresh = document.getElementById('btn-reset-filters'); 

    let isLogged = false; 

    let currentFilters = {concesionario: 'all'};

    async function detectAuth(){
        if(window.api && typeof window.api.whoami === 'function'){
            try{
                const who = await window.api.whoami();
                if(who && who.ok && who.user){
                    isLogged = true;
                }else{
                    isLogged = false;
                }
            }catch(err){
                console.warn('No se pudo comprobar sesioón (whoami)', err);
                isLogged = false;
            }
        }
    }

    async function fetchConcesionarios(){
        try{
            const res = await fetch('/api/vehicles/concesionarios', {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok) throw new Error('Error al obtener concesionarios');
            const data = await res.json();
            populateConcesionarios(data.concesionarios || []);
        }catch(err){
            console.error(err); 
            selectCont.innerHTML = '<option value="all">No se pudieron cargar concesionarios</option>';
        }
    }

    function populateConcesionarios(list){
        selectCont.innerHTML = '<option value="all">Todos los concesionarios</option>';
        list.forEach(c =>{
            const opt = document.createElement('option'); 
            opt.value = String(c.id_concesionario); 
            opt.textContent = `${c.nombre} - ${c.ciudad || ''}`; 
            selectCont.appendChild(opt); 
        });
    }

    function populateColors(colors){
        selectColor.innerHTML = '<option value="">— Cualquiera —</option>';
        const unique = Array.from(new Set(colors.map(c => (c || '').trim()).filter(Boolean)));
        unique.forEach(col => {
        const o = document.createElement('option');
        o.value = col;
        o.textContent = col;
        selectColor.appendChild(o);
        });
    }

    function openAccountOffcanvas(){
        const offEl = document.getElementById('offcanvasRight');
        if(!offEl) return;

        const inst = bootstrap.Offcanvas.getInstance(offEl) || new bootstrap.Offcanvas(offEl);
        inst.show();
    }

    function onReserve(vehiculo){
        // window.location.href = `/reservas.html?id=${vehiculo.id_vehiculo}`;
        alert(`Reservar: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.matricula}) - implementar acción real`);
    }

    async function fetchVehiculos(filters = {concesionario: 'all'}) {
        currentFilters = Object.assign({}, filters);
        try {
            const params = new URLSearchParams(); 
            if (filters.concesionario && filters.concesionario !== 'all') params.set('concesionario', filters.concesionario);
            if (filters.autonomia_min) params.set('autonomia_min', String(filters.autonomia_min));
            if (filters.plazas) params.set('plazas', String(filters.plazas));
            if (filters.color) params.set('color', filters.color);

            const url = '/api/vehicles'+ (params.toString() ? '?' + params.toString() : ''); 
            const res = await fetch(url, {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok) throw new Error('Error al obtener vehículos');
            const data = await res.json();
            if(data && data.ok){
                renderVehiculos(data.vehiculos || []);
                const colors = (data.vehiculos || []).map(v => v.color).filter(Boolean);
                if (colors.length && selectColor.options.length <= 1) populateColors(colors);
            }else{
                renderVehiculos([]); 
            }
        } catch (err) {
            console.error(err);
            grid.innerHTML = `<div class="col-12 text-danger">Error al cargar vehículos.</div>`;
            emptyMsg.hidden = true;
        }
    }

    function renderVehiculos(list){
        grid.innerHTML=''; 
        if(!list || list.length === 0){
            emptyMsg.hidden = false; 
            return; 
        }
        emptyMsg.hidden = true; 

        list.forEach(v =>{
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

            const card = document.createElement('div');
            card.className = 'card h-100';

            // imagen (fallback si no hay)
            const img = document.createElement('img');
            img.className = 'card-img-top';
            img.alt = `${v.marca || ''} ${v.modelo || ''}`;
            img.src = v.imagen ? v.imagen : '/img/placeholder_car.png';

            const body = document.createElement('div');
            body.className = 'card-body d-flex flex-column';

            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = `${v.marca || ''} ${v.modelo || ''}`;

            const info = document.createElement('p');
            info.className = 'card-text mb-2 small text-muted';
            info.innerHTML = `
                Matrícula: <strong>${v.matricula || '-'}</strong><br>
                Año: ${v.ano_matriculacion || '-'} · Plazas: ${v.numero_plazas || '-'} · ${v.autonomia_km ? v.autonomia_km + ' km' : '-'}<br>
                Color: ${v.color || '-'}<br>
                Concesionario: ${v.concesionario_nombre || '-'}
            `;

            const status = document.createElement('p');
            status.className = 'mt-auto mb-2';
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = v.estado || 'desconocido';
            if (v.estado === 'disponible') badge.classList.add('bg-success');
            else if (v.estado === 'reservado') badge.classList.add('bg-warning', 'text-dark');
            else badge.classList.add('bg-secondary');

            status.appendChild(badge);

            const btnGroup = document.createElement('div');
            btnGroup.className = 'd-grid mt-2';

            if(v.estado !== 'disponible'){
                const btnDisabled = document.createElement('button');
                btnDisabled.className = 'btn btn-secondary';
                btnDisabled.type = 'button';
                btnDisabled.disabled = true;
                btnDisabled.textContent = 'No disponible';
                btnGroup.appendChild(btnDisabled);
            }else{
                if(isLogged){
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-primary';
                    btn.type = 'button';
                    btn.textContent = 'Reservar';
                    btn.addEventListener('click', () => onReserve(v));
                    btnGroup.appendChild(btn);
                }else{
                    const btnLogin = document.createElement('button');
                    btnLogin.className = 'btn btn-outline-primary';
                    btnLogin.type = 'button';
                    btnLogin.textContent = 'Iniciar sesión para reservar';
                    btnLogin.addEventListener('click', () => openAccountOffcanvas());
                    btnGroup.appendChild(btnLogin);
                }
            }

            body.appendChild(title);
            body.appendChild(info);
            body.appendChild(status);
            body.appendChild(btnGroup);

            card.appendChild(img);
            card.appendChild(body);
            col.appendChild(card);
            grid.appendChild(col);
        }); 
    }

    btnFilter.addEventListener('click', () => {
        const filters = {
        concesionario: selectCont.value,
        autonomia_min: inputAutonomia.value ? Number(inputAutonomia.value) : undefined,
        plazas: inputPlazas.value ? Number(inputPlazas.value) : undefined,
        color: selectColor.value || undefined
        };
        fetchVehiculos(filters);
    });

    btnRefresh.addEventListener('click', async(e) => {
        e.preventDefault();
        btnRefresh.disabled = true;
        try{
            if(selectCont) selectCont.value = 'all'; 
            if(inputAutonomia) inputAutonomia.value = ''; 
            if(inputPlazas) inputPlazas.value = ''; 
            if(selectColor) selectColor.value = '';

            await fetchVehiculos({concesionario: 'all'});
        }finally{
            btnRefresh.disabled = false;
        }
    }); 

    document.addEventListener('app:user:login', async(e) => {
        isLogged = true;
        await fetchVehiculos(currentFilters);
    });

    document.addEventListener('app:user:logout', async(e) => {
        isLogged = false;
        await fetchVehiculos(currentFilters);
    });

    (async() => {
        await detectAuth();
        await fetchConcesionarios(); 
        await fetchVehiculos(currentFilters); 
    })(); 
});