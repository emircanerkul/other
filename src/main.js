import * as XLSX from 'xlsx';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import { initDB, storeSheet, getSheetData, getSheetNames } from './db.js';

const DATE_COLUMNS = ['End Project Date', 'Testing and Commissioning date', 'Project Start date', 'Job Creation Date'];
const COLORS = ['#e3e3e3', '#4acccd', '#fcc468', '#ef8157', '#468966', '#FFF0A5', '#FFB03B', '#B64926', '#8E2800'];

let sheets = {};

// Alert functions
function alertBadFile() {
  alertify.alert('This file does not appear to be a valid Excel file.');
}

function alertPending() {
  alertify.alert('Please wait until the current file is processed.');
}

function alertLarge(len, cb) {
  alertify.confirm('This file is ' + len + ' bytes and may take a few moments. Your browser may lock up during this process. Shall we play?', cb);
}

function alertFailed(error) {
  const msg = error.message || String(error);
  alertify.alert('Processing failed: ' + msg);
}

// Initialize application
async function init() {
  await initDB();
  setupDropzone();
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
  if (Object.keys(sheets).length > 0) {
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
    
    // Process each sheet
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet['!ref']) continue;
      
      const range = XLSX.utils.decode_range(sheet['!ref']);
      if (!range || !range.s || !range.e || range.s.r > range.e.r) continue;

      // Get headers
      const headers = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ c: c, r: range.s.r });
        headers[c - range.s.c] = sheet[addr] ? sheet[addr].v : 'Column' + c;
      }

      // Get data rows
      const rows = [];
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const row = {};
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ c: c, r: r });
          const cell = sheet[addr];
          if (cell) {
            row[headers[c - range.s.c]] = cell.v;
          }
        }
        rows.push(row);
      }

      sheets[sheetName] = { headers: headers, rows: rows };
    }

    // Store in IndexedDB
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      if (sheets[sheetName]) {
        await storeSheet(sheetName, sheets[sheetName].headers, sheets[sheetName].rows);
      }
    }

    // Remove upload box and show data
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

