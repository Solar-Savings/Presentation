// Simple solar savings calculator (no chart)

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const billInput       = document.getElementById('bill');
  const solarInput      = document.getElementById('solarPayment');
  const yearsRange      = document.getElementById('yearsRange');
  const yearsDisplay    = document.getElementById('yearsDisplay');
  const utilityEscInput = document.getElementById('utilityEsc'); // hidden 9%
  const solarEscSelect  = document.getElementById('solarEsc');

  const utilTotalEl   = document.getElementById('utilTotal');
  const solarTotalEl  = document.getElementById('solarTotal');
  const savingsEl     = document.getElementById('savings');

  const snapYearEl          = document.getElementById('snapYear');
  const selMonthlyUtilityEl = document.getElementById('selMonthlyUtility');
  const selMonthlySolarEl   = document.getElementById('selMonthlySolar');
  const selMonthlySavingsEl = document.getElementById('selMonthlySavings');
  const selAnnualSavingsEl  = document.getElementById('selAnnualSavings');

  const runBtn = document.getElementById('runBtn');

  // Helpers
  const fmtMoney = n => {
    const v = isFinite(n) ? n : 0;
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const seriesTotal = (startMonthly, rate, years) => {
    let total = 0;
    let m = Number(startMonthly) || 0;
    for (let i = 0; i < years; i++) {
      total += m * 12;
      m *= (1 + rate);
    }
    return total;
  };

  const monthlyAtYear = (startMonthly, rate, yearIndex) => {
    // yearIndex is 1-based (Year 1 = no escalation yet)
    return (Number(startMonthly) || 0) * Math.pow(1 + rate, Math.max(0, yearIndex - 1));
  };

  function recalc() {
    const years   = parseInt(yearsRange.value || '25', 10);
    const utilEsc = parseFloat(utilityEscInput.value || '0.09'); // fixed 9%
    const solEsc  = parseFloat(solarEscSelect.value || '0.0299');

    const bill   = parseFloat(billInput.value || '0');
    const solar  = parseFloat(solarInput.value || '0');

    // totals
    const utilTotal  = seriesTotal(bill,  utilEsc, years);
    const solarTotal = seriesTotal(solar, solEsc, years);
    const savings    = utilTotal - solarTotal;

    utilTotalEl.textContent  = Math.round(utilTotal).toLocaleString('en-US');
    solarTotalEl.textContent = Math.round(solarTotal).toLocaleString('en-US');
    savingsEl.textContent    = Math.round(savings).toLocaleString('en-US');

    // snapshot
    yearsDisplay.textContent = years;
    snapYearEl.textContent   = years;

    const uMonthly = monthlyAtYear(bill,  utilEsc, years);
    const sMonthly = monthlyAtYear(solar, solEsc, years);
    const mSave    = Math.max(0, uMonthly - sMonthly);
    const aSave    = mSave * 12;

    selMonthlyUtilityEl.textContent = fmtMoney(uMonthly);
    selMonthlySolarEl.textContent   = fmtMoney(sMonthly);
    selMonthlySavingsEl.textContent = fmtMoney(mSave);
    selAnnualSavingsEl.textContent  = fmtMoney(aSave);
  }

  // Events
  runBtn.addEventListener('click', recalc);
  [billInput, solarInput].forEach(el => el.addEventListener('input', recalc));
  yearsRange.addEventListener('input', recalc);
  solarEscSelect.addEventListener('change', recalc);

  // First run
  recalc();
});