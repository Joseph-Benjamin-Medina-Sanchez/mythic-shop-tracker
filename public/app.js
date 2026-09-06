document.addEventListener('DOMContentLoaded', () => {
  fetchMetrics();
});

async function fetchMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    renderDashboard(data);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    document.getElementById('targetName').innerText = 'Error al conectar con la API';
  }
}

function renderDashboard(data) {
  const { target, metrics, history } = data;

  document.getElementById('targetName').innerText = target.name;
  document.getElementById('targetChampion').innerText = target.champion;
  document.getElementById('targetCost').innerText = target.costMe;
  document.getElementById('targetStatus').innerText = metrics.status;

  const percentage = metrics.nextWeekProbability;
  document.getElementById('probPercent').innerText = `${percentage}%`;
  document.getElementById('probProgress').style.width = `${Math.min(percentage, 100)}%`;

  document.getElementById('valTotal').innerText = metrics.totalCatalogSize;
  document.getElementById('valDiscarded').innerText = metrics.discardedItemsCount;
  document.getElementById('valRemaining').innerText = metrics.remainingPoolSize;
  document.getElementById('valDepletion').innerText = `${metrics.poolDepletionRate}%`;

  const historyContainer = document.getElementById('historyList');
  historyContainer.innerHTML = '';

  history.forEach((rotation, idx) => {
    const item = document.createElement('div');
    item.className = 'rotation-item';

    const header = document.createElement('div');
    header.className = 'rotation-header';
    header.innerHTML = `<span>Semana #${idx + 1} &bull; ${rotation.date}</span><span>${rotation.count} Chromas</span>`;

    const chips = document.createElement('div');
    chips.className = 'rotation-chips';
    rotation.chromas.forEach((chroma) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerText = `${chroma.name} (${chroma.champion})`;
      chips.appendChild(chip);
    });

    item.appendChild(header);
    item.appendChild(chips);
    historyContainer.appendChild(item);
  });
}