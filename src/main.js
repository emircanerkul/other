import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import { initDB, storeSheet, getSheetData, getSheetNames, clearAllData } from './db.js';

const COLORS = ['#e3e3e3', '#4acccd', '#fcc468', '#ef8157', '#468966', '#FFF0A5', '#FFB03B', '#B64926', '#8E2800'];
const TABLE_COLS = ['No', 'Job type', 'Engineer Name', 'Running Time', 'Starting Time'];

let currentData = null;
let totalValue = 0;
let charts = {};
let tableState = { search: '', perPage: 10, page: 1, sortCol: null, sortDir: 1 };

// Alerts
function alertPending() {
  alertify.alert('Please wait until the current file is processed.');
}
function alertLarge(len, cb) {
  alertify.confirm('This file is ' + len + ' bytes and may take a few moments. Your browser may lock up during this process. Shall we play?', cb);
}
function alertFailed(error) {
  alertify.alert('Processing failed: ' + (error && error.message ? error.message : error));
}

// Initialize application
async function init() {
  await initDB();
  setupDropzone();
  wireTableControls();

  // Restore dashboard if data was persisted by a previous import
  const savedSheets = await getSheetNames();
  if (savedSheets.length > 0) {
    await displayData();
  }
}

// Setup file dropzone
function setupDropzone() {
  const target = document.getElementById('upload-box');
  if (!target) return;

  target.addEventListener('dragenter', function(e) { e.stopPropagation(); e.preventDefault(); });
  target.addEventListener('dragover', function(e) { e.stopPropagation(); e.preventDefault(); });
  target.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  });
}

// Process uploaded file
async function processFile(file) {
  if (currentData) {
    alertPending();
    return;
  }

  const size = file.size;
  if (size > 1e6) {
    alertLarge(size, async function(confirmed) {
      if (confirmed) await readAndProcess(file);
    });
  } else {
    await readAndProcess(file);
  }
}

// Read file and initialize data
async function readAndProcess(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { cellDates: true });

    // Parse every sheet generically (headers become row keys)
    const sheets = {};
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet['!ref']) continue;

      const range = XLSX.utils.decode_range(sheet['!ref']);
      if (!range || !range.s || !range.e || range.s.r > range.e.r) continue;

      const headers = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ c: c, r: range.s.r });
        headers[c - range.s.c] = sheet[addr] ? sheet[addr].v : 'Column' + c;
      }

      const rows = [];
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const row = {};
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ c: c, r: r });
          const cell = sheet[addr];
          if (cell) row[headers[c - range.s.c]] = cell.v;
        }
        rows.push(row);
      }
      sheets[sheetName] = rows;
    }

    // Fresh import: wipe previous data, then store every sheet
    await clearAllData();
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      if (sheets[sheetName]) await storeSheet(sheetName, sheets[sheetName]);
    }

    const uploadDiv = document.getElementById('upload');
    if (uploadDiv) uploadDiv.remove();

    await displayData();
  } catch (error) {
    alertFailed(error);
  }
}

// Convert date value to timestamp
function dateToTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value.getTime() / 1000;
  if (typeof value === 'number') return value;
  const ts = Date.parse(value) / 1000;
  return isNaN(ts) ? null : ts;
}

// Load persisted data and render everything
async function displayData() {
  const sheetNames = await getSheetNames();
  if (sheetNames.length === 0) return;

  // Reveal the dashboard now that there is data to show
  document.getElementById('dashboard').hidden = false;
  currentData = await getSheetData(sheetNames[0]);

  renderStats();
  renderTable();
  renderCharts();
}

