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

Ứng dụng là một tập hợp các thẻ div `content-section` (`#dashboard-section`, `#profile-section`, `#study-section`, `#history-section`, `#login-section`) được chuyển đổi bằng **bộ định tuyến dựa trên hash (hash-based router)**:
- `navigateTo(pageId)` chỉ thiết lập `window.location.hash`; nó **không** trực tiếp hiển thị trang.
- `renderSection()` là bộ điều phối thực sự — nó lắng nghe sự kiện `window.addEventListener('hashchange', …)`, ẩn mọi `.content-section`, sau đó hiển thị `#{page}-section` và đánh dấu `#nav-{page}` là đang hoạt động. Nó cũng thực thi xác thực: người dùng chưa đăng nhập bị buộc phải quay về `login`; người dùng đã đăng nhập nếu vào `#login sẽ được chuyển hướng đến `dashboard`. Sau khi định tuyến, nó gọi `updateStreakLogic()` + `updateUIAndDashboard()`.
- Một trang là `{name}` ⇒ cần một thẻ div `#{name}-section` và (tùy chọn) một mục thực đơn `<li>` có id `#nav-{name}`. Không cần bảng đăng ký — quy ước ID chính là cách kết nối.

**Việc kết nối sự kiện được thực hiện nội tuyến `onclick="fn()"` trong mã markup**, không phải `addEventListener`. Để kết nối một nút mới, hãy thêm thuộc tính `onclick` và định nghĩa một hàm cấp cao nhất `function fn()` trong phần `<script>`. Tất cả các hàm xử lý đều là toàn cục vì chúng nằm trong phạm vi script.

Trạng thái được giữ trong các biến cấp mô-đun (`isLoggedIn`, `currentUser`, `userDatabase`, `currentLang`, `currentTheme`, cùng các biến bộ đếm giờ/biểu đồ `countdownInterval`, `totalSecondsLeft`, `initialSecondsPlanned`, `isTimerRunning`, `myChartInstance`) và được phản chiếu vào `localStorage` thông qua `saveState()`.

### Lưu trữ dữ liệu — tất cả các khóa đều bắt đầu bằng `track_`
- `track_isLoggedIn` — kiểu boolean (được ghi bởi `saveState()`)
- `track_currentUser` — JSON của đối tượng người dùng đang hoạt động (được ghi bởi `saveState()`)
- `track_userDatabase` — mảng chứa tất cả người dùng đã đăng ký; lưu các thay đổi thông qua `updateUserInDatabase()`
- `track_theme` (`light`/`dark`, mặc định `dark`), `track_lang` (`vi`/`en`, mặc định `vi`)

**Cấu trúc `currentUser`** (được tạo trong `handleRegister()`):
```js
{ name, email, pass, streak: 0, logs: [], schedules: [],
  profile: { class: '', major: '', goal: '', avatarData: '' } }
```
- `logs[]` — `{ subject, duration, plannedDuration, focus, method, note, date }`. `date` có định dạng `DD/MM/YYYY` thông qua `toLocaleDateString('vi-VN')`; mục mới nhất được đưa lên đầu bằng `unshift`.
- `schedules[]` — `{ day, time, subject }`. `day` là chuỗi ngày tiếng Việt từ mảng `daysOfWeek` (mảng `daysOfWeekEn` dùng để dịch hiển thị).
- `streak` là một con số **được tính toán và lưu trữ**: `updateStreakLogic()` tính toán lại từ các giá trị `logs[].date` duy nhất và ghi lại vào `currentUser`.
- **Huy hiệu KHÔNG được lưu trữ** — `updateBadgeUI(logs)` suy ra chúng mỗi khi render và chỉ bật/tắt lớp CSS `.unlocked` trên `#badge-1/2/3`. Ngưỡng: ≥1 phiên học, ≥5 giờ tổng cộng, ≥20 giờ tổng cộng. Để thêm huy hiệu, hãy thêm mã markup + kiểm tra ngưỡng tại đó.

Việc xác thực chỉ diễn ra cục bộ (không có backend); việc đăng ký/đăng nhập chỉ đọc/ghi vào `track_userDatabase`. **Mật khẩu được lưu trữ dưới dạng văn bản thuần (plaintext)** trong `localStorage` — đây là một bản demo offline có chủ đích, không phải xác thực thực tế cho sản phẩm. Đừng thêm băm mật khẩu/backend trừ khi được yêu cầu rõ ràng (xem đặc tả thiết kế mục tiêu bên dưới để biết về `pass` được băm dự kiến).

## Các quy ước cần giữ vững

