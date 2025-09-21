// Solar Savings Calculator – no chart, clean snapshot

document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  const billInput       = document.getElementById('bill');
  const solarInput      = document.getElementById('solarPayment');
  const yearsRange      = document.getElementById('yearsRange');
  const yearsDisplay    = document.getElementById('yearsDisplay');
  const utilityEscInput = document.getElementById('utilityEsc'); // fixed 9%
  const solarEscSelect  = document.getElementById('solarEsc');

  // Totals
  const utilTotalEl  = document.getElementById('utilTotal');
  const solarTotalEl = document.getElementById('solarTotal');
  const savingsEl    = document.getElementById('savings');

  // Snapshot
  const snapYearEl          = document.getElementById('snapYear');
  const selMonthlyUtilityEl = document.getElementById('selMonthlyUtility');
  const selMonthlySolarEl   = document.getElementById('selMonthlySolar');
  const selMonthlySavingsEl = document.getElementById('selMonthlySavings');
  const selAnnualSavingsEl  = document.getElementById('selAnnualSavings');

  const runBtn = document.getElementById('runBtn');

  const fmtMoney = n => (isFinite(n) ? n : 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const sumSeries = (m0, r, years) => {
    let total = 0, m = Number(m0) || 0;
    for (let i = 0; i < years; i++) { total += m * 12; m *= 1 + r; }
    return total;
  };
  const monthAtYear = (m0, r, year) => (Number(m0) || 0) * Math.pow(1 + r, Math.max(0, year - 1));

  function recalc() {
    const bill   = parseFloat(billInput.value || '0');
    const solar  = parseFloat(solarInput.value || '0');
    const years  = Math.max(1, Math.min(30, parseInt(yearsRange.value || '25', 10)));

    const utilEsc = parseFloat(utilityEscInput.value || '0.09') || 0.09; // fixed 9%
    const solEsc  = parseFloat(solarEscSelect.value || '0.0299') || 0.0299;

    // Totals
    const utilTotal  = sumSeries(bill,  utilEsc, years);
    const solarTotal = sumSeries(solar, solEsc,  years);
    const savings    = utilTotal - solarTotal;

    utilTotalEl.textContent  = fmtMoney(utilTotal);
    solarTotalEl.textContent = fmtMoney(solarTotal);
    savingsEl.textContent    = fmtMoney(savings);

    // Yearly snapshot
    yearsDisplay.textContent = years;
    snapYearEl.textContent   = years;

    const uM = monthAtYear(bill,  utilEsc, years);
    const sM = monthAtYear(solar, solEsc,  years);
    const mS = Math.max(0, uM - sM);
    const aS = mS * 12;

    selMonthlyUtilityEl.textContent = fmtMoney(uM);
    selMonthlySolarEl.textContent   = fmtMoney(sM);
    selMonthlySavingsEl.textContent = fmtMoney(mS);
    selAnnualSavingsEl.textContent  = fmtMoney(aS);
  }

  // Live interactions
  [billInput, solarInput].forEach(el => el.addEventListener('input', recalc));
  yearsRange.addEventListener('input', recalc);
  solarEscSelect.addEventListener('change', recalc);
  runBtn.addEventListener('click', recalc);

  // First paint
  recalc();
  // FAQ dropdown toggle
document.querySelectorAll('.faq-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const content = toggle.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});
});

