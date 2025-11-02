// تنظیمات مدیران (ID های ایتا)
const MANAGERS = {
    commerce: "@Mrefhh", // ID مدیر بازرگانی
    financial: "@Mrefhh", // ID مدیر مالی
    ceo: "@Mrefhh", // ID مدیرعامل
    accountant: "@Mrefhh" // ID حسابدار/پرداخت‌کننده
};

// منتظر بارگذاری کامل صفحه
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM بارگذاری شد");

    // بررسی نقش کاربر
    checkUserRole();

    // یافتن عناصر
    const addItemBtn = document.getElementById('addItemBtn');
    const purchaseForm = document.getElementById('purchaseForm');
    const invoiceRadios = document.querySelectorAll('input[name="hasInvoice"]');
    const itemsTableBody = document.querySelector('#itemsTable tbody');

    if (!addItemBtn || !purchaseForm || !itemsTableBody) {
        console.error("❌ عناصر اصلی پیدا نشد!");
        alert("خطا در بارگذاری فرم");
        return;
    }

    // مقداردهی اولیه
    initializeForm();
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

// بررسی نقش کاربر
function checkUserRole() {
    if (typeof Eitaa !== 'undefined' && Eitaa.jsSDK) {
        Eitaa.jsSDK.getUserInfo((userInfo) => {
            const userId = userInfo.userId;
            console.log("👤 کاربر فعلی:", userId);
            
            // اگر کاربر یکی از مدیران باشد، لیست درخواست‌های در انتظار را نمایش بده
            if (Object.values(MANAGERS).includes(userId)) {
                showPendingRequests(userId);
            }
        });
    }
}

// نمایش درخواست‌های در انتظار تایید
function showPendingRequests(userId) {
    const allRequests = JSON.parse(localStorage.getItem('allPurchaseRequests') || '[]');
    const pendingRequests = allRequests.filter(req => {
        const requestData = JSON.parse(localStorage.getItem(req.id));
        if (!requestData) return false;
        
        const approval = requestData.approvalStatus;
        
        // بررسی اینکه آیا این مدیر باید این درخواست را تایید کند
        if (userId === MANAGERS.commerce && !approval.commerce.approved) return true;
        if (userId === MANAGERS.financial && approval.commerce.approved && !approval.financial.approved) return true;
        if (userId === MANAGERS.ceo && approval.financial.approved && !approval.ceo.approved) return true;
        if (userId === MANAGERS.accountant && approval.ceo.approved && !approval.payment.paid) return true;
        
        return false;
    });

    if (pendingRequests.length > 0) {
        displayApprovalInterface(pendingRequests, userId);
    }
}

// رابط کاربری تایید
function displayApprovalInterface(requests, userId) {
    const container = document.querySelector('.container');
    const approvalSection = document.createElement('div');
    approvalSection.className = 'approval-section';
    approvalSection.innerHTML = `
        <h2>📋 درخواست‌های در انتظار تایید شما</h2>
        <div id="approvalList"></div>
    `;
    
    container.insertBefore(approvalSection, container.firstChild);
    
    const approvalList = document.getElementById('approvalList');
    
    requests.forEach(req => {
        const requestData = JSON.parse(localStorage.getItem(req.id));
        const requestCard = document.createElement('div');
        requestCard.className = 'approval-card';
        requestCard.innerHTML = `
            <div class="request-header">
                <strong>🆔 ${req.id}</strong>
                <span class="request-date">${req.date}</span>
            </div>
            <p><strong>پروژه:</strong> ${requestData.projectName}</p>
            <p><strong>مبلغ کل:</strong> ${requestData.totalPrice.toLocaleString('fa-IR')} ریال</p>
            <div class="approval-actions">
                <button class="btn-approve" onclick="approveRequest('${req.id}', '${userId}')">✅ تایید</button>
                <button class="btn-reject" onclick="rejectRequest('${req.id}', '${userId}')">❌ رد</button>
                <button class="btn-view" onclick="viewRequestDetails('${req.id}')">👁️ مشاهده جزئیات</button>
            </div>
        `;
        approvalList.appendChild(requestCard);
    });
}

// تایید درخواست
function approveRequest(requestId, userId) {
    const requestData = JSON.parse(localStorage.getItem(requestId));
    const now = new Date().toISOString();
    
    if (userId === MANAGERS.commerce) {
        requestData.approvalStatus.commerce.approved = true;
        requestData.approvalStatus.commerce.date = now;
        alert('✅ درخواست توسط مدیر بازرگانی تایید شد');
    } else if (userId === MANAGERS.financial) {
        requestData.approvalStatus.financial.approved = true;
        requestData.approvalStatus.financial.date = now;
        alert('✅ درخواست توسط مدیر مالی تایید شد');
    } else if (userId === MANAGERS.ceo) {
        requestData.approvalStatus.ceo.approved = true;
        requestData.approvalStatus.ceo.date = now;
        alert('✅ درخواست توسط مدیرعامل تایید شد');
    } else if (userId === MANAGERS.accountant) {
        requestData.approvalStatus.payment.paid = true;
        requestData.approvalStatus.payment.date = now;
        requestData.status = 'completed';
        alert('✅ پرداخت انجام شد - فرآیند کامل شد');
    }
    
    localStorage.setItem(requestId, JSON.stringify(requestData));
    location.reload(); // رفرش صفحه
}