// Stat cards (times computed relative to "now"; Update Now recomputes)
function renderStats() {
  if (!currentData) return;
  const now = Math.floor(Date.now() / 1000);

  let ongoing = 0;
  let delayed = 0;
  let cancelled = 0;
  totalValue = 0;

  for (let i = 0; i < currentData.length; i++) {
    const d = currentData[i];

    if (d['Job completed'] === 'No' && d['Remarks'] !== 'Cancelled') {
      const startTs = dateToTimestamp(d['Project Start date']);
      if (startTs !== null && startTs <= now) ongoing++;
    }
    if (d['Job completed'] === 'No' && d['End Project Date']) {
      const endTs = dateToTimestamp(d['End Project Date']);
      if (endTs !== null && endTs < now) delayed++;
    }
    if (d['Remarks'] === 'Cancelled') cancelled++;

    const v = parseFloat(d['Total contract value']);
    if (!isNaN(v)) totalValue += v;
  }

  document.getElementById('number-of-ongoing-project').textContent = ongoing;
  document.getElementById('number-of-delayed-project').textContent = delayed;
  document.getElementById('number-of-cancelled-project').textContent = cancelled;

  const totalInput = document.getElementById('total-project-value');
  if (totalInput) totalInput.value = Math.round(totalValue * 100) / 100;

  const monthsSelect = document.getElementById('completed-months');
  monthsSelect.onchange = updateCompleted;
  updateCompleted();
}

// Completed within X months (selector-driven, like the original app)
function updateCompleted() {
  if (!currentData) return;
  const months = parseFloat(document.getElementById('completed-months').value) || 48;
  let completed = 0;
  for (let i = 0; i < currentData.length; i++) {
    const d = currentData[i];
    if (d['Job completed'] === 'Yes' && d['End Project Date'] && d['Project Start date']) {
      const endTs = dateToTimestamp(d['End Project Date']);
      const startTs = dateToTimestamp(d['Project Start date']);
      if (endTs !== null && startTs !== null && (endTs - startTs) < (60 * 60 * 24 * 30 * months)) completed++;
    }
  }
  document.getElementById('number-of-completed-project').textContent = completed;
}

// Build the filtered "running projects" row set
function buildTableRows() {
  const now = Math.floor(Date.now() / 1000);
  const rows = [];
  for (let i = 0; i < currentData.length; i++) {
    const d = currentData[i];
    if (d['Job completed'] === 'No' && d['Remarks'] !== 'Cancelled' && d['Project Start date']) {
      const startTs = dateToTimestamp(d['Project Start date']);
      const createdTs = dateToTimestamp(d['Job Creation Date']);
      rows.push({
        values: [
          d['No.'] != null ? String(d['No.']) : '',
          d['Job type'] || '',
          d['Engineer Name'] || '',
          startTs !== null ? String(Math.max(0, Math.floor((now - startTs) / 86400))) : '0',
          (startTs !== null && createdTs !== null) ? String(Math.max(0, Math.floor((startTs - createdTs) / 86400))) : '0'
        ]
      });
    }
  }
  return rows;
}

function cmpValues(a, b) {
  const na = parseFloat(a), nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// DataTables-style table: search, length, sorting, pagination
function renderTable() {
  if (!currentData) return;

  let list = buildTableRows();

  // Search across all columns
  const q = tableState.search.trim().toLowerCase();
  if (q) {
    list = list.filter(function(r) {
      return r.values.some(function(v) { return v.toLowerCase().includes(q); });
    });
  }

  // Sort
  if (tableState.sortCol !== null) {
    const col = tableState.sortCol;
    const dir = tableState.sortDir;
    list = list.slice().sort(function(a, b) { return cmpValues(a.values[col], b.values[col]) * dir; });
  }

  // Paginate
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / tableState.perPage));
  if (tableState.page > pages) tableState.page = pages;
  const startIdx = (tableState.page - 1) * tableState.perPage;
  const pageRows = list.slice(startIdx, startIdx + tableState.perPage);

  // Header with sort indicators
  let html = '<thead><tr>';
  for (let i = 0; i < TABLE_COLS.length; i++) {
    const active = tableState.sortCol === i;
    const arrow = active ? (tableState.sortDir > 0 ? '▲' : '▼') : '↕';
    html += '<th data-col="' + i + '">' + TABLE_COLS[i] + '<span class="sort' + (active ? ' on' : '') + '">' + arrow + '</span></th>';
  }
  html += '</tr></thead><tbody>';
  if (pageRows.length === 0) {
    html += '<tr><td colspan="5" style="text-align:center;color:#999">No matching entries</td></tr>';
  } else {
    for (let i = 0; i < pageRows.length; i++) {
      const v = pageRows[i].values;
      html += '<tr><td>' + esc(v[0]) + '</td><td>' + esc(v[1]) + '</td><td>' + esc(v[2]) + '</td><td>' + esc(v[3]) + ' days</td><td>' + esc(v[4]) + ' days</td></tr>';
    }
  }
  html += '</tbody>';

  document.getElementById('projects').innerHTML = html;

  // Info line
  const from = total ? startIdx + 1 : 0;
  const to = Math.min(startIdx + tableState.perPage, total);
  document.getElementById('table-info').textContent = 'Showing ' + from + ' to ' + to + ' of ' + total + ' entries';

  // Pager
  const pager = document.getElementById('table-pager');
  let phtml = '<button data-page="' + (tableState.page - 1) + '"' + (tableState.page <= 1 ? ' disabled' : '') + '>Previous</button>';
  for (let p = 1; p <= pages; p++) {
    phtml += '<button data-page="' + p + '"' + (p === tableState.page ? ' class="active"' : '') + '>' + p + '</button>';
  }
  phtml += '<button data-page="' + (tableState.page + 1) + '"' + (tableState.page >= pages ? ' disabled' : '') + '>Next</button>';
  pager.innerHTML = phtml;
}

