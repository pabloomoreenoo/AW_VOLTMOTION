document.addEventListener('DOMContentLoaded',  () => {
  const section = document.getElementById('reservas'); 
  const form = document.getElementById('form-reserva');

  const inputNombre = document.getElementById('nombre-reserva'); 
  const inputEmail = document.getElementById('email-reserva');
  const inputInicio = document.getElementById('fecha-reserva-inicio');
  const inputFin = document.getElementById('fecha-reserva-fin');
  const inputMarca = document.getElementById('vehiculo-marca'); 
  const inputModelo = document.getElementById('vehiculo-modelo');
  const inputMatricula = document.getElementById('vehiculo-matricula');

  const progressBar = document.getElementById('form-progress'); 
  const progressText = document.getElementById('progress-text');
  const btnReset = document.getElementById('btn-reset-reserva'); 
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  const fields = [inputNombre, inputEmail, inputInicio, inputFin]; 

  let detectedVehicleId = null; 

  function isValidEmail(email){
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

   function getVehicleIdFromQuery(){
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('vehiculo_id') || params.get('id_vehiculo');
    if(!id) return null;
    const n = Number(id);
    return isNaN(n) ? null : n;
  }  

  // actualizar la barra de progreso
  function updateProgress(){
    let filled = 0;
    fields.forEach(f =>{
      if(f && f.value && f.value.trim() !== '') filled++;
    }); 
    const percent = Math.round((filled / fields.length) * 100);
    progressBar.style.width = percent + '%';
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = `Progreso: ${percent}%`;
  }


  async function findVehicleByMatricula(matricula){
    if(!matricula) return null;
    const m = matricula.trim();
    try{
      const res = await fetch(`/api/vehicles?matricula=` + encodeURIComponent(m),{
        cache: 'no-store',
        headers: {'Accept': 'application/json'},
      });
      if(!res.ok) return null; 
      const data = await res.json();
      if(data == null)return null; 
      if(Array.isArray(data))return data[0] || null; 
      if(data && data.ok && Array.isArray(data.vehiculos)) return data.vehiculos[0] || null;
      if(data.id_vehiculo || data.idVehiculo || data.id) return data; 
      return null; 
    }catch(err){
      console.warn('Error buscando vehículo por matrícula', err);
      return null;
    }
  }

  async function getVehicleById(id){
    if(!id)return null; 
    try{
        let data = null; 
        if(window.api && typeof window.api.getVehicleById === 'function'){
            data = await window.api.getVehicleById(id); 
        }else{
            const res = await fetch('/api/vehicles', { cache: 'no-store', headers: {'Accept': 'application/json'}}); 
            if(!res.ok) return null; 
            data = await res.json(); 
        }
        const list = (data && data.ok && Array.isArray(data.vehiculos)) ? data.vehiculos : (Array.isArray(data) ? data : []);
        const idKeys = ['id_vehiculo','idVehiculo','id'];
        const found = list.find(v =>{
            for(const k of idKeys){
                if(v[k] !== undefined && Number(v[k]) === Number(id))return true; 
            }

            if(v.id_vehiculo !== undefined && Number(v.id_vehiculo) === Number(id)) return true;
            return false; 
        }); 
        return found || null; 
    }catch(err){
        console.warn('Error al obtener vehiculo por ID', err); 
        return null; 
    }
  }

  function openAccountOffcanvas(){
    const offEl = document.getElementById('offcanvasRight');
    if(!offEl) return;
    const inst = bootstrap.Offcanvas.getOrCreateInstance(offEl) || new bootstrap.Offcanvas(offEl);
    inst.show(); 
  }

  async function isUserLogged(){
    if(window.api && typeof window.api.whoami === 'function'){
      try{
        const who = await window.api.whoami();
        return !!(who && who.ok && who.user); 
      }catch(err){
        return false; 
      }
    }
    return false; 
  }

  function showLoginRequiredMessage(){
    if(!section) return; 
    // ocultamos el formulario
    if(form) form.style.display = 'none';

    if(document.getElementById('reservas-login-msg')) return;

    // mostramos mensaje
    const msg = document.createElement('div');
    msg.className = 'alert alert-warning';
    msg.id = 'reservas-login-msg'; 
    msg.innerHTML = `
      <p><strong>Inicia sesión con tu cuenta para poder realizar reservas.</strong></p>
      <div class="d-flex gap-2">
        <button id="btn-open-login-from-reservas" class="btn btn-primary btn-sm">Iniciar sesión / Crear cuenta</button>
      </div>
    `;
    
    const h2 = section.querySelector('h2');
    if(h2 && h2.parentNode) {
      h2.insertAdjacentElement('afterend', msg);
    } else {
      section.insertBefore(msg, section.firstChild);
    }

    const btn = document.getElementById('btn-open-login-from-reservas');
    if(btn) btn.addEventListener('click', (e) =>{
      e.preventDefault();
      openAccountOffcanvas();
    });
  }

  function showFormAndPrefill(user){
    if(!form) return; 
    form.style.display = ''; 

    if(user){
      if(user.nombre && inputNombre && !inputNombre.value) inputNombre.value = user.nombre;
      if(user.correo && inputEmail && !inputEmail.value) inputEmail.value = user.correo;
    }
    updateProgress(); 
  }

  if(btnReset){
    btnReset.addEventListener('click', (e) =>{
    e.preventDefault();
    if(form)form.reset();
    updateProgress();
    });
  }

  fields.forEach(f =>{ if(f) f.addEventListener('input', updateProgress); });

  if(form){
    form.addEventListener('submit', async(ev) =>{
    ev.preventDefault();

    const nombre = inputNombre.value.trim(); 
    const email = inputEmail.value.trim();
    const fecha_inicio = inputInicio.value;
    const fecha_fin = inputFin.value;
    const matricula = inputMatricula.value.trim();

    if(!nombre || nombre.length < 3)return alert('Por favor, introduce un nombre válido.');
    if(!email || !isValidEmail(email)) return alert('Por favor, introduce un email válido.');
    if(!fecha_inicio) return alert('Por favor, selecciona una fecha de inicio de la reserva.');
    if(!fecha_fin) return alert('Por favor, selecciona una fecha de fin de la reserva.');
    if(new Date(fecha_inicio) >= new Date(fecha_fin)) return alert('La fecha de fin debe ser posterior a la fecha de inicio.');
    //if(!matricula) return alert('Matrícula del vehículo no especificada.');

    const submitBtnLocal = submitBtn; 
    if(submitBtnLocal){
      submitBtnLocal.disabled = true;
      submitBtnLocal.textContent = 'Procesando...';
    }

    try{
      let id_vehiculo = detectedVehicleId || null;  

      if(!id_vehiculo && matricula){
        const vehicle = await findVehicleByMatricula(matricula);
        if(!vehicle){
          const ok = confirm('No se ha encontrado el vehículo con matrícula ' + matricula + '. ¿Quieres registrarte o iniciar sesión para continuar?');
          if(!ok){
            throw new Error('Vehículo no encontrado.');
          }
        }else{
          id_vehiculo = vehicle.id_vehiculo || vehicle.idVehiculo || vehicle.id || null;
          if(id_vehiculo){
            if(inputMarca && !inputMarca.value){
              inputMarca.value = vehicle.marca || '';
            }
            if(inputModelo && !inputModelo.value){
              inputModelo.value = vehicle.modelo || '';
            }
          }
        }
      }

      if(!id_vehiculo){
        alert('No se ha podido identificar el vehículo. Por favor, inserta una matrícula válida.');
        throw new Error('Vehículo no identificado.');
      }

      const payload = {
        id_vehiculo: Number(id_vehiculo),
        fecha_inicio: fecha_inicio, 
        fecha_fin: fecha_fin
      };

      const res = await fetch('/api/reservas',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      const body = await (res.headers.get('Content-Type') || '').includes('application/json') ? await res.json() : null;

      if(!res.ok){
        const message = (body && (body.error || body.message)) || 'Error procesando la reserva.';
        throw new Error(message);
      }

      const idReserva = (body && body.id_reserva) ? body.id_reserva : null;

      try {
          const recent = {
            id_reserva: idReserva,
            id_vehiculo: id_vehiculo,
            marca: inputMarca && inputMarca.value ? inputMarca.value : null,
            modelo: inputModelo && inputModelo.value ? inputModelo.value : null,
            matricula: inputMatricula && inputMatricula.value ? inputMatricula.value : null,
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin
          };
          sessionStorage.setItem('recentReservation', JSON.stringify(recent));
      } catch (e) {
          console.warn('No se pudo guardar recentReservation en sessionStorage', e);
      }

      window.location.href = '/user';
      updateProgress();
      
      
    }catch(err){
      console.error('Error creando reserva', err);
      alert('Error creando reserva: ' + err.message);
    }finally{
      if(submitBtn){
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear Reserva';
      }
      window.location.href = '/user';
    }
  });
  }

  (async function init(){
    try{
      const logged = await isUserLogged();
      const idFromQuery = getVehicleIdFromQuery(); 
      if(idFromQuery){
        const vehicle = await getVehicleById(idFromQuery); 
        if(vehicle){
            detectedVehicleId = vehicle.id_vehiculo || vehicle.idVehiculo || vehicle.id || idFromQuery; 
            if(inputMatricula && vehicle.matricula) inputMatricula.value = vehicle.matricula || ''; 
            if(inputMarca && vehicle.marca) inputMarca.value = vehicle.marca || ''; 
            if(inputModelo && vehicle.modelo) inputModelo.value = vehicle.modelo || ''; 
        }
      }
      if(!logged){
        showLoginRequiredMessage(); 
      }else{
        let user = null; 
        try{
            const who = await window.api.whoami(); 
            if(who && who.ok && who.user) user = who.user; 
        }catch(err){
            console.warn('No se pudo obtener informacion del usuario', err); 
        }
        showFormAndPrefill(user); 
      }
    }catch(err){
      console.error('Error inicializando la página de reservas', err);
      showFormAndPrefill(null); 
    }
  })(); 

  updateProgress(); 

})