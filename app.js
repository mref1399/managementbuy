document.addEventListener('DOMContentLoaded', function () {
    // مقداردهی اولیه SDK ایتا
    eitaa.init({
        onReady: () => console.log('Eitaa SDK is ready.'),
        onError: (err) => console.error('Eitaa SDK init error:', err)
    });

    // --- گرفتن ارجاع به عناصر HTML ---
    const addItemBtn = document.getElementById('addItemBtn');
    const tableBody = document.getElementById('purchaseTableBody');
    const grandTotalSpan = document.getElementById('grandTotal');
    const submitBtn = document.getElementById('submitBtn');
    const closeBtn = document.getElementById('closeBtn');
    const currentDateSpan = document.getElementById('currentDate');
    const projectCodeInput = document.getElementById('projectCode');
    
    // عناصر جدید مربوط به فاکتور
    const invoiceYesRadio = document.getElementById('invoiceYes');
    const invoiceNoRadio = document.getElementById('invoiceNo');
    const fileUploadWrapper = document.getElementById('fileUploadWrapper');
    const invoiceFileInput = document.getElementById('invoiceFile');

    // 1. تنظیم تاریخ شمسی روز جاری
    currentDateSpan.textContent = new Date().toLocaleDateString('fa-IR-u-nu-latn');

    // --- مدیریت رویدادها ---

    // 2. رویداد کلیک برای افزودن سطر جدید (مشکل حل شده)
    addItemBtn.addEventListener('click', function () {
        console.log("Add Item button clicked!"); // برای اشکال‌زدایی
        const newRow = tableBody.insertRow();
        newRow.innerHTML = `
            <td><input type="text" class="item-title" placeholder="نام کالا"></td>
            <td><input type="number" class="item-quantity" value="1" min="1"></td>
            <td><input type="number" class="item-unit-price" placeholder="0"></td>
            <td class="row-total">۰</td>
            <td><button class="delete-btn">✖</button></td>
        `;
    });

    // 3. رویداد برای جدول (حذف سطر و محاسبه قیمت)
    tableBody.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) {
            e.target.closest('tr').remove();
            updateGrandTotal();
        }
    });
    tableBody.addEventListener('input', function (e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-unit-price')) {
            updateRowTotal(e.target.closest('tr'));
        }
    });

    // 4. رویدادهای جدید برای دکمه‌های رادیویی فاکتور
    invoiceYesRadio.addEventListener('change', function () {
        if (this.checked) {
            fileUploadWrapper.classList.remove('hidden');
        }
    });
    invoiceNoRadio.addEventListener('change', function () {
        if (this.checked) {
            fileUploadWrapper.classList.add('hidden');
        }
    });

    // 5. رویداد کلیک برای "ثبت درخواست" (با منطق جدید فاکتور)
    submitBtn.addEventListener('click', function () {
        // اعتبارسنجی اولیه
        if (!projectCodeInput.value.trim()) {
            alert('لطفاً کد پروژه را وارد کنید.');
            projectCodeInput.focus();
            return;
        }

        // جمع‌آوری اطلاعات اقلام
        const items = [];
        tableBody.querySelectorAll('tr').forEach(row => {
            const title = row.querySelector('.item-title').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
            if (title && quantity > 0 && unitPrice > 0) {
                items.push({ title, quantity, unitPrice, totalPrice: quantity * unitPrice });
            }
        });

        if (items.length === 0) {
            alert('حداقل یک قلم کالا با مشخصات کامل وارد کنید.');
            return;
        }
        
        // اعتبارسنجی بخش فاکتور
        const hasInvoice = invoiceYesRadio.checked;
        const invoiceFile = invoiceFileInput.files[0];

        if (hasInvoice && !invoiceFile) {
            alert('شما گزینه "فاکتور دارد" را انتخاب کرده‌اید، لطفاً فایل فاکتور را بارگذاری کنید.');
            return;
        }

        // ساخت آبجکت نهایی داده‌ها
        const purchaseData = {
            projectCode: projectCodeInput.value.trim(),
            date: currentDateSpan.textContent,
            grandTotal: parseFloat(grandTotalSpan.textContent.replace(/٬/g, '')),
            items: items,
            invoiceInfo: {
                hasInvoice: hasInvoice,
                // اگر فایلی وجود داشته باشد، اطلاعات آن را ذخیره می‌کنیم
                fileName: hasInvoice && invoiceFile ? invoiceFile.name : null,
                fileSize: hasInvoice && invoiceFile ? invoiceFile.size : null,
                fileType: hasInvoice && invoiceFile ? invoiceFile.type : null
            }
        };

        // نمایش داده نهایی در کنسول
        console.log('--- داده‌های نهایی برای ارسال به سرور ---');
        console.log(JSON.stringify(purchaseData, null, 2));
        if (hasInvoice && invoiceFile) {
            console.log('فایل فاکتور انتخاب شده:', invoiceFile);
            // در یک پروژه واقعی، شما باید `purchaseData` و `invoiceFile` را با استفاده از FormData به سرور ارسال کنید.
        }

        alert('درخواست با موفقیت آماده شد! (برای مشاهده جزئیات، کنسول مرورگر را باز کنید)');
    });

    // 6. رویداد کلیک برای بستن برنامک
    closeBtn.addEventListener('click', () => eitaa.close());

    // --- توابع کمکی ---
    function updateRowTotal(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
        const totalCell = row.querySelector('.row-total');
        totalCell.textContent = (quantity * unitPrice).toLocaleString('fa-IR');
        updateGrandTotal();
    }

    function updateGrandTotal() {
        let total = 0;
        tableBody.querySelectorAll('tr').forEach(row => {
            const rowTotalValue = parseFloat(row.querySelector('.row-total').textContent.replace(/٬/g, '')) || 0;
            total += rowTotalValue;
        });
        grandTotalSpan.textContent = total.toLocaleString('fa-IR');
    }
});