// رد درخواست
function rejectRequest(requestId, userId) {
    const reason = prompt('دلیل رد درخواست را وارد کنید:');
    if (!reason) return;
    
    const requestData = JSON.parse(localStorage.getItem(requestId));
    requestData.status = 'rejected';
    requestData.rejectedBy = userId;
    requestData.rejectionReason = reason;
    requestData.rejectionDate = new Date().toISOString();
    
    localStorage.setItem(requestId, JSON.stringify(requestData));
    alert('❌ درخواست رد شد');
    location.reload();
}

// مشاهده جزئیات
function viewRequestDetails(requestId) {
    const requestData = JSON.parse(localStorage.getItem(requestId));
    
    let itemsHTML = '<table style="width:100%; border-collapse: collapse;">';
    itemsHTML += '<tr><th>نام کالا</th><th>تعداد</th><th>قیمت واحد</th><th>مبلغ کل</th></tr>';
    requestData.items.forEach(item => {
        itemsHTML += `<tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toLocaleString('fa-IR')}</td>
            <td>${item.total.toLocaleString('fa-IR')}</td>
        </tr>`;
    });
    itemsHTML += '</table>';
    
    const approvalHTML = `
        <div style="margin-top: 20px;">
            <h3>وضعیت تایید:</h3>
            <p>✅ مدیر بازرگانی: ${requestData.approvalStatus.commerce.approved ? '✔️ تایید شده' : '⏳ در انتظار'}</p>
            <p>✅ مدیر مالی: ${requestData.approvalStatus.financial.approved ? '✔️ تایید شده' : '⏳ در انتظار'}</p>
            <p>✅ مدیرعامل: ${requestData.approvalStatus.ceo.approved ? '✔️ تایید شده' : '⏳ در انتظار'}</p>
            <p>✅ پرداخت: ${requestData.approvalStatus.payment.paid ? '✔️ انجام شد' : '⏳ در انتظار'}</p>
        </div>
    `;
    
    alert(`
📋 جزئیات درخواست ${requestId}

پروژه: ${requestData.projectName}
تاریخ: ${requestData.requestDate}
مبلغ کل: ${requestData.totalPrice.toLocaleString('fa-IR')} ریال

${itemsHTML}
${approvalHTML}
    `);
}

function initializeForm() {
    try {
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const jalaliDate = formatter.format(today).replace(/\u200F/g, '');
        document.getElementById('requestDate').value = jalaliDate;
        console.log("✅ تاریخ شمسی تنظیم شد:", jalaliDate);

        toggleInvoiceUpload();
    } catch(e) {
        console.error("❌ خطا در مقداردهی اولیه:", e);
        document.getElementById('requestDate').value = "1404/08/12";
    }
}

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
    } catch(e) {
        console.error("❌ خطا در ذخیره خودکار:", e);
    }
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('purchaseRequest');
        if (!savedData) return;

        const data = JSON.parse(savedData);

        if (data.projectName) document.getElementById('projectName').value = data.projectName;
        if (data.description) document.getElementById('description').value = data.description;
        
        const invoiceRadio = document.querySelector(`input[name="hasInvoice"][value="${data.hasInvoice}"]`);
        if (invoiceRadio) invoiceRadio.checked = true;
        toggleInvoiceUpload();

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

    const rows = document.querySelectorAll('#itemsTable tbody tr');
    if (rows.length === 0) {
        alert('⚠️ لطفاً حداقل یک کالا اضافه کنید');
        return;
    }

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

    const requestId = 'REQ_' + Date.now();
    const now = new Date().toISOString();
    
    const formData = {
        projectName: document.getElementById('projectName').value.trim(),
        requestDate: document.getElementById('requestDate').value,
        hasInvoice: hasInvoice,
        description: document.getElementById('description').value.trim(),
        items: items,
        totalPrice: grandTotal,
        status: 'pending',
        submittedAt: now,
        // ساختار تایید چند مرحله‌ای
        approvalStatus: {
            commerce: { approved: false, date: null, approver: MANAGERS.commerce },
            financial: { approved: false, date: null, approver: MANAGERS.financial },
            ceo: { approved: false, date: null, approver: MANAGERS.ceo },
            payment: { paid: false, date: null, paidBy: MANAGERS.accountant }
        }
    };

    try {
        localStorage.setItem(requestId, JSON.stringify(formData));
        
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

        localStorage.removeItem('purchaseRequest');

        console.log("✅ درخواست با موفقیت ذخیره شد:", requestId);

        const message = `
✅ درخواست با موفقیت ثبت شد!

🆔 شماره درخواست: ${requestId}
📋 پروژه: ${formData.projectName}
💰 مبلغ کل: ${grandTotal.toLocaleString('fa-IR')} ریال
📅 تاریخ: ${formData.requestDate}

🔄 مراحل تایید:
1️⃣ مدیر بازرگانی - ⏳ در انتظار
2️⃣ مدیر مالی - ⏳ در انتظار
3️⃣ مدیرعامل - ⏳ در انتظار
4️⃣ پرداخت - ⏳ در انتظار
        `;
        
        alert(message);

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

document.addEventListener('change', (e) => {
    if (e.target.closest('#purchaseForm')) {
        autoSaveData();
    }
});
