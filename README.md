<div align="center">

# 🏥 Hệ Thống Quản Lý Phòng Khám (Clinic Management System)

**Đồ án môn SE356 — Hệ thống quản lý phòng khám tư nhân**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)

</div>

---

## 📋 Tổng quan

Hệ thống quản lý phòng khám là một ứng dụng web đầy đủ (full-stack) hỗ trợ vận hành một phòng khám tư: từ đặt lịch khám online, khám bệnh, kê đơn thuốc điện tử, thanh toán hóa đơn, quản lý kho thuốc, lịch trực bác sĩ, chấm công, tính lương đến báo cáo thống kê.

Hệ thống phục vụ **4 vai trò người dùng** với phân quyền chi tiết (RBAC):

| Vai trò | Quyền chính |
|---------|-------------|
| 👨‍💼 **Admin** | Toàn quyền: nhân sự, lương, kho thuốc, chuyên khoa, ca trực, báo cáo, audit log, cấu hình hệ thống |
| 🛎️ **Lễ tân (Receptionist)** | Tiếp nhận & xác nhận lịch hẹn, check-in, hàng đợi, thu ngân/hóa đơn, đặt lịch hộ bệnh nhân |
| 👨‍⚕️ **Bác sĩ (Doctor)** | Lịch khám, khám bệnh & chẩn đoán, kê đơn thuốc, xem lịch sử bệnh nhân, dashboard cá nhân |
| 🧑 **Bệnh nhân (Patient)** | Đặt lịch khám, xem lịch sử khám/đơn thuốc/hóa đơn, hồ sơ cá nhân |

---

## 🏗️ Kiến trúc dự án

Đây là một **monorepo** gồm hai phần độc lập:

```
SE356---He-thong-phong-kham/
├── Backend/          # REST API — Node.js + Express + TypeScript + Sequelize/MySQL
│   ├── src/
│   │   ├── config/       # DB, Redis, CORS, OAuth, env validation
│   │   ├── constant/     # Hằng số (role, appointment status...)
│   │   ├── events/       # Event emitters (appointment events)
│   │   ├── jobs/         # Cron jobs (auto no-show, hết hạn thuốc, sinh lịch...)
│   │   ├── middlewares/  # Auth, RBAC, validators, rate-limit, sanitize, upload, cache
│   │   ├── models/       # 30+ Sequelize models + associations
│   │   ├── modules/      # Code chia theo domain (xem bên dưới)
│   │   ├── services/     # Dịch vụ dùng chung (cache, email)
│   │   ├── templates/    # Mẫu email
│   │   ├── utils/        # PDF, Excel, JWT, chữ ký số, state machine...
│   │   ├── app.ts        # Khai báo Express app & mount routes
│   │   └── server.ts     # Entry point (kết nối DB, khởi động cron)
│   ├── migrations/   # Sequelize migrations
│   ├── seeders/      # Seeder dữ liệu
│   ├── scripts/      # seed_demo.ts, seed_large_data.ts, reset_demo_db.sql
│   └── Automation_Test/  # ~200 test E2E bằng Selenium WebDriver
│
└── Frontend/         # SPA — React 19 + Vite + TypeScript + TailwindCSS + Radix UI
    └── src/
        ├── components/   # Layout, sidebar theo vai trò, UI components (shadcn/ui)
        ├── features/     # Tổ chức theo domain: auth, appointment, doctor,
        │                 #   finance, inventory, shift, notification, admin, landing
        ├── pages/        # Trang theo vai trò: admin/ (45), patient/ (12),
        │                 #   doctor/ (11), recep/ (9) + trang công khai
        ├── hooks/        # Custom React hooks
        ├── lib/          # axios client, firebase, utils
        └── App.tsx       # Định tuyến (react-router-dom v7)
```

### Các module Backend (theo domain)

| Module | Chức năng |
|--------|-----------|
| `auth` | Đăng ký/đăng nhập, JWT, OAuth Google, OTP, quên/đặt lại mật khẩu, hồ sơ |
| `patient` | Quản lý hồ sơ bệnh nhân & hồ sơ y tế |
| `appointment` | Đặt lịch, hủy, đổi lịch, lượt khám (visit), đơn thuốc (prescription) |
| `doctor` | Bác sĩ, chuyên khoa, ca trực bác sĩ (doctor shift) |
| `shift` | Ca làm, mẫu ca (template), sinh lịch tự động, chấm công |
| `inventory` | Thuốc, nhập/xuất kho, cảnh báo tồn kho & hạn dùng |
| `finance` | Hóa đơn, thanh toán, hoàn tiền, bảng lương |
| `admin` | Dashboard, báo cáo (PDF/Excel), audit log, cấu hình hệ thống |
| `notification` | Thông báo trong app & cấu hình thông báo |
| `user` | Tài khoản người dùng, nhân viên, quyền hạn |
| `misc` | Liên hệ, tìm kiếm, jobs |

