# StudyTrack 📚

**StudyTrack là người bạn đồng hành giúp bạn học tập trung hơn và quản lý việc học ở đại học dễ dàng hơn.**

Ứng dụng gộp hai việc thường phải dùng nhiều app rời rạc vào một chỗ:

1. **Tạo thói quen học tốt** — hẹn giờ tập trung kiểu Pomodoro, nghe nhạc lofi, theo dõi số ngày học liên tục và nhận huy hiệu khích lệ.
2. **Quản lý chuyện học vụ** — nhập điểm, tự tính GPA/CPA và xếp loại, theo dõi tiến độ tín chỉ, và lên lộ trình các môn cần học.

Ứng dụng **song ngữ Việt / Anh** và có **giao diện sáng / tối** lấy cảm hứng từ phong cách "giấy tĩnh" của Notion — gọn gàng, ấm mắt, mặc định là **giao diện sáng**.

> 🔗 Bản xem trước: <https://study-track-orpin.vercel.app/> — vào xem trực tiếp **không cần đăng nhập**, duyệt mọi trang với **dữ liệu minh hoạ** (bản preview chưa có backend thật). Bản đầy đủ (đăng nhập, dữ liệu thật) sẽ chạy trên VPS.

---

## StudyTrack dành cho ai?

- **Học sinh, sinh viên** muốn học tập trung hơn và bớt trì hoãn.
- **Sinh viên đại học** cần theo dõi điểm số, GPA, tín chỉ và lên kế hoạch các môn còn phải học theo môn tiên quyết.
- Bất kỳ ai thích một góc học tập gọn gàng, có theo dõi tiến bộ và nhắc nhở.

## Bạn làm được gì với StudyTrack?

### ⏱️ Học tập trung
- **Bộ hẹn giờ tập trung** (Pomodoro / Deep Work / Active Recall): chọn môn, đặt số phút rồi bắt đầu. Có **trình phát nhạc lofi dạng playlist** (bài trước/sau, phát ngẫu nhiên không lặp, nhớ bài + âm lượng); muốn thêm nhạc chỉ cần thả file `.mp3` vào `frontend/src/assets/music/` — tên file tự thành tên bài.
- Khi học xong, ứng dụng **tự lưu lại phiên học** và bắn pháo giấy chúc mừng 🎉.
- **Gợi ý thông minh** nhắc bạn điều chỉnh thời lượng/độ tập trung cho hợp lý.

### 📈 Theo dõi thói quen
- **Trang tổng quan (Dashboard)**: số phút học hôm nay, tổng thời gian, số buổi, và **chuỗi ngày học liên tục (streak)**.
- **Biểu đồ 7 ngày** để thấy mình đang đều đặn tới đâu.
- **Huy hiệu thành tích** mở khóa khi bạn học đủ nhiều.
- **Lịch học tuần** và **lịch sử** các buổi đã học.

### 🎓 Quản lý học vụ
- **Nhập điểm theo môn và học kỳ**, ứng dụng tự đổi sang **điểm chữ và hệ 4** (chuẩn đại học Việt Nam).
- Tự tính **GPA từng kỳ** và **CPA tích lũy**, **xếp loại** (Xuất sắc / Giỏi / Khá / Trung bình / Yếu) và **tiến độ tín chỉ** (đã đạt / đang học / còn lại).
- **"Nếu tôi muốn đạt GPA mục tiêu thì sao?"** — công cụ *what-if* tính giúp bạn **điểm trung bình cần đạt** ở các tín chỉ còn lại, và cho thử các kịch bản điểm giả định.

### 🗺️ Lộ trình & phân tích
- **Lộ trình học**: khai báo môn nào cần học trước môn nào (môn tiên quyết), ứng dụng **tự sắp các môn còn lại vào từng kỳ** sao cho hợp lý và không vượt trần tín chỉ mỗi kỳ.
- **Cảnh báo môn yếu**: tự đánh dấu (đỏ/vàng) những môn điểm thấp, học ít giờ, hoặc còn thiếu môn tiên quyết.
- **Phân tích thế mạnh**: nhóm điểm theo loại môn để thấy bạn mạnh ở mảng nào, cảnh báo kỳ học quá tải.
- Có thể **gắn mỗi phiên học tập trung với một môn cụ thể** để biết mình dành bao nhiêu thời gian cho từng môn.

