import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DoctorSidebar from "../../components/layout/sidebar/doctor";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import api from "../../lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Save,
  Plus,
  Trash2,
  Pill,
  FileText,
  Undo2,
  Heart,
  Activity,
  Search,
  Loader2,
} from "lucide-react";


interface Medicine {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitPrice: number;
}

interface PatientData {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  phoneNumber: string;
  appointmentId?: number;
  visitId?: number;
  symptomInitial?: string;
}

interface DiagnosisData {
  primaryDiagnosis: string;
  note: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
  };
}

interface Medication {
  id: string;
  medicineId: number | null;
  name: string;
  quantity: number;
  dosageMorning: number;
  dosageNoon: number;
  dosageAfternoon: number;
  dosageEvening: number;
  instruction: string;
  days: number;
}

export default function PrescribeMed() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(
    null
  );
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      medicineId: null,
      name: "",
      quantity: 0,
      dosageMorning: 0,
      dosageNoon: 0,
      dosageAfternoon: 0,
      dosageEvening: 0,
      instruction: "",
      days: 1,
    },
  ]);

  
  const [additionalNotes, setAdditionalNotes] = useState("");

  
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [showSuggestions, setShowSuggestions] = useState<{
    [key: string]: boolean;
  }>({});

  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        return;
      }

      try {
        setLoading(true);

        
        const medicinesResponse = await api.get("/medicines");
        if (medicinesResponse.data.success) {
          setMedicines(medicinesResponse.data.data);
        }

        
        const recordId = parseInt(id);

        
        try {
          const visitResponse = await api.get(`/visits/${recordId}`);
          if (visitResponse.data.success && visitResponse.data.data) {
            const visit = visitResponse.data.data;
            const appointment = visit.appointment || {};
            const patient = visit.patient || {};
            const patientUser = patient.user || {};

            if (patient) {
              setPatientData({
                id: patient.id,
                fullName: appointment.patientName || patientUser.fullName || patient.fullName || "Unknown",
                dateOfBirth: appointment.patientDob || patient.dateOfBirth || "",
                gender: appointment.patientGender || patient.gender || "MALE",
                phoneNumber: appointment.patientPhone || patient.phoneNumber || "",
                appointmentId: appointment.id || visit.appointmentId,
                visitId: visit.id,
                symptomInitial: appointment.symptomInitial,
              });

              
              setDiagnosisData({
                primaryDiagnosis: visit.diagnosis || "Pending diagnosis",
                note:
                  visit.note ||
                  appointment.symptomInitial ||
                  "No symptoms reported",
                vitalSigns: parseVitalSigns(visit.note || ""),
              });
              setError(null);
              return;
            }
          }
        } catch (visitErr: any) {
          
        }

        
        const response = await api.get(`/appointments/${recordId}`);
        const appointment = response.data.data || response.data;

        if (appointment) {
          const patient = appointment.patient || appointment.Patient;
          const patientUser = patient?.user || patient?.User || {};

          if (patient) {
            console.log("Appointment data:", appointment);
            const visit = appointment.visit || appointment.Visit;
            console.log("Visit data:", visit);
            const visitId = visit?.id;
            console.log("Visit ID:", visitId);

            setPatientData({
              id: patient.id,
              fullName: appointment.patientName || patientUser.fullName || patient.fullName || "Unknown",
              dateOfBirth: appointment.patientDob || patient.dateOfBirth || "",
              gender: appointment.patientGender || patient.gender || "MALE",
              phoneNumber: appointment.patientPhone || patient.phoneNumber || "",
              appointmentId: appointment.id,
              visitId: visitId,
              symptomInitial: appointment.symptomInitial,
            });

            
            setDiagnosisData({
              primaryDiagnosis: visit?.diagnosis || "Pending diagnosis",
              note:
                visit?.note ||
                appointment.symptomInitial ||
                "No symptoms reported",
              vitalSigns: parseVitalSigns(visit?.note || ""),
            });
            setError(null);
            return;
          }
        }

        
        toast.error("Không tìm thấy lịch hẹn thông tin khám bệnh");
        setError("Appointment not found");
      } catch (err: any) {
        console.error("Error fetching data:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to load data";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  
  const parseVitalSigns = (noteText: string) => {
    const vitalSigns = {
      bloodPressure: "120/80",
      heartRate: "72",
      temperature: "36.5",
      weight: "70",
    };

    if (!noteText) return vitalSigns;

    
    const bpMatch = noteText.match(/Huy[eếệ]t áp:\s*(\d+\/\d+)/i);
    if (bpMatch) vitalSigns.bloodPressure = bpMatch[1];

    
    const hrMatch = noteText.match(/Nh[iịĩ]p tim:\s*(\d+)/i);
    if (hrMatch) vitalSigns.heartRate = hrMatch[1];

    
    const tempMatch = noteText.match(/Nhi[eệ]t đ[oộ]:\s*(\d+(?:\.\d+)?)/i);
    if (tempMatch) vitalSigns.temperature = tempMatch[1];

    
    const weightMatch = noteText.match(/C[aâ]n n[ặa]ng:\s*(\d+(?:\.\d+)?)/i);
    if (weightMatch) vitalSigns.weight = weightMatch[1];

    return vitalSigns;
  };

  
  const cleanNoteText = (noteText: string) => {
    if (!noteText) return "";

    let cleanedText = noteText;

    
    cleanedText = cleanedText.replace(/CLINICAL OBSERVATIONS:.*?ADDITIONAL NOTES:/is, "");
    cleanedText = cleanedText.replace(/VITAL SIGNS:.*?(?=\n\n|$)/is, "");
    
    
    cleanedText = cleanedText.replace(/Huy[eếệ]t áp:\s*\d+\/\d+\s*mmHg\s*•?\s*/gi, "");
    cleanedText = cleanedText.replace(/Nh[iịĩ]p tim:\s*\d+\s*bpm\s*•?\s*/gi, "");
    cleanedText = cleanedText.replace(/Nhi[eệ]t đ[oộ]:\s*\d+(?:\.\d+)?\s*°C\s*•?\s*/gi, "");
    cleanedText = cleanedText.replace(/SpO2:\s*\d+\s*%\s*•?\s*/gi, "");
    cleanedText = cleanedText.replace(/C[aâ]n n[ặa]ng:\s*\d+(?:\.\d+)?\s*kg\s*•?\s*/gi, "");

    
    cleanedText = cleanedText.replace(/Examination completed on:.*$/im, "");

    
    cleanedText = cleanedText.replace(/•\s*/g, "");
    cleanedText = cleanedText.trim();

    return cleanedText || "Không có ghi chú về triệu chứng";
  };

  
  const getFilteredMedicines = (searchTerm: string) => {
    if (!searchTerm) return [];
    return medicines
      .filter(
        (medicine) =>
          medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5); 
  };

  
  const selectMedicine = (medicationId: string, medicine: Medicine) => {
    updateMedication(medicationId, "name", medicine.name);
    updateMedication(medicationId, "medicineId", medicine.id);
    setShowSuggestions((prev) => ({ ...prev, [medicationId]: false }));
    setSearchTerms((prev) => ({ ...prev, [medicationId]: medicine.name }));
  };

  
  const addMedication = () => {
    const newMedication: Medication = {
      id: Date.now().toString(),
      medicineId: null,
      name: "",
      quantity: 0,
      dosageMorning: 0,
      dosageNoon: 0,
      dosageAfternoon: 0,
      dosageEvening: 0,
      instruction: "",
      days: 1,
    };
    setMedications([...medications, newMedication]);
  };

  
  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter((med) => med.id !== id));
    }
  };

  
  const updateMedication = (
    id: string,
    field: keyof Medication,
    value: string | number | null
  ) => {
    setMedications(
      medications.map((med) => {
        if (med.id === id) {
          const updatedMed = { ...med, [field]: value };

          
          if (
            field === "dosageMorning" ||
            field === "dosageNoon" ||
            field === "dosageAfternoon" ||
            field === "dosageEvening" ||
            field === "days"
          ) {
            const morning =
              field === "dosageMorning" ? (value as number) : med.dosageMorning;
            const noon =
              field === "dosageNoon" ? (value as number) : med.dosageNoon;
            const afternoon =
              field === "dosageAfternoon"
                ? (value as number)
                : med.dosageAfternoon;
            const evening =
              field === "dosageEvening" ? (value as number) : med.dosageEvening;
            const days = field === "days" ? (value as number) : med.days;

            updatedMed.quantity =
              (morning + noon + afternoon + evening) * (days || 1);
          }

          return updatedMed;
        }
        return med;
      })
    );

    
    if (field === "name") {
      setSearchTerms((prev) => ({ ...prev, [id]: value as string }));
    }
  };

  
  const handleMedicineSearch = (medicationId: string, value: string) => {
    setSearchTerms((prev) => ({ ...prev, [medicationId]: value }));
    setShowSuggestions((prev) => ({
      ...prev,
      [medicationId]: value.length > 0,
    }));
    updateMedication(medicationId, "name", value);
    updateMedication(medicationId, "medicineId", null); 
  };

  
  const handleSavePrescription = async () => {
    if (!patientData || !diagnosisData) return;

    try {
      setSaving(true);
      setError(null);

      
      const validMedications = medications.filter(
        (med) => med.medicineId && med.quantity > 0
      );

      if (validMedications.length === 0) {
        toast.error(
          "Vui long them it nhat mot loai thuoc vao don"
        );
        setError(
          "Vui long them it nhat mot loai thuoc vao don"
        );
        return;
      }

      
      for (let i = 0; i < validMedications.length; i++) {
        const med = validMedications[i];
        const totalDosage =
          (med.dosageMorning || 0) +
          (med.dosageNoon || 0) +
          (med.dosageAfternoon || 0) +
          (med.dosageEvening || 0);

        if (totalDosage <= 0) {
          toast.error(
            `Thuoc "${
              med.name || "thu " + (i + 1)
            }" phai co it nhat mot lieu dung lon hon 0`
          );
          setError(
            `Thuoc "${
              med.name || "thu " + (i + 1)
            }" phai co it nhat mot lieu dung lon hon 0`
          );
          return;
        }

        if (!med.medicineId) {
          toast.error(
            `Vui long chon thuoc cho dong thu ${i + 1}`
          );
          setError(
            `Vui long chon thuoc cho dong thu ${i + 1}`
          );
          return;
        }
      }

      
      let visitId = patientData.visitId;

      
      if (!visitId && patientData.appointmentId) {
        try {
          const { checkInAppointment } = await import(
            "@/features/appointment/services/visit.service"
          );
          const visit = await checkInAppointment(patientData.appointmentId);
          visitId = visit.id;
          console.log("Visit created successfully:", visitId);
          toast.success("Da tao visit cho benh nhan");
        } catch (checkInError: any) {
          const errorMessage =
            checkInError.response?.data?.message ||
            "Khong the tao visit";
          console.error("Check-in error:", errorMessage);
          toast.error(errorMessage);
          setError(errorMessage);
          return;
        }
      }

      if (!visitId) {
        toast.error(
          "Khong tim thay visit ID va khong co appointment ID."
        );
        setError("Khong tim thay visit ID");
        return;
      }

      
      try {
        const { completeVisit } = await import("@/features/appointment/services/visit.service");
        await completeVisit(visitId, {
          diagnosis: diagnosisData.primaryDiagnosis,
          note: diagnosisData.note,
          examinationFee: 100000,
        });
        console.log("Visit completed successfully");
      } catch (visitError: any) {
        
        const msg =
          visitError.response?.data?.message || visitError.message || "";
        if (
          !msg.includes("already completed") &&
          !msg.includes("CANNOT_MODIFY_COMPLETED_VISIT")
        ) {
          const errorMessage =
            visitError.response?.data?.message || "Không thể hoàn thành visit";
          console.error("Visit completion error:", errorMessage);
          toast.error(errorMessage);
          setError(errorMessage);
          return;
        }
        console.warn("Visit already completed, proceeding...", msg);
      }

      
      const prescriptionData = {
        visitId: visitId,
        patientId: patientData.id,
        medicines: validMedications.map((med) => ({
          medicineId: med.medicineId,
          quantity: med.quantity,
          dosageMorning: med.dosageMorning || 0,
          dosageNoon: med.dosageNoon || 0,
          dosageAfternoon: med.dosageAfternoon || 0,
          dosageEvening: med.dosageEvening || 0,
          days: med.days || 1,
          instruction:
            med.instruction ||
            "Uong theo chi dan cua bac si",
        })),
        note: additionalNotes,
      };

      console.log("Saving prescription:", prescriptionData);

      const response = await api.post("/prescriptions", prescriptionData);

      if (response.data.success) {
        console.log("Prescription saved successfully:", response.data);

        
        const invoice = response.data.data?.invoice;
        if (invoice) {
          const examinationFee = Number(invoice.examinationFee || 0).toLocaleString("vi-VN");
          const medicineTotalAmount = Number(invoice.medicineTotalAmount || 0).toLocaleString("vi-VN");
          const totalAmount = Number(invoice.totalAmount || 0).toLocaleString("vi-VN");

          toast.success(
            `Đơn thuốc đã lưu! Hóa đơn ${
              invoice.invoiceCode
            } đã được tạo (khám: ${examinationFee} VNĐ, thuốc: ${medicineTotalAmount} VNĐ, tổng: ${totalAmount} VNĐ). Bệnh nhân có thể thanh toán tại quầy.`,
            { duration: 5000 }
          );
          console.log("Invoice created:", invoice);
        } else {
          toast.success("Lưu đơn thuốc thành công!");
        }

        navigate("/doctor/medicalList");
        return;
      }
    } catch (err: any) {
      console.error("Error saving prescription:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to save prescription";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  
  const handleBackToExamination = async () => {
    if (!patientData?.appointmentId) {
      navigate(`/doctor/patients/${id}/examination`);
      return;
    }

    try {
      setUpdatingAppointment(true);

      
      const validMedications = medications.filter(
        (med) => med.medicineId && med.quantity > 0
      );

      if (validMedications.length > 0) {
        
        let visitId = patientData.visitId;

        if (!visitId && patientData.appointmentId) {
          try {
            const { checkInAppointment } = await import(
              "@/features/appointment/services/visit.service"
            );
            const visit = await checkInAppointment(patientData.appointmentId);
            visitId = visit.id;
            toast.success("Visit created for patient");
          } catch (checkInError: any) {
            const errorMessage =
              checkInError.response?.data?.message || "Cannot create visit";
            console.error("Check-in error:", errorMessage);
            toast.error(errorMessage);
            navigate(`/doctor/patients/${id}/examination`);
            return;
          }
        }

        if (!visitId) {
          console.log("No visitId available, skipping prescription save");
          toast.info("Chua co visit, khong the luu don thuoc");
          navigate(`/doctor/patients/${id}/examination`);
          return;
        }
        const prescriptionData = {
          visitId: visitId,
          patientId: patientData.id,
          medicines: validMedications.map((med) => ({
            medicineId: med.medicineId,
            quantity: med.quantity,
            dosageMorning: med.dosageMorning,
            dosageNoon: med.dosageNoon,
            dosageAfternoon: med.dosageAfternoon,
            dosageEvening: med.dosageEvening,
            days: med.days || 1,
            instruction:
              med.instruction || "Uong theo chi dan cua bac si",
          })),
          note: additionalNotes,
        };

        try {
          await api.post("/prescriptions", prescriptionData);
          console.log("Prescription saved successfully");
          toast.success("Đã lưu đơn thuốc thành công!");
        } catch (prescriptionError: any) {
          console.log(
            "Prescription save failed, continuing with navigation:",
            prescriptionError.response?.data?.message
          );
          toast.error(
            "Không thể lưu đơn thuốc: " +
              (prescriptionError.response?.data?.message ||
                "Lỗi không xác định")
          );
        }
      }

      
      navigate(`/doctor/patients/${id}/examination`);
    } catch (error: any) {
      console.error("Error in handleBackToExamination:", error);
      
      navigate(`/doctor/patients/${id}/examination`);
    } finally {
      setUpdatingAppointment(false);
    }
  };

  if (loading) {
    return (
      <DoctorSidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Loading prescription data...</p>
          </div>
        </div>
      </DoctorSidebar>
    );
  }

  if (error && !patientData) {
    return (
      <DoctorSidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Error loading data</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={() => navigate("/doctor/medicalList")}>
              Back to Medical List
            </Button>
          </div>
        </div>
      </DoctorSidebar>
    );
  }

  if (!patientData || !diagnosisData) {
    return null;
  }

  return (
    <DoctorSidebar>
      <div className="space-y-6">
        {}
        <div className="flex items-center gap-4 -ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/doctor/medicalList")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách bệnh nhân
          </Button>
        </div>

        {}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {}
        <Card className="border-0 shadow-xl shadow-slate-900/5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-white font-bold text-3xl shadow-inner uppercase">
                  {patientData.fullName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {patientData.fullName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-blue-100 font-medium text-sm">
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      <User className="w-4 h-4" />
                      ID: #{patientData.appointmentId}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                      {calculateAge(patientData.dateOfBirth)} tuổi
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                      {patientData.gender === "MALE" ? "Nam" : "Nữ"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                      SĐT: {patientData.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-wider">
                  Ngày khám
                </div>
                <div className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-100">
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        <Card className="border-0 shadow-xl shadow-slate-900/5 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Thông tin chẩn đoán
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Chẩn đoán chính
                  </Label>
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="font-bold text-lg text-blue-900 leading-relaxed">
                      {diagnosisData.primaryDiagnosis}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Triệu chứng & Ghi chú
                  </Label>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {cleanNoteText(diagnosisData.note)}
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <Label className="text-sm font-bold text-slate-700">
                    Chỉ số sinh hiệu
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Huyết áp
                    </div>
                    <div className="text-lg font-black text-slate-800">
                      {diagnosisData.vitalSigns.bloodPressure}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      mmHg
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nhịp tim
                    </div>
                    <div className="text-lg font-black text-emerald-600">
                      {diagnosisData.vitalSigns.heartRate}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      bpm
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-orange-200 transition-colors">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nhiệt độ
                    </div>
                    <div className="text-lg font-black text-orange-500">
                      {diagnosisData.vitalSigns.temperature}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      °C
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Cân nặng
                    </div>
                    <div className="text-lg font-black text-indigo-600">
                      {diagnosisData.vitalSigns.weight}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      kg
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        <Card className="border-0 shadow-xl shadow-slate-900/5 flex flex-col overflow-visible">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Kê đơn thuốc
              </CardTitle>
            </div>
            <Button
              onClick={addMedication}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm thuốc
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-visible">
            <div className="overflow-visible">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[250px]">Tên thuốc</th>
                    <th className="py-3 px-4 w-24 text-center">Số lượng</th>
                    <th className="py-3 px-4 w-20 text-center">Ngày</th>
                    <th className="py-3 px-4 w-16 text-center text-blue-600">
                      Sáng
                    </th>
                    <th className="py-3 px-4 w-16 text-center text-orange-500">
                      Trưa
                    </th>
                    <th className="py-3 px-4 w-16 text-center text-purple-600">
                      Chiều
                    </th>
                    <th className="py-3 px-4 w-16 text-center text-indigo-600">
                      Tối
                    </th>
                    <th className="py-3 px-4 min-w-[200px]">Hướng dẫn</th>
                    <th className="py-3 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medications.map((medication, index) => (
                    <tr
                      key={medication.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-medium text-slate-400 group-hover:text-slate-600">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <Input
                            placeholder="Nhập tên thuốc..."
                            value={
                              searchTerms[medication.id] || medication.name
                            }
                            onChange={(e) =>
                              handleMedicineSearch(
                                medication.id,
                                e.target.value
                              )
                            }
                            onFocus={() =>
                              setShowSuggestions((prev) => ({
                                ...prev,
                                [medication.id]:
                                  (
                                    searchTerms[medication.id] ||
                                    medication.name
                                  ).length > 0,
                              }))
                            }
                            className="w-full font-medium border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {showSuggestions[medication.id] && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                              {getFilteredMedicines(
                                searchTerms[medication.id] || medication.name
                              ).length > 0 ? (
                                getFilteredMedicines(
                                  searchTerms[medication.id] || medication.name
                                ).map((medicine) => (
                                  <div
                                    key={medicine.id}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-b-0 transition-colors"
                                    onClick={() =>
                                      selectMedicine(medication.id, medicine)
                                    }
                                  >
                                    <div className="font-bold text-slate-800 text-sm">
                                      {medicine.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                                      <span>{medicine.category}</span>
                                      <span className="font-medium text-emerald-600">
                                        Kho: {medicine.currentStock}{" "}
                                        {medicine.unit}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-sm text-slate-500 text-center italic">
                                  Không tìm thấy thuốc
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-10 flex items-center justify-center bg-blue-50/50 text-blue-700 font-bold rounded-lg border border-blue-100 min-w-[3rem]">
                          {medication.quantity || 0}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          min="1"
                          value={medication.days || ""}
                          onChange={(e) => {
                            const days = parseInt(e.target.value) || 0;
                            updateMedication(medication.id, "days", days);
                          }}
                          className="h-10 text-center font-bold border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      {[
                        "dosageMorning",
                        "dosageNoon",
                        "dosageAfternoon",
                        "dosageEvening",
                      ].map((field) => (
                        <td key={field} className="py-3 px-2">
                          <Input
                            type="number"
                            min="0"
                            value={medication[field as keyof Medication] || ""}
                            onChange={(e) =>
                              updateMedication(
                                medication.id,
                                field as keyof Medication,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-10 text-center font-semibold text-slate-700 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="py-3 px-4">
                        <Input
                          placeholder="Cách dùng..."
                          value={medication.instruction}
                          onChange={(e) =>
                            updateMedication(
                              medication.id,
                              "instruction",
                              e.target.value
                            )
                          }
                          className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMedication(medication.id)}
                          disabled={medications.length === 1}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
              <Label className="text-sm font-bold text-slate-700 mb-2 block">
                Lời dặn của bác sĩ
              </Label>
              <Textarea
                placeholder="Nhập lời dặn dò cho bệnh nhân..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 mt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBackToExamination}
            disabled={saving || updatingAppointment}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 h-12 px-6 font-medium"
          >
            {updatingAppointment ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Undo2 className="w-5 h-5 mr-2" />
            )}
            Quay lại khám
          </Button>

          <Button
            onClick={handleSavePrescription}
            disabled={saving || updatingAppointment}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all h-12 px-8 font-bold text-base rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Lưu đơn thuốc
              </>
            )}
          </Button>
        </div>
      </div>
    </DoctorSidebar>
  );
}