---

## ✨ Tính năng nổi bật

- 🔐 **Xác thực & bảo mật**: JWT (access + refresh token), OAuth 2.0 (Google), RBAC theo quyền, bcrypt, Helmet, rate-limiting, sanitize input, audit log.
- 📅 **Đặt lịch khám**: online/offline, kiểm tra lịch trống bác sĩ, hủy/đổi lịch, tự động đánh dấu "no-show", upload ảnh triệu chứng.
- 💊 **Đơn thuốc điện tử**: vòng đời trạng thái (Nháp → Khóa → Cấp phát), xuất PDF kèm chữ ký số.
- 💰 **Hóa đơn & thanh toán**: tiền mặt/chuyển khoản/QR, thanh toán từng phần, hoàn tiền, xuất hóa đơn PDF.
- 🏪 **Quản lý kho thuốc**: CRUD, nhập/xuất, cảnh báo tồn thấp & hạn dùng (cron job).
- 👨‍⚕️ **Nhân sự**: ca trực, mẫu ca, sinh lịch tự động, chấm công, bảng lương & tính lương.
- 📊 **Báo cáo**: doanh thu/chi phí/lợi nhuận, bệnh nhân, lịch hẹn, top thuốc — xuất **PDF & Excel** theo tháng/năm, biểu đồ Chart.js.
- 🔔 **Thông báo & email**: Nodemailer (xác minh email, OTP, nhắc lịch).
- ⏱️ **Cron jobs**: tự động đánh dấu vắng khám, kiểm tra hạn thuốc, sinh lịch trực.

---

## 🛠 Công nghệ

**Backend**: Node.js · Express 5 · TypeScript · Sequelize ORM · MySQL · Redis (ioredis) · JWT · Passport (Google OAuth) · bcrypt · Helmet · express-rate-limit · Nodemailer · PDFKit · ExcelJS · Chart.js · node-cron · Multer · Winston · Jest + Supertest · Selenium WebDriver

**Frontend**: React 19 · Vite 7 · TypeScript · React Router v7 · TailwindCSS 4 · Radix UI / shadcn · Zustand · React Hook Form + Zod/Yup · Axios · Recharts · Firebase · jsPDF · Sonner · Lucide

---

## 🚀 Bắt đầu

### Yêu cầu môi trường
- **Node.js** >= 18
- **MySQL** >= 8.0
- **Redis** (tùy chọn — dùng cho cache & blacklist token)
- **npm** >= 9

### 1. Clone repository
```bash
git clone <repo-url>
cd SE356---He-thong-phong-kham
```

### 2. Cài đặt & cấu hình Backend
```bash
cd Backend
npm install
cp .env.example .env     # rồi điền các giá trị thật
```

Tạo database và chạy migration + seed:
```bash
mysql -u root -p -e "CREATE DATABASE healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all      # dữ liệu cơ bản (roles, permissions...)
npm run seed:demo                  # (tùy chọn) tài khoản & dữ liệu demo
# npm run seed:data                # (tùy chọn) dữ liệu lớn để test
```

Khởi động API (mặc định cổng **5000**):
```bash
npm run dev
```

### 3. Cài đặt & chạy Frontend
```bash
cd ../Frontend
npm install
npm run dev                        # Vite dev server tại http://localhost:5173
```

Frontend gọi API qua biến môi trường `VITE_API_URL` (mặc định `http://localhost:5000/api`). Tạo file `Frontend/.env` nếu cần đổi:
```env
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ Lưu ý: cổng mặc định trong `.env.example` của Backend là `PORT=3000`, nhưng `server.ts` fallback về `5000` và `OAuth callback` cấu hình ở `3000`. Hãy thống nhất cổng giữa `PORT`, `VITE_API_URL` và `GOOGLE_CALLBACK_URL` khi cấu hình.

### 4. Build production
```bash
# Backend
cd Backend && npm run build && npm start
# Frontend
cd Frontend && npm run build && npm run preview
```

---

## 🔑 Tài khoản demo

Sau khi chạy `npm run seed:demo`, dùng mật khẩu chung **`123456`**:

| Vai trò | Email |
|---------|-------|
| Admin | `admin@clinic.local` |
| Lễ tân | `recep@clinic.local` |
| Bác sĩ | `doctor1@clinic.local` … `doctor8@clinic.local` |
| Bệnh nhân | `patient1@example.com` … |

---

## ⚙️ Biến môi trường Backend (chính)

| Nhóm | Biến |
|------|------|
| Server | `NODE_ENV`, `PORT`, `FRONTEND_URL` |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| JWT | `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| Email | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` |
| Upload | `MAX_FILE_SIZE`, `UPLOAD_PATH` |
| CORS | `CORS_ORIGIN` |
| Rate limit | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` |
| Bảo mật | `BCRYPT_SALT_ROUNDS`, `LOG_LEVEL` |

