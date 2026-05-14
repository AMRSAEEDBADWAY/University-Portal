var currentPayId = null;
var currentPayAmount = 0;

function openPay(id, amount) {
    currentPayId = id;
    currentPayAmount = amount;
    document.getElementById('payAmount').textContent = amount.toLocaleString();
    document.getElementById('payModal').classList.add('active');
    document.getElementById('payMainContent').style.display = 'block';
    document.getElementById('paySuccess').style.display = 'none';
    document.getElementById('fawryCodeBox').style.display = 'none';
    document.getElementById('btnGenFawry').style.display = '';
    selectPayMethod('visa');
}

function closePay() { document.getElementById('payModal').classList.remove('active'); }

function selectPayMethod(method) {
    document.querySelectorAll('.pay-method-card').forEach(function(c) { c.classList.remove('active'); });
    var card = document.querySelector('[data-method="' + method + '"]');
    if (card) card.classList.add('active');
    document.querySelectorAll('.pay-form').forEach(function(f) { f.classList.remove('active'); });
    var form = document.getElementById('form-' + method);
    if (form) form.classList.add('active');
}

function processPay(e, method) {
    e.preventDefault();
    document.getElementById('payMainContent').style.display = 'none';
    document.getElementById('paySuccess').style.display = 'block';
    var statusEl = document.getElementById('fee' + currentPayId + '-status');
    if (statusEl) statusEl.innerHTML = '<span class="badge-paid">مدفوع ✅</span>';
}

function generateFawryCode() {
    var code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    document.getElementById('fawryCode').textContent = code;
    document.getElementById('fawryCodeBox').style.display = 'block';
    document.getElementById('btnGenFawry').style.display = 'none';
}

function copyFawryCode() {
    var code = document.getElementById('fawryCode').textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(function() { alert('✅ تم نسخ كود فوري!'); });
    } else { prompt('انسخ الكود:', code); }
}

function formatCardNumber(input) {
    var v = input.value.replace(/\D/g,'').substring(0,16);
    input.value = v.replace(/(.{4})/g,'$1 ').trim();
}

function formatExpiry(input) {
    var v = input.value.replace(/\D/g,'').substring(0,4);
    if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
    input.value = v;
}

function genPDF(desc, amount, date) {
    const { jsPDF } = window.jspdf;
    const d = new jsPDF();
    d.setFontSize(22); d.text('University Portal - Receipt', 20, 20);
    d.setFontSize(14);
    d.text('Description: ' + desc, 20, 40);
    d.text('Amount: ' + amount + ' EGP', 20, 50);
    d.text('Date: ' + date, 20, 60);
    d.text('Status: PAID', 20, 70);
    d.text('Ref: UNI-' + Math.floor(Math.random() * 999999), 20, 80);
    d.save('receipt_' + desc + '.pdf');
}
