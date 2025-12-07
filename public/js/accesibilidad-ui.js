// public/js/accesibilidad-ui.js
(function(){
  
  const btnSave = document.getElementById('access-save') || null;
  const btnReset = document.getElementById('access-reset') || null;
  const toggleContrast = document.getElementById('access-contrast') || null;
  const selectFont = document.getElementById('access-fontsize') || null; 
  const toggleKeyNav = document.getElementById('access-keynav') || null;

  function applyPrefs(prefs){
    prefs = prefs || {};
    const contrast = prefs.contrast || 'normal';
    const fontSize = prefs.fontSize || 'normal';
    const keyNav = !!prefs.keyNav;

    const root = document.documentElement;

    
    root.classList.remove('vm-high-contrast', 'vm-font-small', 'vm-font-normal', 'vm-font-large', 'vm-keynav');

    if(contrast === 'high') root.classList.add('vm-high-contrast');
    if(fontSize === 'small') root.classList.add('vm-font-small');
    else if(fontSize === 'large') root.classList.add('vm-font-large');
    else root.classList.add('vm-font-normal');

    if(keyNav) root.classList.add('vm-keynav');
    else root.classList.remove('vm-keynav');

   
    if(toggleContrast) toggleContrast.checked = (contrast === 'high');
    if(selectFont) selectFont.value = fontSize;
    if(toggleKeyNav) toggleKeyNav.checked = keyNav;
  }

  async function loadAndApply(){
    try{
      if(window.api && typeof window.api.getPrefs === 'function'){
        const res = await window.api.getPrefs();
        if(res && res.ok){
          applyPrefs(res.prefs);
        } else {
          // no guardamos preferncias, aplicamos ppr defecto
          applyPrefs(null);
        }
      }else{
        applyPrefs(null);
      }
    }catch(err){
      console.warn('Error cargando prefs', err);
    }
  }

  async function savePrefs(){
    const prefs = {
      contrast: toggleContrast && toggleContrast.checked ? 'high' : 'normal',
      fontSize: selectFont ? selectFont.value : 'normal',
      keyNav: toggleKeyNav && toggleKeyNav.checked ? true : false
    };
    try{
      if(window.api && typeof window.api.setPrefs === 'function'){
        const res = await window.api.setPrefs(prefs);
        if(res && res.ok){
          applyPrefs(prefs);
          // notificr al resto de la app
          document.dispatchEvent(new CustomEvent('app:accessibility:changed', { detail: { prefs } }));
          return true;
        } else {
          throw new Error((res && res.error) ? res.error : 'No OK response');
        }
      } else {
        // fallback: guardado en localStorage para sesiones anonimas
        localStorage.setItem('vm:access:prefs', JSON.stringify(prefs));
        applyPrefs(prefs);
        document.dispatchEvent(new CustomEvent('app:accessibility:changed', { detail: { prefs } }));
        return true;
      }
    }catch(err){
      console.error('Error guardando prefs', err);
      return false;
    }
  }

  function resetPrefs(){
    try{
      if(window.api && typeof window.api.setPrefs === 'function'){
        window.api.setPrefs({}); 
      } else {
        localStorage.removeItem('vm:access:prefs');
      }
    }catch(e){}
    applyPrefs({ contrast: 'normal', fontSize: 'normal', keyNav: false });
    document.dispatchEvent(new CustomEvent('app:accessibility:changed', { detail: { prefs: null } }));
  }

  
  if(btnSave) btnSave.addEventListener('click', async (e) => {
    e.preventDefault();
    btnSave.disabled = true;
    btnSave.textContent = 'Guardando...';
    await savePrefs();
    btnSave.disabled = false;
    btnSave.textContent = 'Guardar preferencias';
  });

  if(btnReset) btnReset.addEventListener('click', (e) => {
    e.preventDefault();
    if(!confirm('¿Restaurar las preferencias por defecto?')) return;
    resetPrefs();
  });

  
  document.addEventListener('DOMContentLoaded', loadAndApply);
  
  loadAndApply();

  
  window.vmApplyAccessPrefs = applyPrefs;
})();
