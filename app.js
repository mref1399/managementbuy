// منتظر بارگذاری کامل صفحه
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM بارگذاری شد");

    // یافتن عناصر
    const addItemBtn = document.getElementById('addItemBtn');
    const purchaseForm = document.getElementById('purchaseForm');
    const invoiceRadios = document.querySelectorAll('input[name="hasInvoice"]');
    const itemsTableBody = document.querySelector('#itemsTable tbody');

    // بررسی وجود عناصر
    if (!addItemBtn || !purchaseForm || !itemsTableBody) {
        console.error("❌ عناصر اصلی پیدا نشد!");
        alert("خطا در بارگذاری فرم");
        return;
    }

    // مقداردهی اولیه
    initializeForm();
    
    // بارگذاری داده‌های قبلی (اگر وجود دارد)
    loadSavedData();

    // اتصال رویدادها
    addItemBtn.addEventListener('click', addItemRow);
    purchaseForm.addEventListener('submit', submitForm);
    invoiceRadios.forEach(radio => {
        radio.addEventListener('change', toggleInvoiceUpload);
    });
    itemsTableBody.addEventListener('input', handleTableInput);

    console.log("✅ رویدادها متصل شدند");
});

function initializeForm() {
    try {
        // تنظیم تاریخ شمسی
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const jalaliDate = formatter.format(today).replace(/\u200F/g, '');
        document.getElementById('requestDate').value = jalaliDate;
        console.log("✅ تاریخ شمسی تنظیم شد:", jalaliDate);

        // مخفی کردن فیلد آپلود فاکتور
        toggleInvoiceUpload();
    } catch(e) {
        console.error("❌ خطا در مقداردهی اولیه:", e);
        document.getElementById('requestDate').value = "1404/08/12";
    }
}

// ذخیره خودکار داده‌ها
function autoSaveData() {
    try {
        const rows = document.querySelectorAll('#itemsTable tbody tr');
        const items = [];
        
        rows.forEach(row => {
            const itemName = row.querySelector('input[name="itemName"]').value.trim();
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const price = parseFloat(row.querySelector('.price').value) || 0;
            
            if (itemName) {
                items.push({ name: itemName, quantity, price });
            }
        });

        const formData = {
            projectName: document.getElementById('projectName').value.trim(),
            requestDate: document.getElementById('requestDate').value,
            hasInvoice: document.querySelector('input[name="hasInvoice"]:checked').value,
            description: document.getElementById('description').value.trim(),
            items: items,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('purchaseRequest', JSON.stringify(formData));
        console.log("💾 داده‌ها ذخیره شدند");
    } catch(e) {
        console.error("❌ خطا در ذخیره خودکار:", e);
    }
}

// بارگذاری داده‌های ذخیره شده
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('purchaseRequest');
        if (!savedData) return;

        const data = JSON.parse(savedData);
        console.log("📂 بارگذاری داده‌های قبلی:", data);

        // بازیابی فیلدها
        if (data.projectName) document.getElementById('projectName').value = data.projectName;
        if (data.description) document.getElementById('description').value = data.description;
        
        // بازیابی وضعیت فاکتور
        const invoiceRadio = document.querySelector(`input[name="hasInvoice"][value="${data.hasInvoice}"]`);
        if (invoiceRadio) invoiceRadio.checked = true;
        toggleInvoiceUpload();

        // بازیابی آیتم‌ها
        if (data.items && data.items.length > 0) {
            const tableBody = document.querySelector('#itemsTable tbody');
            tableBody.innerHTML = '';
            
            data.items.forEach(item => {
                const newRow = tableBody.insertRow();
                newRow.innerHTML = `
                    <td><input type="text" name="itemName" class="form-control" required value="${item.name}"></td>
                    <td><input type="number" name="quantity" class="form-control quantity" min="1" value="${item.quantity}" required></td>
                    <td><input type="number" name="price" class="form-control price" min="0" value="${item.price}" required></td>
                    <td class="total-price">${(item.quantity * item.price).toLocaleString('fa-IR')}</td>
                    <td><button type="button" class="btn btn-danger btn-sm remove-item-btn">حذف</button></td>
                `;

                newRow.querySelector('.remove-item-btn').addEventListener('click', (e) => {
                    e.target.closest('tr').remove();
                    updateGrandTotal();
                    autoSaveData();
                });
            });

            updateGrandTotal();
        }
    } catch(e) {
        console.error("❌ خطا در بارگذاری داده‌ها:", e);
    }
}

