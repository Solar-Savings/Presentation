//
// script.js — Solar savings calculator logic
//
// This module powers the interactive calculator at the top of the
// presentation.  It reads user inputs for the current monthly
// utility bill, projected solar payment, analysis horizon and
// escalation rates, then generates annual cost curves and visualises
// them on a canvas element.  Totals and savings are displayed
// alongside the chart.

document.addEventListener('DOMContentLoaded', () => {
  // Grab DOM elements
  const billInput = document.getElementById('bill');
  const solarInput = document.getElementById('solarPayment');
  const yearsRange = document.getElementById('yearsRange');
  const yearsDisplay = document.getElementById('yearsDisplay');
  const utilityEsc = document.getElementById('utilityEsc');
  const solarEsc = document.getElementById('solarEsc');
  const runBtn = document.getElementById('runBtn');
  const utilTotalEl = document.getElementById('utilTotal');
  const solarTotalEl = document.getElementById('solarTotal');
  const savingsEl = document.getElementById('savings');
  const canvas = document.getElementById('savingsChart');
  const ctx = canvas.getContext('2d');

  /**
   * Helper to format a number as USD currency without cents.
   * @param {number} n
   */
  function formatCurrency(n) {
    if (!isFinite(n)) return '0';
    return Math.round(n).toLocaleString('en-US');
  }

  /**
   * Generate an array of annual costs based on an initial monthly
   * amount and a fixed escalation rate.  Costs are calculated on
   * a yearly basis (monthly * 12) and escalated each year.
   *
   * @param {number} monthly - starting monthly cost
   * @param {number} rate - annual escalation rate (e.g. 0.09 for 9%)
   * @param {number} years - number of years to generate
   * @returns {number[]} - array of annual cost values
   */
  function generateAnnualSeries(monthly, rate, years) {
    const arr = [];
    let annual = monthly * 12;
    for (let i = 0; i < years; i++) {
      arr.push(annual);
      annual *= 1 + rate;
    }
    return arr;
  }

  /**
   * Sum all numbers in an array.
   *
   * @param {number[]} arr
   * @returns {number}
   */
  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }

  /**
   * Draw the savings chart on the canvas.  Two series are plotted:
   * the projected utility cost and the projected solar cost.  A simple
   * line chart is drawn without any external libraries.  Axes and
   * legends are included for clarity.
   *
   * @param {number[]} utilData - annual utility costs
   * @param {number[]} solarData - annual solar costs
   */
  function drawChart(utilData, solarData) {
    // Set canvas dimensions based on its CSS width to ensure crisp lines
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Padding for axes
    const pad = { l: 60, r: 20, t: 20, b: 50 };
    const years = utilData.length;
    // Determine maximum y-value for scaling
    const maxVal = Math.max(...utilData, ...solarData) * 1.1 || 1;
    // Scale functions
    const xScale = years > 1 ? (w - pad.l - pad.r) / (years - 1) : 0;
    const yScale = (h - pad.t - pad.b) / maxVal;
    // Draw axes
    ctx.strokeStyle = '#8a9e94';
    ctx.lineWidth = 1;
    // y-axis
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, h - pad.b);
    ctx.stroke();
    // x-axis
    ctx.beginPath();
    ctx.moveTo(pad.l, h - pad.b);
    ctx.lineTo(w - pad.r, h - pad.b);
    ctx.stroke();
    // Draw y-axis labels (4 ticks)
    ctx.fillStyle = '#3f5c52';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = (maxVal / ticks) * i;
      const yPos = h - pad.b - yScale * val;
      ctx.beginPath();
      ctx.moveTo(pad.l - 5, yPos);
      ctx.lineTo(pad.l, yPos);
      ctx.stroke();
      ctx.fillText(`$${(val / 1000).toFixed(1)}k`, pad.l - 8, yPos);
    }
    // Draw x-axis labels (every 5 years or last)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelInterval = years > 10 ? Math.ceil(years / 10) : 1;
    for (let i = 0; i < years; i++) {
      if (i % labelInterval === 0 || i === years - 1) {
        const xPos = pad.l + xScale * i;
        ctx.fillText(`${i + 1}`, xPos, h - pad.b + 6);
      }
    }
    // Helper to draw a line series
    function drawLine(data, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = pad.l + xScale * i;
        const y = h - pad.b - v * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    // Draw utility and solar series with distinct colours
    drawLine(utilData, '#b71c1c');   // red tone for utility
    drawLine(solarData, '#1b5e20');  // green tone for solar
    // Legend
    const legendX = pad.l;
    const legendY = pad.t - 12;
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Utility
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(legendX, legendY, 14, 4);
    ctx.fillStyle = varColor('#1b2420');
    ctx.fillText(' Utility', legendX + 18, legendY + 2);
    // Solar
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(legendX + 70, legendY, 14, 4);
    ctx.fillStyle = varColor('#1b2420');
    ctx.fillText(' Solar', legendX + 88, legendY + 2);
  }

  /**
   * Utility function to choose fallback text colour given variable support.
   * This ensures legend text is visible when CSS variables aren’t accessible
   * inside the canvas context.
   *
   * @param {string} fallback
   * @returns {string}
   */
  function varColor(fallback) {
    // Canvas does not have access to CSS variables, so just return fallback
    return fallback;
  }

  /**
   * Perform the calculation and update the UI.  This is triggered when
   * the user clicks the Calculate button or modifies the inputs.
   */
  function runCalculation() {
    const monthlyBill = parseFloat(billInput.value) || 0;
    const solarMonthly = parseFloat(solarInput.value) || 0;
    const years = parseInt(yearsRange.value, 10) || 0;
    const utilRate = parseFloat(utilityEsc.value) || 0.09;
    const solarRate = parseFloat(solarEsc.value) || 0;
    // Update years display
    yearsDisplay.textContent = years.toString();
    // Generate series
    const utilData = generateAnnualSeries(monthlyBill, utilRate, years);
    const solarData = generateAnnualSeries(solarMonthly, solarRate, years);
    // Update totals
    const utilTotal = sum(utilData);
    const solarTotal = sum(solarData);
    const savings = utilTotal - solarTotal;
    utilTotalEl.textContent = formatCurrency(utilTotal);
    solarTotalEl.textContent = formatCurrency(solarTotal);
    savingsEl.textContent = formatCurrency(savings);
    // Draw chart
    drawChart(utilData, solarData);
  }

  // Event listeners
  runBtn.addEventListener('click', runCalculation);
  billInput.addEventListener('input', runCalculation);
  solarInput.addEventListener('input', runCalculation);
  yearsRange.addEventListener('input', () => {
    yearsDisplay.textContent = yearsRange.value;
  });
  utilityEsc.addEventListener('change', runCalculation);
  solarEsc.addEventListener('change', runCalculation);
  window.addEventListener('resize', () => {
    // Redraw the chart on resize to keep proportions accurate
    runCalculation();
  });
  // Initialise default values and run once
  billInput.value = billInput.placeholder || '';
  solarInput.value = solarInput.placeholder || '';
  runCalculation();
});