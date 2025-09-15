// Solar savings calculator — live updates + yearly snapshot + canvas chart
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const billInput      = document.getElementById('bill');
  const solarInput     = document.getElementById('solarPayment');
  const yearsRange     = document.getElementById('yearsRange');
  const yearsDisplay   = document.getElementById('yearsDisplay');
  const utilityEsc     = document.getElementById('utilityEsc');  // hidden (0.09)
  const solarEsc       = document.getElementById('solarEsc');
  const runBtn         = document.getElementById('runBtn');

  const utilTotalEl    = document.getElementById('utilTotal');
  const solarTotalEl   = document.getElementById('solarTotal');
  const savingsEl      = document.getElementById('savings');

  const snapshotText   = document.getElementById('snapshotText');

  const canvas         = document.getElementById('savingsChart');
  const ctx            = canvas.getContext('2d');

  // Helpers
  const fmtMoney = (n) => isFinite(n) ? n.toLocaleString('en-US', {maximumFractionDigits: 2}) : '0';

  function annualSeries(monthly, esc, years){
    const arr = [];
    let a = (parseFloat(monthly)||0) * 12;
    for (let i=0;i<years;i++){ arr.push(a); a *= (1 + (parseFloat(esc)||0)); }
    return arr;
  }
  const sum = (arr) => arr.reduce((x,y)=>x+y,0);

  // Chart
  function drawChart(utilY, solarY){
  // --- responsive canvas sizing (crisp on mobile/retina) ---
  const dpr = window.devicePixelRatio || 1;
  const parent = canvas.parentElement;

  // CSS size of the canvas (what you see)
  const cssW = Math.max(320, Math.round(parent.getBoundingClientRect().width));
  const cssH = Math.round(cssW * 0.38); // ~38% aspect; tweak to taste

  // Apply CSS size
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';

  // Internal bitmap size (for sharp rendering)
  canvas.width  = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  // Draw using CSS pixel coordinates
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  // ---- from here on, use cssW / cssH instead of canvas.width/height ----
  const pad = { l: 60, r: 20, t: 24, b: 44 };
  const w = cssW, h = cssH;
  const N = utilY.length;
  const maxV = Math.max(...utilY, ...solarY, 1) * 1.08;
  const xStep = N > 1 ? (w - pad.l - pad.r) / (N - 1) : 0;
  const yUnit = (h - pad.t - pad.b) / maxV;

  // ... rest of your drawing code stays the same ...
}

    // axes + grid
    ctx.strokeStyle = '#cfdad4'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,h-pad.b); ctx.lineTo(w-pad.r,h-pad.b); ctx.stroke();

    ctx.fillStyle = '#5e6e66'; ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign='right'; ctx.textBaseline='middle';
    for(let i=0;i<=5;i++){
      const v = maxV*i/5, y = h-pad.b - v*yUnit;
      ctx.strokeStyle = i===0 ? '#cfdad4' : '#e9f0ed';
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
      ctx.fillText('$'+Math.round(v/1000)+'k', pad.l-8, y);
    }

    ctx.textAlign='center'; ctx.textBaseline='top';
    const step = N>10 ? Math.ceil(N/10) : 1;
    for(let i=0;i<N;i+=step){ ctx.fillText(String(i+1), pad.l + xStep*i, h-pad.b+6); }
    if ((N-1)%step !== 0 && N>1) ctx.fillText(String(N), pad.l + xStep*(N-1), h-pad.b+6);

    function line(data,color){
      ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath();
      data.forEach((v,i)=>{ const x=pad.l+xStep*i, y=h-pad.b - v*yUnit; i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
      ctx.stroke();
    }
    line(utilY,  '#b71c1c'); // Utility red
    line(solarY, '#1b5e20'); // Solar green

    // legend
    ctx.fillStyle='#b71c1c'; ctx.fillRect(pad.l, pad.t-16, 16, 4);
    ctx.fillStyle='#0f3427'; ctx.fillText(' Utility', pad.l + 22, pad.t-18);
    ctx.fillStyle='#1b5e20'; ctx.fillRect(pad.l + 92, pad.t-16, 16, 4);
    ctx.fillStyle='#0f3427'; ctx.fillText(' Solar', pad.l + 114, pad.t-18);
  }

  function run(){
    const monthly = parseFloat(billInput.value || '0');
    const solarM  = parseFloat(solarInput.value || '0');
    const years   = parseInt(yearsRange.value || '25', 10);

    yearsDisplay.textContent = years;

    // keep 9% utility even if hidden
    const uEsc = parseFloat(utilityEsc.value || '0.09') || 0.09;
    const sEsc = parseFloat(solarEsc.value || '0') || 0;

    const utilY  = annualSeries(monthly, uEsc, years);
    const solarY = annualSeries(solarM,  sEsc, years);

    utilTotalEl.textContent  = fmtMoney(sum(utilY));
    solarTotalEl.textContent = fmtMoney(sum(solarY));
    savingsEl.textContent    = fmtMoney(sum(utilY) - sum(solarY));

    drawChart(utilY, solarY);

    // Yearly snapshot for selected year (the year shown by slider)
    const idx = Math.max(0, years - 1);
    const utilMonthlyNow  = monthly * Math.pow(1 + uEsc, idx);
    const solarMonthlyNow = solarM  * Math.pow(1 + sEsc, idx);
    const monthlySavings  = utilMonthlyNow - solarMonthlyNow;
    const annualSavings   = (utilY[idx] || 0) - (solarY[idx] || 0);

    snapshotText.textContent =
      `Year ${years}: Utility monthly cost $${fmtMoney(utilMonthlyNow)}`
      + `, Solar monthly cost $${fmtMoney(solarMonthlyNow)}`
      + `, Monthly savings $${fmtMoney(monthlySavings)}`
      + `, Annual savings $${fmtMoney(annualSavings)}`;
  }

  // Live updates
  yearsRange.addEventListener('input', run);
  billInput.addEventListener('input', run);
  solarInput.addEventListener('input', run);
  solarEsc.addEventListener('change', run);
  runBtn.addEventListener('click', run);
  window.addEventListener('resize', run);

  // Good defaults so it renders immediately
  if(!billInput.value) billInput.value = 180;
  if(!solarInput.value) solarInput.value = 135;
  run();
});