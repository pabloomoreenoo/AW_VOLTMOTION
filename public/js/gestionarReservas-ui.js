document.addEventListener('DOMContentLoaded', () =>{

    const contActivas = document.getElementById('reservas-activas'); 
    const contTerminadas = document.getElementById('reservas-terminadas');
    const emptyActivas = document.getElementById('activas-empty');
    const emptyTerminadas = document.getElementById('terminadas-empty');

    function fmtDate(dtStr){ // convertimos un String recibido a Date
        try{
            const d = new Date(dtStr); 
            return d.toLocaleString(); 
        }catch(e){
            return dtStr; 
        }
    }

    // creamos un item para visualizar la resrva
    function createReservaItem(r){
        const item = document.createElement('div'); 
        item.className = 'list-group-item d-flex gap-3 align-items-center';

        const img = document.createElement('img');
        img.src = r.imagen || '/img/vehiculos/prueba1.jpg';
        img.alt = `${r.marca || ''} ${r.modelo || ''}`;
        img.style.width = '96px';
        img.style.height = '64px';
        img.style.objectFit = 'cover';
        img.className = 'rounded';

        const body = document.createElement('div'); 
        body.className = 'flex-grow-1'; 

        const title = document.createElement('div'); 
        title.className = 'd-flex justify-content-between align-items-start';
        title.innerHTML = `<div><strong>${r.marca || '-'} ${r.modelo || '-'}</strong> <small class="text-muted">(${r.matricula || '-'})</small><small class="text-muted">(${"id de la reserva:" + r.id_reserva || '-'})</small></div>
                       <div><span class="badge ${r.estado === 'activa' ? 'bg-success' : 'bg-secondary'}">${r.estado}</span></div>`;

        const meta = document.createElement('div'); 
        meta.className = 'small text-muted';
        meta.innerHTML = `Desde: ${fmtDate(r.fecha_inicio)} — Hasta: ${fmtDate(r.fecha_fin)}`;


        body.append(title); 
        body.append(meta); 

        const actions = document.createElement('div'); 
        actions.className = 'd-flex flex-column align-items-end gap-2';

        if(r.estado === 'activa'){
            const btnCancel = document.createElement('button');
            btnCancel.className = 'btn btn-sm btn-outline-danger';
            btnCancel.textContent = 'Cancelar reserva';
            btnCancel.addEventListener('click', () => handleCancel(r, item, btnCancel));

            const btnFinish = document.createElement('button');
            btnFinish.className = 'btn btn-sm btn-outline-success';
            btnFinish.textContent = 'Finalizar reserva';
            btnFinish.addEventListener('click',  () => handleFinish(r, item, btnFinish));

            actions.appendChild(btnCancel);
            //actions.appendChild(btnFinish); 
        }else{
            const span = document.createElement('span');
            span.className = 'text-muted small';
            span.textContent = '—';
            actions.appendChild(span);
        }

        item.appendChild(img); 
        item.appendChild(body); 
        item.appendChild(actions); 

        return item; 
    }

    function appendActiva(r){
        if(!contActivas) return;
        const item = createReservaItem(r);
        contActivas.appendChild(item);
    }

    function appendTerminada(r){
        if(!contTerminadas) return;
        const item = createReservaItem(r);
        contTerminadas.appendChild(item);
    }

    function refreshEmptyStates(){
        const actCount = contActivas ? contActivas.children.length : 0;
        const termCount = contTerminadas ? contTerminadas.children.length : 0;
        emptyActivas.hidden = actCount > 0;
        emptyTerminadas.hidden = termCount > 0;
    }

    function showCancelModal(reserva) {
        try {
        const modalEl = document.getElementById('modalReservaCancelada');
        if (!modalEl) return;
        const setText = (idSel, val) => {
            const el = document.getElementById(idSel);
            if (el) el.textContent = val || '—';
        };
        setText('modal-cancel-id', reserva.id_reserva || reserva.id || 'N/A');
        setText('modal-cancel-veh', `${reserva.marca || ''} ${reserva.modelo || ''}`);
        setText('modal-cancel-mat', reserva.matricula || '—');

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        } catch (e) {
        console.warn('No se pudo mostrar modal', e);
        }
    }

    async function handleCancel(r, itemNode, btn){
        //if (!confirm('¿Deseas cancelar esta reserva?')) return;
        btn.disabled = true;
        btn.textContent = 'Cancelando...';
        try{
            const res = await fetch(`/api/reservas/${r.id_reserva}/cancel`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' }
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body && body.error ? body.error : 'Error cancelando reserva');

            if (itemNode && itemNode.parentNode) itemNode.remove();
            const updated = Object.assign({}, r, { estado: 'cancelado' });
            appendTerminada(updated);
            refreshEmptyStates();

            showCancelModal(updated);
        }catch(err){
            console.error('Error al cancelar la reserva', err);
            alert('No se pudo cancelar la reserva: ' + (err.message || err));
            btn.disabled = false;
            btn.textContent = 'Cancelar reserva';
        }
    }

    async function handleFinish(r, itemNode, btn){
        if (!confirm('¿Deseas marcar esta reserva como finalizada?')) return;
        btn.disabled = true;
        btn.textContent = 'Finalizando...';
        try{
            const res = await fetch(`/api/reservas/${r.id_reserva}/finish`, {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' }
            });

            const body = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error((body && body.error) ? body.error : 'Error finalizando reserva');

            if (itemNode && itemNode.parentNode) itemNode.remove();
            const updated = Object.assign({}, r, { estado: 'finalizada' });
            appendTerminada(updated);
            refreshEmptyStates();

            } catch (err) {
                console.error('Error al finalizar la reserva', err);
                alert('No se pudo finalizar la reserva: ' + (err.message || err));
                btn.disabled = false;
                btn.textContent = 'Finalizar reserva';
            }        
      }     
    
    

    async function loadTodasReservas(){
        try{
            const res = await fetch('/api/reservas', { credentials: 'same-origin' });
            if (!res.ok) {
                const body = await res.json().catch(()=>({}));
                throw new Error(body && body.error ? body.error : 'Error cargando reservas');
            }
            
            const data = await res.json().catch(()=>null);

            let list = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (data && Array.isArray(data.reservas)) {
                list = data.reservas;
            } else if (data && data.ok && Array.isArray(data.reservas)) {
                list = data.reservas;
            } else {
                list = [];
            }

            // limpiar
            if (contActivas) contActivas.innerHTML = '';
            if (contTerminadas) contTerminadas.innerHTML = '';

            list.forEach(r => {
                if (r.estado === 'activa') appendActiva(r);
                else appendTerminada(r);
            });
            refreshEmptyStates();
        }catch(err){
            console.error('Error cargando las reservas del admin', err); 
            if (contActivas) contActivas.innerHTML = '<div class="text-danger">Error cargando reservas.</div>';
            if (contTerminadas) contTerminadas.innerHTML = '';
        }
    }

    (async () =>{
        await loadTodasReservas(); 
    }) (); 
});