# 🎵 NK-MusicStream - Music Streaming Platform

NK-MusicStream là một nền tảng phát nhạc trực tuyến (Spotify Clone), được thiết kế để mang lại trải nghiệm nghe nhạc mượt mà cho người dùng, đồng thời cung cấp một cho các Nghệ sĩ phát hành tác phẩm quản lý cập nhật nhạc của mình.
<img width="1867" height="887" alt="Screenshot 2026-05-28 195343" src="https://github.com/user-attachments/assets/f2ebe4e4-e065-41f8-b8df-d175109f3c22" />

## Các chức năng chính

- **Bảo mật & Tài khoản:** Đăng nhập / Đăng ký sử dụng bảo mật JWT (Bearer Token). Xác thực tài khoản qua Email OTP tự động. Phân quyền chặt chẽ: Listener (Người nghe), Artist (Nghệ sĩ) và Admin.
- **Trình phát nhạc cốt lõi:** Trải nghiệm nghe nhạc liền mạch không gián đoạn khi chuyển trang. Hỗ trợ phát nhạc, quản lý danh sách chờ, xem lời bài hát.

- **Artist Portal (Dành cho Nghệ sĩ):** Không gian làm việc riêng biệt để tạo Release (Single/EP/Album). Hỗ trợ upload ảnh bìa, tệp âm thanh gốc, quản lý danh sách bài hát (Draft), thay đổi thứ tự và Submit chờ Admin xét duyệt.

- **Admin Dashboard:** Khu vực dành riêng cho quản trị viên để kiểm duyệt nhạc. Admin có thể duyệt (Approve) hoặc từ chối (Reject) các Release kèm theo lý do chi tiết trả về cho Nghệ sĩ.

- **Premium Subscription:** Tích hợp cổng thanh toán Stripe, cho phép người dùng nâng cấp lên tài khoản Premium để trải nghiệm các tính năng đặc quyền.

- **Lưu trữ & Bảo mật:** Tích hợp Cloudflare R2 (chuẩn S3) để lưu trữ tệp đa phương tiện. Tích hợp Redis để xử lý dữ liệu và hệ thống gửi mail tự động.

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" alt="Django REST" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

## Giao diện ứng dụng

### Trang Home & Khám phá Âm nhạc &  Trình phát nhạc toàn cục (Global Player)
<img width="1919" height="868" alt="Screenshot 2026-05-28 195137" src="https://github.com/user-attachments/assets/c77805aa-0aa4-4109-8790-cc20251066cf" />
<img width="1919" height="870" alt="Screenshot 2026-05-28 195231" src="https://github.com/user-attachments/assets/3e7febed-bd27-41c2-9663-be4e3d20eb84" />
### Artist Portal - Quản lý Release & Upload Track

### Admin Dashboard - Kiểm duyệt Âm nhạc
#### Dashboard
<img width="1919" height="869" alt="Screenshot 2026-05-28 195442" src="https://github.com/user-attachments/assets/4945ed4b-a872-4bca-a43e-b661089b48f0" />
#### Duyệt nhạc
<img width="1919" height="868" alt="Screenshot 2026-05-28 195506" src="https://github.com/user-attachments/assets/01ea2f43-235f-4b5c-b883-744a47dfd02a" />
#### Quản lý Nhạc
<img width="1918" height="866" alt="Screenshot 2026-05-28 195556" src="https://github.com/user-attachments/assets/0c250183-65ac-45c1-a2f5-d34af2f1d4b5" />
#### Quản lý Nghệ sĩ
<img width="1919" height="869" alt="Screenshot 2026-05-28 195644" src="https://github.com/user-attachments/assets/ec956bfb-0c8b-43e7-adcf-8a923f819d47" />
#### Quản lý Thể loại
<img width="1919" height="869" alt="Screenshot 2026-05-28 195701" src="https://github.com/user-attachments/assets/0b49741b-9e40-440a-9b21-083af12c0f5b" />
#### Quản lý User
<img width="1919" height="868" alt="Screenshot 2026-05-28 195743" src="https://github.com/user-attachments/assets/51709e4c-0da7-4e2d-a5cd-dda911248093" />
#### Quản lý Staff
<img width="1919" height="873" alt="Screenshot 2026-05-28 195834" src="https://github.com/user-attachments/assets/5b22e075-118f-454d-89b1-73669e4164b2" />
<img width="1917" height="870" alt="Screenshot 2026-05-28 195858" src="https://github.com/user-attachments/assets/af6db404-652c-406e-8b3d-2d57f9c9c500" />
## Hướng dẫn cài đặt

Repository này chứa cả mã nguồn Frontend (React/Vite) và Backend (Django REST Framework). Để chạy dự án trên máy local, bạn cần thiết lập lần lượt Backend rồi mới đến Frontend.

### Lưu ý: Yêu cầu hệ thống:

- Node.js & npm
- Python 3.10+
- Cơ sở dữ liệu PostgreSQL và Redis đã được cài đặt và chạy ngầm dưới local.
- Tài khoản Cloudflare R2 (hoặc AWS S3), Stripe và Brevo/Resend để cấu hình biến môi trường.

### Cài đặt Backend (Django)

1. Clone repository này về máy:

```bash
   git clone https://github.com/Male29003/spotify-clone
```

2. Mở terminal, di chuyển vào thư mục backend và tạo môi trường ảo (Virtual Environment):

```bash
   python -m venv venv
   # Kích hoạt venv (Windows)
   venv\Scripts\activate
   # Kích hoạt venv (Mac/Linux)
   source venv/bin/activate
```

3. Cài đặt các thư viện cần thiết:

```bash
   pip install -r requirements.txt
```

4. Tạo file .env ở thư mục gốc của backend và cấu hình các thông số cốt lõi (DB, Redis, S3, Email, Stripe):

```bash
DEBUG=True
SECRET_KEY=chuoi-secret-key-cua-ban
MUSIC_ENCRYPTION_KEY=chuoi-ma-hoa-nhac-cua-ban
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:3000
ALLOWED_HOSTS=127.0.0.1,localhost

DB_USER=postgres
DB_PASSWORD=your-db-password
DB_NAME=spotify_clone
DB_HOST=localhost
DB_PORT=5432

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_ENDPOINT_URL=https://[account-id].r2.cloudflarestorage.com
AWS_S3_CUSTOM_DOMAIN=your_custom_domain.r2.dev

BREVO_API_KEY=your_brevo_api_key
DEFAULT_FROM_EMAIL=your_email@gmail.com
```

5. Khởi tạo Database và chạy server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Cài đặt Frontend (React)

6. Mở terminal mới và di chuyển vào thư mục frontend:

```bash
cd frontend
```

7. Cài đặt các thư viện (node_modules):

```bash
npm install
```

8. Tạo file .env trong thư mục frontend và cấu hình đường dẫn gọi API:

```code snippet
VITE_API_URL=http://localhost:8000/api/v1
```

8. Khởi chạy giao diện Frontend:

```bash
npm run dev
```

# 📫 Thông tin liên hệ

Nếu bạn có bất kỳ thắc mắc nào về dự án, cần trao đổi về technical stack hoặc gặp khó khăn khi cài đặt, vui lòng liên hệ với tôi qua email: namnguyen23009@gmail.com (hoặc nam23009@gmail.com).
