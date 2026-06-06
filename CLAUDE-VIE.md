# CLAUDE-VIE.md

Tệp này cung cấp hướng dẫn cho Claude Code (claude.ai/code) khi làm việc với mã nguồn trong kho lưu trữ này.

StudyTrack là một ứng dụng quản lý thói quen học tập trên một trang duy nhất (bộ đếm giờ Pomodoro, bảng điều khiển, lập lịch hàng tuần, huy hiệu thành tích, thẻ sinh viên ảo). Ứng dụng hỗ trợ song ngữ (Tiếng Việt/Tiếng Anh) với các giao diện sáng/tối, được triển khai tại https://studytrack-mzds.vercel.app/.

## Khởi chạy

Không có bước xây dựng (build) hay trình quản lý gói nào — đây là ứng dụng HTML/CSS/JS thuần túy tải Chart.js và Canvas Confetti từ các CDN (yêu cầu internet). Hãy khởi chạy qua HTTP thay vì `file://` để `dom.mp3` và các tài nguyên có thể tải được:

```bash
python3 -m http.server 8000   # hoặc: npx serve .
```

Không có thiết lập kiểm thử (test) hay kiểm lỗi (lint).

## Kiến trúc

**Tất cả mọi thứ đều nằm trong `index.html`** như một thành phần tệp đơn có chủ đích — tất cả các phần `<style>`, đánh dấu (markup), và logic `<script>` đều được đặt nội tuyến. `main.css` và `main.js` tồn tại nhưng được để trống một cách cố ý; đừng chuyển mã nguồn vào đó trừ khi có yêu cầu cấu trúc lại (refactor) một cách rõ ràng. `dom.mp3` là âm thanh lofi cho phiên tập trung.

Ứng dụng là một tập hợp các thẻ div `content-section` được chuyển đổi qua hàm `navigateTo()` (không sử dụng bộ định tuyến - router). Trạng thái được giữ trong các biến cấp mô-đun (`isLoggedIn`, `currentUser`) và được phản chiếu vào `localStorage` thông qua hàm `saveState()`.

### Lưu trữ dữ liệu — tất cả các khóa đều bắt đầu bằng `track_`
- `track_isLoggedIn` — kiểu boolean
- `track_currentUser` — JSON của người dùng đang hoạt động (nhật ký học tập, lịch trình, hồ sơ, huy hiệu đều được lồng ở đây)
- `track_userDatabase` — mảng chứa tất cả người dùng đã đăng ký; lưu các thay đổi thông qua `updateUserInDatabase()`
- `track_theme` (`light`/`dark`), `track_lang` (`vi`/`en`)

Việc xác thực chỉ diễn ra cục bộ (không có backend); việc đăng ký/đăng nhập chỉ đọc/ghi vào `track_userDatabase`.

## Các quy ước cần giữ vững

- **Đa ngôn ngữ (Localization):** tất cả các chuỗi ký tự hiển thị cho người dùng đều đến từ từ điển `langData`. Khi thêm văn bản giao diện, hãy thêm cả mục nhập `vi` và `en` và dựa vào `applyLanguagePack()` để hiển thị — tuyệt đối không viết cứng (hardcode) các chuỗi hiển thị.
- **Giao diện (Theming):** màu sắc là các biến CSS nằm trong `:root`; chuyển đổi giao diện bằng cách đặt thuộc tính `data-theme` trên thẻ `<body>`, không chỉnh sửa các quy tắc CSS trực tiếp.
- **Bảng điều khiển/Chuỗi ngày/Huy hiệu (Dashboard/streak/badges)** được tính toán lại từ dữ liệu của `currentUser` thông qua `updateUIAndDashboard()`, `updateStreakLogic()`, và `updateBadgeUI()` — hãy cập nhật các hàm đó thay vì ghi trực tiếp các giá trị vào bảng điều khiển.

## Ghi chú

- `GEMINI.md` / `GEMINI-VIE.md` là các tệp hướng dẫn AI tương tự bao quát cùng một dự án; hãy giữ chúng nhất quán khi bạn thay đổi các quy ước ở đây.
- `README.md` được viết bằng tiếng Việt.

## Đặc tả Hệ thống (từ tài liệu UML — thiết kế mục tiêu)

