# Nhạc focus — drop-and-go

Thả file `.mp3` vào thư mục này là playlist tự nhận (Vite `import.meta.glob`),
KHÔNG cần sửa code hay manifest.

- Tên bài hiển thị sinh từ tên file: `lofi-rain.mp3` → "Lofi Rain",
  `night_coding.mp3` → "Night Coding".
- Dev server đang chạy thì restart (`make frontend`) để nhận bài mới;
  bản build/deploy tự gom toàn bộ.
- `dom.mp3` (bài gốc) sẽ được chuyển vào đây khi feature playlist ship.
