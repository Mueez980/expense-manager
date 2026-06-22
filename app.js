var entries = JSON.parse(localStorage.getItem('em_entries') || '[]');
var currentType = 'income';
var currentPeriod = 'today';
var chartRange = 7;
var mainChart = null;

function save() {
  localStorage.setItem('em_entries', JSON.stringify(entries));
}

function showSection(name) {
  var sections = ['dashboard','add','history','charts'];
  for (var i = 0; i < sections.length; i++) {
    document.getElementById(sections[i]).classList.add('hidden');
    document.getElementById('nav-' + sections[i]).classList.remove('active');
  }
  document.getElementById(name).classList.remove('hidden');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
  if (name === 'charts') renderChart();
}

function setPeriod(p) {
  currentPeriod = p;
  var tabs = ['today','week','month'];
  for (var i = 0; i < tabs.length; i++) {
    document.getElementById('tab-' + tabs[i]).classList.remove('active');
  }
  document.getElementById('tab-' + p).classList.add('active');
  renderDashboard();
}

function getDateRange(period) {
  var now = new Date();
  var today = now.toISOString().slice(0, 10);
  if (period === 'today') return { start: today, end: today };
  if (period === 'week') {
    var d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
  if (period === 'month') {
    var d2 = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: d2.toISOString().slice(0, 10), end: today };
  }
}

function inRange(entry, range) {
  return entry.date >= range.start && entry.date <= range.end;
}

function renderDashboard() {
  var range = getDateRange(currentPeriod);
  var filtered = [];
  for (var i = 0; i < entries.length; i++) {
    if (inRange(entries[i], range)) filtered.push(entries[i]);
  }

  var totalIncome = 0;
  var totalExpense = 0;
  var takeaway = 0; var dinein = 0; var parcel = 0;
  var food = 0; var salary = 0; var bills = 0;

  for (var i = 0; i < filtered.length; i++) {
    var e = filtered[i];
    if (e.type === 'income') {
      totalIncome += e.amount;
      if (e.category === 'takeaway') takeaway += e.amount;
      if (e.category === 'dinein') dinein += e.amount;
      if (e.category === 'parcel') parcel += e.amount;
    } else {
      totalExpense += e.amount;
      if (e.category === 'food') food += e.amount;
      if (e.category === 'salary') salary += e.amount;
      if (e.category === 'bills') bills += e.amount;
    }
  }

  var net = totalIncome - totalExpense;

  document.getElementById('total-income').textContent = 'PKR ' + totalIncome.toLocaleString();
  document.getElementById('total-expense').textContent = 'PKR ' + totalExpense.toLocaleString();
  document.getElementById('net-profit').textContent = (net < 0 ? '-PKR ' : 'PKR ') + Math.abs(net).toLocaleString();
  document.getElementById('inc-takeaway').textContent = 'PKR ' + takeaway.toLocaleString();
  document.getElementById('inc-dinein').textContent = 'PKR ' + dinein.toLocaleString();
  document.getElementById('inc-parcel').textContent = 'PKR ' + parcel.toLocaleString();
  document.getElementById('exp-food').textContent = 'PKR ' + food.toLocaleString();
  document.getElementById('exp-salary').textContent = 'PKR ' + salary.toLocaleString();
  document.getElementById('exp-bills').textContent = 'PKR ' + bills.toLocaleString();

  var profitCard = document.getElementById('profit-card');
  var hint = document.getElementById('profit-hint');
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

function setType(type) {
  currentType = type;
  document.getElementById('type-income').classList.toggle('active', type === 'income');
  document.getElementById('type-expense').classList.toggle('active', type === 'expense');
  var cat = document.getElementById('entry-category');
  if (type === 'income') {
    cat.innerHTML = '
Takeaway
Dine-in
Parcel
';
  } else {
    cat.innerHTML = '
Food and Ingredients
Staff Salary
Bills and Utilities
';
  }
}

function addEntry() {
  var amount = parseFloat(document.getElementById('entry-amount').value);
  var category = document.getElementById('entry-category').value;
  var date = document.getElementById('entry-date').value;
  var note = document.getElementById('entry-note').value;
  var msg = document.getElementById('form-msg');

  if (!amount || amount <= 0) {
    msg.style.color = '#A32D2D';
    msg.textContent = 'Please enter a valid amount.';
    return;
  }
  if (!date) {
    msg.style.color = '#A32D2D';
    msg.textContent = 'Please select a date.';
    return;
  }

  var entry = {
    id: Date.now(),
    type: currentType,
    category: category,
    amount: amount,
    date: date,
    note: note
  };

  entries.unshift(entry);
  save();

  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  msg.style.color = '#0F6E56';
  msg.textContent = 'Entry saved successfully!';
  setTimeout(function() { msg.textContent = ''; }, 2500);
}

function renderHistory() {
  var typeFilter = document.getElementById('filter-type').value;
  var catFilter = document.getElementById('filter-cat').value;
  var dateFilter = document.getElementById('filter-date').value;
  var list = document.getElementById('history-list');
  var catLabels = {
    takeaway: 'Takeaway', dinein: 'Dine-in', parcel: 'Parcel',
    food: 'Food and Ingredients', salary: 'Staff Salary', bills: 'Bills and Utilities'
  };

  var filtered = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (typeFilter !== 'all' && e.type !== typeFilter) continue;
    if (catFilter !== 'all' && e.category !== catFilter) continue;
    if (dateFilter && e.date !== dateFilter) continue;
    filtered.push(e);
  }

  if (filtered.length === 0) {
    list.innerHTML = '
No entries found.
';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var e = filtered[i];
    var badgeClass = e.type === 'income' ? 'badge-income' : 'badge-expense';
    var amtClass = e.type === 'income' ? 'amount-income' : 'amount-expense';
    var sign = e.type === 'income' ? '+' : '-';
    var label = catLabels[e.category] || e.category;
    var meta = e.date + (e.note ? ' - ' + e.note : '');
    html += '
';
    html += '
';
    html += '' + (e.type === 'income' ? 'Income' : 'Expense') + '';
    html += '' + label + '';
    html += '' + meta + '';
    html += '
';
    html += '
';
    html += '' + sign + 'PKR ' + e.amount.toLocaleString() + '';
    html += 'X';
    html += '
';
  }
  list.innerHTML = html;
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  var newEntries = [];
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].id !== id) newEntries.push(entries[i]);
  }
  entries = newEntries;
  save();
  renderHistory();
}

function setChartRange(days) {
  chartRange = days;
  document.getElementById('range-7').classList.toggle('active', days === 7);
  document.getElementById('range-30').classList.toggle('active', days === 30);
  renderChart();
}

function renderChart() {
  var labels = [];
  var incomeData = [];
  var expenseData = [];
  var now = new Date();

  for (var i = chartRange - 1; i >= 0; i--) {
    var d = new Date(now);
    d.setDate(d.getDate() - i);
    var dateStr = d.toISOString().slice(0, 10);
    var label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    labels.push(label);
    var inc = 0; var exp = 0;
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].date === dateStr) {
        if (entries[j].type === 'income') inc += entries[j].amount;
        else exp += entries[j].amount;
      }
    }
    incomeData.push(inc);
    expenseData.push(exp);
  }

  if (mainChart) mainChart.destroy();

  mainChart = new Chart(document.getElementById('mainChart'), {
    type: 'bar',
    data: {
      labels: labels,
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
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(v) { return 'PKR ' + v.toLocaleString(); }
          }
        }
      }
    }
  });
}

document.getElementById('entry-date').value = new Date().toISOString().slice(0, 10);
renderDashboard();
