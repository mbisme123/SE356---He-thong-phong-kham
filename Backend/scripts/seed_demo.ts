/**
 * Seed script demo cho buổi báo cáo cuối kỳ.
 * Tạo dữ liệu đầy đủ để demo ASR-DI-02 (Atomic Financial Operations).
 *
 * Chạy: npm run seed:demo
 */

import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
// Import models qua index.ts để setupAssociations() chạy đúng
import {
  Role,
  User,
  Patient,
  Employee,
  Doctor,
  Specialty,
  Shift,
  ShiftTemplate,
  DoctorShift,
  Appointment,
  Visit,
  Medicine,
  DiseaseCategory,
  SystemSettings,
} from "../src/models/index";
import { DoctorShiftStatus } from "../src/models/DoctorShift";
import { MedicineUnit, MedicineStatus } from "../src/models/Medicine";
import { RoleCode } from "../src/constant/role";

const today = (): string => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
const datePlus = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
};
const dobOf = (yearsAgo: number): Date => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  return d;
};

async function seed() {
  console.log("\n========== SEED DEMO START ==========\n");

  // ---------------- 1. Roles ----------------
  console.log("→ Seeding Roles...");
  await Role.bulkCreate(
    [
      { id: RoleCode.ADMIN, name: "Admin" },
      { id: RoleCode.RECEPTIONIST, name: "Receptionist" },
      { id: RoleCode.PATIENT, name: "Patient" },
      { id: RoleCode.DOCTOR, name: "Doctor" },
    ],
    { ignoreDuplicates: true }
  );

  // ---------------- 2. System Settings ----------------
  console.log("→ Seeding System Settings...");
  await SystemSettings.create({
    systemSettings: {
      maintenanceMode: false,
      examinationFee: 200000,
      defaultSlotsPerShift: 15,
      medicineExpiryWarningDays: 30,
    } as any,
  } as any).catch(() => {
    /* settings already exists */
  });

  // ---------------- 3. Specialties ----------------
  console.log("→ Seeding Specialties...");
  const specialtyData = [
    { name: "Nội tổng quát", description: "Khám tổng quát, bệnh thường gặp" },
    { name: "Nhi khoa", description: "Khám cho trẻ em" },
    { name: "Tai-Mũi-Họng", description: "Bệnh về tai, mũi, họng" },
    { name: "Da liễu", description: "Bệnh ngoài da" },
    { name: "Răng-Hàm-Mặt", description: "Khám và điều trị răng miệng" },
  ];
  const specialties = await Specialty.bulkCreate(specialtyData as any, {
    ignoreDuplicates: true,
  });
  const allSpecs = await Specialty.findAll({ order: [["id", "ASC"]] });

  // ---------------- 4. Shift Templates + Shifts ----------------
  console.log("→ Seeding Shift Templates + Shifts...");
  const shiftRows = [
    { name: "Ca sáng", startTime: "07:00", endTime: "11:00" },
    { name: "Ca chiều", startTime: "13:00", endTime: "17:00" },
    { name: "Ca tối", startTime: "18:00", endTime: "21:00" },
  ];
  await Shift.bulkCreate(shiftRows, { ignoreDuplicates: true });
  await ShiftTemplate.bulkCreate(shiftRows as any, { ignoreDuplicates: true });
  const allShifts = await Shift.findAll({ order: [["id", "ASC"]] });

  // ---------------- 5. Helper: tạo User ----------------
  const passwordHash = await bcrypt.hash("123456", 10);
  const createUser = async (
    email: string,
    fullName: string,
    roleId: number
  ): Promise<User> => {
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        email,
        password: passwordHash,
        fullName,
        roleId,
        isActive: true,
        isEmailVerified: true,
      } as any,
    });

    // Demo accounts must be usable immediately, including on a repeated seed run.
    if (!user.isEmailVerified) {
      await user.update({ isEmailVerified: true } as any);
    }

    return user;
  };

  // ---------------- 6. Admin + Receptionist ----------------
  console.log("→ Seeding Admin + Receptionist...");
  const adminUser = await createUser(
    "admin@clinic.local",
    "Quản trị viên",
    RoleCode.ADMIN
  );
  await Employee.findOrCreate({
    where: { userId: adminUser.id },
    defaults: {
      employeeCode: "EMP000001",
      userId: adminUser.id,
      position: "Quản trị viên hệ thống",
      gender: "MALE",
      dateOfBirth: "1985-01-15",
      phone: "0900000001",
      address: "Hà Nội",
      joiningDate: "2024-01-01",
      isActive: true,
    } as any,
  });

  const recepUser = await createUser(
    "recep@clinic.local",
    "Nguyễn Thị Lễ Tân",
    RoleCode.RECEPTIONIST
  );
  await Employee.findOrCreate({
    where: { userId: recepUser.id },
    defaults: {
      employeeCode: "EMP000002",
      userId: recepUser.id,
      position: "Lễ tân",
      gender: "FEMALE",
      dateOfBirth: "1995-05-20",
      phone: "0900000002",
      address: "Hà Nội",
      joiningDate: "2024-03-01",
      isActive: true,
    } as any,
  });

  // ---------------- 7. Doctors (8 bác sĩ) ----------------
  console.log("→ Seeding Doctors...");
  const doctorSeeds = [
    { email: "doctor1@clinic.local", fullName: "BS. Trần Văn An", spec: 0, gender: "MALE" as const },
    { email: "doctor2@clinic.local", fullName: "BS. Lê Thị Bình", spec: 0, gender: "FEMALE" as const },
    { email: "doctor3@clinic.local", fullName: "BS. Phạm Văn Cường", spec: 1, gender: "MALE" as const },
    { email: "doctor4@clinic.local", fullName: "BS. Hoàng Thị Dung", spec: 1, gender: "FEMALE" as const },
    { email: "doctor5@clinic.local", fullName: "BS. Đinh Văn Em", spec: 2, gender: "MALE" as const },
    { email: "doctor6@clinic.local", fullName: "BS. Vũ Thị Phượng", spec: 3, gender: "FEMALE" as const },
    { email: "doctor7@clinic.local", fullName: "BS. Ngô Văn Giang", spec: 4, gender: "MALE" as const },
    { email: "doctor8@clinic.local", fullName: "BS. Bùi Thị Hoa", spec: 0, gender: "FEMALE" as const },
  ];
  const doctors: { doctor: Doctor; user: User }[] = [];
  let docCounter = 3;
  for (const seed of doctorSeeds) {
    const u = await createUser(seed.email, seed.fullName, RoleCode.DOCTOR);
    const [emp] = await Employee.findOrCreate({
      where: { userId: u.id },
      defaults: {
        employeeCode: `EMP${String(docCounter).padStart(6, "0")}`,
        userId: u.id,
        position: "Bác sĩ",
        gender: seed.gender,
        dateOfBirth: "1985-06-15",
        phone: `09000${String(docCounter).padStart(5, "0")}`,
        address: "Hà Nội",
        joiningDate: "2024-01-15",
        isActive: true,
      } as any,
    });
    const [d] = await Doctor.findOrCreate({
      where: { userId: u.id },
      defaults: {
        doctorCode: `BS${String(docCounter).padStart(6, "0")}`,
        userId: u.id,
        specialtyId: allSpecs[seed.spec].id,
        position: "Bác sĩ điều trị",
        degree: "Thạc sĩ Y khoa",
        description: "Có 10+ năm kinh nghiệm",
        isActive: true,
      } as any,
    });
    doctors.push({ doctor: d, user: u });
    docCounter++;
  }

  // ---------------- 8. Patients (15 bệnh nhân) ----------------
  console.log("→ Seeding Patients...");
  const patientSeeds = [
    { email: "patient1@example.com", fullName: "Nguyễn Văn A", gender: "MALE" as const, age: 35 },
    { email: "patient2@example.com", fullName: "Trần Thị B", gender: "FEMALE" as const, age: 28 },
    { email: "patient3@example.com", fullName: "Lê Văn C", gender: "MALE" as const, age: 45 },
    { email: "patient4@example.com", fullName: "Phạm Thị D", gender: "FEMALE" as const, age: 52 },
    { email: "patient5@example.com", fullName: "Hoàng Văn E", gender: "MALE" as const, age: 30 },
    { email: "patient6@example.com", fullName: "Vũ Thị F", gender: "FEMALE" as const, age: 25 },
    { email: "patient7@example.com", fullName: "Đỗ Văn G", gender: "MALE" as const, age: 60 },
    { email: "patient8@example.com", fullName: "Bùi Thị H", gender: "FEMALE" as const, age: 40 },
    { email: "patient9@example.com", fullName: "Ngô Văn I", gender: "MALE" as const, age: 33 },
    { email: "patient10@example.com", fullName: "Đinh Thị K", gender: "FEMALE" as const, age: 27 },
    { email: "patient11@example.com", fullName: "Mai Văn L", gender: "MALE" as const, age: 48 },
    { email: "patient12@example.com", fullName: "Hà Thị M", gender: "FEMALE" as const, age: 36 },
    { email: "patient13@example.com", fullName: "Lý Văn N", gender: "MALE" as const, age: 55 },
    { email: "patient14@example.com", fullName: "Trịnh Thị O", gender: "FEMALE" as const, age: 22 },
    { email: "patient15@example.com", fullName: "Phan Văn P", gender: "MALE" as const, age: 65 },
  ];
  const patients: Patient[] = [];
  let pCounter = 1;
  for (const seed of patientSeeds) {
    const u = await createUser(seed.email, seed.fullName, RoleCode.PATIENT);
    const [p] = await Patient.findOrCreate({
      where: { userId: u.id },
      defaults: {
        patientCode: `BN${String(pCounter).padStart(6, "0")}`,
        userId: u.id,
        fullName: seed.fullName,
        gender: seed.gender,
        dateOfBirth: dobOf(seed.age),
        isActive: true,
      } as any,
    });
    patients.push(p);
    pCounter++;
  }

  // ---------------- 9. Disease Categories ----------------
  console.log("→ Seeding Disease Categories...");
  await DiseaseCategory.bulkCreate(
    [
      { name: "Cảm cúm", description: "Cảm cúm thông thường" },
      { name: "Viêm họng", description: "Viêm họng cấp" },
      { name: "Đau đầu", description: "Đau đầu, mất ngủ" },
      { name: "Tiêu chảy", description: "Rối loạn tiêu hóa" },
      { name: "Dị ứng", description: "Dị ứng da, mẩn ngứa" },
    ] as any,
    { ignoreDuplicates: true }
  );

  // ---------------- 10. Medicines (20 loại) ----------------
  console.log("→ Seeding Medicines...");
  const medicineData = [
    { name: "Paracetamol 500mg", group: "Giảm đau, hạ sốt", unit: MedicineUnit.VIEN, importPrice: 500, salePrice: 2000, quantity: 500 },
    { name: "Ibuprofen 400mg", group: "Giảm đau, kháng viêm", unit: MedicineUnit.VIEN, importPrice: 800, salePrice: 3000, quantity: 300 },
    { name: "Amoxicillin 500mg", group: "Kháng sinh", unit: MedicineUnit.VIEN, importPrice: 1500, salePrice: 5000, quantity: 200 },
    { name: "Cetirizine 10mg", group: "Kháng histamin", unit: MedicineUnit.VIEN, importPrice: 700, salePrice: 2500, quantity: 250 },
    { name: "Omeprazole 20mg", group: "Tiêu hóa", unit: MedicineUnit.VIEN, importPrice: 1200, salePrice: 4000, quantity: 180 },
    { name: "Vitamin C 500mg", group: "Vitamin", unit: MedicineUnit.VIEN, importPrice: 300, salePrice: 1500, quantity: 600 },
    { name: "Berberin", group: "Tiêu chảy", unit: MedicineUnit.VIEN, importPrice: 200, salePrice: 1000, quantity: 400 },
    { name: "Loratadine 10mg", group: "Kháng histamin", unit: MedicineUnit.VIEN, importPrice: 900, salePrice: 3500, quantity: 220 },
    { name: "Salbutamol Inhaler", group: "Hen suyễn", unit: MedicineUnit.CHAI, importPrice: 35000, salePrice: 80000, quantity: 50 },
    { name: "Oresol", group: "Bù điện giải", unit: MedicineUnit.GOI, importPrice: 1500, salePrice: 5000, quantity: 300 },
    { name: "Mometasone Cream", group: "Da liễu", unit: MedicineUnit.TUYP, importPrice: 15000, salePrice: 45000, quantity: 80 },
    { name: "Aspirin 81mg", group: "Tim mạch", unit: MedicineUnit.VIEN, importPrice: 400, salePrice: 1800, quantity: 350 },
    { name: "Metformin 500mg", group: "Tiểu đường", unit: MedicineUnit.VIEN, importPrice: 600, salePrice: 2200, quantity: 280 },
    { name: "Amlodipine 5mg", group: "Huyết áp", unit: MedicineUnit.VIEN, importPrice: 800, salePrice: 3000, quantity: 230 },
    { name: "Atorvastatin 10mg", group: "Mỡ máu", unit: MedicineUnit.VIEN, importPrice: 1100, salePrice: 4000, quantity: 200 },
    { name: "Dextromethorphan 15mg", group: "Ho", unit: MedicineUnit.VIEN, importPrice: 500, salePrice: 2000, quantity: 320 },
    { name: "Diphenhydramine 25mg", group: "Kháng histamin", unit: MedicineUnit.VIEN, importPrice: 600, salePrice: 2200, quantity: 250 },
    // 3 thuốc có tồn kho thấp để demo INSUFFICIENT_STOCK
    { name: "Augmentin 625mg", group: "Kháng sinh", unit: MedicineUnit.VIEN, importPrice: 5000, salePrice: 15000, quantity: 8 },
    { name: "Ventolin Inhaler", group: "Hen suyễn", unit: MedicineUnit.CHAI, importPrice: 45000, salePrice: 95000, quantity: 5 },
    { name: "Insulin Lantus", group: "Tiểu đường", unit: MedicineUnit.CHAI, importPrice: 280000, salePrice: 450000, quantity: 3 },
  ];
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 2);
  let mCounter = 1;
  const medicines: Medicine[] = [];
  for (const m of medicineData) {
    const [med] = await Medicine.findOrCreate({
      where: { name: m.name },
      defaults: {
        medicineCode: `MED${String(mCounter).padStart(6, "0")}`,
        name: m.name,
        group: m.group,
        unit: m.unit,
        importPrice: m.importPrice,
        salePrice: m.salePrice,
        quantity: m.quantity,
        minStockLevel: 20,
        expiryDate: expiry,
        status: MedicineStatus.ACTIVE,
      } as any,
    });
    medicines.push(med);
    mCounter++;
  }

  // ---------------- 11. Doctor Shifts (hôm nay + ngày mai) ----------------
  console.log("→ Seeding Doctor Shifts (hôm nay + ngày mai)...");
  const dateToday = today();
  const dateTomorrow = datePlus(1);
  for (const date of [dateToday, dateTomorrow]) {
    for (const shift of allShifts) {
      // Chia bác sĩ vào ca: mỗi ca có 2-3 bác sĩ
      const docCount = 3;
      for (let i = 0; i < docCount && i < doctors.length; i++) {
        const docIdx = (shift.id + i) % doctors.length;
        await DoctorShift.findOrCreate({
          where: {
            doctorId: doctors[docIdx].doctor.id,
            shiftId: shift.id,
            workDate: date,
          },
          defaults: {
            doctorId: doctors[docIdx].doctor.id,
            shiftId: shift.id,
            workDate: date,
            status: DoctorShiftStatus.ACTIVE,
            maxSlots: 15,
          } as any,
        });
      }
    }
  }

  // ---------------- 12. Appointments mẫu cho hôm nay ----------------
  console.log("→ Seeding Appointments cho hôm nay...");
  const appointmentSeeds: {
    patient: Patient;
    doctorIdx: number;
    shiftId: number;
    status: "WAITING" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED";
    visitStatus?: "WAITING" | "EXAMINING" | "EXAMINED" | "COMPLETED";
    slot: number;
  }[] = [
    // Ca sáng (shiftId=1) — bác sĩ 1
    { patient: patients[0], doctorIdx: 0, shiftId: 1, status: "WAITING", slot: 1 },
    { patient: patients[1], doctorIdx: 0, shiftId: 1, status: "WAITING", slot: 2 },
    { patient: patients[2], doctorIdx: 0, shiftId: 1, status: "CHECKED_IN", visitStatus: "WAITING", slot: 3 },
    // ⭐ Demo chính: đây là visit ở EXAMINING — sẽ dùng để demo kê đơn
    { patient: patients[3], doctorIdx: 0, shiftId: 1, status: "IN_PROGRESS", visitStatus: "EXAMINING", slot: 4 },
    { patient: patients[4], doctorIdx: 0, shiftId: 1, status: "IN_PROGRESS", visitStatus: "EXAMINING", slot: 5 },
    // 1 visit đã EXAMINED — đã được kê đơn trước, để demo "đã có hóa đơn"
    { patient: patients[5], doctorIdx: 0, shiftId: 1, status: "IN_PROGRESS", visitStatus: "EXAMINED", slot: 6 },

    // Ca chiều (shiftId=2) — bác sĩ 1
    { patient: patients[6], doctorIdx: 0, shiftId: 2, status: "WAITING", slot: 1 },
    { patient: patients[7], doctorIdx: 0, shiftId: 2, status: "CHECKED_IN", visitStatus: "WAITING", slot: 2 },

    // Ca sáng — bác sĩ 2
    { patient: patients[8], doctorIdx: 1, shiftId: 1, status: "WAITING", slot: 1 },
    { patient: patients[9], doctorIdx: 1, shiftId: 1, status: "IN_PROGRESS", visitStatus: "EXAMINING", slot: 2 },
  ];

  let apptCounter = 1;
  for (const a of appointmentSeeds) {
    const doctor = doctors[a.doctorIdx].doctor;
    const [appt, created] = await Appointment.findOrCreate({
      where: {
        doctorId: doctor.id,
        shiftId: a.shiftId,
        date: dateToday,
        slotNumber: a.slot,
      },
      defaults: {
        appointmentCode: `APT${String(apptCounter).padStart(6, "0")}`,
        patientId: a.patient.id,
        doctorId: doctor.id,
        shiftId: a.shiftId,
        date: dateToday,
        slotNumber: a.slot,
        queueNumber: a.slot,
        bookingType: "ONLINE",
        bookedBy: "PATIENT",
        symptomInitial: "Sốt, ho, đau đầu",
        status: a.status,
      } as any,
    });
    apptCounter++;

    // Tạo Visit nếu cần
    if (a.visitStatus && created) {
      await Visit.create({
        visitCode: `VST${String(apptCounter).padStart(6, "0")}`,
        appointmentId: appt.id,
        patientId: a.patient.id,
        doctorId: doctor.id,
        checkInTime: new Date(),
        symptoms: "Bệnh nhân than sốt 38.5°C, ho khan, đau họng, mệt mỏi 2 ngày",
        diagnosis: a.visitStatus === "EXAMINING" ? null : "Viêm họng cấp",
        vitalSigns: {
          bloodPressure: "120/80",
          heartRate: 78,
          temperature: 38.5,
          weight: 65,
        },
        status: a.visitStatus,
      } as any);
    }
  }

  // ---------------- TỔNG KẾT ----------------
  console.log("\n========== SEED DEMO XONG ==========\n");
  console.log("📋 Tài khoản demo (mật khẩu chung: 123456):\n");
  console.log("  ADMIN:        admin@clinic.local");
  console.log("  RECEPTIONIST: recep@clinic.local");
  console.log("  DOCTOR (1):   doctor1@clinic.local  ← dùng để demo ASR-DI-02");
  console.log("  DOCTOR (2-8): doctor2@clinic.local ... doctor8@clinic.local");
  console.log("  PATIENT (1):  patient1@example.com");
  console.log("  PATIENT (2-15): patient2@example.com ... patient15@example.com");
  console.log("\n📊 Thống kê:");
  console.log(`  - ${(await Specialty.count())} Specialties`);
  console.log(`  - ${(await Doctor.count())} Doctors`);
  console.log(`  - ${(await Patient.count())} Patients`);
  console.log(`  - ${(await Medicine.count())} Medicines`);
  console.log(`  - ${(await DoctorShift.count())} Doctor Shifts (today + tomorrow)`);
  console.log(`  - ${(await Appointment.count())} Appointments hôm nay`);
  console.log(`  - ${(await Visit.count())} Visits`);

  console.log("\n🎯 Sẵn sàng demo ASR-DI-02:");
  console.log("  • Login doctor1@clinic.local sẽ thấy:");
  console.log("    - 2 visit đang EXAMINING (patients 4, 5) → kê đơn được");
  console.log("    - 1 visit đã EXAMINED (patient 6) → đã khám xong");
  console.log("    - Các bệnh nhân khác đang WAITING/CHECKED_IN");
  console.log("  • Medicine 'Augmentin 625mg' chỉ có 8 viên → demo INSUFFICIENT_STOCK");
  console.log("  • Medicine 'Insulin Lantus' chỉ có 3 chai → demo INSUFFICIENT_STOCK\n");
}

seed()
  .then(() => {
    console.log("✅ Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
