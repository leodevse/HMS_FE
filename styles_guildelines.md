# Style Guidelines (Mantine UI) — HMS Project

> Mục tiêu: thống nhất màu sắc, typography, spacing và cách dùng component để UI đồng nhất, dễ mở rộng, tránh “mỗi người một kiểu”.

---

## 1) Brand & Color System

### 1.1 Nguyên tắc chung
- **1 Primary color** (màu chủ đạo) dùng cho: nút chính (CTA), link, trạng thái active, highlight.
- **Neutral (gray)** dùng cho: nền, border, text phụ, divider.
- **Semantic colors** (success/warning/error/info) dùng theo ý nghĩa, **không dùng thay primary**.
- Không dùng quá 2 màu “nổi” trên cùng 1 màn hình. Ưu tiên sạch, rõ ràng.

### 1.2 Palette đề xuất (khuyến nghị cho HMS)
- **Primary:** `teal` (phù hợp cảm giác “sạch”, y tế, hiện đại)
- **Neutral:** `gray`
- **Success:** `green`
- **Warning:** `yellow` hoặc `orange`
- **Error:** `red`
- **Info:** `cyan` hoặc dùng `teal` shade nhạt

> Nếu team đã có màu nhận diện, hãy thay Primary bằng màu brand và giữ các quy tắc sử dụng bên dưới.

### 1.3 Quy ước shade (độ đậm/nhạt)
Với Mantine (0 → 9: nhạt → đậm), dùng thống nhất:
- **Primary**
  - Default action (Button primary): shade **6**
  - Hover: shade **7**
  - Subtle background (chip, highlight nền nhạt): shade **0–1**
  - Border/outline: shade **3–4**
- **Gray**
  - Nền app: `gray.0`
  - Card nền: `white`
  - Border: `gray.2` hoặc `gray.3`
  - Text phụ: `gray.6` hoặc `dimmed`

### 1.4 Quy tắc dùng màu theo ngữ cảnh (bắt buộc)
**Buttons**
- Primary CTA: `color="teal"` (hoặc primaryColor của theme)
- Secondary action: `variant="light"` hoặc `variant="default"`
- Destructive action: `color="red"` (không dùng primary cho “Xóa”)

**Links & Active state**
- Link: dùng primary shade 6
- Active NavLink/Tab: dùng primary (underline/indicator)

**Badges / Status**
- Trạng thái:
  - `SUCCESS`: green
  - `WARNING`: yellow/orange
  - `ERROR`: red
  - `INFO`: cyan/blue

**Alerts/Notifications**
- Thông báo lỗi: đỏ
- Cảnh báo: vàng/cam
- Thành công: xanh lá
- Thông tin: cyan/blue

---

## 2) Typography

### 2.1 Font
- Ưu tiên font hệ thống hoặc một font sans dễ đọc.
- Quy ước:
  - Nội dung chính: 14–16px
  - Table text: 13–14px
  - Caption/helper: 12–13px

### 2.2 Heading
- H1: dùng cho tiêu đề trang (1 lần/trang)
- H2/H3: chia khối nội dung
- Không dùng quá nhiều cấp heading trong 1 view CRUD.

### 2.3 Trọng lượng chữ
- Body: 400
- Emphasis: 500
- Heading: 600
- Tránh 700 nếu không cần thiết.

---

## 3) Spacing & Layout

### 3.1 Spacing scale
Dùng spacing theo bội số 4/8 để đồng nhất:
- 4, 8, 12, 16, 20, 24, 32, 40...

Mantine gợi ý:
- `xs`, `sm`, `md`, `lg`, `xl` và `rem()`.

### 3.2 Layout chuẩn cho trang Dashboard (khuyến nghị)
- AppShell: Navbar trái + Header + Content.
- Content tối đa: `max-width` theo breakpoint (tránh kéo quá rộng).
- Grid cards KPI: 3–4 cột trên desktop, giảm cột khi responsive.

### 3.3 Layout chuẩn cho trang CRUD
- Top bar: Search + Filter + CTA “Tạo mới”
- Bảng: full width, có pagination
- Form create/edit: Modal/Drawer
- Action column: icon nhỏ + tooltip

