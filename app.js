// ── DATA ──────────────────────────────────────────────
let entries = JSON.parse(localStorage.getItem('em_entries') || '[]');
let currentType = 'income';
let currentPeriod = 'today';
let chartRange = 7;
let mainChart = null;

function save() {
  localStorage.setItem('em_entries', JSON.stringify(entries));
}

// ── NAVIGATION ────────────────────────────────────────
function showSection(name) {
  ['dashboard','add','history','charts'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
    document.getElementById('nav-' + s).classList.remove('active');
  });
  document.getElementById(name).classList.remove('hidden');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
  if (name === 'charts') renderChart();
}

// ── PERIOD TABS ───────────────────────────────────────
function setPeriod(p) {
  currentPeriod = p;
  ['today','week','month'].forEach(t => {
    document.getElementById('tab-' + t).classList.remove('active');
  });
  document.getElementById('tab-' + p).classList.add('active');
  renderDashboard();
}

function getDateRange(period) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (period === 'today') return { start: today, end: today };
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
}

function inRange(entry, range) {
  return entry.date >= range.start && entry.date <= range.end;
}

// ── DASHBOARD ─────────────────────────────────────────
function renderDashboard() {
  const range = getDateRange(currentPeriod);
  const filtered = entries.filter(e => inRange(e, range));

  const incomeEntries = filtered.filter(e => e.type === 'income');
  const expenseEntries = filtered.filter(e => e.type === 'expense');

  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpense;

  document.getElementById('total-income').textContent = 'PKR ' + totalIncome.toLocaleString();
  document.getElementById('total-expense').textContent = 'PKR ' + totalExpense.toLocaleString();
  document.getElementById('net-profit').textContent = (net < 0 ? '-PKR ' : 'PKR ') + Math.abs(net).toLocaleString();

  const byCategory = (cat) => incomeEntries.filter(e => e.category === cat).reduce((s,e) => s+e.amount, 0);
  document.getElementById('inc-takeaway').textContent = 'PKR ' + byCategory('takeaway').toLocaleString();
  document.getElementById('inc-dinein').textContent = 'PKR ' + byCategory('dinein').toLocaleString();
  document.getElementById('inc-parcel').textContent = 'PKR ' + byCategory('parcel').toLocaleString();

  const byExp = (cat) => expenseEntries.filter(e => e.category === cat).reduce((s,e) => s+e.amount, 0);
  document.getElementById('exp-food').textContent = 'PKR ' + byExp('food').toLocaleString();
  document.getElementById('exp-salary').textContent = 'PKR ' + byExp('salary').toLocaleString();
  document.getElementById('exp-bills').textContent = 'PKR ' + byExp('bills').toLocaleString();

  const profitCard = document.getElementById('profit-card');
  const hint = document.getElementById('profit-hint');
  profitCard.classList.remove('positive','negative');
  if (filtered.length === 0) {
    hint.textContent = 'No entries yet';
  } else if (net > 0) {
    profitCard.classList.add('positive');
    hint.textContent = 'You are in profit!';
  } else if (net < 0) {
    profitCard.classList.add('negative');
    hint.textContent = 'You are in loss.';
  } else {
    hint.textContent = 'Breaking even.';
  }
}

// ── ADD ENTRY ─────────────────────────────────────────
function setType(type) {
  currentType = type;
  document.getElementById('type-income').classList.toggle('active', type === 'income');
  document.getElementById('type-expense').classList.toggle('active', type === 'expense');

  const cat = document.getElementById('entry-category');
  cat.innerHTML = type === 'income'
    ? `
Takeaway

       
Dine-in

       
Parcel
`
    : `
Food & Ingredients

       
Staff Salary

       
Bills & Utilities
`;
}

function addEntry() {
  const amount = parseFloat(document.getElementById('entry-amount').value);
  const category = document.getElementById('entry-category').value;
  const date = document.getElementById('entry-date').value;
  const note = document.getElementById('entry-note').value.trim();
  const msg = document.getElementById('form-msg');

  if (!amount || amount <= 0) { msg.style.color = '#A32D2D'; msg.textContent = 'Please enter a valid amount.'; return; }
  if (!date) { msg.style.color = '#A32D2D'; msg.textContent = 'Please select a date.'; return; }

  const entry = {
    id: Date.now(),
    type: currentType,
    category,
    amount,
    date,
    note
  };

  entries.unshift(entry);
  save();

  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  msg.style.color = '#0F6E56';
  msg.textContent = 'Entry saved successfully!';
  setTimeout(() => msg.textContent = '', 2500);
}

// ── HISTORY ───────────────────────────────────────────
const catLabels = {
  takeaway: 'Takeaway', dinein: 'Dine-in', parcel: 'Parcel',
  food: 'Food & Ingredients', salary: 'Staff Salary', bills: 'Bills & Utilities'
};

function renderHistory() {
  const typeFilter = document.getElementById('filter-type').value;
  const catFilter = document.getElementById('filter-cat').value;
  const dateFilter = document.getElementById('filter-date').value;
  const list = document.getElementById('history-list');

  let filtered = [...entries];
  if (typeFilter !== 'all') filtered = filtered.filter(e => e.type === typeFilter);
  if (catFilter !== 'all') filtered = filtered.filter(e => e.category === catFilter);
  if (dateFilter) filtered = filtered.filter(e => e.date === dateFilter);

  if (filtered.length === 0) {
    list.innerHTML = '
No entries found.
';
    return;
  }

  list.innerHTML = filtered.map(e => `
    

      

        
          ${e.type === 'income' ? 'Income' : 'Expense'}
        
        ${catLabels[e.category] || e.category}
        ${e.date}${e.note ? ' · ' + e.note : ''}
      

      

        
          ${e.type === 'income' ? '+' : '-'}PKR ${e.amount.toLocaleString()}
        
        🗑️
      

    

  `).join('');
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  entries = entries.filter(e => e.id !== id);
  save();
  renderHistory();
}

// ── CHARTS ────────────────────────────────────────────
function setChartRange(days) {
  chartRange = days;
  document.getElementById('range-7').classList.toggle('active', days === 7);
  document.getElementById('range-30').classList.toggle('active', days === 30);
  renderChart();
}

function renderChart() {
  const labels = [];
  const incomeData = [];
  const expenseData = [];
  const now = new Date();

  for (let i = chartRange - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    labels.push(label);
    const dayEntries = entries.filter(e => e.date === dateStr);
    incomeData.push(dayEntries.filter(e => e.type === 'income').reduce((s,e) => s+e.amount, 0));
    expenseData.push(dayEntries.filter(e => e.type === 'expense').reduce((s,e) => s+e.amount, 0));
  }

  if (mainChart) mainChart.destroy();

  mainChart = new Chart(document.getElementById('mainChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#B5D4F4',
          borderColor: '#185FA5',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#F7C1C1',
          borderColor: '#E24B4A',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => 'PKR ' + ctx.parsed.y.toLocaleString()
          }
        }
      },
      scales: {
        x: {
          ticks: { autoSkip: chartRange > 15, maxRotation: 45, font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => 'PKR ' + v.toLocaleString(),
            font: { size: 11 }
          }
        }
      }
    }
  });
}

// ── INIT ──────────────────────────────────────────────
document.getElementById('entry-date').value = new Date().toISOString().slice(0, 10);
renderDashboard();
