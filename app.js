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
        // تنظیم تاریخ شمسی با moment-jalaali
        const jalaliDate = moment().format('jYYYY/jMM/jDD');
        document.getElementById('requestDate').value = jalaliDate;
        console.log("✅ تاریخ شمسی تنظیم شد:", jalaliDate);

        // مخفی کردن فیلد آپلود فاکتور
        toggleInvoiceUpload();
    } catch(e) {
        console.error("❌ خطا در مقداردهی اولیه:", e);
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

    // رویداد حذف
    newRow.querySelector('.remove-item-btn').addEventListener('click', (e) => {
        e.target.closest('tr').remove();
        updateGrandTotal();
        console.log("🗑️ ردیف حذف شد");
    });

    // محاسبه اولیه
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
}

function submitForm(event) {
    event.preventDefault();
    console.log("📤 شروع ارسال فرم");

    // بررسی اتصال اینترنت
    if (!navigator.onLine) {
        alert('⚠️ اتصال اینترنت خود را بررسی کنید');
        return;
    }

    // جمع‌آوری داده‌ها
    const hasInvoice = document.querySelector('input[name="hasInvoice"]:checked').value;
    
    const formData = {
        projectName: document.getElementById('projectName').value.trim(),
        requestDate: document.getElementById('requestDate').value,
        hasInvoice: hasInvoice,
        description: document.getElementById('description').value.trim(),
        items: [],
        totalPrice: 0
    };

    // بررسی وجود آیتم
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    if (rows.length === 0) {
        alert('⚠️ لطفاً حداقل یک کالا اضافه کنید');
        return;
    }

    // جمع‌آوری آیتم‌ها
    let grandTotal = 0;
    rows.forEach(row => {
        const itemName = row.querySelector('input[name="itemName"]').value.trim();
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const total = quantity * price;
        grandTotal += total;
        formData.items.push({ 
            name: itemName, 
            quantity, 
            price, 
            total 
        });
    });
    formData.totalPrice = grandTotal;

    // غیرفعال کردن دکمه
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'در حال ارسال...';

    // آدرس webhook
    const n8nWebhookURL = 'https://mref1365.darkube.app/webhook-test/Buy';
    
    console.log('🔵 ارسال به:', n8nWebhookURL);
    console.log('🔵 داده‌ها:', JSON.stringify(formData, null, 2));

    // ارسال با timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    fetch(n8nWebhookURL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
        mode: 'cors'
    })
    .then(response => {
        clearTimeout(timeoutId);
        console.log('✅ پاسخ دریافت شد - وضعیت:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('❌ پاسخ خطا:', text);
                throw new Error(`خطای سرور: ${response.status}`);
            });
        }
        
        return response.text().then(text => {
            console.log('✅ پاسخ خام:', text);
            return text ? JSON.parse(text) : {};
        });
    })
    .then(data => {
        console.log('✅ موفقیت:', data);
        alert("✅ درخواست با موفقیت ثبت شد!");
        
        // بستن برنامک ایتا
        if (typeof Eitaa !== 'undefined' && Eitaa.jsSDK) {
            setTimeout(() => {
                Eitaa.jsSDK.closeApp();
            }, 1500);
        }
    })
    .catch((error) => {
        clearTimeout(timeoutId);
        console.error('❌ خطا:', error);
        
        let errorMessage = '❌ خطا در ارسال:\n';
        
        if (error.name === 'AbortError') {
            errorMessage += 'زمان انتظار تمام شد';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'مشکل در اتصال به سرور\n';
            errorMessage += 'لطفاً:\n';
            errorMessage += '• اتصال اینترنت را بررسی کنید\n';
            errorMessage += '• با پشتیبانی تماس بگیرید';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'ثبت و ارسال درخواست';
    });
}
