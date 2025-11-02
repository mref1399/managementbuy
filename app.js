document.addEventListener('DOMContentLoaded', function () {
    // مقداردهی اولیه SDK ایتا (اختیاری برای این فرم، اما روش استاندارد است)
    eitaa.init({
        onReady: () => console.log('Eitaa SDK is ready.'),
        onError: (err) => console.error('Eitaa SDK init error:', err)
    });

    // گرفتن ارجاع به عناصر HTML
    const projectCodeInput = document.getElementById('projectCode');
    const currentDateSpan = document.getElementById('currentDate');
    const addItemBtn = document.getElementById('addItemBtn');
    const tableBody = document.getElementById('purchaseTableBody');
    const grandTotalSpan = document.getElementById('grandTotal');
    const submitBtn = document.getElementById('submitBtn');
    const closeBtn = document.getElementById('closeBtn');

    // 1. تنظیم تاریخ شمسی روز جاری
    // از API استاندارد مرورگر برای نمایش تاریخ شمسی استفاده می‌کنیم.
    currentDateSpan.textContent = new Date().toLocaleDateString('fa-IR-u-nu-latn');

    // 2. رویداد کلیک برای افزودن سطر جدید به جدول
    addItemBtn.addEventListener('click', function () {
        const newRow = tableBody.insertRow(); // یک <tr> جدید ایجاد می‌کند

        newRow.innerHTML = `
            <td><input type="text" class="item-title" placeholder="نام کالا"></td>
            <td><input type="number" class="item-quantity" value="1" min="1"></td>
            <td><input type="number" class="item-unit-price" placeholder="0"></td>
            <td class="row-total">۰</td>
            <td><button class="delete-btn">✖</button></td>
        `;
    });

    // 3. استفاده از Event Delegation برای مدیریت رویدادهای داخل جدول
    tableBody.addEventListener('input', function (e) {
        // این رویداد زمانی اجرا می‌شود که کاربر در یکی از input های تعداد یا قیمت تایپ کند
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-unit-price')) {
            const row = e.target.closest('tr'); // پیدا کردن سطر والدِ input
            updateRowTotal(row);
        }
    });

    tableBody.addEventListener('click', function (e) {
        // این رویداد زمانی اجرا می‌شود که روی دکمه حذف کلیک شود
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            row.remove(); // حذف سطر از جدول
            updateGrandTotal(); // به‌روزرسانی جمع کل
        }
    });

    // 4. تابع برای محاسبه قیمت کل یک سطر
    function updateRowTotal(row) {
        const quantityInput = row.querySelector('.item-quantity');
        const priceInput = row.querySelector('.item-unit-price');
        const totalCell = row.querySelector('.row-total');

        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(priceInput.value) || 0;

        const rowTotal = quantity * unitPrice;
        totalCell.textContent = rowTotal.toLocaleString('fa-IR'); // نمایش با جداکننده هزارگان فارسی
        
        updateGrandTotal(); // پس از هر تغییر، جمع کل را به‌روز کن
    }

    // 5. تابع برای محاسبه جمع کل فاکتور
    function updateGrandTotal() {
        let total = 0;
        const allRows = tableBody.querySelectorAll('tr');
        
        allRows.forEach(row => {
            const totalCell = row.querySelector('.row-total');
            // تبدیل عدد فارسی با جداکننده به عدد انگلیسی برای محاسبه
            const rowTotalValue = parseFloat(totalCell.textContent.replace(/٬/g, '')) || 0;
            total += rowTotalValue;
        });

        grandTotalSpan.textContent = total.toLocaleString('fa-IR');
    }

    // 6. رویداد کلیک برای دکمه "ثبت درخواست"
    submitBtn.addEventListener('click', function () {
        if (!projectCodeInput.value) {
            alert('لطفاً کد پروژه را وارد کنید.');
            return;
        }

        const items = [];
        const allRows = tableBody.querySelectorAll('tr');

        allRows.forEach(row => {
            const title = row.querySelector('.item-title').value;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;

            if (title && quantity > 0 && unitPrice > 0) {
                items.push({
                    title: title,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    totalPrice: quantity * unitPrice
                });
            }
        });

        if (items.length === 0) {
            alert('حداقل یک قلم کالا با مشخصات کامل وارد کنید.');
            return;
        }

        const purchaseData = {
            projectCode: projectCodeInput.value,
            date: currentDateSpan.textContent,
            grandTotal: parseFloat(grandTotalSpan.textContent.replace(/٬/g, '')),
            items: items
        };

        // نمایش داده نهایی در کنسول (در یک پروژه واقعی، این داده به سرور ارسال می‌شود)
        console.log('داده‌های نهایی برای ارسال به سرور:');
        console.log(JSON.stringify(purchaseData, null, 2));

        alert('درخواست شما با موفقیت آماده شد! (داده‌ها در کنسول نمایش داده شده‌اند)');
        
        // در صورت تمایل می‌توانید پس از ثبت، برنامک را ببندید
        // eitaa.close();
    });

    // 7. رویداد کلیک برای بستن برنامک
    closeBtn.addEventListener('click', function () {
        eitaa.close();
    });
});