---

## 4) Component Usage Rules (Mantine)

### 4.1 Buttons
- CTA chính: **1 CTA**/màn hình (ví dụ “Tạo mới”, “Lưu”).
- Nút “Hủy”: `variant="default"` hoặc `light`, không dùng primary.
- Nút “Xóa”: `color="red"` + confirm.

### 4.2 Forms
- Mọi field có label rõ ràng.
- Validation:
  - lỗi hiển thị ngay dưới field (`error`).
- Dùng `required` cho field bắt buộc.
- Date/time: dùng date picker thống nhất format hiển thị.

### 4.3 Tables
- Có loading state & empty state.
- Sort/filter: rõ ràng, không nhồi quá nhiều control.
- Column “Actions” căn phải, icon có tooltip.

### 4.4 Modals/Drawers
- Modal: form ngắn
- Drawer: form dài hoặc nhiều section
- Footer luôn có: `Hủy` (trái) + `Lưu` (phải)

### 4.5 Icons
- Dùng 1 bộ icon thống nhất (Tabler Icons là lựa chọn phù hợp vì Mantine hay dùng).
- Màu icon theo semantic (xóa đỏ, sửa primary, xem gray/blue).

---

## 5) Radius, Shadow, Borders

### 5.1 Radius
- Mặc định: `md`
- Card/Modal: `md`
- Input: `sm` hoặc `md` (chọn 1 và giữ xuyên suốt)

### 5.2 Shadow
- Card: shadow nhẹ (`sm`)
- Modal: `md`
- Tránh shadow nặng gây “nổi” quá nhiều.

### 5.3 Borders
- Border dùng `gray.2/gray.3`
- Divider mảnh, không dùng màu primary cho border thông thường.

---

## 6) Light/Dark Mode
- Ưu tiên build **Light mode** trước.
- Khi thêm Dark mode:
  - Không hard-code màu (vd: `#fff`, `#000`) trong component.
  - Dùng token/theme (`var(--mantine-color-...)`, `theme.colors...`).

---

## 7) Accessibility (A11y)
- Contrast đủ (đặc biệt text trên nền primary).
- Button/icon phải có `aria-label` nếu chỉ có icon.
- Focus ring: không tắt focus outline nếu không thay bằng focus style khác.

---

## 8) Naming & Code Organization (khuyến nghị)
> Mục tiêu: “quy định màu ở 1 nơi”.

Cấu trúc gợi ý:
- `src/theme/colors.ts` — khai báo brand & semantic tokens (nếu cần custom)
- `src/theme/index.ts` — tạo theme Mantine (primaryColor, radius, font, component overrides)
- `src/styles/` — chỉ chứa CSS global thật sự cần (reset, helper hiếm)

Quy ước:
- Không dùng inline style cho màu nếu có thể dùng `color`, `variant`, `theme`.
- Nếu cần custom màu, định nghĩa token ở `colors.ts` rồi dùng lại.

---

## 9) Do / Don’t (Checklist nhanh)

### DO
- Dùng primary nhất quán cho CTA, link, active state.
- Dùng semantic color đúng ngữ nghĩa.
- Dùng spacing theo scale thống nhất.
- Có empty/loading/error states.

### DON’T
- Không hard-code màu rải rác trong component.
- Không dùng primary cho “Xóa”.
- Không phối quá nhiều màu bão hòa trên 1 màn hình.
- Không tạo 5 kiểu button khác nhau cho cùng một hành động.

---

## 10) Trạng thái (Status) chuẩn đề xuất cho HMS
Nếu hệ thống có lịch hẹn/phiếu khám/hoá đơn, gợi ý map màu:
- `Đã hoàn thành`: green
- `Đang xử lý`: teal/blue
- `Chờ`: yellow
- `Hủy`: gray hoặc red (tuỳ mức nghiêm trọng)
- `Quá hạn`: red

---

**Owner:** Frontend Team  
**Last updated:** 2026-03-08