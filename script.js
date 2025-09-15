document.addEventListener('DOMContentLoaded', () => {
  const billInput    = document.getElementById('bill');
  const solarInput   = document.getElementById('solarPayment');
  const yearsRange   = document.getElementById('yearsRange');
  const yearsDisplay = document.getElementById('yearsDisplay');
  const utilityEsc   = document.getElementById('utilityEsc'); // hidden 0.09
  const solarEsc     = document.getElementById('solarEsc');
  const runBtn       = document.getElementById('runBtn');

  const utilTotalEl  = document.getElementById('utilTotal');
  const solarTotalEl = document.getElementById('solarTotal');
  const savingsEl    = document.getElementById('savings');

  const selYearEl    = document.getElementById('selYear');
  const mUtilEl      = document.getElementById('selMonthlyUtility');
  const mSolarEl     = document.getElementById('selMonthlySolar');
  const mSaveEl      = document.getElementById('selMonthlySavings');
  const aSaveEl      = document.getElementById('selAnnualSavings');

  const fmt2 = (n) => isFinite(n) ? Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '0.00';
  const fmt0 = (n) => isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0';

  function series(monthly, esc, years){
    const out = [];
    let annual = (parseFloat(monthly)||0) * 12;
    const r = parseFloat(esc)||0;
    for(let i=0;i<years;i++){ out.push(annual); annual *= (1+r); }
    return out;
  }
  const sum = (arr)=>arr.reduce((a,b)=>a+b,0);

  function run(){
    const monthly = parseFloat(billInput.value || '0');
    const solarM  = parseFloat(solarInput.value || '0');
    const years   = parseInt(yearsRange.value || '25', 10);
    yearsDisplay.textContent = years;
    selYearEl.textContent = years;

    const uEsc = parseFloat(utilityEsc.value || '0.09') || 0.09;  // fixed & hidden
    const sEsc = parseFloat(solarEsc.value || '0') || 0;

    const utilY  = series(monthly, uEsc, years);
    const solarY = series(solarM,  sEsc, years);

    utilTotalEl.textContent  = fmt0(sum(utilY));
    solarTotalEl.textContent = fmt0(sum(solarY));
    savingsEl.textContent    = fmt0(sum(utilY) - sum(solarY));

    const idx = Math.max(0, years - 1);
    const utilMonthlyNow  = monthly * Math.pow(1 + uEsc, idx);
    const solarMonthlyNow = solarM  * Math.pow(1 + sEsc, idx);
    const monthlySavings  = utilMonthlyNow - solarMonthlyNow;
    const annualSavings   = (utilY[idx] || 0) - (solarY[idx] || 0);

    mUtilEl.textContent  = fmt2(utilMonthlyNow);
    mSolarEl.textContent = fmt2(solarMonthlyNow);
    mSaveEl.textContent  = fmt2(monthlySavings);
    aSaveEl.textContent  = fmt0(annualSavings);
  }

  yearsRange.addEventListener('input', run);
  billInput.addEventListener('input', run);
  solarInput.addEventListener('input', run);
  solarEsc.addEventListener('change', run);
  runBtn.addEventListener('click', run);

  // defaults so it renders immediately
  if(!billInput.value)  billInput.value  = 180;
  if(!solarInput.value) solarInput.value = 135;
  run();
});