### 🔔 Hạn chót & nhắc nhở (mới)
- **Quản lý hạn chót**: lưu các deadline (bài tập / lịch thi / đồ án), đặt mức ưu tiên, gắn với môn học, và đánh dấu việc nào sắp tới hạn hay đã trễ.
- **Nhắc nhở đúng lúc**: chọn nhắc trước bao lâu (1 giờ, 3 giờ, 1 ngày, 3 ngày, 1 tuần), tới giờ ứng dụng **tự bật thông báo ngay trên màn hình** mà không cần bấm tải lại trang.
- **Chuông thông báo**: một chiếc chuông luôn hiện số thông báo chưa đọc — nhắc deadline và cả lúc bạn vừa mở khóa một huy hiệu mới.

### 👤 Hồ sơ cá nhân
- Hồ sơ sinh viên (lớp, khoa, ngành, MSSV, mục tiêu, ảnh đại diện) và **thẻ sinh viên ảo** đẹp mắt.
- **4 giao diện thẻ** chọn được ngay dưới thẻ (StudyTrack indigo, VJU trắng-đen, VJU đỏ, VNU xanh — theo logo trường) và lưu vào tài khoản, đổi máy vẫn giữ.
- **Đổi/xem ảnh đại diện kiểu Facebook**: bấm thẳng vào avatar trên thẻ → "Xem ảnh đại diện" (phóng to) hoặc "Chọn ảnh đại diện" (đổi ảnh, lưu ngay).

### 🎨 Giao diện kiểu Notion (mới)
- **Thanh điều hướng bên (sidebar)**: trên máy tính là một thanh cố định bên trái, trên điện thoại là ngăn kéo trượt ra (có thể đóng bằng Esc); thay cho thanh tiêu đề trên cùng kiểu cũ.
- **Hai giao diện "giấy tĩnh"**: nền giấy ấm cho chế độ **sáng** và tông indigo "đêm" cho chế độ **tối**, dùng font **Inter**; mặc định mở lên là giao diện sáng.
- **Bảng lệnh ⌘K**: nhấn **⌘K** (hoặc Ctrl+K) để mở ô tìm nhanh, gõ vài chữ là nhảy thẳng tới trang hay thực hiện hành động.
- **Phím tắt toàn cục**: đi nhanh giữa các trang bằng tổ hợp **g** (ví dụ g rồi d về dashboard), **n** tạo mới, **t** đổi giao diện, **l** đổi ngôn ngữ, **?** mở bảng tra cứu phím tắt.
- **Chuyển động mượt** (GSAP) và **tự tắt khi bạn bật "giảm chuyển động"** trong hệ điều hành.

### 🔐 Tài khoản & bảo mật (mới)
- **Xác thực email**: khi đăng ký, ứng dụng gửi email kèm liên kết xác thực. Tài khoản chưa xác thực vẫn dùng được (cổng mềm), nhưng có **banner nhắc xác thực** kèm nút **gửi lại email**.
- **Quên mật khẩu / đặt lại mật khẩu**: nhập email để nhận liên kết đặt lại; mở liên kết là đặt được mật khẩu mới (liên kết dùng một lần, có hạn).
- **Trang Cài đặt (`/settings`)**: **đổi mật khẩu**, **xuất toàn bộ dữ liệu** của bạn ra một file JSON, và **xoá tài khoản vĩnh viễn** (xoá luôn mọi dữ liệu liên quan).
- Các endpoint đăng nhập/đăng ký/quên mật khẩu có **giới hạn tần suất** để chống lạm dụng.

