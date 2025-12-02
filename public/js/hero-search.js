document.addEventListener('DOMContentLoaded', () =>{
    const form = document.querySelector('.hero-forma form'); // nombre de nuestrdo pequeño panel de reserva en la pag principal 
    if(!form) return; 

    form.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const lugarRecogida = document.getElementById('lugar-recogida').value.trim();
        const lugarDevolucion = document.getElementById('Lugar-devolucion').value.trim();
        const inicio = document.getElementById('inicio-reserva').value;
        const fin = document.getElementById('fin-reserva').value;

        if(!lugarRecogida || !inicio || !fin){
            alert('Rellenar lugar de recogida y fechas de inicio y fin'); 
        }

        // redirigimos a reservas.html
        const params = new URLSearchParams({
            lugarRecogida, lugarDevolucion, inicio, fin
        }).toString(); 

        window.location.href = `reservas.html?${params}`;
    }); 
}); 