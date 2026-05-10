# EscapeUIT
# 🎮 ESCAPE UIT

> *"Chúc bạn có 4 năm ở đây thật vui vẻ :)"*

**🔗 Link sản phẩm:** https://escape-uit.vercel.app/

---

## Giới thiệu

**Escape UIT** là một game browser 2D được xây dựng bằng HTML5 Canvas thuần, lấy bối cảnh là hành trình 4 năm của một sinh viên Trường Đại học Công nghệ Thông tin (UIT). Câu chuyện bắt đầu khi nhân vật chìm vào một cơn ác mộng lúc 12 giờ đêm — và phải tìm cách thoát khỏi một thực thể bí ẩn đang truy đuổi trong bóng tối.

Game được lấy cảm hứng từ phong cách **top-down dungeon crawler** kết hợp với các yếu tố **narrative** và **turn-based boss battle** theo phong cách Undertale.

---

## Cách chơi

### Di chuyển
| Phím | Hành động |
|------|-----------|
| `W` / `↑` | Di chuyển lên |
| `S` / `↓` | Di chuyển xuống |
| `A` / `←` | Di chuyển trái |
| `D` / `→` | Di chuyển phải |
| `ESC` | Tạm dừng / Tiếp tục |
| `J` / `Enter` | Bỏ qua hội thoại |
| `?` (nút góc phải) | Xem hướng dẫn |

### Mục tiêu
1. **Thu thập 4 chìa khóa**  được giấu trong các phòng — mỗi chìa khóa mở ra một mảnh ký ức về 4 năm đại học.
2. **Thu thập mảnh Năng lượng UIT** ẩn khắp bản đồ — có thể dùng trong trận boss để gây sát thương khổng lồ.
3. **Sống sót qua 5 phòng** được bố cục theo dạng lưới, né tránh các kẻ thù.
4. **Đánh bại Boss cuối** trong một trận chiến turn-based sau khi thu thập đủ 4 chìa khóa.

### Vùng an toàn
Các ô màu xanh lá trên bản đồ (tile `4`) là **Safe Zone** — kẻ thù không thể tấn công bạn khi bạn đứng ở đây.

### Điều kiện thua
Nếu bị kẻ thù chạm vào **5 lần**, game over và bạn bị "kẹt lại mãi mãi tại UIT".

---



## Hệ thống kẻ thù

Game có **3 loại kẻ thù**, mỗi loại có AI riêng biệt:

###  *Kẻ săn mồi*
- **Hành vi:** Truy đuổi thẳng người chơi bằng BFS pathfinding, có khả năng **dự đoán vị trí** tương lai của player.
- **Đặc điểm:** Khi ở gần (< 120px), chuyển sang chế độ **Rage** — tăng tốc độ 1.5x, phát sáng đỏ.
- **Chuyển phòng:** Chủ động tìm lối ra để đuổi theo player sang phòng khác.

###  *Kẻ lang thang*
- **Hành vi:** Di chuyển ngẫu nhiên giữa các ô trên bản đồ (wander), không chủ động truy đuổi.
- **Đặc điểm:** Vô tình nguy hiểm — có thể va vào bạn bất ngờ.

###  *Kẻ canh gác*
- **Hành vi:** Chỉ truy đuổi khi player và enemy cùng ở gần một vật phẩm (chìa khóa / mảnh năng lượng) trong bán kính 250px.
- **Đặc điểm:** "Bảo vệ" các item — nguy hiểm nhất khi bạn đang tiếp cận mục tiêu.

---

## Hệ thống Boss Battle

Khi thu thập đủ 4 chìa khóa, trận boss bắt đầu với **"UIT?!?!"** — một thực thể muốn giữ bạn lại mãi mãi.

### Turn-based Combat
| Hành động | Hiệu ứng |
|-----------|----------|
| ⚔️ FIGHT | Gây 15–35 sát thương cho boss |
| 🗣️ HOPE | Dùng các mảnh Năng lượng UIT đã thu thập — mỗi mảnh gây 10 sát thương cộng dồn (chỉ dùng 1 lần) |
| 💭 DREAM | Hồi phục 15–30 HP cho bản thân |
| 🏃 ESCAPE | Boss mắng và tiếp tục tấn công |

### Dodge Phase
Sau mỗi lượt của player, boss phản công bằng **mưa đạn** — bạn điều khiển linh hồn né tránh trong khung thời gian giới hạn. Boss có 3 phase với độ khó tăng dần và các pattern đạn khác nhau:
- **Phase 1 (HP > 100):** `rain`, `aimed`
- **Phase 2 (HP 50–100):** `spiral`, `wall`
- **Phase 3 (HP < 50):** Kết hợp cả 3 pattern, nhiều đạn hơn, nhanh hơn

---

## Cốt truyện & Nội dung

- **5 cảnh giới thiệu** dẫn dắt câu chuyện từ UIT → ác mộng.
- **4 mảnh ký ức** (theo 4 năm đại học) mở ra khi nhặt chìa khóa.
- **20 mảnh lịch sử UIT** (2006–2026) ẩn khắp bản đồ, có thể xem lại trong **UIT Gallery** 📖 sau khi hoàn thành game.
- **Nhiều kết thúc:** thua → game over, thắng boss → kết thúc thật sự.

---


## Công nghệ sử dụng

- **HTML5 Canvas API** — render game
- **Vanilla JavaScript** — toàn bộ game logic, không dùng framework
- **BFS Pathfinding** — AI kẻ thù tìm đường xuyên tường
- **Web Audio API** — tạo âm thanh bước chân thủ công (procedural footsteps)
- **CSS Animations** — hiệu ứng boss intro, float, shake

---

## Tác giả
Hồ Gia Bảo - 24520151