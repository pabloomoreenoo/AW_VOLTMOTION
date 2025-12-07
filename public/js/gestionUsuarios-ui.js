document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('usuarios-container');
  const emptyMsg = document.getElementById('usuarios-empty');
  const btnRefresh = document.getElementById('btn-refresh-users');

  const modalEl = document.getElementById('modalEditUser');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const form = document.getElementById('form-edit-user');

  // cmpos del modal
  const fldId = document.getElementById('edit-id');
  const fldNombre = document.getElementById('edit-nombre');
  const fldCorreo = document.getElementById('edit-correo');
  const fldRol = document.getElementById('edit-rol');
  const fldTelefono = document.getElementById('edit-telefono');
  const fldIdConces = document.getElementById('edit-id-concesionario');
  const fldNuevaPass = document.getElementById('edit-nueva-contrasena');

  //campos del modal crearUser
  const btnOpenAddUser = document.getElementById('btn-open-add-user');
  const modalAddUserEl = document.getElementById('modalAddUser');
  const modalAddUser = modalAddUserEl ? new bootstrap.Modal(modalAddUserEl) : null;
  const formAddUser = document.getElementById('form-add-user');

  async function createUsuario(payload){
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(()=>null);
      if (!res.ok) {
        throw new Error((body && body.error) ? body.error : `Error creando usuario (${res.status})`);
      }
      return body;
    } catch (err) {
      throw err;
    }
  }

  if (btnOpenAddUser) {
    btnOpenAddUser.addEventListener('click', (e) => {
      e.preventDefault();
      if (formAddUser) formAddUser.reset();
      if (modalAddUser) modalAddUser.show();
    });
  }

  if (formAddUser) {
    formAddUser.addEventListener('submit', async (ev) => {
      ev.preventDefault();

      const nombre = (document.getElementById('add-nombre').value || '').trim();
      const correo = (document.getElementById('add-correo').value || '').trim();
      const contrasena = (document.getElementById('add-contrasena').value || '').trim();
      const telefono = (document.getElementById('add-telefono').value || '').trim();
      const id_concesionario_val = document.getElementById('add-id-concesionario').value;
      const id_concesionario = id_concesionario_val ? Number(id_concesionario_val) : null;

      // Validacin de correo  
      const regex = /^[A-Za-z0-9._%+-]+@ucm\.es$/;
      if (!regex.test(correo)) {
        alert('El correo debe ser de la UCM (ej: usuario@ucm.es)');
        return;
      }
      const payload = { nombre, correo, contrasena, telefono: telefono || null, id_concesionario };

      const btn = document.getElementById('btn-add-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }

      try {
        const resultado = await createUsuario(payload);
        if (modalAddUser) modalAddUser.hide();
        if (formAddUser) formAddUser.reset();
        if (typeof fetchUsuarios === 'function') await fetchUsuarios();
      } catch (err) {
        console.error('Error creando usuario', err);
        alert('Error creando usuario: ' + (err.message || err));
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Crear usuario'; }
      }
    });
  }

  function showEmpty(state) {
    if (!emptyMsg) return;
    emptyMsg.hidden = !state;
  }

  function el(tag, cls) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  function renderUserRow(u) {
    const item = el('div', 'list-group-item d-flex justify-content-between align-items-start');
    const left = el('div', 'ms-0');
    left.innerHTML = `<strong>${u.nombre || '—'}</strong>
                      <div class="small text-muted">${u.correo || ''} · ${u.rol || ''}</div>`;
    const right = el('div', 'text-end');
    const btnEdit = el('button', 'btn btn-sm btn-outline-primary');
    btnEdit.textContent = 'Editar';
    btnEdit.addEventListener('click', () => openEditModal(u));
    right.appendChild(btnEdit);
    item.appendChild(left);
    item.appendChild(right);
    return item;
  }


  async function fetchUsuarios() {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'same-origin' });
      if (!res.ok) {
        const b = await res.json().catch(()=>({}));
        throw new Error((b && b.error) || 'Error al obtener usuarios');
      }
      const data = await res.json();
      const list = (data && data.usuarios) ? data.usuarios : [];
      renderList(list);
    } catch (err) {
      console.error('Error cargando usuarios', err);
      if (container) container.innerHTML = `<div class="text-danger">Error cargando usuarios.</div>`;
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
    list.forEach(u => container.appendChild(renderUserRow(u)));
  }

  function openEditModal(u) {
    fldId.value = u.id_usuario;
    fldNombre.value = u.nombre || '';
    fldCorreo.value = u.correo || '';
    fldRol.value = u.rol || 'empleado';
    fldTelefono.value = u.telefono || '';
    fldIdConces.value = u.id_concesionario || '';
    fldNuevaPass.value = '';
    if (modal) modal.show();
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const id = Number(fldId.value);
    if (!id) return alert('ID inválido');

    const payload = {
      nombre: fldNombre.value.trim() || null,
      correo: fldCorreo.value.trim() || null,
      rol: fldRol.value || null,
      telefono: fldTelefono.value.trim() || null,
      id_concesionario: fldIdConces.value ? Number(fldIdConces.value) : null,
      // de momento no quiero mostrar prefs
      nueva_contrasena: fldNuevaPass.value ? fldNuevaPass.value : undefined
    };

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(()=>null);
      if (!res.ok) {
        throw new Error((body && body.error) || 'Error actualizando usuario');
      }
      if (modal) modal.hide();
      await fetchUsuarios();
    } catch (err) {
      console.error('Error actualizando usuario', err);
      alert('Error actualizando usuario: ' + (err.message || err));
    }
  });

  (async function init() {
    await fetchUsuarios();
  })();

  if (btnRefresh) btnRefresh.addEventListener('click', (e) => { e.preventDefault(); fetchUsuarios(); });

});
