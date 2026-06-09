// EscrowNG — Main JS

// Auto-dismiss flash messages after 5 seconds
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => el.remove(), 5000);
});

// Confirm destructive actions
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', e => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// Format amount inputs on blur
document.querySelectorAll('input[type="number"][step="0.01"]').forEach(input => {
  input.addEventListener('blur', () => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) input.value = val.toFixed(2);
  });
});
