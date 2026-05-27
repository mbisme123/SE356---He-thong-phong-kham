"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../features/auth/context/authContext"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Lock, Mail, Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { logError } from "../utils/logger"
import { toast } from "sonner"

const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email bắt buộc nhập")
    .email("Định dạng email không hợp lệ"),
  password: yup
    .string()
    .required("Mật khẩu bắt buộc nhập")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  remember: yup.boolean().default(false),
})

type LoginFormValues = yup.InferType<typeof loginSchema>

export default function Login() {
  const { login, user, isAuthenticated } = useAuth()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = (location.state as any)?.from?.pathname || "/"

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
  })

  
  useEffect(() => {
    if (isAuthenticated && user && location.pathname === "/login" && !hasNavigated) {
      const rawRole = user.roleId || user.role || "patient"
      const userRole = String(rawRole).toLowerCase()
      let targetPath = "/"
      switch (userRole) {
        case "admin":
        case "1":
          targetPath = "/admin/dashboard"
          break
        case "doctor":
        case "4":
          targetPath = "/doctor/dashboard"
          break
        case "patient":
        case "3":
          targetPath = "/patient/dashboard"
          break
        case "receptionist":
        case "2":
        case "staff":
          targetPath = "/receptionist/dashboard"
          break
        default:
          targetPath = from && from !== "/" && from !== "/login" ? from : "/patient/dashboard"
          break
      }

      try {
        setHasNavigated(true)
        navigate(targetPath, { replace: true })
      } catch (navError: any) {
        console.error("Navigation error:", navError)
        setHasNavigated(false)
      }
    }
  }, [isAuthenticated, user, navigate, from, location.pathname, hasNavigated])

  
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail")
    if (savedEmail) {
      setValue("email", savedEmail)
      setValue("remember", true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormValues) => {
    if (isSubmittingForm) return;
    
    if (data.remember) {
      localStorage.setItem("savedEmail", data.email);
    } else {
      localStorage.removeItem("savedEmail");
    }
    
    setError("")
    setIsSubmittingForm(true)
    
    try {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessToken');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const loggedInUser = await login(data.email, data.password, data.remember)
      if (loggedInUser) {
        const rawRole = loggedInUser.roleId || loggedInUser.role || "patient"
        const userRole = String(rawRole).toLowerCase()
        let targetPath = "/"
        switch (userRole) {
          case "admin":
          case "1": targetPath = "/admin/dashboard"; break;
          case "doctor":
          case "4": targetPath = "/doctor/dashboard"; break;
          case "patient":
          case "3": targetPath = "/patient/dashboard"; break;
          case "receptionist":
          case "2":
          case "staff":
          default:
            targetPath = from && from !== "/" && from !== "/login" ? from : "/receptionist/dashboard"
            break
        }
        setHasNavigated(true)
        navigate(targetPath, { replace: true })
      } else {
        setHasNavigated(false)
      }
    } catch (err: any) {
      logError("Login Error", err)
      
      
      if (err.response?.data?.message === "EMAIL_NOT_VERIFIED" || err.response?.status === 403) {
        const emailToVerify = err.response?.data?.data?.email || data.email
        toast.error("Email chưa được xác thực. Đang chuyển hướng...")
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(emailToVerify)}`)
        }, 1500)
        return
      }
      
      if (err.response?.status === 429 || err.message?.includes("Quá nhiều yêu cầu")) {
        const retryAfter = err.response?.headers?.['retry-after'] || err.response?.headers?.['Retry-After'] || err.response?.data?.retryAfter;
        const waitTime = retryAfter ? `${retryAfter} giây` : "30-60 giây";
        setError(`Quá nhiều yêu cầu đăng nhập. Vui lòng đợi ${waitTime} và thử lại.`)
        setTimeout(() => setIsSubmittingForm(false), 60000)
        return
      } else if (err.message?.includes("Đang xử lý đăng nhập")) {
        setError(err.message)
      } else {
        setError(err.message || "Đã có lỗi xảy ra.")
      }
    } finally {
      const currentError = error || "";
      if (!currentError.includes("Quá nhiều yêu cầu")) {
        setTimeout(() => setIsSubmittingForm(false), 1500)
      }
    }
  }

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 overflow-hidden bg-white">
      {}
      <div className="hidden lg:flex relative flex-col justify-center items-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        {}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative z-10 p-12 text-center text-white max-w-lg">
            <div className="mb-8 flex justify-center">
                 <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                 </div>
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-md">HealthCare Plus</h2>
            <p className="text-lg text-blue-100/90 mb-10 leading-relaxed font-light">
                Hệ thống quản lý y tế thông minh. <br/>
                Trải nghiệm đặt lịch và chăm sóc sức khỏe 5 sao.
            </p>
            
            <div className="grid grid-cols-2 gap-6 text-sm font-medium text-white/80">
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" /> 
                    <span>Bảo mật tuyệt đối</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span>Hỗ trợ 24/7</span>
                </div>
            </div>
        </div>
      </div>

      {}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 relative bg-white">
         <Link to="/" className="absolute top-8 left-8 text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-medium group">
             <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Trang chủ
         </Link>

         <div className="w-full max-w-md space-y-8">
             <div className="text-center lg:text-left space-y-2">
                 <h1 className="text-3xl font-bold tracking-tight text-slate-900">Đăng Nhập</h1>
                 <p className="text-slate-500 text-base">Vui lòng nhập thông tin để truy cập hệ thống.</p>
             </div>

             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                 {error && (
                   <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 font-medium animate-in fade-in slide-in-from-top-2">
                     {error}
                   </div>
                 )}

                 <div className="space-y-5">
                     <div className="space-y-2">
                         <Label className="text-slate-700 font-semibold" htmlFor="email">Email</Label>
                         <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                autoComplete="username"
                                {...register("email")}
                              />
                         </div>
                         {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>}
                     </div>

                     <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <Label className="text-slate-700 font-semibold" htmlFor="password">Mật khẩu</Label>
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                              Quên mật khẩu?
                            </Link>
                         </div>
                         <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu"
                              className="pl-12 pr-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                              autoComplete="current-password"
                              {...register("password")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                         </div>
                         {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>}
                     </div>
                 </div>

                 <div className="flex items-center space-x-3">
                   <div className="relative flex items-start">
                     <div className="flex items-center h-5">
                       <input
                         type="checkbox"
                         id="remember"
                         className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                         {...register("remember")}
                       />
                     </div>
                     <div className="ml-3 text-sm">
                       <Label htmlFor="remember" className="font-medium text-slate-700 cursor-pointer select-none">
                         Ghi nhớ đăng nhập
                       </Label>
                     </div>
                   </div>
                 </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-blue-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    disabled={isSubmitting || isSubmittingForm}
                  >
                    {isSubmitting || isSubmittingForm ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" /> Đang xử lý...
                      </>
                    ) : "Đăng Nhập"}
                  </Button>
                  
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400 font-medium">
                        Hoặc đăng nhập với
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-medium text-slate-700"
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/oauth/google`
                    }}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Đăng nhập bằng Google
                  </Button>

                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-500">
                      Chưa có tài khoản?{" "}
                      <Link to="/register" className="text-blue-600 font-bold hover:underline hover:text-blue-700 transition-colors">
                        Đăng ký ngay
                      </Link>
                    </p>
                  </div>
             </form>
         </div>
      </div>
    </div>
  )
}
