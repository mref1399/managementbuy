// منتظر بارگذاری کامل DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM بارگذاری شد");

    // یافتن عناصر
    const addItemBtn = document.getElementById('addItemBtn');
    const purchaseForm = document.getElementById('purchaseForm');
    const invoiceRadios = document.querySelectorAll('input[name="hasInvoice"]');
    const itemsTableBody = document.querySelector('#itemsTable tbody');

    // بررسی وجود عناصر
    if (!addItemBtn || !purchaseForm || !itemsTableBody) {
        console.error("عناصر اصلی فرم پیدا نشد!");
        return;
    }

    // مقداردهی اولیه
    initializeForm();

    // اتصال رویدادها
    addItemBtn.addEventListener('click', addItemRow);
    purchaseForm.addEventListener('submit', submitForm);
    
    // رویداد تغییر رادیو باتن‌ها
    invoiceRadios.forEach(radio => {
        radio.addEventListener('change', toggleInvoiceUpload);
    });
    
    itemsTableBody.addEventListener('input', handleTableInput);

    // افزودن یک ردیف اولیه
    addItemRow();

    console.log("رویدادها متصل شدند");
});

function initializeForm() {
    try {
        // تنظیم تاریخ شمسی با استفاده از moment-jalaali
        const jalaliDate = moment().format('jYYYY/jMM/jDD');
        document.getElementById('requestDate').value = jalaliDate;
        console.log("تاریخ تنظیم شد:", jalaliDate);

        // دریافت کد پروژه از URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectCode = urlParams.get('project_code') || 'تعریف نشده';
        document.getElementById('projectName').value = projectCode;
        console.log("کد پروژه:", projectCode);

        // مخفی کردن فیلد آپلود
        toggleInvoiceUpload();
    } catch(e) {
        console.error("خطا در مقداردهی اولیه:", e);
    }
}

function addItemRow() {
    console.log("افزودن ردیف جدید");
    const tableBody = document.querySelector('#itemsTable tbody');
    const newRow = tableBody.insertRow();
    
    newRow.innerHTML = `
        <td><input type="text" name="itemName" class="form-control" required></td>
        <td><input type="number" name="quantity" class="form-control quantity" min="1" value="1" required></td>
        <td><input type="number" name="price" class="form-control price" min="0" value="0" required></td>
        <td class="total-price">0</td>
        <td><button type="button" class="btn-danger btn-sm remove-item-btn">حذف</button></td>
    `;

    // رویداد حذف
    const removeBtn = newRow.querySelector('.remove-item-btn');
    removeBtn.addEventListener('click', function() {
        newRow.remove();
        updateGrandTotal();
    });

    // به‌روزرسانی جمع کل
    updateRowTotal(newRow);
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
    const hasInvoiceYes = document.querySelector('input[name="hasInvoice"][value="yes"]').checked;
    const fileUploadDiv = document.getElementById('fileUploadDiv');
    const fileInput = document.getElementById('invoiceFile');
    
    if (hasInvoiceYes) {
        fileUploadDiv.classList.remove('hidden');
        fileInput.required = true;
    } else {
        fileUploadDiv.classList.add('hidden');
        fileInput.required = false;
    }
}

function submitForm(event) {
    event.preventDefault();
    console.log("ارسال فرم...");

    // جمع‌آوری داده‌ها
    const hasInvoice = document.querySelector('input[name="hasInvoice"]:checked').value;
    
    const formData = {
        projectName: document.getElementById('projectName').value,
        requestDate: document.getElementById('requestDate').value,
        hasInvoice: hasInvoice,
        description: document.getElementById('description').value,
        items: [],
        totalPrice: 0
    };

    // بررسی وجود آیتم
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    if (rows.length === 0) {
        alert('لطفاً حداقل یک کالا اضافه کنید.');
        return;
    }

    // جمع‌آوری آیتم‌ها
    let grandTotal = 0;
    rows.forEach(row => {
        const itemName = row.querySelector('input[name="itemName"]').value;
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const total = quantity * price;
        grandTotal += total;
        formData.items.push({ name: itemName, quantity, price, total });
    });
    formData.totalPrice = grandTotal;

    // غیرفعال کردن دکمه
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'در حال ارسال...';

    // ارسال به webhook
    const n8nWebhookURL = 'https://mref1365.darkube.app/webhook-test/Buy';
    console.log('ارسال به:', n8nWebhookURL);
    console.log('داده:', JSON.stringify(formData, null, 2));

    fetch(n8nWebhookURL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log("پاسخ دریافت شد:", response.status);
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }
        return response.text().then(text => {
            return text ? JSON.parse(text) : {};
        });
    })
    .then(data => {
        console.log('پاسخ موفق:', data);
        alert("درخواست با موفقیت ثبت شد.");
        
        // بستن برنامک ایتا (اگر در ایتا باز شده باشد)
        if (typeof Eitaa !== 'undefined' && Eitaa.jsSDK) {
            Eitaa.jsSDK.closeApp();
        }
    })
    .catch((error) => {
        console.error('خطا در ارسال:', error);
        alert(`خطا در ارسال: ${error.message}`);
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'ثبت و ارسال درخواست';
    });
}
