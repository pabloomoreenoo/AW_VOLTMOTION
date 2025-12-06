document.addEventListener('DOMContentLoaded', () => {
    const emailEl = document.getElementById('email');
    const passEl = document.getElementById('password');
    const loginBtn = document.getElementById('LoginButton');
    const errEmail = document.getElementById('error-email');
    const errPass = document.getElementById('error-password');
    const navAccount = document.getElementById('nav-account');
    const offEl = document.getElementById('offcanvasRight');

    function showFieldError(el, msg) {
        if(!el)return; 
        el.textContent = msg || '';
    }

    async function onSuccessfulLogin(user){
        // funcion que se ejcuta al iniciar sesion correctamente
        /*if(navAccount){
            navAccount.textContent = user.nombre || user.correo || 'Usuario';
        }*/

        document.dispatchEvent(new CustomEvent('app:user:login', { detail: { user } }));

        try{
            if(offEl && typeof bootstrap !== 'undefined'){
                const inst = bootstrap.Offcanvas.getInstance(offEl) || new bootstrap.Offcanvas(offEl);
                inst.hide();
            }
        }catch(err){
            console.error('No se pudo ocultar el offcanvas tras el login', err);
        }
    }

    if(!loginBtn)return;

    loginBtn.addEventListener('click', async (e) =>{
            e.preventDefault(); 
            if(!emailEl || !passEl)return;

            showFieldError(errEmail, '');
            showFieldError(errPass, '');

            const correo = (emailEl.value || '').trim();
            const contrasena = passEl.value || '';

            if(!correo){showFieldError(errEmail, 'El correo es obligatorio'); return;}
            if(!contrasena){showFieldError(errPass, 'La contraseña es obligatoria'); return;}

            loginBtn.disabled = true;
            const prevText = loginBtn.textContent;
            loginBtn.textContent = 'Iniciando sesión...';

            try{
                const res = await window.api.login({ correo, contrasena });
                if(res && res.ok){
                    let who = null; 
                    try{
                        who = await window.api.whoami();
                    }catch(_){}

                    const user = (who && who.ok && who.user) ? who.user : (res.user || { correo });
                    onSuccessfulLogin(user);

                    if (user && user.rol === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/user';
                    }
                }else{
                    const msg = (res && res.error) ? res.error : 'Credenciales inválidas';
                    showFieldError(errPass, msg);
                }
            }catch(err){
                console.error('Error en el login', err);
                showFieldError(errPass, err.error || 'Error iniciando sesión');
            }finally{
                loginBtn.disabled = false;
                loginBtn.textContent = prevText;
            }
    });

    document.addEventListener('app:user:logout', ()=>{
        if(navAccount){
            navAccount.textContent = 'Cuenta';
        }
    });

    
});