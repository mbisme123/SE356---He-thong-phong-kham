# BÀI THI THỰC HÀNH KIẾN TRÚC PHẦN MỀM — ĐỀ 1

**Đề tài**: Hệ thống quản lý phòng khám
**Chức năng chọn**: Tạo kê đơn thuốc (Create Prescription)
**Thuộc tính chất lượng**: Data Integrity (Tính toàn vẹn dữ liệu)

---

## CÂU 1 (5đ) — Memento Pattern cho chức năng Tạo kê đơn

### 1. Mô tả chức năng

Bác sĩ chọn thuốc + số lượng → hệ thống lưu đơn thuốc + trừ kho.

**Vấn đề**: Giá thuốc có thể thay đổi theo thời gian. Nếu hóa đơn đọc giá hiện tại của Medicine, khi admin đổi giá, hóa đơn cũ sẽ bị tính sai → sai kế toán + pháp lý.

### 2. Mẫu thiết kế chọn: Memento Pattern (GoF, Behavioral)

**Định nghĩa**: Lưu ảnh chụp (snapshot) trạng thái của một object tại một thời điểm, để dùng sau này mà không phụ thuộc vào thay đổi của object gốc.

**Mapping GoF**:

| Vai trò GoF | Trong code |
|---|---|
| Originator | `Medicine` (giá có thể đổi) |
| Memento | Object `{ medicineName, unit, unitPrice }` |
| Caretaker | `PrescriptionDetail` (giữ snapshot trong DB) |

### 3. Hiện thực (TypeScript)

```typescript
// Memento helper — chụp ảnh Medicine
const createMedicineMemento = (medicine: Medicine) => ({
  medicineName: medicine.name,
  unit: medicine.unit,
  unitPrice: medicine.salePrice,
});

export const createPrescription = async (input) => {
  // Tạo đơn thuốc
  const prescription = await Prescription.create({
    visitId: input.visitId,
    status: "DRAFT",
  });

  // Với mỗi thuốc, chụp snapshot vào PrescriptionDetail
  for (const item of input.medicines) {
    const medicine = await Medicine.findByPk(item.medicineId);

    // Trừ kho
    medicine.quantity -= item.quantity;
    await medicine.save();

    // Memento Pattern — chụp snapshot tại thời điểm kê
    await PrescriptionDetail.create({
      prescriptionId: prescription.id,
      medicineId: medicine.id,
      ...createMedicineMemento(medicine),  // ← snapshot
      quantity: item.quantity,
    });
  }

  return prescription;
};
```

### 4. Kịch bản chứng minh

```
01/12 — Bác sĩ kê 10 viên Paracetamol giá 5.000đ
        → PrescriptionDetail.unitPrice = 5.000đ (snapshot)

15/12 — Admin tăng giá lên 7.000đ
        → Medicine.salePrice = 7.000đ
        (snapshot KHÔNG đổi)

20/12 — Lễ tân tạo hóa đơn
        → Đọc PrescriptionDetail.unitPrice = 5.000đ ✅
        (KHÔNG đọc Medicine.salePrice = 7.000đ)
```

### 5. Lợi ích

- Hóa đơn cũ luôn dùng giá tại thời điểm kê → đúng yêu cầu kế toán + pháp lý.
- Nếu admin xóa cứng Medicine, hóa đơn vẫn in được vì snapshot đã đủ thông tin.
- Cô lập vòng đời 2 thực thể — Medicine có thể đổi tự do, đơn thuốc cũ không bị ảnh hưởng.

---

## CÂU 2 (5đ) — Fault Tree Analysis cho Data Integrity

### 1. Khai báo Top Event

**Feature**: Tạo kê đơn thuốc
**Quality Attribute**: Data Integrity

