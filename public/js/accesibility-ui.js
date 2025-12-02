document.addEventListener('DOMContentLoaded', async () =>{
    const contrasteLink = document.getElementById('nav-contraste'); 

    try{
        const prefs = await window.api.getPrefs();
        if (prefs && prefs.fontSize) {
        document.documentElement.style.fontSize = prefs.fontSize + '%';
        }
        if (prefs && prefs.contraste === 'alto') {
        document.body.classList.add('alto-contraste');
        contrasteLink.setAttribute('aria-pressed', 'true');
        } else {
        document.body.classList.remove('alto-contraste');
        contrasteLink.setAttribute('aria-pressed', 'false');
        }
        if (prefs && prefs.lang) {
        languageSelect.value = prefs.lang;
        document.documentElement.lang = prefs.lang;
        }
    }catch(err){
        console.warn('No prefs', err); 
    }

    contrasteLink && contrasteLink.addEventListener('click', async(e) => {
        e.preventDefault(); 
        const isContrast = document.body.classList.toogle('alto-contraste'); 
        contrasteLink.setAttribute('aria-pressed', isContrast ? 'true' : 'false');
        await window.api.setPrefs({ contraste: isContrast ? 'alto' : 'normal' });
    }); 
}); 