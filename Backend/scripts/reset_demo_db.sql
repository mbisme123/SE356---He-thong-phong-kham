-- =============================================================
-- RESET DATABASE TRƯỚC KHI SEED LẠI DEMO
-- =============================================================
-- Mục đích: Xóa sạch toàn bộ dữ liệu trong DB để seed_demo.ts chạy
-- từ trạng thái sạch — KHÔNG xóa schema, chỉ xóa data.
--
-- Chạy:
--   docker exec -i clinic-mysql mysql -uroot -p123456 healthcare_db < scripts/reset_demo_db.sql
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Tài chính (xóa trước vì phụ thuộc invoices/visits)
TRUNCATE TABLE refunds;
TRUNCATE TABLE payments;
TRUNCATE TABLE invoice_items;
TRUNCATE TABLE invoices;
TRUNCATE TABLE payrolls;

-- Đơn thuốc + kho
TRUNCATE TABLE medicine_exports;
TRUNCATE TABLE prescription_details;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE medicine_imports;
TRUNCATE TABLE medicines;

-- Khám bệnh
TRUNCATE TABLE diagnoses;
TRUNCATE TABLE visits;
TRUNCATE TABLE appointments;
TRUNCATE TABLE disease_categories;

-- Ca trực + chấm công
TRUNCATE TABLE attendance;
TRUNCATE TABLE doctor_shifts;
TRUNCATE TABLE shift_templates;
TRUNCATE TABLE shifts;

-- Hồ sơ người dùng
TRUNCATE TABLE patient_profiles;
TRUNCATE TABLE patients;
TRUNCATE TABLE doctors;
TRUNCATE TABLE specialties;
TRUNCATE TABLE employees;

-- Thông báo + audit + cấu hình
TRUNCATE TABLE notifications;
TRUNCATE TABLE notification_settings;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE system_settings;

-- Tài khoản & phân quyền (xóa CUỐI vì nhiều bảng FK tới)
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE permissions;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Reset DB xong - giờ chạy: npm run seed:demo' AS message;
