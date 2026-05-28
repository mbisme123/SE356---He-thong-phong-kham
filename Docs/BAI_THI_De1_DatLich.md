# BÀI THI THỰC HÀNH KIẾN TRÚC PHẦN MỀM — ĐỀ 1

**Đề tài**: Hệ thống quản lý phòng khám
**Chức năng chọn**: Đặt lịch khám (Create Appointment)
**Thuộc tính chất lượng**: Data Integrity / Reliability — ASR-DI-01

---

## CÂU 1 (5đ) — Pessimistic Locking Pattern cho chức năng Đặt lịch khám

### 1. Mô tả chức năng

Bệnh nhân (hoặc lễ tân) chọn bác sĩ + ca trực → hệ thống tạo lịch hẹn nếu ca trực còn slot.

**Vấn đề**: Nếu 2 bệnh nhân cùng đặt vào slot cuối cùng của ca trực đồng thời (giờ cao điểm), cả 2 cùng đọc thấy `currentBooked = 9 / maxPatients = 10` → cả 2 cùng insert → ca trực có **11 lịch hẹn** vượt giới hạn. Đây là race condition cổ điển.

### 2. Mẫu thiết kế chọn: Pessimistic Locking (Concurrency Pattern)

**Định nghĩa**: Khóa hàng dữ liệu **ngay lúc đọc** bằng `SELECT ... FOR UPDATE`. Các transaction khác đụng vào hàng đó **phải đợi** đến khi transaction hiện tại COMMIT hoặc ROLLBACK.

**Nguyên lý**: Biến thao tác "đọc → check → ghi" của nhiều transaction thành **chuỗi tuần tự** trên cùng 1 hàng, loại bỏ race condition.

**Mapping**:

| Vai trò | Trong code |
|---|---|
| Tài nguyên giới hạn | `DoctorShift` (slot ca trực) |
| Lock | `lock: t.LOCK.UPDATE` (Sequelize) → `SELECT FOR UPDATE` (MySQL) |
| Critical section | Vùng đọc count + check + insert + update count |
| Đối thủ tranh chấp | Nhiều request đặt lịch cùng lúc |

### 3. Hiện thực (TypeScript)

```typescript
export const createAppointment = async (input) => {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      // ━━━ Pessimistic Locking ━━━
      // Khóa hàng DoctorShift đến khi commit — request khác phải đợi
      const doctorShift = await DoctorShift.findByPk(input.doctorShiftId, {
        transaction: t,
        lock: t.LOCK.UPDATE,    // ← SELECT FOR UPDATE
      });

      if (!doctorShift) throw new Error("DOCTOR_SHIFT_NOT_FOUND");

      // Check slot — số liệu chắc chắn đúng vì đã có lock
      if (doctorShift.currentBooked >= doctorShift.maxPatients) {
        throw new Error("SHIFT_FULL");
      }

      // Sinh mã lịch hẹn trong cùng transaction
      const appointmentCode = await generateAppointmentCode(t);

      // INSERT Appointment
      const appointment = await Appointment.create(
        {
          patientId: input.patientId,
          doctorId: input.doctorId,
          doctorShiftId: input.doctorShiftId,
          appointmentCode,
          status: "WAITING",
        },
        { transaction: t }
      );

      // Update count — atomic vì đang trong transaction + lock
      doctorShift.currentBooked += 1;
      await doctorShift.save({ transaction: t });

      return appointment;
      // COMMIT → lock được giải phóng → request kế tiếp đọc được count mới
    }
  );
};
```

### 4. Kịch bản chứng minh

```
Ca trực X: maxPatients = 10, currentBooked = 9 (còn 1 slot)

09:00:00.000 — Bệnh nhân A đặt:
   → BEGIN TRANSACTION
   → SELECT * FROM doctor_shifts WHERE id=X FOR UPDATE  (lock!)
   → Đọc currentBooked = 9 < 10 → OK
   → INSERT Appointment cho A
   → UPDATE currentBooked = 10
   ... (chưa commit)

09:00:00.005 — Bệnh nhân B đặt (cùng ca):
   → BEGIN TRANSACTION
   → SELECT * FROM doctor_shifts WHERE id=X FOR UPDATE
   → ⏸ ĐỢI vì A đang giữ lock...

09:00:00.100 — A commit
   → Lock được giải phóng

09:00:00.101 — B tiếp tục:
   → Đọc lại currentBooked = 10 (đã cập nhật)
   → 10 < 10 = false → throw SHIFT_FULL ❌

Kết quả: A đặt được, B bị từ chối với lỗi rõ ràng.
KHÔNG bao giờ có trường hợp ca trực vượt quá 10 lịch hẹn.
```

### 5. Vì sao chọn Pessimistic mà không phải Optimistic?

| Tiêu chí | Pessimistic | Optimistic |
|---|---|---|
| Cách hoạt động | Khóa ngay khi đọc | Đọc tự do + check version khi update |
| Conflict rate giờ cao điểm | Đợi (an toàn) | Retry nhiều lần (tốn CPU) |
| Phù hợp với | Tài nguyên giới hạn (slot) | View count, like count |

→ Slot ca trực là tài nguyên **giới hạn cứng** + giờ cao điểm conflict rate cao → chọn Pessimistic.

### 6. Lợi ích

- Đảm bảo **0 lịch hẹn vượt slot** dưới mọi mức concurrency.
- Logic đơn giản — không cần retry loop như Optimistic.
- Tự động ROLLBACK toàn bộ nếu bất kỳ bước nào fail (kết hợp transaction).