- **Đa ngôn ngữ (Localization):** tất cả các chuỗi ký tự hiển thị cho người dùng đều đến từ từ điển `langData`. `applyLanguagePack()` hiển thị bằng cách **gán thủ công từng phần tử một** (`document.getElementById('lbl-x').innerText = p.x`) — nó KHÔNG tự động quét DOM. Vì vậy, một chuỗi mới cần ba chỉnh sửa: (1) thêm khóa dưới cả `langData.vi` và `langData.en`, (2) đặt cho phần tử một `id` cố định, (3) thêm dòng `getElementById(...).innerText = p.key` tương ứng trong `applyLanguagePack()`. Tuyệt đối không viết cứng các chuỗi hiển thị.
  - *Sự không nhất quán đã biết:* một số văn bản hiển thị động (các mục lịch sử trong `updateUIAndDashboard()`, hậu tố "ngày/days" của chuỗi ngày) sử dụng toán tử ba ngôi `currentLang === 'vi' ? … : …` thay vì `langData`. Hãy làm theo `langData` cho mã mới; chỉ sử dụng toán tử ba ngôi khi bạn muốn khớp với mẫu hiện có trong cùng một hàm render.
- **Giao diện (Theming):** màu sắc là các biến CSS nằm trong `:root` (và `[data-theme="light"]`); chuyển đổi giao diện bằng cách đặt thuộc tính `data-theme` trên thẻ `<body>` thông qua `toggleTheme()`, không chỉnh sửa các quy tắc CSS trực tiếp. Biểu đồ Chart.js đọc `currentTheme` để lấy màu sắc, vì vậy khi đổi giao diện cần gọi `initOrUpdateWeeklyChart()` để vẽ lại màu.
- **Bảng điều khiển/Chuỗi ngày/Huy hiệu (Dashboard/streak/badges)** được tính toán lại từ dữ liệu của `currentUser` thông qua `updateUIAndDashboard()`, `updateStreakLogic()`, và `updateBadgeUI()` — hãy cập nhật các hàm đó thay vì ghi trực tiếp các giá trị vào bảng điều khiển.

## Bản đồ các hàm chính

Tất cả nằm trong một khối `<script>` ở cuối tệp `index.html`. Những nơi cần tìm:

| Khu vực | Các hàm |
|------|-----------|
| Định tuyến | `navigateTo()`, `renderSection()`, `toggleAuthForm()` |
| Xác thực | `handleRegister()`, `handleLogin()`, `handleLogout()` |
| Lưu trữ | `saveState()`, `updateUserInDatabase()` |
| Render Dashboard | `updateUIAndDashboard()` (lời chào, các thẻ KPI, danh sách lịch sử, biểu đồ, huy hiệu, lịch) |
| Streak / biểu đồ / huy hiệu | `updateStreakLogic()`, `initOrUpdateWeeklyChart()`, `updateBadgeUI()` |
| Bộ đếm giờ | `triggerManualStart()`, `startCountdown()`, `pauseCountdown()`, `stopCountdown(isFinishedNaturally)`, `renderTimerDisplay()` |
| Lịch trình | `renderCalendar()`, `handleSaveSchedule()` |
| Hồ sơ | `handleSaveProfile()`, `syncCardRealtime()`, `handleAvatarChange()`, `renderAvatarUI()` |
| i18n / giao diện | `toggleLanguage()`, `applyLanguagePack()`, `toggleTheme()`, `syncThemeUI()` |
| Âm thanh | `toggleStudyMusic()`, `changeMusicVolume()`, `resetMusicPlayerUI()` |
| Gợi ý | `generateSmartSuggestion(method, focusLevel, minutesPlanned)` |

## Các quy trình công việc phổ biến

Sau **bất kỳ** thay đổi nào đối với `currentUser`, hãy lưu trữ bằng `updateUserInDatabase()` **sau đó** là `saveState()` (cơ sở dữ liệu trước, để JSON người dùng hiện tại và mảng DB luôn đồng bộ), và render lại khung nhìn bị ảnh hưởng.

- **Thêm một chuỗi UI:** thêm khóa vào `langData.vi` VÀ `langData.en` → đặt cho phần tử một `id` → thêm dòng `getElementById(id).innerText = p.key` trong `applyLanguagePack()`.
- **Thêm một nút/hành động:** thêm `onclick="myFn()"` trong mã markup → định nghĩa `function myFn()` cấp cao nhất trong script → nếu nó thay đổi dữ liệu, hãy lưu trữ (như trên) và gọi hàm `update*`/`render*` liên quan.
- **Thêm một trang/phần:** thêm một div `#{name}-section` lớp `.content-section` (`style="display:none;"`) → tùy chọn mục thực đơn `<li>` với `onclick="navigateTo('{name}')"` → thêm nhãn điều hướng vào `langData` + `applyLanguagePack()`. `renderSection()` sẽ tự động nhận diện thông qua quy ước ID.
- **Thêm một trường vào nhật ký học tập:** thu thập nó trong `triggerManualStart()`/`stopCountdown()`, thêm vào đối tượng `newLog`, và hiển thị trong phần render lịch sử bên trong `updateUIAndDashboard()`.
- **Thêm một trường hồ sơ:** mở rộng đối tượng `profile` trong giá trị mặc định của `handleRegister()` + ghi trong `handleSaveProfile()` + đọc/render trong `updateUIAndDashboard()`.

