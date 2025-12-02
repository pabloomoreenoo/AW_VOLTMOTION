/* auth.js - manejo UI login / register (versión depurada para evitar loops offcanvas/modal) */

let _loginHandlersAttached = false;
let _registerModalInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  const navAccount = document.getElementById('nav-account');
  const offcanvasBodyWrapper = document.getElementById('offcanvas-account-body');

  const selectors = {
    offcanvasId: 'offcanvasRight',
    modalId: 'modalRegister'
  };

  function getLoginElements() {
    return {
      emailInput: document.getElementById('email'),
      passwordInput: document.getElementById('password'),
      // fallback robustos para botones dentro del offcanvas
      btnLogin: document.querySelector('#offcanvasRight .signIn-buttons .btn-primary'),
      btnCreate: (function(){
        const nodes = document.querySelectorAll('#offcanvasRight .signIn-buttons .btn-primary');
        return nodes && nodes.length > 1 ? nodes[1] : null;
      })(),
      errorEmail: document.getElementById('error-email'),
      errorPassword: document.getElementById('error-password')
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function renderLoggedUI(user) {
      const displayName = user.nombre || user.correo || 'Usuario';
      if (navAccount) navAccount.textContent = displayName;

      offcanvasBodyWrapper.innerHTML = `
        <div class="mb-3">
          <p class="mb-1"><strong>${escapeHtml(displayName)}</strong></p>
          <p class="small text-muted mb-2">Conectado</p>
        </div>
        <div class="d-grid gap-2">
          <button id="btn-logout" class="btn btn-outline-danger" type="button">Cerrar sesión</button>
        </div>
      `;

      const btnLogout = document.getElementById('btn-logout');
      if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
          btnLogout.disabled = true;
          try {
            const res = await window.api.logout();
            if (res && res.ok) {
              location.reload();
            } else {
              alert('Error al cerrar sesión');
              btnLogout.disabled = false;
            }
          } catch (err) {
            console.error('Logout error', err);
            alert('Error de conexión al cerrar sesión');
            btnLogout.disabled = false;
          }
        });
      }
  }

  function renderAnonymousUI() {
    if (navAccount) navAccount.textContent = 'Cuenta';

    // Si no hay campos de login en DOM (por ejemplo render anterior cambió el contenido),
    // renderizamos el formulario dentro del offcanvas-body (solo si hace falta)
    if (!document.getElementById('email')) {
      offcanvasBodyWrapper.innerHTML = `
        <div class="mb-3">
          <label for="email" class="form-label">Correo electrónico</label>
          <input type="email" class="form-control" id="email" placeholder="name@example.com">
          <span class="error" id="error-email" aria-live="polite"></span>
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Contraseña</label>
          <input type="password" class="form-control" id="password" name="password">
          <span class="error" id="error-password" aria-live="polite"></span>
        </div>
        <div class="signIn-buttons mt-4 d-grid gap-3">
          <button id="LoginButton" class="btn btn-primary" type="button">Iniciar sesion</button>
          <button id="openRegisterModal" class="btn btn-primary" type="button">Crear cuenta</button>
        </div>
      `;
    }

    // attach handlers solo si no están ya adjuntados
    attachLoginHandlers();
  }

  // evita múltiples listeners
  function attachLoginHandlers() {
    if (_loginHandlersAttached) return;
    _loginHandlersAttached = true;

    const elems = getLoginElements();
    if (!elems.emailInput) return; // si por alguna razón no existe, salir

    const { emailInput, passwordInput, errorEmail, errorPassword } = elems;

    // preferir botones por id si hemos re-renderizado el offcanvas (renderAnonymousUI crea ids)
    let btnLogin = document.getElementById('LoginButton') || elems.btnLogin;
    let btnCreate = document.getElementById('openRegisterModal') || elems.btnCreate;

    // LOGIN handler
    if (btnLogin) {
      btnLogin.addEventListener('click', async (e) => {
        if (errorEmail) errorEmail.textContent = '';
        if (errorPassword) errorPassword.textContent = '';

        const correo = (emailInput && emailInput.value || '').trim();
        const contrasena = (passwordInput && passwordInput.value) || '';

        if (!correo) { if (errorEmail) errorEmail.textContent = 'Introduce tu correo'; return; }
        if (!contrasena) { if (errorPassword) errorPassword.textContent = 'Introduce la contraseña'; return; }

        btnLogin.disabled = true;
        try {
          const res = await window.api.login({ correo, contrasena });
          if (res && res.ok) {
            // obtener usuario y renderizar UI sin recargar
            const who = await window.api.whoami();
            if (who && who.ok && who.user) {
              renderLoggedUI(who.user);
              location.reload();
            } else {
              location.reload();
            }
          } else {
            const msg = (res && res.error) ? res.error : 'Credenciales inválidas';
            if (errorPassword) errorPassword.textContent = msg;
            btnLogin.disabled = false;
          }
        } catch (err) {
          console.error('Login error', err);
          if (errorPassword) errorPassword.textContent = 'Error de conexión';
          btnLogin.disabled = false;
        }
      });
    }

    // CREATE (abrir modal). Solo UN listener que usa la función segura openRegisterModalFromOffcanvas
    if (btnCreate) {
      btnCreate.addEventListener('click', async (e) => {
        e.preventDefault();
        // inicializar modal (solo una vez)
        setupRegisterModal();
        try {
          // abre el modal esperando que el offcanvas se cierre antes
          await openRegisterModalFromOffcanvas(selectors.offcanvasId, selectors.modalId);
        } catch (err) {
          console.error('Error opening register modal', err);
          // fallback: intentar abrir modal directamente
          if (document.getElementById(selectors.modalId)) {
            const m = new bootstrap.Modal(document.getElementById(selectors.modalId));
            m.show();
          }
        }
      });
    }
  }

  // inicializa el formulario de registro dentro del modal (solo una vez)
  function setupRegisterModal() {
    if (_registerModalInitialized) return;
    _registerModalInitialized = true;

    const modalEl = document.getElementById('modalRegister');
    if (!modalEl) return; // si no existe en DOM, nada que hacer

    const form = modalEl.querySelector('#form-register');
    if (!form) return;

    const inputNombre = modalEl.querySelector('#reg-nombre');
    const inputCorreo = modalEl.querySelector('#reg-correo');
    const inputPass = modalEl.querySelector('#reg-contrasena');
    const inputConfirm = modalEl.querySelector('#reg-confirm');
    const inputTelefono = modalEl.querySelector('#reg-telefono');
    const serverErr = modalEl.querySelector('#register-server-error');
    const btnSubmit = modalEl.querySelector('#btn-register-submit');

    const ucmRegex = /^[A-Za-z0-9._%+-]+@ucm\.es$/;

    function clearErrors() {
      if (serverErr) { serverErr.classList.add('d-none'); serverErr.textContent = ''; }
      ['err-nombre','err-correo','err-contrasena','err-confirm','err-telefono'].forEach(id=>{
        const el = modalEl.querySelector(`#${id}`);
        if (el) el.textContent = '';
      });
      [inputNombre, inputCorreo, inputPass, inputConfirm, inputTelefono].forEach(i => {
        if (i) i.classList.remove('is-invalid');
      });
    }

    // focus cuando se abra modal
    modalEl.addEventListener('shown.bs.modal', () => {
      if (inputNombre) inputNombre.focus();
    });

    // cuando modal se oculta, hacemos limpieza por si hubiera backdrop residual
    modalEl.addEventListener('hidden.bs.modal', () => {
      cleanupBackdrops();
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      clearErrors();

      const nombre = (inputNombre && inputNombre.value || '').trim();
      const correo = (inputCorreo && inputCorreo.value || '').trim();
      const contrasena = (inputPass && inputPass.value) || '';
      const confirm = (inputConfirm && inputConfirm.value) || '';
      const telefono = (inputTelefono && inputTelefono.value || '').trim();

      let hasError = false;
      if (!nombre || nombre.length < 3) {
        inputNombre.classList.add('is-invalid');
        modalEl.querySelector('#err-nombre').textContent = 'Nombre mínimo 3 caracteres';
        hasError = true;
      }
      if (!ucmRegex.test(correo)) {
        inputCorreo.classList.add('is-invalid');
        modalEl.querySelector('#err-correo').textContent = 'Usa una dirección @ucm.es';
        hasError = true;
      }
      if (!contrasena || contrasena.length < 8) {
        inputPass.classList.add('is-invalid');
        modalEl.querySelector('#err-contrasena').textContent = 'Contraseña mínima 8 caracteres';
        hasError = true;
      }
      if (contrasena !== confirm) {
        inputConfirm.classList.add('is-invalid');
        modalEl.querySelector('#err-confirm').textContent = 'Las contraseñas no coinciden';
        hasError = true;
      }
      if (telefono && !/^[0-9]{9}$/.test(telefono)) {
        inputTelefono.classList.add('is-invalid');
        modalEl.querySelector('#err-telefono').textContent = 'Teléfono: 9 dígitos';
        hasError = true;
      }
      if (hasError) return;

      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Creando...';
      try {
        const payload = { nombre, correo, contrasena, telefono: telefono || null, id_concesionario: null };
        const res = await window.api.register(payload);
        if (res && res.ok) {
          // ocultar modal y pre-cargar email en login
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
          const loginEmail = document.getElementById('email');
          if (loginEmail) loginEmail.value = correo;
          alert('Usuario creado correctamente. Inicia sesión.');
        } else {
          if (serverErr) {
            serverErr.classList.remove('d-none');
            serverErr.textContent = (res && res.error) ? res.error : 'Error al crear usuario';
          }
        }
      } catch (err) {
        console.error('Register error', err);
        if (serverErr) {
          serverErr.classList.remove('d-none');
          serverErr.textContent = 'Error de conexión al crear usuario';
        }
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Crear cuenta';
      }
    });
  }

  /* ---------- Helpers para abrir modal de forma segura ---------- */

  // abrir modal esperando a que offcanvas se oculte primero (evita conflicto foco/backdrop)
  async function openRegisterModalFromOffcanvas(offcanvasId = 'offcanvasRight', modalId = 'modalRegister') {
    const offEl = document.getElementById(offcanvasId);
    const modalEl = document.getElementById(modalId);

    if (!modalEl) return Promise.reject(new Error('Modal no encontrado'));

    let offInstance = null;
    if (offEl) offInstance = bootstrap.Offcanvas.getInstance(offEl) || new bootstrap.Offcanvas(offEl);

    if (offInstance) {
      return new Promise((resolve) => {
        const onHidden = () => {
          offEl.removeEventListener('hidden.bs.offcanvas', onHidden);
          // abrir modal UNA vez
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
          resolve(modal);
        };
        offEl.addEventListener('hidden.bs.offcanvas', onHidden);
        // pedir que se oculte
        offInstance.hide();

        // fallback: si hidden no se dispara por cualquier razón, abrir modal después de timeout
        setTimeout(() => {
          if (!document.querySelector('.modal.show')) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
            resolve(modal);
          }
        }, 350);
      });
    } else {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
      return modal;
    }
  }

  // limpieza de backdrops/clases residuales
  function cleanupBackdrops() {
    document.querySelectorAll('.modal-backdrop, .offcanvas-backdrop').forEach(node => node.remove());
    document.body.classList.remove('modal-open', 'offcanvas-backdrop');
    document.body.style.pointerEvents = '';
  }

  /* ---------- Inicialización ---------- */
  (async function init() {
    // intentamos conocer al usuario conectado
    try {
      const who = await window.api.whoami();
      if (who && who.ok && who.user) {
        renderLoggedUI(who.user);

        document.dispatchEvent(new CustomEvent('app:user:login', { detail: { user: who.user } }));
      } else {
        renderAnonymousUI();
        document.dispatchEvent(new CustomEvent('app:user:logout'));
      }
    } catch (err) {
      console.error('whoami error', err);
      renderAnonymousUI();
    }

    // asegurar que modal existe en DOM y se inicialice si ya fue creado en HTML
    setupRegisterModal();
  })();

});