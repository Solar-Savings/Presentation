// Solar Savings – simple, no-chart calculator

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const billInput   = document.getElementById('bill');
  const solarInput  = document.getElementById('solarPayment');
  const yearsRange  = document.getElementById('yearsRange');
  const yearsDisplay= document.getElementById('yearsDisplay');
  const snapYearEl  = document.getElementById('snapYear');

  const utilityEsc  = document.getElementById('utilityEsc'); // hidden 9%
  const solarEscSel = document.getElementById('solarEsc');

  const utilTotalEl = document.getElementById('utilTotal');
  const solarTotalEl= document.getElementById('solarTotal');
  const savingsEl   = document.getElementById('savings');

  const selMonthlyUtil   = document.getElementById('selMonthlyUtil');
  const selMonthlySolar  = document.getElementById('selMonthlySolar');
  const selMonthlySavings= document.getElementById('selMonthlySavings');
  const selAnnualSavings = document.getElementById('selAnnualSavings');

  const runBtn = document.getElementById('runBtn');

  const money = n => n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});

  function seriesAnnual(monthly, rate, years){
    const out = [];
    let m = monthly;
    for (let i=0;i<years;i++){
      out.push(m*12);
      m *= (1+rate);
    }
    return out;
  }
  const sum = arr => arr.reduce((a,b)=>a+b,0);

  function calc(){
    const bill   = Math.max(0, parseFloat(billInput.value) || 0);
    const solar  = Math.max(0, parseFloat(solarInput.value) || 0);
    const years  = Math.max(1, Math.min(30, parseInt(yearsRange.value || '25',10)));
    const utilR  = parseFloat(utilityEsc.value) || 0.09; // 9% fixed
    const solarR = parseFloat(solarEscSel.value) || 0;

    yearsDisplay.textContent = years;
    snapYearEl.textContent = `Year ${years}`;

    const utilSeries  = seriesAnnual(bill,  utilR, years);
    const solarSeries = seriesAnnual(solar, solarR, years);

    const utilTotal  = sum(utilSeries);
    const solarTotal = sum(solarSeries);
    const savings    = utilTotal - solarTotal;

    utilTotalEl.textContent  = money(utilTotal);
    solarTotalEl.textContent = money(solarTotal);
    savingsEl.textContent    = money(savings);

    // Yearly snapshot (month N)
    const utilMonthN  = bill  * Math.pow(1+utilR,  years-1);
    const solarMonthN = solar * Math.pow(1+solarR, years-1);
    const monthSave   = Math.max(0, utilMonthN - solarMonthN);
    const annualSave  = monthSave * 12;

    selMonthlyUtil.textContent    = money(utilMonthN);
    selMonthlySolar.textContent   = money(solarMonthN);
    selMonthlySavings.textContent = money(monthSave);
    selAnnualSavings.textContent  = money(annualSave);
  }

  // Live updates
  [billInput, solarInput, solarEscSel, yearsRange].forEach(el=>{
    el.addEventListener('input', calc);
  });
  runBtn.addEventListener('click', calc);

  // Initial render
  calc();
});