// One-time wiring for table controls and Update Now buttons
function wireTableControls() {
  const table = document.getElementById('projects');
  const search = document.getElementById('table-search');
  const length = document.getElementById('table-length');
  const pager = document.getElementById('table-pager');

  table.addEventListener('click', function(e) {
    const th = e.target.closest('th');
    if (!th) return;
    const col = parseInt(th.dataset.col, 10);
    if (tableState.sortCol === col) tableState.sortDir *= -1;
    else { tableState.sortCol = col; tableState.sortDir = 1; }
    tableState.page = 1;
    renderTable();
  });

  search.addEventListener('input', function() {
    tableState.search = this.value;
    tableState.page = 1;
    renderTable();
  });

  length.addEventListener('change', function() {
    tableState.perPage = parseInt(this.value, 10) || 10;
    tableState.page = 1;
    renderTable();
  });

  pager.addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    tableState.page = parseInt(btn.dataset.page, 10);
    renderTable();
  });

  // Update Now: recompute stats and table times relative to now
  document.querySelectorAll('.update-now').forEach(function(a) {
    a.addEventListener('click', function(ev) {
      ev.preventDefault();
      renderStats();
      renderTable();
    });
  });
}

// Destroy and (re)create a pie chart
function pie(canvasId, labels, values) {
  const el = document.getElementById(canvasId);
  if (!el || labels.length === 0) return;
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(el, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{ data: values, backgroundColor: COLORS, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 15, padding: 12, font: { size: 12 } }
        }
      }
    }
  });
}

function groupSum(data, nameKey, valueFn) {
  const out = {};
  for (let i = 0; i < data.length; i++) {
    const name = data[i][nameKey];
    if (!name) continue;
    const v = valueFn(data[i]);
    if (v === null) continue;
    out[name] = (out[name] || 0) + v;
  }
  return out;
}

function renderCharts() {
  if (!currentData) return;
  const count = Math.max(1, Object.keys(groupSum(currentData, 'Engineer Name', function() { return 1; })).length);

  // Projects per engineer
  const perEngineer = groupSum(currentData, 'Engineer Name', function() { return 1; });
  pie('number-of-projects-per-engineer', Object.keys(perEngineer), Object.values(perEngineer));

  // Individual engineer project value
  const valuePerEngineer = groupSum(currentData, 'Engineer Name', function(d) {
    const v = parseFloat(d['Total contract value']);
    return isNaN(v) ? null : v;
  });
  pie('individual-engineer-project-value', Object.keys(valuePerEngineer), Object.values(valuePerEngineer));

  // Engineers who took lesser time to start (average days from creation to start)
  const speed = {};
  for (let i = 0; i < currentData.length; i++) {
    const d = currentData[i];
    if (!d['Engineer Name']) continue;
    const startTs = dateToTimestamp(d['Project Start date']);
    const createdTs = dateToTimestamp(d['Job Creation Date']);
    if (startTs === null || createdTs === null) continue;
    const days = (startTs - createdTs) / 86400;
    speed[d['Engineer Name']] = (speed[d['Engineer Name']] || 0) + days;
  }
  const labels = Object.keys(speed);
  pie('quick-engineers', labels, labels.map(function(k) { return speed[k] / count; }));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