function addItemRow() {
    console.log("➕ افزودن ردیف جدید");
    const tableBody = document.querySelector('#itemsTable tbody');
    const newRow = tableBody.insertRow();
    newRow.innerHTML = `
        <td><input type="text" name="itemName" class="form-control" required placeholder="نام کالا یا خدمات"></td>
        <td><input type="number" name="quantity" class="form-control quantity" min="1" value="1" required></td>
        <td><input type="number" name="price" class="form-control price" min="0" value="0" required></td>
        <td class="total-price">0</td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item-btn">حذف</button></td>
    `;

    newRow.querySelector('.remove-item-btn').addEventListener('click', (e) => {
        e.target.closest('tr').remove();
        updateGrandTotal();
        autoSaveData();
        console.log("🗑️ ردیف حذف شد");
    });

    updateRowTotal(newRow);
    autoSaveData();
}

function handleTableInput(event) {
    if (event.target.classList.contains('quantity') || event.target.classList.contains('price')) {
        const row = event.target.closest('tr');
        updateRowTotal(row);
        autoSaveData();
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
    const hasInvoice = document.querySelector('input[name="hasInvoice"]:checked').value;
    const fileUploadDiv = document.getElementById('fileUploadDiv');
    const fileInput = document.getElementById('invoiceFile');
    
    if (hasInvoice === 'yes') {
        fileUploadDiv.classList.remove('hidden');
        fileInput.required = true;
    } else {
        fileUploadDiv.classList.add('hidden');
        fileInput.required = false;
    }
    autoSaveData();
}

function submitForm(event) {
    event.preventDefault();
    console.log("📝 ثبت درخواست خرید");

    // بررسی وجود آیتم
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    if (rows.length === 0) {
        alert('⚠️ لطفاً حداقل یک کالا اضافه کنید');
        return;
    }

    // جمع‌آوری داده‌ها
    const hasInvoice = document.querySelector('input[name="hasInvoice"]:checked').value;
    let grandTotal = 0;
    const items = [];

    rows.forEach(row => {
        const itemName = row.querySelector('input[name="itemName"]').value.trim();
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const total = quantity * price;
        grandTotal += total;

        items.push({
            name: itemName,
            quantity: quantity,
            price: price,
            total: total
        });
    });

    const formData = {
        projectName: document.getElementById('projectName').value.trim(),
        requestDate: document.getElementById('requestDate').value,
        hasInvoice: hasInvoice,
        description: document.getElementById('description').value.trim(),
        items: items,
        totalPrice: grandTotal,
        status: 'pending',
        submittedAt: new Date().toISOString()
    };

    // ذخیره نهایی در localStorage با کلید منحصربفرد
    const requestId = 'REQ_' + Date.now();
    
    try {
        // ذخیره درخواست فعلی
        localStorage.setItem(requestId, JSON.stringify(formData));
        
        // به‌روزرسانی لیست درخواست‌ها
        let allRequests = JSON.parse(localStorage.getItem('allPurchaseRequests') || '[]');
        allRequests.push({
            id: requestId,
            projectName: formData.projectName,
            totalPrice: formData.totalPrice,
            date: formData.requestDate,
            submittedAt: formData.submittedAt,
            status: 'pending'
        });
        localStorage.setItem('allPurchaseRequests', JSON.stringify(allRequests));

        // پاک کردن ذخیره موقت
        localStorage.removeItem('purchaseRequest');

        console.log("✅ درخواست با موفقیت ذخیره شد:", requestId);
        console.log("📊 داده‌های ذخیره شده:", formData);

        // نمایش پیام موفقیت با جزئیات
        const message = `
✅ درخواست با موفقیت ثبت شد!

🆔 شماره درخواست: ${requestId}
📋 پروژه: ${formData.projectName}
💰 مبلغ کل: ${grandTotal.toLocaleString('fa-IR')} ریال
📅 تاریخ: ${formData.requestDate}

درخواست شما در حالت انتظار قرار گرفت و پس از تأیید، فرآیند خرید انجام خواهد شد.
        `;
        
        alert(message);

        // بستن برنامک ایتا
        if (typeof Eitaa !== 'undefined' && Eitaa.jsSDK) {
            setTimeout(() => {
                Eitaa.jsSDK.closeApp();
            }, 2000);
        }

    } catch(e) {
        console.error("❌ خطا در ذخیره درخواست:", e);
        alert("❌ خطا در ذخیره‌سازی. لطفاً مجدداً تلاش کنید.");
    }
}

// ذخیره خودکار هنگام تغییر فیلدها
document.addEventListener('change', (e) => {
    if (e.target.closest('#purchaseForm')) {
        autoSaveData();
    }
});