### 📊 Phân tích học tập (mới)
- **Trang phân tích**: nhìn lại thói quen học qua **bản đồ nhiệt cả năm** (ngày nào học nhiều/ít), **thời gian theo từng phương pháp và từng môn**, và **xu hướng độ tập trung** theo thời gian.
- **So sánh tuần / tháng**: tuần (hoặc tháng) này bạn học nhiều hơn hay ít hơn kỳ trước bao nhiêu phần trăm.
- **Điểm năng suất (0–100)**: một con số tổng hợp gói gọn mức độ đều đặn, khối lượng và chất lượng tập trung trong 7 ngày gần nhất.
- **Khung giờ vàng**: biểu đồ phân bố theo giờ giúp bạn biết mình học hiệu quả nhất vào lúc nào trong ngày.

## Tính năng đã có & sắp tới

| Nhóm tính năng | Trạng thái |
|----------------|------------|
| Đăng ký / đăng nhập, hồ sơ + thẻ sinh viên ảo | ✅ Đã có |
| Hẹn giờ tập trung, lịch sử, streak, huy hiệu, lịch tuần, dashboard | ✅ Đã có |
| Nhập điểm, GPA/CPA, xếp loại, tiến độ tín chỉ, what-if GPA | ✅ Đã có |
| Lộ trình học theo môn tiên quyết, cảnh báo môn yếu, phân tích thế mạnh | ✅ Đã có |
| Quản lý deadline / lịch thi + nhắc nhở theo thời gian thực + chuông thông báo | ✅ Đã có |
| Tài khoản: xác thực email, quên/đặt lại & đổi mật khẩu, xuất dữ liệu, xoá tài khoản | ✅ Đã có |
| Phân tích học tập: bản đồ nhiệt, thời gian theo phương pháp/môn, điểm năng suất, so sánh tuần/tháng | ✅ Đã có |
| Giao diện kiểu Notion: sidebar, hai theme sáng/tối, bảng lệnh ⌘K, phím tắt toàn cục | ✅ Đã có |
| Trợ lý AI tư vấn chọn môn & lộ trình | ⏳ Sắp tới |

## Dùng thử nhanh

Sau khi cài đặt (xem hướng dẫn cho lập trình viên bên dưới) và nạp dữ liệu mẫu, đăng nhập bằng **tài khoản demo**:

- **Email:** `demo@studytrack.app`
- **Mật khẩu:** `studytrack`

Tài khoản này đã có sẵn vài phiên học, điểm số, môn học và lộ trình mẫu để bạn xem ngay được mọi tính năng.

## Dành cho lập trình viên 👩‍💻

StudyTrack là một ứng dụng full-stack thật (React + FastAPI + PostgreSQL), đang được xây dựng lại từ bản single-file ban đầu. Toàn bộ hướng dẫn kỹ thuật — kiến trúc, cách chạy môi trường dev, danh sách API từng phase, mô hình dữ liệu, biến môi trường và quy trình Git/deploy — nằm ở:

👉 **[`docs/DEVELOPERS.md`](docs/DEVELOPERS.md)**

Tóm tắt nhanh để chạy thử ở máy (cần Docker, Python 3.12+, Node 20+):

```bash
cp .env.example .env   # tạo file cấu hình
make db-up             # bật cơ sở dữ liệu (Postgres) cho dev
make dev               # chạy backend + frontend cùng lúc
make seed              # (tùy chọn) nạp dữ liệu demo
```

## Ghi chú

- Bản app cũ (single-file `index.html`) nằm trong thư mục **`legacy/`** và vẫn chạy độc lập được (`python3 -m http.server 8000` rồi mở `legacy/index.html`); xem `legacy/README.md`.
- Dự án được phát triển với sự hỗ trợ của Claude Code. Cấu hình trợ lý AI (file hướng dẫn `CLAUDE.md` và bộ harness `.claude/`) được giữ **cục bộ trên máy dev, không commit lên repo** để GitHub chỉ chứa mã nguồn sản phẩm.
