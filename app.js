// فایل: app.js

// منتظر می‌مانیم تا کل محتوای صفحه بارگذاری شود
document.addEventListener('DOMContentLoaded', () => {
    // مقداردهی اولیه تاریخ و رویدادها
    initializeForm();

    // اتصال رویدادها به دکمه‌ها و فیلدها
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);
    document.getElementById('purchaseForm').addEventListener('submit', submitForm);
    document.getElementById('invoiceQuestion').addEventListener('change', toggleInvoiceUpload);
    document.querySelector('#itemsTable tbody').addEventListener('input', handleTableInput);
});

function initializeForm() {
    // تنظیم تاریخ جاری شمسی
    const today = new Date();
    const jalaliDate = today.toLocaleDateString('fa-IR-u-nu-latn').replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3');
    document.getElementById('requestDate').value = jalaliDate;

    // دریافت و تنظیم کد پروژه از پارامترهای URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectCode = urlParams.get('project_code') || 'تعریف نشده';
    document.getElementById('projectName').value = projectCode;

    // اطمینان از مخفی بودن فیلد آپلود فایل در ابتدا
    toggleInvoiceUpload();
}

function addItemRow() {
    const tableBody = document.querySelector('#itemsTable tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" name="itemName" class="form-control" required></td>
        <td><input type="number" name="quantity" class="form-control quantity" min="1" value="1" required></td>
        <td><input type="number" name="price" class="form-control price" min="0" value="0" required></td>
        <td class="total-price">0</td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item-btn">حذف</button></td>
    `;
    tableBody.appendChild(newRow);

    // افزودن رویداد برای دکمه حذف جدید
    newRow.querySelector('.remove-item-btn').addEventListener('click', (e) => {
        e.target.closest('tr').remove();
        updateGrandTotal();
    });
}

function handleTableInput(event) {
    if (event.target.classList.contains('quantity') || event.target.classList.contains('price')) {
        const row = event.target.closest('tr');
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const totalPrice = quantity * price;
        row.querySelector('.total-price').textContent = totalPrice.toLocaleString('fa-IR');
        updateGrandTotal();
    }
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
    if (invoiceQuestion === 'yes') {
        fileUploadDiv.style.display = 'block';
        document.getElementById('invoiceFile').setAttribute('required', 'true');
    } else {
        fileUploadDiv.style.display = 'none';
        document.getElementById('invoiceFile').removeAttribute('required');
    }
}

function submitForm(event) {
    event.preventDefault();

    // جمع‌آوری داده‌های اصلی فرم
    const formData = {
        projectName: document.getElementById('projectName').value,
        requestDate: document.getElementById('requestDate').value,
        hasInvoice: document.getElementById('invoiceQuestion').value,
        description: document.getElementById('description').value,
        items: [],
        totalPrice: 0
    };

    // جمع‌آوری آیتم‌های جدول
    let grandTotal = 0;
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    if (rows.length === 0) {
        alert('لطفاً حداقل یک کالا به لیست اضافه کنید.');
        return;
    }
    
    rows.forEach(row => {
        const itemName = row.querySelector('input[name="itemName"]').value;
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const total = quantity * price;
        grandTotal += total;
        formData.items.push({
            name: itemName,
            quantity: quantity,
            price: price,
            total: total
        });
    });

    formData.totalPrice = grandTotal;

    // غیرفعال کردن دکمه برای جلوگیری از ارسال مجدد
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'در حال ارسال...';
    
    // آدرس وبهوک تستی شما که از n8n کپی شده است
    const n8nWebhookURL = 'https://mref1365.darkube.app/webhook-test/Buy'; // <--- این خط اصلاح شد

    // توجه: ارسال فایل از طریق JSON ممکن نیست.
    // در این مرحله، ما فقط داده‌های متنی را ارسال می‌کنیم.
    // مدیریت آپلود فایل نیاز به روش‌های دیگری (مثل multipart/form-data) دارد که n8n آن را پشتیبانی می‌کند.
    // فعلا برای سادگی، فرض می‌کنیم فقط داده‌های JSON را می‌فرستیم.
    console.log('داده‌های ارسالی به n8n:', JSON.stringify(formData, null, 2));

    fetch(n8nWebhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('پاسخ شبکه ناموفق بود. Status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('پاسخ موفقیت‌آمیز از n8n:', data);
        // ارسال پیام موفقیت به ربات و بستن برنامک
        Eitaa.jsSDK.sendData("درخواست خرید با موفقیت ثبت و برای n8n ارسال شد.");
        Eitaa.jsSDK.closeApp();
    })
    .catch((error) => {
        console.error('خطا در ارسال به n8n:', error);
        alert('خطا در ارسال درخواست: ' + error.message);
        // فعال کردن مجدد دکمه در صورت خطا
        submitButton.disabled = false;
        submitButton.textContent = 'ثبت و ارسال درخواست';
    });
}