// ===== Electricity Rates chart (no libraries) =====
(function () {
  const elCanvas = document.getElementById('rateChart');
  if (!elCanvas) return;

  // Data: US avg residential price (¢/kWh)
  // Source hint: EIA annual averages. Values here are practical approximations you can adjust.
  const DATA = [
    { y: 2005, v: 9.45 },
    { y: 2007, v: 10.65 },
    { y: 2009, v: 11.51 },
    { y: 2011, v: 12.43 },
    { y: 2013, v: 12.98 },
    { y: 2015, v: 12.67 },
    { y: 2017, v: 12.89 },
    { y: 2019, v: 13.04 },
    { y: 2020, v: 13.15 },
    { y: 2021, v: 13.72 },
    { y: 2022, v: 15.04 },
    { y: 2023, v: 15.95 },
    { y: 2024, v: 16.28 }
  ];

  // Helper: compute % growth between first and last (and last 10 years)
  const first = DATA[0], last = DATA[DATA.length - 1];
  const pct = (last.v / first.v - 1) * 100;
  const tenStart = DATA.find(d => d.y >= last.y - 10) || DATA[Math.max(0, DATA.length - 11)];
  const pct10 = (last.v / tenStart.v - 1) * 100;

  // Fallback table rows
  const tb = document.getElementById('rateTableBody');
  if (tb) {
    tb.innerHTML = DATA.map(d => `<tr><td>${d.y}</td><td>${d.v.toFixed(2)}</td></tr>`).join('');
  }
  const notes = document.getElementById('rateNotes');
  if (notes) {
    notes.innerHTML =
      `Up <strong>${pct.toFixed(0)}%</strong> since ${first.y} &bull; ` +
      `<strong>${pct10.toFixed(0)}%</strong> in the last decade`;
  }

  // Drawing
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  const PADDING = { l: 56, r: 18, t: 30, b: 40 };

  function draw() {
    // Resize canvas for crispness
    const cssW = elCanvas.clientWidth;
    const cssH = elCanvas.clientHeight;
    elCanvas.width = Math.floor(cssW * DPR);
    elCanvas.height = Math.floor(cssH * DPR);

    const ctx = elCanvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, cssW, cssH);

    const W = cssW - PADDING.l - PADDING.r;
    const H = cssH - PADDING.t - PADDING.b;

    // Scales
    const years = DATA.map(d => d.y);
    const vals = DATA.map(d => d.v);
    const minY = Math.floor(Math.min(...vals) * 0.9);
    const maxY = Math.ceil(Math.max(...vals) * 1.05);

    const x = (yr) => {
      const t = (yr - years[0]) / (years[years.length - 1] - years[0]);
      return PADDING.l + t * W;
    };
    const y = (v) => {
      const t = (v - minY) / (maxY - minY);
      return PADDING.t + (1 - t) * H;
    };

    // Gridlines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const gy = PADDING.t + (H / steps) * i;
      ctx.beginPath();
      ctx.moveTo(PADDING.l, gy);
      ctx.lineTo(cssW - PADDING.r, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(PADDING.l, PADDING.t);
    ctx.lineTo(PADDING.l, cssH - PADDING.b);
    ctx.lineTo(cssW - PADDING.r, cssH - PADDING.b);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#3a4a5c';
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= steps; i++) {
      const vv = minY + ((maxY - minY) / steps) * i;
      const gy = PADDING.t + (H / steps) * (steps - i);
      ctx.fillText(vv.toFixed(0) + '¢', PADDING.l - 8, gy);
    }

    // X-axis labels (every 2–3 ticks)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const stride = Math.ceil(years.length / 6);
    years.forEach((yr, idx) => {
      if (idx % stride === 0 || idx === years.length - 1) {
        ctx.fillText(yr, x(yr), cssH - PADDING.b + 8);
      }
    });

    // Line
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b74da';
    ctx.fillStyle = 'rgba(11,116,218,0.12)';
    ctx.beginPath();
    DATA.forEach((d, i) => {
      const px = x(d.y), py = y(d.v);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Area under line (nice drama)
    ctx.lineTo(x(last.y), y(minY));
    ctx.lineTo(x(first.y), y(minY));
    ctx.closePath();
    ctx.fill();

    // Points + labels on first, 2020, last
    const labelYears = [first.y, 2020, last.y].filter((v, i, a) => a.indexOf(v) === i);
    ctx.fillStyle = '#0b74da';
    labelYears.forEach(yr => {
      const d = DATA.find(p => p.y === yr) || DATA.reduce((prev, cur) =>
        Math.abs(cur.y - yr) < Math.abs(prev.y - yr) ? cur : prev
      );
      const px = x(d.y), py = y(d.v);
      // dot
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // label
      const box = `${d.y}: ${d.v.toFixed(2)}¢`;
      ctx.fillStyle = '#16324c';
      ctx.font = '600 12px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(box, px + 6, py - 6);
      ctx.fillStyle = '#0b74da';
    });

    // Callout box (total % and last 10 yrs %)
    const blurb = `Total ↑ ${pct.toFixed(0)}% since ${first.y} · ↑ ${pct10.toFixed(0)}% in last 10 yrs`;
    const bx = PADDING.l + 10, by = PADDING.t + 10;
    ctx.font = '600 13px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
    const bw = ctx.measureText(blurb).width + 16, bh = 28;
    ctx.fillStyle = 'rgba(22, 50, 76, 0.9)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(blurb, bx + 8, by + bh / 2);
  }

  // Draw now + on resize
  draw();
  window.addEventListener('resize', draw, { passive: true });
})();
// ===== Electricity Rates Chart =====
document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('rateChart');
  if (!ctx) return;

  // Example national average price data
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const prices = [12.4, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 14.3, 15.1, 15.8];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: '¢/kWh',
        data: prices,
        borderColor: '#ff5722',
        backgroundColor: 'rgba(255,87,34,0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#ff5722',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.raw.toFixed(2) + ' ¢/kWh'
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Year' } },
        y: { title: { display: true, text: '¢/kWh' } }
      }
    }
  });

  // Table data
  const tableBody = document.getElementById('rateTableBody');
  prices.forEach((p, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${years[i]}</td><td>${p.toFixed(2)}</td>`;
    tableBody.appendChild(row);
  });

  // Notes
  document.getElementById('rateNotes').innerText =
    'Data: U.S. Energy Information Administration (EIA) – illustrative example.';
});
