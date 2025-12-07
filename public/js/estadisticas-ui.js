// public/js/estadisticas-ui.js
document.addEventListener('DOMContentLoaded', async () => {
  const cancelPctEl = document.getElementById('cancel-pct');
  const topVehiclesList = document.getElementById('topVehiclesList');
  const topConcesList = document.getElementById('topConcesList');
  const topUsersList = document.getElementById('topUsersList');

  // esto es por un error que he tenifo y lo que hace es asegurarse de que se carga correctamente el chart
  async function ensureChartJs() {
    if (window.Chart) return;
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-chartjs-dynamic]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Chart.js')));
        return;
      }
      const s = document.createElement('script');
      s.dataset.chartjsDynamic = '1';
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar Chart.js desde CDN'));
      document.head.appendChild(s);
    });
  }

  function safeText(s){ return String(s == null ? '' : s); }

  try {
    const res = await fetch('/api/stats', { credentials: 'same-origin' });
    if (!res.ok) {
      console.error('Error fetching stats', await res.text());
      return;
    }
    const data = await res.json();
    if (!data.ok) {
      console.error('Stats API error', data);
      return;
    }

    // Mostrar porcentaje de canceladas (texto)
    const pct = (data.cancelPct != null) ? data.cancelPct : 0;
    if (cancelPctEl) cancelPctEl.textContent = `${pct}%`;

    // Intentamos cargar Chart
    try {
      await ensureChartJs();
    } catch (err) {
      console.error('No se pudo cargar Chart.js:', err);
    }

    // --- Donut: canceladas vs resto (repasar porque no funciona correctamente en el prctg)
    try {
      const totals = data.totals || { canceladas: 0, total: 0 };
      const canceladas = Number(totals.canceladas || 0);
      const total = Number(totals.total || 0);
      const resto = Math.max(0, total - canceladas);

      const ctxCancel = document.getElementById('chartCancel');
      if (ctxCancel && window.Chart) {
        new Chart(ctxCancel.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Canceladas', 'Resto'],
            datasets: [{
              data: [canceladas, resto],
              backgroundColor: ['#dc3545', '#198754'],
              borderColor: ['#fff', '#fff'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    } catch(e){ console.warn('chartCancel error', e); }

    // --- Top covhes
    try {
      if (data.topVehicles && Array.isArray(data.topVehicles)) {
        const labels = data.topVehicles.map(v => `${v.marca || ''} ${v.modelo || ''} (${v.matricula||''})`);
        const values = data.topVehicles.map(v => Number(v.reservas || 0));
        const ctxV = document.getElementById('chartVehicles');
        if (ctxV && window.Chart) {
          new Chart(ctxV.getContext('2d'), {
            type: 'bar',
            data: {
              labels,
              datasets: [{ label: 'Reservas', data: values, backgroundColor: '#0d6efd' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }

        if (topVehiclesList) {
          topVehiclesList.innerHTML = '';
          data.topVehicles.forEach(v => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${safeText(v.marca)} ${safeText(v.modelo)} (${safeText(v.matricula)}) — ${v.reservas || 0} reservas`;
            topVehiclesList.appendChild(li);
          });
        }
      }
    } catch(e){ console.warn('chartVehicles error', e); }

    // --- Top concesionarios
    try {
      if (data.topConcesionarios && Array.isArray(data.topConcesionarios)) {
        const labels = data.topConcesionarios.map(c => `${c.nombre || ''}`);
        const values = data.topConcesionarios.map(c => Number(c.reservas || 0));
        const ctxC = document.getElementById('chartConces');
        if (ctxC && window.Chart) {
          new Chart(ctxC.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Reservas', data: values, backgroundColor: '#6f42c1' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }

        if (topConcesList) {
          topConcesList.innerHTML = '';
          data.topConcesionarios.forEach(c => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${safeText(c.nombre)} ${c.ciudad ? '· ' + c.ciudad : ''} — ${c.reservas || 0} reservas`;
            topConcesList.appendChild(li);
          });
        }
      }
    } catch(e){ console.warn('chartConces error', e); }

    // --- Top usuarios
    try {
      if (data.topUsuarios && Array.isArray(data.topUsuarios)) {
        const labels = data.topUsuarios.map(u => u.nombre || u.correo || 'Usuario');
        const values = data.topUsuarios.map(u => Number(u.reservas || 0));
        const ctxU = document.getElementById('chartUsers');
        if (ctxU && window.Chart) {
          new Chart(ctxU.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Reservas', data: values, backgroundColor: '#198754' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }

        if (topUsersList) {
          topUsersList.innerHTML = '';
          data.topUsuarios.forEach(u => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${safeText(u.nombre || u.correo)} — ${u.reservas || 0} reservas`;
            topUsersList.appendChild(li);
          });
        }
      }
    } catch(e){ console.warn('chartUsers error', e); }

  } catch (err) {
    console.error('Error cargando estadsticas', err);
  }
});
