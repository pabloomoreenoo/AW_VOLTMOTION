// ===========================
// VALIDACIÓN FORMULARIO RESERVA
// ===========================

const formReserva = document.getElementById("form-reserva");

if (formReserva) {
  const nombreInput   = document.getElementById("nombre-reserva");
  const emailInput    = document.getElementById("email-reserva");
  const fechaInput    = document.getElementById("fecha-reserva");
  const vehiculoInput = document.getElementById("vehiculo-tipo");
  const duracionInput = document.getElementById("duracion");

  const errorNombre   = document.getElementById("error-nombre");
  const errorEmail    = document.getElementById("error-email");
  const errorFecha    = document.getElementById("error-fecha");
  const errorVehiculo = document.getElementById("error-vehiculo");
  const errorDuracion = document.getElementById("error-duracion");

  const progressBar   = document.getElementById("form-progress");
  const progressText  = document.getElementById("progress-text");
  const btnReset      = document.getElementById("btn-reset-reserva");

  const totalCampos = 5;

  function marcarError(input, errorSpan, mensaje) {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
    errorSpan.textContent = mensaje;
  }

  function marcarValido(input, errorSpan) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    errorSpan.textContent = "";
  }

  // Validar nombre y apellidos
  function validarNombre() {
    const valor = nombreInput.value.trim();
    if (valor.length < 3) {
      marcarError(nombreInput, errorNombre, "Introduce al menos 3 caracteres.");
      return false;
    }
    marcarValido(nombreInput, errorNombre);
    return true;
  }

  // Validar email con expresión regular sencilla
  function validarEmail() {
    const valor = emailInput.value.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(valor)) {
      marcarError(emailInput, errorEmail, "Introduce un correo electrónico válido.");
      return false;
    }
    marcarValido(emailInput, errorEmail);
    return true;
  }

  // Validar fecha de reserva (no puede ser anterior a hoy)
  function validarFecha() {
    const valor = fechaInput.value;
    if (!valor) {
      marcarError(fechaInput, errorFecha, "Selecciona una fecha de reserva.");
      return false;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSeleccionada = new Date(valor);

    if (fechaSeleccionada < hoy) {
      marcarError(fechaInput, errorFecha, "La fecha no puede ser anterior a hoy.");
      return false;
    }

    marcarValido(fechaInput, errorFecha);
    return true;
  }

  // Validar selector de vehículo
  function validarVehiculo() {
    const valor = vehiculoInput.value;
    if (!valor) {
      marcarError(vehiculoInput, errorVehiculo, "Selecciona un tipo de vehículo.");
      return false;
    }
    marcarValido(vehiculoInput, errorVehiculo);
    return true;
  }

  // Validar duración (número positivo)
  function validarDuracion() {
    const valor = duracionInput.value;
    const numero = Number(valor);

    if (!valor || !Number.isFinite(numero) || numero <= 0) {
      marcarError(duracionInput, errorDuracion, "Introduce un número de horas válido y positivo.");
      return false;
    }
    marcarValido(duracionInput, errorDuracion);
    return true;
  }

  // Actualizar barra de progreso
  function actualizarProgreso() {
    let validos = 0;
    if (validarNombre())   validos++;
    if (validarEmail())    validos++;
    if (validarFecha())    validos++;
    if (validarVehiculo()) validos++;
    if (validarDuracion()) validos++;

    const porcentaje = Math.round((validos / totalCampos) * 100);

    if (progressBar) {
      progressBar.style.width = porcentaje + "%";
      progressBar.setAttribute("aria-valuenow", porcentaje.toString());
    }
    if (progressText) {
      progressText.textContent = "Compleción del formulario: " + porcentaje + "%";
    }
  }

  // Validación en tiempo real (oninput)
  nombreInput.addEventListener("input", function () {
    validarNombre();
    actualizarProgreso();
  });

  emailInput.addEventListener("input", function () {
    validarEmail();
    actualizarProgreso();
  });

  fechaInput.addEventListener("input", function () {
    validarFecha();
    actualizarProgreso();
  });

  vehiculoInput.addEventListener("change", function () {
    validarVehiculo();
    actualizarProgreso();
  });

  duracionInput.addEventListener("input", function () {
    validarDuracion();
    actualizarProgreso();
  });

  // Impedir envío si algo es inválido
  formReserva.addEventListener("submit", function (event) {
    const esValidoNombre   = validarNombre();
    const esValidoEmail    = validarEmail();
    const esValidoFecha    = validarFecha();
    const esValidoVehiculo = validarVehiculo();
    const esValidoDuracion = validarDuracion();

    actualizarProgreso();

    if (!esValidoNombre || !esValidoEmail || !esValidoFecha || !esValidoVehiculo || !esValidoDuracion) {
      event.preventDefault();
    }
  });

  // Botón "Borrar formulario"
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      formReserva.reset();

      [nombreInput, emailInput, fechaInput, vehiculoInput, duracionInput].forEach(input => {
        input.classList.remove("is-valid", "is-invalid");
      });

      [errorNombre, errorEmail, errorFecha, errorVehiculo, errorDuracion].forEach(span => {
        span.textContent = "";
      });

      if (progressBar) {
        progressBar.style.width = "0%";
        progressBar.setAttribute("aria-valuenow", "0");
      }
      if (progressText) {
        progressText.textContent = "Compleción del formulario: 0%";
      }
    });
  }
}

// ===========================
// VALIDACIÓN CONTRASEÑA SEGURA
// ===========================

const passwordInput = document.getElementById("password");
const errorPassword = document.getElementById("error-password");

if (passwordInput && errorPassword) {
  const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  // Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial

  passwordInput.addEventListener("input", function () {
    const valor = passwordInput.value;

    if (!regexPassword.test(valor)) {
      passwordInput.classList.remove("is-valid");
      passwordInput.classList.add("is-invalid");
      errorPassword.textContent =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.";
    } else {
      passwordInput.classList.remove("is-invalid");
      passwordInput.classList.add("is-valid");
      errorPassword.textContent = "";
    }
  });

  // ===========================
// VALIDACIÓN CORREO CORRECTO
// ===========================

    const emailInputLogin = document.getElementById("email");
    const errorEmailLogin = document.getElementById("error-email");

    if (emailInputLogin && errorEmailLogin) {
      const regexEmailLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      emailInputLogin.addEventListener("input", function () {
        const valor = emailInputLogin.value.trim();

        if (!regexEmailLogin.test(valor)) {
          emailInputLogin.classList.remove("is-valid");
          emailInputLogin.classList.add("is-invalid");
          errorEmailLogin.textContent = "Introduce un correo electrónico válido.";
        } else {
          emailInputLogin.classList.remove("is-invalid");
          emailInputLogin.classList.add("is-valid");
          errorEmailLogin.textContent = "";
        }
      });
    }
}

