// این رویداد تضمین می‌کند که کد جاوااسکریپت پس از بارگذاری کامل ساختار HTML اجرا شود.
// با انتقال اسکریپت به انتهای بادی، این رویداد دیگر الزامی نیست اما نگه داشتن آن یک عادت خوب است.
document.addEventListener('DOMContentLoaded', function () {
    
    // مقداردهی اولیه SDK ایتا
    try {
        eitaa.init({
            onReady: () => console.log('Eitaa SDK is ready.'),
            onError: (err) => console.error('Eitaa SDK init error:', err)
        });
    } catch (e) {
        console.warn('Eitaa SDK not found. Running in browser mode.');
    }


    // --- گرفتن ارجاع به عناصر HTML ---
    const addItemBtn = document.getElementById('addItemBtn');
    const tableBody = document.getElementById('purchaseTableBody');
    const grandTotalSpan = document.getElementById('grandTotal');
    const submitBtn = document.getElementById('submitBtn');
    const closeBtn = document.getElementById('closeBtn');
    const currentDateSpan = document.getElementById('currentDate');
    const projectCodeInput = document.getElementById('projectCode');
    const invoiceYesRadio = document.getElementById('invoiceYes');
    const invoiceNoRadio = document.getElementById('invoiceNo');
    const fileUploadWrapper = document.getElementById('fileUploadWrapper');
    const invoiceFileInput = document.getElementById('invoiceFile');

    // --- توابع اولیه ---
    function initializeApp() {
        // 1. تنظیم تاریخ شمسی روز جاری (اکنون به درستی کار می‌کند)
        try {
            currentDateSpan.textContent = new Date().toLocaleDateString('fa-IR-u-nu-latn');
        } catch(e) {
            console.error("Error setting date:", e);
            currentDateSpan.textContent = "خطا در تاریخ";
        }

        // 2. اضافه کردن یک سطر خالی به صورت پیش‌فرض برای راحتی کاربر
        addNewItemRow();
    }
    
    function addNewItemRow() {
        console.log("Adding a new item row..."); // برای اشکال‌زدایی
        const newRow = tableBody.insertRow();
        newRow.innerHTML = `
            <td><input type="text" class="item-title" placeholder="نام کالا"></td>
            <td><input type="number" class="item-quantity" value="1" min="1"></td>
            <td><input type="number" class="item-unit-price" placeholder="0"></td>
            <td class="row-total">۰</td>
            <td><button class="delete-btn">✖</button></td>
        `;
    }

    // --- مدیریت رویدادها ---

    // 3. رویداد کلیک برای افزودن سطر جدید (اکنون به درستی کار می‌کند)
    addItemBtn.addEventListener('click', addNewItemRow);

    // 4. رویداد برای جدول (حذف سطر و محاسبه قیمت)
    tableBody.addEventListener('input', function (e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-unit-price')) {
            updateRowTotal(e.target.closest('tr'));
        }
    });

    tableBody.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) {
            // اگر فقط یک سطر باقی مانده باشد، آن را حذف نکن، فقط خالی کن
            if (tableBody.rows.length > 1) {
                e.target.closest('tr').remove();
            } else {
                alert('برای حذف آخرین سطر، از دکمه "انصراف" استفاده کنید.');
            }
            updateGrandTotal();
        }
    });

    // 5. رویدادهای دکمه‌های رادیویی فاکتور
    invoiceYesRadio.addEventListener('change', () => fileUploadWrapper.classList.remove('hidden'));
    invoiceNoRadio.addEventListener('change', () => fileUploadWrapper.classList.add('hidden'));

    // 6. رویداد کلیک برای "ثبت درخواست"
    submitBtn.addEventListener('click', function () {
        if (!projectCodeInput.value.trim()) {
            alert('لطفاً کد پروژه را وارد کنید.');
            projectCodeInput.focus();
            return;
        }

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
        
        const hasInvoice = invoiceYesRadio.checked;
        const invoiceFile = invoiceFileInput.files[0];
        if (hasInvoice && !invoiceFile) {
            alert('شما گزینه "فاکتور دارد" را انتخاب کرده‌اید، لطفاً فایل فاکتور را بارگذاری کنید.');
            return;
        }

        const purchaseData = {
            projectCode: projectCodeInput.value.trim(),
            date: currentDateSpan.textContent,
            grandTotal: parseFloat(grandTotalSpan.textContent.replace(/٬/g, '')),
            items: items,
            invoiceInfo: {
                hasInvoice: hasInvoice,
                fileName: hasInvoice && invoiceFile ? invoiceFile.name : null,
                fileSize: hasInvoice && invoiceFile ? invoiceFile.size : null,
                fileType: hasInvoice && invoiceFile ? invoiceFile.type : null
            }
        };

        console.log('--- داده‌های نهایی برای ارسال به سرور ---');
        console.log(JSON.stringify(purchaseData, null, 2));
        if (hasInvoice && invoiceFile) {
            console.log('فایل فاکتور انتخاب شده:', invoiceFile);
        }

        alert('درخواست با موفقیت آماده شد! (برای مشاهده جزئیات، کنسول مرورگر را باز کنید)');
    });

    // 7. رویداد کلیک برای بستن برنامک
    closeBtn.addEventListener('click', () => {
        try {
            eitaa.close();
        } catch (e) {
            console.warn('Could not close. eitaa.close() not found.');
            alert('در حالت مرورگر، این دکمه برنامک را می‌بندد.');
        }
    });

    // --- توابع کمکی ---
    function updateRowTotal(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
        row.querySelector('.row-total').textContent = (quantity * unitPrice).toLocaleString('fa-IR');
        updateGrandTotal();
    }

    function updateGrandTotal() {
        let total = 0;
        tableBody.querySelectorAll('tr').forEach(row => {
            total += parseFloat(row.querySelector('.row-total').textContent.replace(/٬/g, '')) || 0;
        });
        grandTotalSpan.textContent = total.toLocaleString('fa-IR');
    }

    // --- شروع برنامه ---
    initializeApp();
});