---

## CÂU 2 (5đ) — Fault Tree Analysis cho Data Integrity

### 1. Khai báo Top Event

**Feature**: Đặt lịch khám
**Quality Attribute**: Data Integrity / Reliability

**TOP EVENT**: *"Dữ liệu đặt lịch bị lệch — biểu hiện qua 3 dấu hiệu: (a) số lịch hẹn của ca trực vượt quá maxPatients, (b) Appointment mồ côi (tạo ra nhưng DoctorShift.currentBooked không tăng), (c) trùng mã appointmentCode."*

### 2. Ký hiệu

| Hình | Tên | Ý nghĩa |
|---|---|---|
| ▭ chữ nhật | Top / Intermediate Event | Sự cố phân rã tiếp |
| ◯ tròn | Basic Event | Nguyên nhân gốc |
| AND | And gate | Cha xảy ra khi **TẤT CẢ** con xảy ra |
| OR | Or gate | Cha xảy ra khi **BẤT KỲ** con xảy ra |

### 3. Sơ đồ Fault Tree

```
                ┌─────────────────────────────────────┐
                │           TOP EVENT                  │
                │  Dữ liệu đặt lịch bị lệch           │
                └────────────────┬────────────────────┘
                                 │
                                OR
            ┌────────────────────┼───────────────────────┐
            ▼                    ▼                       ▼
       ┌─────────┐        ┌─────────────┐         ┌─────────────┐
       │   E1    │        │     E2      │         │     E3      │
       │ Vượt    │        │ Appointment │         │  Trùng mã   │
       │ maxSlot │        │  mồ côi     │         │ appointment │
       └────┬────┘        └──────┬──────┘         └──────┬──────┘
            │                    │                       │
           AND                  OR                      OR
         ┌──┴──┐              ┌──┴──┐                 ┌──┴──┐
         ▼     ▼              ▼     ▼                 ▼     ▼
       ┌──┐  ┌──┐           ┌──┐  ┌──┐              ┌──┐  ┌──┐
       │B1│  │B2│           │B3│  │B4│              │B5│  │B6│
       └──┘  └──┘           └──┘  └──┘              └──┘  └──┘

B1: Thiếu FOR UPDATE trên DoctorShift (không có pessimistic lock)
B2: Hai bệnh nhân đặt cùng slot cuối đồng thời (concurrent traffic)
B3: Exception giữa INSERT Appointment và UPDATE currentBooked
B4: Service không bọc trong transaction (auto-commit từng query)
B5: Sinh appointmentCode ngoài transaction (race khi 2 request cùng đọc max code)
B6: Thuật toán sinh mã không có UNIQUE constraint ở DB
```

### 4. Phân tích từng nhánh

**E1 — Vượt số slot maxPatients (Gate: AND)**
> Chọn AND vì: thiếu lock mà không có concurrent → không lệch; có concurrent mà có lock → cũng không lệch. **Phải gặp cả 2**.

**E2 — Appointment mồ côi (Gate: OR)**
> Chỉ cần 1 trong 2: hoặc exception giữa 2 bước, hoặc không có transaction → Appointment tồn tại mà DoctorShift.currentBooked không tăng → lần đặt sau sẽ đọc count sai.

**E3 — Trùng mã appointmentCode (Gate: OR)**
> Hoặc sinh mã ngoài transaction (B5), hoặc thiếu UNIQUE constraint ở DB (B6) → 2 lịch hẹn cùng mã → vi phạm tính duy nhất → audit/truy vết hỏng.

### 5. Minimal Cut Sets

| # | Cut Set | Số phần tử | Ghi chú |
|---|---|---|---|
| 1 | {B1, B2} | 2 | Cần cả 2 |
| 2 | {B3} | 1 | SPOF ⚠ |
| 3 | {B4} | 1 | SPOF ⚠ |
| 4 | {B5} | 1 | SPOF ⚠ |
| 5 | {B6} | 1 | SPOF ⚠ |

→ Có **4 single point of failure** — chỉ 1 lỗi đã đủ gây Top Event.
→ Cut set {B1, B2} có 2 phần tử nhờ Pessimistic Lock đã biến SPOF "thiếu lock" thành điều kiện phải đi kèm concurrent traffic mới gây lỗi.

### 6. Mitigation — Cách kiến trúc đã chặn từng Basic Event

| Basic Event | Tactic phòng ngừa |
|---|---|
| B1, B2 | **Pessimistic Locking** — `lock: t.LOCK.UPDATE` trên DoctorShift |
| B3, B4 | **Transaction wrapper** — `sequelize.transaction(callback)` tự rollback khi throw |
| B5 | Sinh `appointmentCode` **trong transaction** với lock — không cho 2 request cùng đọc max code |
| B6 | Migration tạo **UNIQUE INDEX** trên cột `appointmentCode` ở DB layer |

### 7. Kết luận

> FTA phân rã Top Event "Dữ liệu đặt lịch lệch" thành **3 nhánh** với **6 Basic Event** và **5 cut sets** (4 SPOF). Trong đó **B1 và B2 trực tiếp liên quan đến Pessimistic Locking Pattern ở Câu 1** — chứng minh Pessimistic Lock không chỉ là kỹ thuật concurrency mà là tactic kiến trúc cụ thể chặn nhánh **E1 — nhánh nguy hiểm nhất** vì đây chính là dấu hiệu vi phạm yêu cầu nghiệp vụ cốt lõi của ca trực (không vượt maxPatients).
