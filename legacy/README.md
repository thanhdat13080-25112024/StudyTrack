# Hãy nhấn vào link và trải nghiệm ngay hệ thống hỗ trợ học tập trên web mà không cần cài đặt công cụ hỗ trợ nào nha !

https://studytrack-mzds.vercel.app/#login

# StudyTrack — Quản Lý Thói Quen Học Tập

Ứng dụng web giúp học sinh, sinh viên quản lý thói quen học tập, đếm ngược Pomodoro, theo dõi lịch sử và thống kê năng suất qua biểu đồ. Giao diện trực quan với hỗ trợ chế độ sáng/tối và song ngữ Việt/Anh, lưu trữ dữ liệu an toàn trên trình duyệt.

## Tính năng

```text
- Quản lý phiên học: Đếm giờ Pomodoro, tùy chỉnh thời gian, mức độ tập trung, phát nhạc nền lofi.
- Dashboard: Thống kê tổng giờ học, chuỗi ngày học (streak), tổng số buổi.
- Thống kê trực quan: Biểu đồ cột (Chart.js) theo dõi thói quen học tập 7 ngày qua.
- Lên lịch: Tạo lịch trình học tập theo từng thứ trong tuần.
- Hồ sơ sinh viên: Quản lý thông tin cá nhân, tự tạo Thẻ sinh viên ảo (Student ID Card).
- Huy hiệu (Badges): Hệ thống thành tựu (Tân binh, Chiến thần, Bậc thầy) khích lệ học tập.
- Đa ngôn ngữ: Chuyển đổi mượt mà giữa Tiếng Việt / Tiếng Anh.
- Giao diện: Chế độ Sáng / Tối linh hoạt, tích hợp hiệu ứng pháo hoa (Canvas Confetti) khi hoàn thành mục tiêu.
- Xác thực: Đăng ký / Đăng nhập lưu trạng thái phiên người dùng qua Local Storage.

```

## Yêu cầu

```text
- Trình duyệt web hiện đại (Chrome 90+, Safari 14+, Firefox 88+, Edge)
- Bật tính năng Local Storage trên trình duyệt
- Kết nối Internet (để tải thư viện Chart.js, Confetti và Font chữ Poppins)

```

## Cấu trúc dự án

```text
Project/
  index.html              Toàn bộ cấu trúc UI, logic xử lý và style (Single-file Component)
    ├── <style>           Khởi tạo biến theme (CSS Variables), layout sidebar, responsive
    ├── <body>            Dashboard, Form Profile, Timer, Music Player, Login/Register
    └── <script>          Xử lý sự kiện, đa ngôn ngữ, LocalStorage DB, logic biểu đồ

```

## Build & Run

```bash
# Clone repository
git clone https://github.com/yourusername/studytrack.git

# Hoặc tải file .zip và giải nén trực tiếp

# Mở trực tiếp trên trình duyệt
open index.html

# Hoặc chạy bằng Live Server (VS Code Extension)
# Click chuột phải vào file index.html -> Chọn "Open with Live Server"

```
