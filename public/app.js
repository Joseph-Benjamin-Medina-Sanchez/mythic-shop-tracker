let fullCatalog = [];
let currentTargetId = '';
const selectedChromaIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  startCountdownTimer();
  await initializeApp();
});

function startCountdownTimer() {
  const timerElement = document.getElementById('countdownTimer');

  function update() {
    const now = new Date();
    const nextReset = new Date(now.getTime());

    const currentDay = nextReset.getUTCDay();
    const daysUntilThursday = (4 - currentDay + 7) % 7;

    nextReset.setUTCDate(nextReset.getUTCDate() + daysUntilThursday);
    nextReset.setUTCHours(0, 0, 0, 0);

    if (nextReset <= now) {
      nextReset.setUTCDate(nextReset.getUTCDate() + 7);
    }

    const diff = nextReset - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timerElement.innerText = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  update();
  setInterval(update, 1000);
}

async function initializeApp() {
  await loadCatalog();
  await fetchMetrics(currentTargetId);
  setupListeners();
}

async function loadCatalog() {
  try {
    const res = await fetch('/api/catalog');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    fullCatalog = await res.json();
    if (fullCatalog.length > 0 && !currentTargetId) {
      currentTargetId = fullCatalog[0].id;
    }
    renderSelectOptions(fullCatalog);
    renderManualChromaOptions(fullCatalog);
  } catch (error) {
    console.error('Error loading catalog:', error);
  }
}

function renderSelectOptions(items) {
  const select = document.getElementById('chromaSelect');
  select.innerHTML = '';

  items.forEach((chroma) => {
    const opt = document.createElement('option');
    opt.value = chroma.id;
    opt.textContent = `${chroma.champion} - ${chroma.name}`;
    if (chroma.id === currentTargetId) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

function setupListeners() {
  const select = document.getElementById('chromaSelect');
  const searchInput = document.getElementById('chromaSearch');
  const btnSync = document.getElementById('btnSync');

  select.addEventListener('change', (e) => {
    currentTargetId = e.target.value;
    fetchMetrics(currentTargetId);
  });

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = fullCatalog.filter(
      (item) =>
        item.champion.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term)
    );

    renderSelectOptions(filtered);

    if (filtered.length > 0) {
      const match = filtered.find((i) => i.id === currentTargetId) || filtered[0];
      currentTargetId = match.id;
      select.value = currentTargetId;
      fetchMetrics(currentTargetId);
    }
  });

  btnSync.addEventListener('click', async () => {
    btnSync.disabled = true;
    btnSync.innerText = '⟳ Sincronizando...';

    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const result = await res.json();
      await loadCatalog();
      await fetchMetrics(currentTargetId);
      alert(result.message || result.error || 'Sincronización completada.');
    } catch (error) {
      console.error('Error in sync:', error);
      alert('No se pudo sincronizar la rotación en vivo.');
    } finally {
      btnSync.disabled = false;
      btnSync.innerText = '⟳ Sincronizar Tienda';
    }
  });

  setupManualEntryListeners();
}

function renderManualChromaOptions(items) {
  const container = document.getElementById('manualChromaOptions');
  container.innerHTML = '';

  items.forEach((chroma) => {
    const label = document.createElement('label');
    label.className = 'manual-entry-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = chroma.id;
    checkbox.checked = selectedChromaIds.has(chroma.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedChromaIds.add(chroma.id);
      } else {
        selectedChromaIds.delete(chroma.id);
      }
      renderManualSelectedChips();
    });

    label.appendChild(checkbox);
    label.append(`${chroma.champion} - ${chroma.name}`);
    container.appendChild(label);
  });
}

function renderManualSelectedChips() {
  const container = document.getElementById('manualSelectedChips');
  container.innerHTML = '';

  selectedChromaIds.forEach((id) => {
    const chroma = fullCatalog.find((c) => c.id === id);
    if (!chroma) {
      return;
    }

    const chip = document.createElement('span');
    chip.className = 'chip chip-active-target';
    chip.innerText = `${chroma.name} ✕`;
    chip.style.cursor = 'pointer';
    chip.addEventListener('click', () => {
      selectedChromaIds.delete(id);
      renderManualSelectedChips();
      renderManualChromaOptions(filterCatalog(document.getElementById('manualChromaSearch').value));
    });
    container.appendChild(chip);
  });
}

function filterCatalog(term) {
  const normalized = term.toLowerCase().trim();
  if (!normalized) {
    return fullCatalog;
  }
  return fullCatalog.filter(
    (item) =>
      item.champion.toLowerCase().includes(normalized) ||
      item.name.toLowerCase().includes(normalized)
  );
}

function setupManualEntryListeners() {
  const manualSearch = document.getElementById('manualChromaSearch');
  const manualDate = document.getElementById('manualDate');
  const btnSubmit = document.getElementById('btnSubmitRotation');
  const feedback = document.getElementById('manualFeedback');

  manualSearch.addEventListener('input', (e) => {
    renderManualChromaOptions(filterCatalog(e.target.value));
  });

  btnSubmit.addEventListener('click', async () => {
    feedback.className = 'manual-feedback';
    feedback.innerText = '';

    if (!manualDate.value) {
      feedback.className = 'manual-feedback manual-feedback-error';
      feedback.innerText = 'Selecciona una fecha.';
      return;
    }

    if (selectedChromaIds.size === 0) {
      feedback.className = 'manual-feedback manual-feedback-error';
      feedback.innerText = 'Selecciona al menos un chroma.';
      return;
    }

    btnSubmit.disabled = true;

    try {
      const res = await fetch('/api/rotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: manualDate.value, chromaIds: Array.from(selectedChromaIds) }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'No se pudo registrar la rotación.');
      }

      feedback.className = 'manual-feedback manual-feedback-success';
      feedback.innerText = result.message;
      selectedChromaIds.clear();
      renderManualSelectedChips();
      renderManualChromaOptions(fullCatalog);
      manualDate.value = '';
      await fetchMetrics(currentTargetId);
    } catch (error) {
      feedback.className = 'manual-feedback manual-feedback-error';
      feedback.innerText = error.message;
    } finally {
      btnSubmit.disabled = false;
    }
  });
}

async function fetchMetrics(targetId) {
  try {
    const url = targetId ? `/api/metrics?targetId=${encodeURIComponent(targetId)}` : '/api/metrics';
    const res = await fetch(url);
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

  const statusEl = document.getElementById('targetStatus');
  statusEl.innerText = metrics.status;
  statusEl.className = 'meta-item status-pill ' + (metrics.isEligible ? 'status-eligible' : 'status-cooldown');

  const daysAgoEl = document.getElementById('targetDaysAgo');
  if (metrics.daysSinceLastSeen !== null) {
    daysAgoEl.innerText = `Hace ${Math.max(0, metrics.daysSinceLastSeen)} día(s)`;
  } else {
    daysAgoEl.innerText = '';
  }

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
      chip.className = 'chip' + (chroma.id === target.id ? ' chip-active-target' : '');
      chip.innerText = `${chroma.name} (${chroma.champion})`;
      chips.appendChild(chip);
    });

    item.appendChild(header);
    item.appendChild(chips);
    historyContainer.appendChild(item);
  });
}