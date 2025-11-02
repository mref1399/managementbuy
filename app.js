// این رویداد تضمین می‌کند که کد جاوااسکریپت پس از بارگذاری کامل HTML اجرا شود.
document.addEventListener('DOMContentLoaded', function () {

    // گرفتن ارجاع به عناصر HTML
    const statusDiv = document.getElementById('status');
    const userInfoDiv = document.getElementById('userInfo');
    const getUserBtn = document.getElementById('getUserBtn');
    const closeBtn = document.getElementById('closeBtn');

    const firstNameSpan = document.getElementById('firstName');
    const lastNameSpan = document.getElementById('lastName');
    const usernameSpan = document.getElementById('username');

    // مرحله 1: مقداردهی اولیه SDK
    // این اولین و مهم‌ترین تابعی است که باید فراخوانی شود.
    eitaa.init({
        // هر آپشنی که در آینده اضافه شود اینجا قرار می‌گیرد
        onReady: () => {
            statusDiv.textContent = 'آماده برای دریافت دستورات!';
            statusDiv.className = 'status-info status-success';
            // حالا که SDK آماده است، دکمه را فعال می‌کنیم.
            getUserBtn.disabled = false; 
            console.log('Eitaa JS SDK is ready.');
        },
        onError: (err) => {
            statusDiv.textContent = 'خطا در اتصال به ایتا!';
            statusDiv.className = 'status-info status-error';
            console.error('Eitaa JS SDK initialization failed:', err);
        }
    });

    // مرحله 2: تعریف رویداد برای دکمه "دریافت اطلاعات"
    getUserBtn.addEventListener('click', function () {
        statusDiv.textContent = 'در حال ارسال درخواست به ایتا...';
        statusDiv.className = 'status-info';

        // فراخوانی تابع getMe برای دریافت اطلاعات کاربر
        eitaa.getMe({
            onSuccess: (user) => {
                console.log('User data received:', user);

                // نمایش اطلاعات دریافت شده در صفحه
                firstNameSpan.textContent = user.firstName || 'ثبت نشده';
                lastNameSpan.textContent = user.lastName || 'ثبت نشده';
                usernameSpan.textContent = user.username ? `@${user.username}` : 'ثبت نشده';

                // نمایش کارت اطلاعات و پیام موفقیت
                userInfoDiv.classList.remove('hidden');
                statusDiv.textContent = 'اطلاعات با موفقیت دریافت شد.';
                statusDiv.className = 'status-info status-success';
            },
            onError: (err) => {
                console.error('Failed to get user data:', err);
                statusDiv.textContent = 'خطا: شما اجازه دسترسی را ندادید یا مشکلی رخ داده است.';
                statusDiv.className = 'status-info status-error';
            }
        });
    });

    // مرحله 3: تعریف رویداد برای دکمه "بستن"
    closeBtn.addEventListener('click', function () {
        // فراخوانی تابع close برای بستن پنجره برنامک
        eitaa.close({
            onError: (err) => {
                // این خطا به ندرت رخ می‌دهد اما بررسی آن خوب است.
                console.error('Failed to close the mini app:', err);
                alert('خطا در بستن پنجره!');
            }
        });
    });
});
