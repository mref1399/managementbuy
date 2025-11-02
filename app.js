// مرحله ۱: این پیام باید بلافاصله پس از بارگذاری کامل صفحه نمایش داده شود.
// اگر این پیام را می‌بینید، یعنی فایل app.js با موفقیت بارگذاری و اجرا شده است.
alert('فایل app.js با موفقیت بارگذاری و اجرا شد!');

// مرحله ۲: تمام کدها داخل این رویداد قرار می‌گیرند.
// این تضمین می‌کند که کد فقط پس از آماده شدن کامل ساختار صفحه (DOM) اجرا شود.
document.addEventListener('DOMContentLoaded', function () {
    
    // از try-catch برای گرفتن هرگونه خطای غیرمنتظره در حین اجرا استفاده می‌کنیم.
    try {

        // --- مقداردهی اولیه SDK ایتا (در صورت وجود) ---
        try {
            eitaa.init({ onReady: () => console.log('Eitaa SDK is ready.') });
        } catch (e) {
            console.warn('Eitaa SDK not found. Running in browser mode.');
            // این خطا طبیعی است اگر فایل را مستقیماً در مرورگر باز کنید.
        }

        // --- گرفتن تمام عناصر مورد نیاز از صفحه ---
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
        
        // اگر هر یک از عناصر اصلی پیدا نشوند، یک خطا نمایش بده تا مشکل سریع مشخص شود.
        if (!addItemBtn || !tableBody) {
            alert('خطای بحرانی: عناصر اصلی صفحه (دکمه افزودن یا جدول) پیدا نشدند!');
            return;
        }

        // --- توابع اصلی برنامه ---

        // محاسبه قیمت کل یک سطر
        function updateRowTotal(row) {
            const quantityInput = row.querySelector('.item-quantity');
            const unitPriceInput = row.querySelector('.item-unit-price');
            const rowTotalCell = row.querySelector('.row-total');
            
            const quantity = parseFloat(quantityInput.value) || 0;
            const unitPrice = parseFloat(unitPriceInput.value) || 0;
            
            rowTotalCell.textContent = (quantity * unitPrice).toLocaleString('fa-IR');
            updateGrandTotal();
        }

        // محاسبه و نمایش جمع کل فاکتور
        function updateGrandTotal() {
            let total = 0;
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const rowTotalText = row.querySelector('.row-total').textContent;
                total += parseFloat(rowTotalText.replace(/٬/g, '')) || 0;
            });
            grandTotalSpan.textContent = total.toLocaleString('fa-IR');
        }

        // افزودن یک سطر جدید و خالی به جدول
        function addNewItemRow() {
            const newRow = tableBody.insertRow(); // افزودن سطر جدید به انتهای tbody
            newRow.innerHTML = `
                <td><input type="text" class="item-title" placeholder="نام کالا"></td>
                <td><input type="number" class="item-quantity" value="1" min="1"></td>
                <td><input type="number" class="item-unit-price" placeholder="0"></td>
                <td class="row-total">۰</td>
                <td><button class="delete-btn">✖</button></td>
            `;

            // رویدادها را برای این سطر جدید متصل می‌کنیم
            const inputs = newRow.querySelectorAll('.item-quantity, .item-unit-price');
            inputs.forEach(input => {
                input.addEventListener('input', () => updateRowTotal(newRow));
            });

            const deleteBtn = newRow.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (tableBody.rows.length > 1) {
                    newRow.remove();
                    updateGrandTotal();
                } else {
                    alert('این آخرین سطر است و نمی‌توان آن را حذف کرد.');
                }
            });
        }
        
        // نمایش یا پنهان کردن بخش آپلود فایل بر اساس انتخاب کاربر
        function handleInvoiceRadioChange() {
            if (invoiceYesRadio.checked) {
                fileUploadWrapper.classList.remove('hidden');
            } else {
                fileUploadWrapper.classList.add('hidden');
            }
        }


        // --- اتصال رویدادها به عناصر ---

        // کلیک روی دکمه "افزودن قلم جدید"
        addItemBtn.addEventListener('click', addNewItemRow);

        // تغییر در رادیوباتن‌های فاکتور رسمی
        invoiceYesRadio.addEventListener('change', handleInvoiceRadioChange);
        invoiceNoRadio.addEventListener('change', handleInvoiceRadioChange);

        // بستن برنامک
        closeBtn.addEventListener('click', () => {
            try { eitaa.close(); } catch (e) { console.warn('eitaa.close() failed.'); alert('در حالت مرورگر، این دکمه کار نمی‌کند.'); }
        });
        
        // ثبت نهایی فرم (فعلاً فقط داده‌ها را در کنسول نمایش می‌دهد)
        submitBtn.addEventListener('click', () => {
            alert('اطلاعات فرم برای ارسال آماده است. (برای مشاهده به کنسول مرورگر مراجعه کنید)');
            // منطق ارسال داده به سرور در اینجا قرار می‌گیرد
        });


        // --- اجرای اولیه برنامه ---
        function initializeApp() {
            // تنظیم تاریخ امروز به فرمت شمسی
            currentDateSpan.textContent = new Date().toLocaleDateString('fa-IR-u-nu-latn');
            
            // افزودن یک سطر اولیه برای شروع کار
            addNewItemRow();
        }
        
        // فراخوانی تابع اصلی برای راه‌اندازی برنامه
        initializeApp();

    } catch (error) {
        // اگر هر خطای غیرمنتظره‌ای در کد رخ دهد، با یک پیام واضح نمایش داده می‌شود.
        alert('یک خطای اساسی در اجرای کد رخ داد: \n' + error.message);
        console.error("Error details:", error);
    }
});
