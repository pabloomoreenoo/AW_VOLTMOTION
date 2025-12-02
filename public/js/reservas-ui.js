// public/js/reservas-ui.js
document.addEventListener('DOMContentLoaded', async () => {
  //const selectVeh = document.getElementById('vehiculo-select');
  const fechaInput = document.getElementById('fecha-reserva');
  const duracionInput = document.getElementById('duracion');
  const form = document.getElementById('form-reserva');
  const progressBar = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  const globalMsg = document.getElementById('global-msg');

  const vehiculoMarca = document.getElementById('vehiculo-marca').value.trim();
  const vehiculoModelo = document.getElementById('vehiculo-modelo').value.trim();
  const vehiculoMatricula = document.getElementById('vehiculo-matricula').value.trim();

  // 1) Cargar vehículos y rellenar select
  try {
    const vehiculos = await window.api.getVehiculos();
    if (!vehiculos || !vehiculos.length) {
      selectVeh.innerHTML = '<option value="">No hay vehículos disponibles</option>';
    } else {
      selectVeh.innerHTML = '<option value="">Selecciona un vehículo</option>';
      vehiculos.forEach(v => {
        // adapta campos según tu API: v.id_vehiculo, v.marca, v.modelo
        const opt = document.createElement('option');
        opt.value = v.id_vehiculo || v.id || v.idVehiculo; // intenta varias claves
        opt.textContent = `${v.marca || ''} ${v.modelo || ''} — ${v.autonomia_km || ''}km`;
        selectVeh.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error cargando vehículos', err);
    selectVeh.innerHTML = '<option value="">Error cargando vehículos</option>';
  }

  // 2) Actualizar barra de progreso según campos completados
  function updateProgress() {
    const total = 4; // nombre, email, fecha, vehiculo (duración también)
    let filled = 0;
    if (document.getElementById('nombre-reserva').value.trim()) filled++;
    if (document.getElementById('email-reserva').value.trim()) filled++;
    if (fechaInput.value) filled++;
    if (selectVeh.value) filled++;
    // opcional: duracion
    if (duracionInput.value) filled++;
    const percent = Math.round((filled / (total + 1)) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = `Compleción del formulario: ${percent}%`;
  }

  ['input', 'change'].forEach(ev => {
    document.querySelectorAll('#form-reserva input, #form-reserva select').forEach(el => el.addEventListener(ev, updateProgress));
  });

  updateProgress();

  // 3) Manejar submit: construir payload y llamar a API
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // limpiar mensajes
    document.querySelectorAll('#form-reserva .error').forEach(s => s.textContent = '');
    globalMsg.textContent = '';

    const nombre = document.getElementById('nombre-reserva').value.trim();
    const email = document.getElementById('email-reserva').value.trim();
    const fechaInicio = fechaInput.value;
    const vehiculoId = selectVeh.value;
    const duracion = Number(duracionInput.value) || 0;

    // validaciones básicas
    if (!nombre) { document.getElementById('error-nombre').textContent = 'Nombre requerido'; return; }
    if (!email) { document.getElementById('error-email').textContent = 'Email requerido'; return; }
    if (!fechaInicio) { document.getElementById('error-fecha').textContent = 'Fecha de inicio requerida'; return; }
    if (!vehiculoId) { document.getElementById('error-vehiculo').textContent = 'Selecciona un vehículo'; return; }
    if (duracion <= 0) { document.getElementById('error-duracion').textContent = 'Duración mínima 1 hora'; return; }

    // calcular fecha fin sumando horas a fechaInicio
    // fechaInicio está en formato "YYYY-MM-DDTHH:MM"
    const start = new Date(fechaInicio);
    if (isNaN(start)) { document.getElementById('error-fecha').textContent = 'Formato de fecha/hora inválido'; return; }
    const end = new Date(start.getTime() + duracion * 60 * 60 * 1000);

    // construir payload según backend
    const payload = {
        // si tu backend acepta id_vehiculo, deja undefined; en esta opción enviamos info libre
        vehiculo: {
            marca: vehiculoMarca || null,
            modelo: vehiculoModelo || null,
            matricula: vehiculoMatricula || null,
            categoria: document.getElementById('vehiculo-tipo') ? document.getElementById('vehiculo-tipo').value : null
        },
        fecha_inicio: start.toISOString().slice(0,19),
        fecha_fin: end.toISOString().slice(0,19),
        cliente: {
            nombre: nombre,
            email: email
        }
    };

    try {
      const res = await window.api.createReserva(payload);
      if (res.ok) {
        globalMsg.className = 'alert alert-success';
        globalMsg.textContent = 'Reserva creada correctamente';
        form.reset();
        updateProgress();
      } else {
        globalMsg.className = 'alert alert-danger';
        globalMsg.textContent = res.error || 'Error creando reserva';
      }
    } catch (err) {
      console.error(err);
      globalMsg.className = 'alert alert-danger';
      globalMsg.textContent = 'Error de conexión al servidor';
    }
  });

  // reset button
  document.getElementById('btn-reset-reserva').addEventListener('click', () => {
    form.reset();
    updateProgress();
    globalMsg.textContent = '';
  });

});
