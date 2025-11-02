// فایل: app.js

// منتظر می‌مانیم تا کل محتوای صفحه (HTML) بارگذاری شود
// این دستور کلیدی‌ترین بخش برای حل مشکل کار نکردن دکمه‌ها است
document.addEventListener('DOMContentLoaded', () => {
    
    console.log("DOM کاملاً بارگذاری شد. در حال اجرای اسکریپت...");

    // یافتن عناصر بعد از اینکه مطمئن شدیم در صفحه وجود دارند
    const addItemBtn = document.getElementById('addItemBtn');
    const purchaseForm = document.getElementById('purchaseForm');
    const invoiceQuestion = document.getElementById('invoiceQuestion');
    const itemsTableBody = document.querySelector('#itemsTable tbody');

    // بررسی اینکه آیا عناصر پیدا شده‌اند یا نه
    if (!addItemBtn || !purchaseForm || !invoiceQuestion || !itemsTableBody) {
        console.error("یکی از عناصر اصلی فرم پیدا نشد! کد متوقف می‌شود.");
        alert("خطای داخلی در بارگذاری فرم. لطفاً مجدداً تلاش کنید.");
        return;
    }

    // مقداردهی اولیه فرم (تاریخ و کد پروژه)
    initializeForm();

    // اتصال رویدادها (Event Listeners)
    addItemBtn.addEventListener('click', addItemRow);
    purchaseForm.addEventListener('submit', submitForm);
    invoiceQuestion.addEventListener('change', toggleInvoiceUpload);
    itemsTableBody.addEventListener('input', handleTableInput);
    
    console.log("رویدادها با موفقیت به عناصر متصل شدند.");
});

function initializeForm() {
    try {
        // تنظیم تاریخ جاری شمسی
        const today = new Date();
        const jalaliDate = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
        document.getElementById('requestDate').value = jalaliDate;
        console.log("تاریخ تنظیم شد:", jalaliDate);

        // دریافت و تنظیم کد پروژه
        const urlParams = new URLSearchParams(window.location.search);
        const projectCode = urlParams.get('project_code') || 'تعریف نشده';
        document.getElementById('projectName').value = projectCode;
        console.log("کد پروژه تنظیم شد:", projectCode);

        // مخفی کردن فیلد آپلود
        toggleInvoiceUpload();
    } catch(e) {
        console.error("خطا در مقداردهی اولیه فرم:", e);
    }
}

function addItemRow() {
    console.log("دکمه افزودن ردیف کلیک شد.");
    const tableBody = document.querySelector('#itemsTable tbody');
    const newRow = tableBody.insertRow(); // روش مطمئن‌تر برای افزودن سطر
    newRow.innerHTML = `
        <td><input type="text" name="itemName" class="form-control" required></td>
        <td><input type="number" name="quantity" class="form-control quantity" min="1" value="1" required></td>
        <td><input type="number" name="price" class="form-control price" min="0" value="0" required></td>
        <td class="total-price">0</td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item-btn">حذف</button></td>
    `;
    
    // افزودن رویداد حذف به دکمه جدید
    newRow.querySelector('.remove-item-btn').addEventListener('click', (e) => {
        e.target.closest('tr').remove();
        updateGrandTotal();
    });
}

function handleTableInput(event) {
    if (event.target.classList.contains('quantity') || event.target.classList.contains('price')) {
        const row = event.target.closest('tr');
        updateRowTotal(row);
    }
}

function updateRowTotal(row) {
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const price = parseFloat(row.querySelector('.price').value) || 0;
    const totalPrice = quantity * price;
    row.querySelector('.total-price').textContent = totalPrice.toLocaleString('fa-IR');
    updateGrandTotal();
}

function updateGrandTotal() {
    let grandTotal = 0;
    document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        grandTotal += quantity * price;
    });
    document.getElementById('grandTotal').textContent = grandTotal.toLocaleString('fa-IR');
}

function toggleInvoiceUpload() {
    const invoiceQuestion = document.getElementById('invoiceQuestion').value;
    const fileUploadDiv = document.getElementById('fileUploadDiv');
    const fileInput = document.getElementById('invoiceFile');
    if (invoiceQuestion === 'yes') {
        fileUploadDiv.style.display = 'block';
        fileInput.required = true;
    } else {
        fileUploadDiv.style.display = 'none';
        fileInput.required = false;
    }
}

function submitForm(event) {
    event.preventDefault();
    console.log("فرم در حال ارسال است...");

    // ... (کد جمع‌آوری داده‌ها مثل قبل باقی می‌ماند)
    const formData = {
        projectName: document.getElementById('projectName').value,
        requestDate: document.getElementById('requestDate').value,
        hasInvoice: document.getElementById('invoiceQuestion').value,
        description: document.getElementById('description').value,
        items: [],
        totalPrice: 0
    };

    let grandTotal = 0;
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    if (rows.length === 0) {
        alert('لطفاً حداقل یک کالا به لیست اضافه کنید.');
        console.warn("ارسال متوقف شد: هیچ آیتمی در جدول وجود ندارد.");
        return;
    }
    
    rows.forEach(row => {
        const itemName = row.querySelector('input[name="itemName"]').value;
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const total = quantity * price;
        grandTotal += total;
        formData.items.push({ name: itemName, quantity, price, total });
    });
    formData.totalPrice = grandTotal;

    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'در حال ارسال...';
    
    const n8nWebhookURL = 'https://mref1365.darkube.app/webhook-test/Buy';
    console.log('ارسال داده به آدرس:', n8nWebhookURL);
    console.log('محتوای ارسالی:', JSON.stringify(formData, null, 2));

    fetch(n8nWebhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log("پاسخ اولیه از سرور دریافت شد.", response);
        if (!response.ok) {
            throw new Error(`خطای شبکه: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('پاسخ موفقیت‌آمیز از n8n:', data);
        alert("درخواست شما با موفقیت ثبت شد.");
        Eitaa.jsSDK.closeApp();
    })
    .catch((error) => {
        console.error('خطای بسیار مهم در ارسال به n8n:', error);
        alert(`خطا در ارسال درخواست. لطفاً جزئیات خطا را بررسی کنید: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'ثبت و ارسال درخواست';
    });
}