**TOP EVENT**: *"Dữ liệu tài chính lệch sau khi kê đơn thuốc — biểu hiện qua 3 dấu hiệu: (a) tồn kho âm, (b) Prescription mồ côi (header có, detail thiếu), (c) hóa đơn tính sai giá."*

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
                │ Dữ liệu tài chính lệch sau kê đơn   │
                └────────────────┬────────────────────┘
                                 │
                                OR
            ┌────────────────────┼───────────────────────┐
            ▼                    ▼                       ▼
       ┌─────────┐        ┌─────────────┐         ┌─────────────┐
       │   E1    │        │     E2      │         │     E3      │
       │ Tồn kho │        │Prescription │         │ Hóa đơn     │
       │ âm      │        │  mồ côi     │         │ sai giá     │
       └────┬────┘        └──────┬──────┘         └──────┬──────┘
            │                    │                       │
           AND                  OR                      OR
         ┌──┴──┐              ┌──┴──┐                 ┌──┴──┐
         ▼     ▼              ▼     ▼                 ▼     ▼
       ┌──┐  ┌──┐           ┌──┐  ┌──┐              ┌──┐  ┌──┐
       │B1│  │B2│           │B3│  │B4│              │B5│  │B6│
       └──┘  └──┘           └──┘  └──┘              └──┘  └──┘

B1: Thiếu FOR UPDATE trên Medicine (không có pessimistic lock)
B2: Hai bác sĩ kê cùng thuốc cuối kho đồng thời
B3: Exception giữa INSERT Prescription và INSERT Detail
B4: Service không bọc trong transaction
B5: Schema PrescriptionDetail thiếu cột snapshot
B6: InvoiceItem đọc Medicine.salePrice trực tiếp (vi phạm Memento)
```

### 4. Phân tích từng nhánh

**E1 — Tồn kho âm (Gate: AND)**
> Chọn AND vì: thiếu lock mà không có concurrent → không lệch; có concurrent mà có lock → cũng không lệch. Phải gặp **cả 2**.

**E2 — Prescription mồ côi (Gate: OR)**
> Chỉ cần 1 trong 2 lỗi (exception giữa chừng hoặc không có transaction) là header tồn tại mà detail thiếu.

**E3 — Hóa đơn sai giá (Gate: OR)**
> Hoặc DB không có cột snapshot (B5), hoặc code đọc Medicine trực tiếp (B6) — đều dẫn đến hóa đơn dùng giá hiện tại thay vì giá lúc kê.

### 5. Minimal Cut Sets

| # | Cut Set | Số phần tử | Ghi chú |
|---|---|---|---|
| 1 | {B1, B2} | 2 | Cần cả 2 |
| 2 | {B3} | 1 | SPOF ⚠ |
| 3 | {B4} | 1 | SPOF ⚠ |
| 4 | {B5} | 1 | SPOF ⚠ |
| 5 | {B6} | 1 | SPOF ⚠ |

→ Có **4 single point of failure** — chỉ 1 lỗi đã đủ gây Top Event.

### 6. Mitigation — Cách kiến trúc đã chặn từng Basic Event

| Basic Event | Tactic phòng ngừa |
|---|---|
| B1, B2 | **Pessimistic Locking** — `lock: t.LOCK.UPDATE` trên Medicine |
| B3, B4 | **Transaction wrapper** — `sequelize.transaction(callback)` tự rollback khi throw |
| B5 | **Memento Pattern** — Schema PrescriptionDetail có sẵn cột `medicineName/unit/unitPrice` |
| B6 | **Memento Pattern** — Invoice đọc snapshot từ PrescriptionDetail, không đọc Medicine |

### 7. Kết luận

> FTA phân rã Top Event "Dữ liệu tài chính lệch" thành **3 nhánh** với **6 Basic Event** và **5 cut sets** (4 SPOF). Trong đó **B5 và B6 trực tiếp liên quan đến Memento Pattern ở Câu 1** — chứng minh Memento không chỉ là một pattern "đẹp", mà là tactic kiến trúc cụ thể chặn 2/6 nguyên nhân gốc gây mất toàn vẹn dữ liệu.
