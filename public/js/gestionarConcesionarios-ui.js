document.addEventListener('DOMContentLoaded', () =>{
  const container = document.getElementById('concesionarios-container');
  const emptyMsg = document.getElementById('concesionarios-empty');
  const btnOpenAdd = document.getElementById('btn-open-add-concesionario');
  const modalEl = document.getElementById('modalAddConcesionario');
  const formAdd = document.getElementById('form-add-concesionario');
  const modalAdd = modalEl ? new bootstrap.Modal(modalEl) : null;
  

  function showEmpty(state){
    if(!emptyMsg)return; 
    emptyMsg.hidden = !state; 
  }

  // func para facilitar la crecaion de elms
  function el(tag, cls){
    const d = document.createElement(tag); 
    if(cls)d.className = cls; 
    return d; 
  }

  function renderConcesionarioItem(c) {
    const item = el('div', 'list-group-item d-flex justify-content-between align-items-start');
    const left = el('div', 'ms-0');
    left.innerHTML = `<strong>${c.nombre || '—'}</strong><div class="small text-muted">${c.ciudad || ''} ${c.direccion ? '· ' + c.direccion : ''}</div>`;
    const right = el('div', 'text-end small text-muted');
    right.innerHTML = `${c.telefono }`;
    item.appendChild(left);
    item.appendChild(right);
    return item;
  }

  async function fetchConcesionarios() {
    try {
      const res = await fetch('/api/vehicles/concesionarios', { cache: 'no-store', headers: { 'Accept': 'application/json' }});
      if (!res.ok) throw new Error('Error al obtener concesionarios');
      const data = await res.json();
      const list = data && data.concesionarios ? data.concesionarios : (Array.isArray(data) ? data : []);
      renderList(list);
    } catch (err) {
      console.error('Error cargando concesionarios', err);
      showEmpty(false);
    }
  }

  function renderList(list) {
    if (!container) return;
    container.innerHTML = '';
    if (!list || list.length === 0) {
      showEmpty(true);
      return;
    }
    showEmpty(false);
    list.forEach(c => {
      container.appendChild(renderConcesionarioItem(c));
    });
  }

  const CREATE_URLS = ['/api/admin/addConcesionario'];

  async function createConcesionario(payload) {
    let lastErr = null;
    for (const url of CREATE_URLS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const body = await res.json().catch(()=>null);
        if (res.ok) return { ok: true, body, url };
        lastErr = { url, status: res.status, body }
      } catch (err) {
        lastErr = { url, error: err };
      }
    }
    throw lastErr;
  }

  // abrir el modal pulsando btn
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', (e) => {
      e.preventDefault();
      if (formAdd) formAdd.reset();
      if (modalAdd) modalAdd.show();
    });
  }

  // crear conces cuando pulsas el botn de crear dentro del modal
  if (formAdd) {
    formAdd.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!formAdd.checkValidity()) {
        formAdd.classList.add('was-validated');
        return;
      }
      const nombre = (document.getElementById('add-nombre').value || '').trim();
      const ciudad = (document.getElementById('add-ciudad').value || '').trim();
      const direccion = (document.getElementById('add-direccion').value || '').trim();
      const telefono = (document.getElementById('add-telefono').value || '').trim();

      const payload = { nombre, ciudad: ciudad || null, direccion: direccion || null, telefono: telefono || null };

      const btn = document.getElementById('btn-add-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }

      try {
        const res = await createConcesionario(payload);
        if (modalAdd) modalAdd.hide();
        await fetchConcesionarios();
      } catch (err) {
        console.error('Error creando concesionario', err);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Crear concesionario'; }
      }
    });
  }


  (async () => {
    await fetchConcesionarios(); 
  })(); 
}); 