> Dưới đây là đặc tả chính thức được rút ra từ tài liệu UML của dự án. Nó mô tả **kiến trúc dự kiến/mục tiêu**, khác với những gì hiện đang được triển khai (ứng dụng hiện tại là SPA sử dụng JS thuần + `localStorage`, không phải Flask/MySQL). Hãy sử dụng nó làm nguồn thông tin tin cậy khi xây dựng backend, sơ đồ DB, hoặc cấu trúc lại theo mô hình client-server.

### Kiến trúc mục tiêu (Client-Server)
- **Frontend:** SPA — HTML5, **Tailwind CSS**, JS ES6 thuần, Chart.js.
- **Backend:** Python 3, **Flask**, **SQLAlchemy ORM**, **Flask-Login**.
- **Database:** MySQL (sản xuất) / LocalStorage (mô phỏng & đồng bộ phía client).

### Sơ đồ quan hệ (ER)
- **User** — `email` (PK, duy nhất), `pass` (đã băm), `name`, `streak` (số nguyên, mặc định 0)
- **Profile** (1–1 với User) — `user_email` (FK→User.email), `class`, `major`, `goal` (tất cả mặc định `''`), `avatarData` (Dữ liệu hình ảnh Base64)
- **Log** (1–N với User) — `id` (PK, tự tăng), `user_email` (FK), `subject`, `duration` (phút thực tế), `plannedDuration` (phút dự kiến), `focus` (1–10), `method` (Pomodoro / Deep Work / Active Recall), `note`, `date` (`DD/MM/YYYY`)
- **Schedule** (1–N với User) — `id` (PK, tự tăng), `user_email` (FK), `day` (Thứ 2 → Chủ nhật), `time` (`HH:MM SA/CH`), `subject`

### Các lớp miền (UML)
- **NguoiDung (User):** id, hoTen, email, matKhau, lopKhoa, nganhHoc, mucTieuDaiHan, anhDaiDien, ngonNgu, cheDoManHinh. Phương thức: dangKy, dangNhap, dangXuat, capNhatHoSo, thayDoiNgonNgu, chinhCheDoMH.
- **PhienHoc (StudySession):** id, monHoc, thoiGianDinhHoc, mucDoTapTrung, phuongPhap, ghiChu, thoiGianBatDau, thoiGianKetThuc, thoiGianThucHoc. Phương thức: kichHoat, tamDung, luuVaKetThuc, demGio.
- **LichHoc (Schedule):** id, thu, thoiGianBatDau, monHoc. Phương thức: lenLich, suaLich, xoaLich.
- **Dashboard:** nguoiDungId, gioHocHomNay, streakNgay, tongSoBuoi. Phương thức: tinhStreak, tinhGioHocHomNay, layLichTuan, layBieuDo7Ngay.
- **LichSu (History):** id, monHoc, thoiGianThucHoc, phuongPhap, mucDoTapTrung, ghiChu, ngayHoc. Phương thức: xemLichSu, locTheoMon.
- **ThanhTuu (Achievement):** id, ten, moTa, dieuKien, nguongGio, icon. Phương thức: kiemTraDieuKien, capHuyHieu.
- **AmNhac (Music):** id, ten, url. Phương thức: phat, tamDung, dieuChinh.

Quan hệ: User 1→0..* StudySession; User 1→0..* Schedule; User 1→1 Dashboard; User 1→0..* Achievement; StudySession 0..*→1 Music (phát); StudySession 1→1 History (lưu vào); Dashboard 1→0..* History (đọc).

### Logic bộ đếm giờ / phiên học
- **Bắt đầu (`triggerManualStart`):** yêu cầu `subject`; xây dựng `currentSession` trong bộ nhớ với `secondsLeft = duration * 60` và `startTime = Date.now()`; chạy một vòng lặp `setInterval` 1 giây để giảm `secondsLeft` và hiển thị lại, gọi `stopCountdown(wasInterrupted=false)` khi nó bằng 0.
- **Tạm dừng:** `clearInterval(timerInterval)` và chuyển giao diện sang `PAUSED`.
- **Dừng / lưu (`stopCountdown`):** tính toán số phút thực tế là `((plannedDuration * 60) - secondsLeft) / 60`, làm tròn. Nếu `> 0`, tạo một Log mới và thêm vào.