**Kiểm tra thủ công (không có kiểm thử tự động):** khởi chạy qua HTTP, sau đó với bất kỳ thay đổi nào, hãy xác nhận ở **cả hai ngôn ngữ** (`toggleLanguage`) và **cả hai giao diện** (`toggleTheme`), cũng như ở trạng thái **đã đăng nhập và chưa đăng nhập**. Kiểm tra các khóa `track_*` trong `localStorage` bằng DevTools. Để đặt lại, hãy xóa các khóa `track_*`.

## Các ràng buộc / rào chắn

- **Tệp đơn là có chủ đích.** Giữ tất cả định dạng, mã markup và logic nội tuyến trong `index.html`. `main.css`/`main.js` cố ý để trống — đừng chuyển mã vào đó, đừng thêm bộ đóng gói (bundler)/framework/package.json, trừ khi có yêu cầu cấu trúc lại *rõ ràng*.
- **Không có bước build/test/lint** và không có backend. Đừng tự ý đưa vào như một tác dụng phụ của một thay đổi nhỏ.
- **Phụ thuộc vào CDN:** Chart.js và Canvas Confetti tải từ các CDN — ứng dụng cần internet, và các hàm sử dụng thư viện (ví dụ: confetti) chỉ được gọi khi thư viện có mặt. Đừng giả định hỗ trợ ngoại tuyến (offline).
- **Lưu trữ qua các hàm hỗ trợ** (`updateUserInDatabase()` + `saveState()`); tuyệt đối không ghi đè `track_currentUser`/`track_userDatabase` một cách tùy tiện, nếu không người dùng hiện tại và mảng DB sẽ bị lệch nhau.
- **Mặc định song ngữ + giao diện:** mọi chuỗi hiển thị cho người dùng phải đi qua `langData` (cả `vi` và `en`); mọi màu sắc phải đi qua biến CSS/`data-theme`. Không viết cứng văn bản chỉ có tiếng Anh hoặc mã màu hex trong UI mới.
- **Giữ các tài liệu anh em đồng bộ** (xem phần Ghi chú) khi bạn thay đổi một quy ước ở đây.

## Ghi chú

- `CLAUDE.md` là bản gốc tiếng Anh của tệp này; `GEMINI.md` / `GEMINI-VIE.md` là các tệp hướng dẫn AI tương tự bao quát cùng một dự án. Hãy giữ tất cả chúng nhất quán khi bạn thay đổi các quy ước ở đây. Tệp này (`CLAUDE-VIE.md`) là bản dịch tiếng Việt.
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

> Đặc tả bên dưới sử dụng cách đặt tên `currentSession`/`secondsLeft`/`timerInterval`. **Trong thực tế triển khai**, bộ đếm giờ được thực hiện bằng các biến cấp mô-đun `totalSecondsLeft`, `initialSecondsPlanned`, `countdownInterval`, `isTimerRunning` (không có đối tượng `currentSession`). Hãy sử dụng các tên thực tế bên dưới khi chỉnh sửa mã nguồn hiện tại.

- **Bắt đầu (`triggerManualStart()`):** yêu cầu `subject` + một `duration` dương (nếu không `alert(langData[currentLang].alert_valid)`); thiết lập `totalSecondsLeft = duration*60`, `initialSecondsPlanned = totalSecondsLeft`; hoán đổi biểu mẫu lấy hộp đếm giờ, bắt đầu âm thanh lofi (tự động phát có thể bị chặn → cần xử lý lỗi), thêm lớp `body.focus-active`, sau đó gọi `startCountdown()`.
- **Chạy giây (`startCountdown()`):** ngăn chặn việc bắt đầu hai lần bằng biến `isTimerRunning`; một `setInterval` 1 giây (`countdownInterval`) giảm `totalSecondsLeft`, render lại qua `renderTimerDisplay()`, và gọi `stopCountdown(true)` khi về 0.
- **Tạm dừng (`pauseCountdown()`):** `clearInterval(countdownInterval)`, `isTimerRunning = false`, hoán đổi nút tạm dừng→tiếp tục. Tiếp tục sẽ gọi lại `startCountdown()`.
- **Dừng / lưu (`stopCountdown(isFinishedNaturally=false)`):** phút thực tế = `initialSecondsPlanned - totalSecondsLeft` giây, làm tròn xuống phút, **làm tròn lên nếu phần dư ≥ 30 giây**, và tối thiểu là **1 phút** nếu có thời gian trôi qua. Nếu số phút `> 0` và môn học đã được đặt, `unshift` một nhật ký mới vào `currentUser.logs`, tính toán lại chuỗi ngày, lưu trữ (`updateUserInDatabase()` + `saveState()`), bắn pháo hoa **chỉ khi `isFinishedNaturally` là true**, sau đó `navigateTo('dashboard')`.
