# EscapeUIT 🎮 ESCAPE UIT

## Contributors
* **Author:** Hồ Gia Bảo - 24520151 - [Github Link](https://github.com/) *(Vui lòng cập nhật link Github của bạn tại đây)*
## Description
**Escape UIT** là một game browser 2D được xây dựng bằng HTML5 Canvas thuần, lấy bối cảnh là hành trình 4 năm của một sinh viên Trường Đại học Công nghệ Thông tin (UIT). Câu chuyện bắt đầu khi nhân vật chìm vào một cơn ác mộng lúc 12 giờ đêm — và phải tìm cách thoát khỏi một thực thể bí ẩn đang truy đuổi trong bóng tối.
Game được lấy cảm hứng từ phong cách *top-down dungeon crawler* kết hợp với các yếu tố *narrative* (dẫn chuyện) và *turn-based boss battle* (chiến đấu theo lượt) theo phong cách Undertale.
### Các tính năng và hệ thống nổi bật:
* **Hệ thống kẻ thù (3 loại AI riêng biệt):**
  * *Kẻ săn mồi:* Truy đuổi thẳng người chơi bằng BFS pathfinding, có khả năng dự đoán vị trí tương lai của player. Khi ở gần (< 120px), chuyển sang chế độ *Rage* (tăng tốc độ 1.5x, phát sáng đỏ) và chủ động tìm lối ra để đuổi theo player sang phòng khác.
  * *Kẻ lang thang:* Di chuyển ngẫu nhiên giữa các ô trên bản đồ (wander), không chủ động truy đuổi nhưng có thể va vào bạn bất ngờ.
  * *Kẻ canh gác:* Chỉ truy đuổi khi player và enemy cùng ở gần một vật phẩm (chìa khóa / mảnh năng lượng) trong bán kính 250px nhằm "bảo vệ" các item.
* **Hệ thống Boss Battle ("UIT?!?!"):** Trận chiến kích hoạt khi thu thập đủ 4 chìa khóa. Bao gồm cơ chế chiến đấu theo lượt (Turn-based Combat) kết hợp né mưa đạn (Dodge Phase) qua 3 giai đoạn độ khó tăng dần (Phase 1: rain, aimed; Phase 2: spiral, wall; Phase 3: kết hợp cả 3 pattern).
* **Cốt truyện & Nội dung:** Gồm 5 cảnh giới thiệu, 4 mảnh ký ức (theo 4 năm đại học) và 20 mảnh lịch sử UIT (2006–2026) ẩn khắp bản đồ. Sau khi phá đảo, người chơi có thể xem lại trong *UIT Gallery* 📖. Game có nhiều kết thúc khác nhau dựa trên kết quả của bạn.
## How to use
### 🔗 Link sản phẩm: [escape-uit.vercel.app](https://escape-uit.vercel.app/)
### Hướng dẫn điều khiển
| Phím | Hành động |
| :--- | :--- |
| **W** / **↑** | Di chuyển lên |
| **S** / **↓** | Di chuyển xuống |
| **A** / **←** | Di chuyển trái |
| **D** / **→** | Di chuyển phải |
| **ESC** | Tạm dừng / Tiếp tục |
| **J** / **Enter** | Bỏ qua hội thoại |
| **?** (nút góc phải) | Xem hướng dẫn trực tiếp |

### Mục tiêu trò chơi
1. **Thu thập 4 chìa khóa** được giấu trong các phòng để mở ra mảnh ký ức và mở khóa trận chiến với Boss cuối.
2. **Thu thập mảnh Năng lượng UIT** ẩn khắp bản đồ để tích lũy và gây sát thương khổng lồ trong trận chiến với Boss.
3. **Sống sót qua 5 phòng** được bố cục theo dạng lưới. Tận dụng các ô màu xanh lá (**Safe Zone - tile 4**) để ẩn nấp vì kẻ thù không thể tấn công bạn tại đây.
4. **Đánh bại Boss cuối** để giành chiến thắng. Nếu bị kẻ thù chạm trúng **5 lần**, bạn sẽ Game Over và bị "kẹt lại mãi mãi tại UIT".

### Cơ chế Boss Battle (Turn-based Combat)
| Hành động | Hiệu ứng |
| :--- | :--- |
| ⚔️ **FIGHT** | Gây 15–35 sát thương cho boss. |
| 🗣️ **HOPE** | Dùng các mảnh Năng lượng UIT đã thu thập — mỗi mảnh gây 10 sát thương cộng dồn (chỉ dùng được 1 lần). |
| 💭 **DREAM** | Hồi phục 15–30 HP cho bản thân. |
| 🏃 **ESCAPE** | Boss mắng và tiếp tục tấn công bạn. |

## Additional information
### Công nghệ sử dụng trong dự án
* **HTML5 Canvas API:** Sử dụng để render toàn bộ đồ họa và chuyển động trong game.
* **Vanilla JavaScript:** Toàn bộ logic game được viết bằng JS thuần, hoàn toàn không sử dụng framework.
* **BFS Pathfinding:** Thuật toán tìm đường đi ngắn nhất xuyên tường dành cho AI kẻ thù.
* **Web Audio API:** Tạo hiệu ứng âm thanh bước chân thủ công (procedural footsteps).
* **CSS Animations:** Xử lý các hiệu ứng giao diện như boss intro, hiệu ứng nổi (float) và rung lắc (shake).

## Code of conducting
Dự án này được xây dựng trên tinh thần học hỏi và chia sẻ. Mọi người tham gia đóng góp đóng góp mã nguồn, báo lỗi (issues) hoặc đề xuất tính năng mới đều phải tuân thủ các quy tắc ứng xử văn minh, tôn trọng lẫn nhau và không gây xung đột trong cộng đồng.

## License
Dự án này được phân phối dưới giấy phép **MIT License**. Bạn có thể tự do chỉnh sửa, sử dụng cho mục đích cá nhân hoặc học tập.