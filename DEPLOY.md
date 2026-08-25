# Deploy NEXUS

## API trên Render

Tạo Blueprint từ `render.yaml`, sau đó điền các biến được đánh dấu `sync: false`.
`TELEGRAM_ALLOWED_USER_IDS` là Telegram numeric user ID, nhiều ID được phân cách bằng dấu phẩy.
Google Calendar phải dùng `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và
`GOOGLE_REFRESH_TOKEN`; không tải `credentials.json` hoặc `token.json` lên hosting.

## Web trên Vercel

Đặt Root Directory là `apps/web` và cấu hình:

- `NEXUS_API_URL`: URL API Render, ví dụ `https://nexus-api.onrender.com`
- `NEXUS_API_KEY`: cùng giá trị với API
- `NEXUS_SESSION_SECRET`: chuỗi ngẫu nhiên dài, khác API key
- `NEXUS_OWNER_PASSWORD`: mật khẩu đăng nhập dashboard

Sau khi có URL Vercel, cập nhật `CORS_ORIGINS` trên Render thành URL đó.

## Cài NEXUS như ứng dụng PWA

PWA chỉ cài được khi Web chạy qua HTTPS (Vercel cung cấp HTTPS mặc định).

- Android/Chrome: mở NEXUS và chọn **Cài ứng dụng**.
- iPhone/iPad/Safari: chọn **Chia sẻ → Thêm vào Màn hình chính**.
- Localhost hỗ trợ service worker để phát triển, nhưng nên kiểm tra cài đặt cuối cùng
  trên URL HTTPS đã deploy.

Service worker hiện không cache dashboard hoặc API để tránh lưu dữ liệu tài chính
nhạy cảm và tránh hiển thị số liệu cũ khi offline. Push notification sẽ là milestone riêng.

Render Free có thể ngủ khi không có HTTP traffic. Vì Telegram hiện dùng long polling,
bot và lịch nhắc sẽ tạm dừng trong thời gian service ngủ; cấu hình lookback giúp gửi bù
nhắc việc sau khi service thức lại nhưng không biến Free tier thành dịch vụ 24/7 thực sự.