Xem đầy đủ trong [Backend/.env.example](Backend/.env.example).

---

## 🌐 Tổng quan REST API

Tất cả endpoint có tiền tố `/api`. Một số nhóm chính (mount tại [Backend/src/app.ts](Backend/src/app.ts)):

| Prefix | Mô tả |
|--------|-------|
| `/api/auth`, `/api/auth/oauth`, `/api/profile` | Xác thực, OAuth, hồ sơ |
| `/api/patients`, `/api/users`, `/api/employees` | Người dùng & nhân viên |
| `/api/appointments`, `/api/visits`, `/api/prescriptions` | Lịch hẹn, lượt khám, đơn thuốc |
| `/api/doctors`, `/api/doctor-shifts`, `/api/specialties` | Bác sĩ & chuyên khoa |
| `/api/shifts`, `/api/shift-templates`, `/api/schedule-generation`, `/api/attendance` | Ca trực & chấm công |
| `/api/medicines`, `/api/medicine-imports`, `/api/medicine-exports` | Kho thuốc |
| `/api/invoices`, `/api/payrolls` | Tài chính |
| `/api/dashboard`, `/api/reports`, `/api/audit-logs`, `/api/system` | Admin & báo cáo |
| `/api/notifications`, `/api/search`, `/api/contact`, `/api/jobs` | Khác |

Health check: `GET /` trả về thông tin & phiên bản API.

---

## 🗄️ Cơ sở dữ liệu

MySQL (utf8mb4, timezone `+07:00`) quản lý qua Sequelize. Các model chính:

`User`, `Role`, `Permission`, `RolePermission`, `Patient`, `PatientProfile`, `Doctor`, `Specialty`, `Appointment`, `Visit`, `Diagnosis`, `DiseaseCategory`, `Prescription`, `PrescriptionDetail`, `Medicine`, `MedicineImport`, `MedicineExport`, `Invoice`, `InvoiceItem`, `Payment`, `Refund`, `Payroll`, `Employee`, `Shift`, `ShiftTemplate`, `DoctorShift`, `Attendance`, `Notification`, `NotificationSetting`, `AuditLog`, `SystemSettings`.

Schema được định nghĩa qua [migrations](Backend/migrations/) (chạy theo thứ tự timestamp).

---

## 🧪 Kiểm thử

```bash
cd Backend
npm test                  # toàn bộ test Jest
npm run test:unit         # unit test
npm run test:integration  # integration test (dùng testcontainers)
npm run test:coverage     # báo cáo coverage
```

**E2E (Selenium)**: thư mục [Backend/Automation_Test/](Backend/Automation_Test/) chứa ~200 kịch bản chia theo nhóm (Authentication, UserProfile, AppointmentBooking, ReceptionistAdmin, Doctor, Medicine, Salary & Employees, AdminReports, Schedule). Chạy từng file bằng `node <đường-dẫn-file>.js` (cần Frontend + Backend đang chạy và ChromeDriver).

---

## 📜 Lệnh thường dùng

**Backend**
| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Dev server (nodemon) |
| `npm run build` | Biên dịch TypeScript → `dist/` |
| `npm start` | Chạy production (`node dist/server.js`) |
| `npm run seed:demo` | Seed tài khoản & dữ liệu demo |
| `npm run seed:data` | Seed dữ liệu lớn |
| `npm test` | Chạy test |

**Frontend**
| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build production (`tsc -b && vite build`) |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | ESLint |

---

## 📚 Tài liệu thêm

- [Backend/README.md](Backend/README.md) — chi tiết riêng cho phần Backend.
- [Frontend/README.md](Frontend/README.md) — chi tiết riêng cho phần Frontend.

---

<div align="center">

Đồ án môn **SE356** • Phát triển bởi nhóm sinh viên.

</div>