// Display visualization
async function displayData() {
  const sheetNames = await getSheetNames();
  if (sheetNames.length === 0) return;

  const sheetName = sheetNames[0];
  const data = await getSheetData(sheetName);
  
  // Dashboard statistics
  const now = Math.floor(Date.now() / 1000);
  
  let ongoing = 0;
  let delayed = 0;
  let cancelled = 0;
  let completed = 0;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    
    // Ongoing
    if (d['Job completed'] === 'No' && d['Remarks'] !== 'Cancelled') {
      const startTs = dateToTimestamp(d['Project Start date']);
      if (startTs !== null && startTs <= now) ongoing++;
    }
    
    // Delayed
    if (d['Job completed'] === 'No' && d['End Project Date']) {
      const endTs = dateToTimestamp(d['End Project Date']);
      if (endTs !== null && endTs < now) delayed++;
    }
    
    // Cancelled
    if (d['Remarks'] === 'Cancelled') cancelled++;
    
    // Completed (within 6 months)
    if (d['Job completed'] === 'Yes' && d['End Project Date'] && d['Project Start date']) {
      const endTs = dateToTimestamp(d['End Project Date']);
      const startTs = dateToTimestamp(d['Project Start date']);
      if (endTs !== null && startTs !== null) {
        const diff = endTs - startTs;
        if (diff < (60 * 60 * 24 * 30 * 6)) completed++;
      }
    }
  }

  document.getElementById('number-of-ongoing-project').textContent = ongoing;
  document.getElementById('number-of-delayed-project').textContent = delayed;
  document.getElementById('number-of-cancelled-project').textContent = cancelled;
  document.getElementById('number-of-completed-project').textContent = completed;

  // Total project value
  let totalValue = 0;
  for (let i = 0; i < data.length; i++) {
    const v = parseFloat(data[i]['Total contract value']);
    if (!isNaN(v)) totalValue += v;
  }
  const totalInput = document.getElementById('total-project-value');
  if (totalInput) totalInput.value = totalValue.toFixed(2);

  // DataTable
  const tableData = [];
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d['Job completed'] === 'No' && d['Remarks'] !== 'Cancelled' && d['Project Start date']) {
      const startTs = dateToTimestamp(d['Project Start date']);
      const createdTs = dateToTimestamp(d['Job Creation Date']);
      tableData.push([
        d['No.'] || '',
        d['Job type'] || '',
        d['Engineer Name'] || '',
        startTs !== null ? Math.floor((now - startTs) / 86400) + ' days' : '',
        startTs !== null && createdTs !== null ? Math.floor((startTs - createdTs) / 86400) + ' days' : ''
      ]);
    }
  }

  // Initialize DataTable
  const table = document.getElementById('projects');
  if (table) {
    // Simple table population instead of DataTable (to avoid CDN dependencies)
    let html = '<thead><tr><th>No</th><th>Job type</th><th>Engineer Name</th><th>Running Time</th><th>Starting Time</th></tr></thead><tbody>';
    for (let i = 0; i < tableData.length; i++) {
      html += '<tr>';
      for (let j = 0; j < tableData[i].length; j++) {
        html += '<td>' + tableData[i][j] + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody>';
    table.innerHTML = html;
  }

  // Charts
  renderQuickEngineersChart(data);
  renderProjectsPerEngineerChart(data);
  renderIndividualEngineerValueChart(data);
}

// Chart: Engineers who took lesser time to start
function renderQuickEngineersChart(data) {
  const engineers = {};
  
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d['Engineer Name'] && d['Project Start date'] && d['Job Creation Date']) {
      const name = d['Engineer Name'];
      const startTs = dateToTimestamp(d['Project Start date']);
      const createdTs = dateToTimestamp(d['Job Creation Date']);
      if (startTs !== null && createdTs !== null) {
        const days = (startTs - createdTs) / 86400;
        engineers[name] = (engineers[name] || 0) + days;
      }
    }
  }

  const labels = Object.keys(engineers);
  const values = [];
  const count = labels.length;
  for (let i = 0; i < count; i++) {
    values.push(engineers[labels[i]] / count);
  }

  renderChart('quick-engineers', labels, values, COLORS.slice(0, count));
}

// Chart: Projects per engineer
function renderProjectsPerEngineerChart(data) {
  const engineers = {};
  
  for (let i = 0; i < data.length; i++) {
    if (data[i]['Engineer Name']) {
      const name = data[i]['Engineer Name'];
      engineers[name] = (engineers[name] || 0) + 1;
    }
  }

  const labels = Object.keys(engineers);
  const values = Object.values(engineers);
  renderChart('number-of-projects-per-engineer', labels, values, COLORS.slice(0, labels.length));
}

// Chart: Individual engineer project value
function renderIndividualEngineerValueChart(data) {
  const engineers = {};
  
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d['Engineer Name'] && d['Total contract value']) {
      const name = d['Engineer Name'];
      const value = parseFloat(d['Total contract value']) || 0;
      engineers[name] = (engineers[name] || 0) + value;
    }
  }

  const labels = Object.keys(engineers);
  const values = Object.values(engineers);
  renderChart('individual-engineer-project-value', labels, values, COLORS.slice(0, labels.length));
}

// Generic chart renderer
function renderChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || values.length === 0) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 300;
  canvas.height = canvas.clientHeight || 300;
  const width = canvas.width;
  const height = canvas.height;
  
  // Simple pie chart
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const total = values.reduce(function(a, b) { return a + b; }, 0);
  
  let startAngle = -Math.PI / 2;
  
  for (let i = 0; i < values.length; i++) {
    const sliceAngle = (values[i] / total) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    
    startAngle += sliceAngle;
  }
  
  // Labels
  startAngle = -Math.PI / 2;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i < labels.length; i++) {
    const sliceAngle = (values[i] / total) * 2 * Math.PI;
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + Math.cos(midAngle) * labelRadius;
    const labelY = centerY + Math.sin(midAngle) * labelRadius;
    
    ctx.fillStyle = '#333';
    if (values[i] / total > 0.1) {
      ctx.fillText(labels[i], labelX, labelY);
    }
    
    startAngle += sliceAngle;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
