# Storefront Theme Builder

Môi trường phát triển độc lập để thiết kế và xem trước theme storefront của Zucandu — **không cần Laravel, không cần backend, không cần database**.

Toàn bộ dữ liệu lấy từ các file JSON tĩnh trong `src/data/`. Theme components copy nguyên từ v3; chỉ có Pinia stores và bootstrap được viết lại để dùng mock data thay vì gọi API thật.

---

## Stack

- **Vite 8** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia 3** — stores
- **Vue Router 5** — routing
- **Tailwind CSS v4** — styling
- **vue-i18n 11** — i18n

---

## Cài đặt & chạy

> Dùng **pnpm** (npm không hỗ trợ `workspace:` protocol của một số package).

```bash
# Cài pnpm nếu chưa có
npm install -g pnpm

# Cài dependencies
pnpm install

# Khởi động dev server
pnpm dev
# → http://localhost:5173

# Build production
pnpm build
```

---

## Các trang có thể preview

| URL | Trang |
|-----|-------|
| `/` | Homepage |
| `/category/furniture` | Danh mục sản phẩm |
| `/product/classic-wooden-chair` | Chi tiết sản phẩm |
| `/cart` | Giỏ hàng |
| `/checkout` | Thanh toán |
| `/login` | Đăng nhập |
| `/register` | Đăng ký |
| `/account/order/list` | Tài khoản (cần login trước) |
| `/blog/listing` | Blog |
| `/search/result?keyword=chair` | Kết quả tìm kiếm |
| `/track-order/form` | Tra cứu đơn hàng |
| `/return-exchange/form` | Trả/đổi hàng |

---

## Dev Panel

Góc dưới phải có nút **⚙** để mở Dev Panel (chỉ hiện ở môi trường dev):

- **Login as Jane** — đăng nhập / đăng xuất tài khoản mock
- **Add Chair to Cart** — thêm sản phẩm vào giỏ hàng
- **USD / EUR** — chuyển đổi tiền tệ

---

## Cấu trúc thư mục

```
src/
├── main.js                   # App bootstrap (mock zucConfig, không có Laravel/Axios)
├── router.js                 # Vue Router (không có lang prefix)
├── i18n.js                   # vue-i18n setup
├── DevPanel.vue              # Dev-only floating panel
│
├── themes/
│   └── default/              # Theme files copy từ v3 (KHÔNG sửa trực tiếp ở đây)
│       ├── Storefront.vue
│       ├── storefront/       # 41 page components + components/
│       └── storefront/css/   # style.css (Tailwind v4)
│
├── stores/                   # Viết lại toàn bộ — load JSON thay vì gọi API
│   ├── settings.js
│   ├── cart.js
│   ├── wishlist.js
│   ├── order.js
│   ├── auth/customer.js
│   ├── catalog/{product,listing}.js
│   ├── utils/{banner,menu,post,contact}.js
│   └── payments/{cod,bankTransfer}.js
│
├── composables/              # Copy từ v3, một số đã patch bỏ axios
├── locales/en.json           # Copy từ v3
└── data/                     # Mock data JSON
    ├── settings.json
    ├── listing.json
    ├── product.json
    ├── banners.json
    ├── menu-main.json
    ├── menu-footer.json
    ├── cart.json
    ├── posts.json
    ├── article.json
    └── account.json
```

---

## Tạo theme mới

1. Copy `src/themes/default/` → `src/themes/my-new-theme/`
2. Sửa alias `@theme` trong `vite.config.js` trỏ sang theme mới:
   ```js
   '@theme': fileURLToPath(new URL('./src/themes/my-new-theme', import.meta.url)),
   ```
3. Edit thoải mái các Vue components
4. Stores và mock data dùng chung — không cần đụng vào

---

## Mock data

Tất cả dữ liệu nằm trong `src/data/*.json`. Sửa trực tiếp để thay đổi nội dung hiển thị (tên store, sản phẩm, banner, menu, bài viết, thông tin tài khoản...).

Tài khoản mock mặc định: **jane.smith@example.com** (mật khẩu bất kỳ đều được qua Dev Panel).

---

## Những gì KHÔNG hoạt động (by design)

Dưới đây render được UI nhưng không có logic thật:

- Thanh toán (Stripe, Square, PayPal) — stub only
- Newsletter subscription — trả về success
- Upload ảnh — input file only, không gửi lên server
- Invoice PDF — render HTML
- Tra cứu đơn hàng / trả hàng — hiện mock data
