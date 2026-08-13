import { useState, useRef, useEffect } from "react";
import { userStore } from "../../store/userStore";
import { motion } from "motion/react";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";

export const OTP = () => {
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [resendTimer, setResendTimer] = useState<number>(30);
    const [email, setEmail] = useState<string>("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { verifyOTPAndRegister, sendRegistrationMail, isRegistering, setCurrentPage } = (userStore as any)();

    useEffect(() => {
        const detailsStr = localStorage.getItem("registration_details");
        if (detailsStr) {
            try {
                const details = JSON.parse(detailsStr);
                if (details.email) {
                    setEmail(details.email);
                }
            } catch (e) {
                console.error("Failed to parse registration details", e);
            }
        } else {
            toast.error("No registration details found. Redirecting...");
            setCurrentPage("dashboard");
        }
    }, [setCurrentPage]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return; // Allow only numbers
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input if filled
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").trim();
        if (data.length === 6 && !isNaN(Number(data))) {
            const newOtp = data.split("");
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        await verifyOTPAndRegister(otpCode);
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        const success = await sendRegistrationMail(email);
        if (success) {
            setResendTimer(30);
            setOtp(Array(6).fill(""));
            inputRefs.current[0]?.focus();
        }
    };

    const handleBack = () => {
        setCurrentPage("dashboard"); // Renders Login as userData is null
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#191302] text-[#f1e1bf] px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl relative overflow-hidden"
            >
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="absolute top-6 left-6 text-[#DBCCAB] hover:text-[#F1E1BF] flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 text-[#DB422A]" />
                    Back
                </button>

                <div className="flex flex-col items-center text-center space-y-6 pt-6">
                    <div className="w-14 h-14 bg-[#DB422A]/10 border border-[#DB422A]/30 rounded-2xl flex items-center justify-center shadow-lg shadow-[#DB422A]/5">
                        <KeyRound className="text-[#DB422A] w-7 h-7 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-sans font-bold text-2xl tracking-tight text-[#F1E1BF]">
                            Verification Code
                        </h2>
                        <p className="text-sm text-[#DBCCAB]/80 px-2 leading-relaxed">
                            We have sent a 6-digit OTP code to <br />
                            <span className="text-[#E48520] font-semibold">{email || "your email"}</span>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        <div className="flex justify-between gap-2 max-w-sm mx-auto" onPaste={handlePaste}>
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { inputRefs.current[idx] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className="w-12 h-12 text-center text-xl font-bold rounded-lg input-field text-[#F1E1BF] focus:border-[#DB422A] transition-all bg-[#242424]/80 shadow-inner"
                                    required
                                    disabled={isRegistering}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white shadow-lg active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                        >
                            {isRegistering ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify Code & Register"
                            )}
                        </button>
                    </form>

                    <div className="text-sm">
                        {resendTimer > 0 ? (
                            <span className="text-[#DBCCAB]/60">
                                Resend code in <strong className="text-[#E48520]">{resendTimer}s</strong>
                            </span>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-[#DB422A] hover:underline font-semibold bg-transparent border-none cursor-pointer"
                            >
                                Resend Code
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OTP;
