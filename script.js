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
