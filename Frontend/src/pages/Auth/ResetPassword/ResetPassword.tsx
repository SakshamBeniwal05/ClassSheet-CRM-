import { useState, useEffect } from "react";
import { userStore } from "../../../store/userStore";
import { motion } from "motion/react";
import { Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const { resetPasswordWithOTP, isResettingPassword, setCurrentPage } = (userStore as any)();

    useEffect(() => {
        const storedEmail = sessionStorage.getItem("pending_forgot_email");
        const storedOtp = sessionStorage.getItem("pending_reset_otp");

        if (!storedEmail || !storedOtp) {
            toast.error("Password reset session expired. Please start again.");
            setCurrentPage("dashboard");
            return;
        }

        setEmail(storedEmail);
        setOtp(storedOtp);
    }, [setCurrentPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Client-side validation
        if (!newPassword || !confirmPassword) {
            toast.error("Please enter and confirm your new password");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        // 2. Client-side password comparison
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match! Please check and try again.");
            return;
        }

        // 3. Dispatch to backend
        await resetPasswordWithOTP({
            email,
            inputOtp: otp,
            newPassword
        });
    };

    const handleBack = () => {
        sessionStorage.removeItem("pending_forgot_email");
        sessionStorage.removeItem("pending_reset_otp");
        sessionStorage.removeItem("otp_mode");
        setCurrentPage("dashboard");
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
                    className="absolute top-6 left-6 text-[#DBCCAB] hover:text-[#F1E1BF] flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                    <ArrowLeft className="w-4 h-4 text-[#DB422A]" />
                    Back to Login
                </button>

                <div className="flex flex-col items-center text-center space-y-6 pt-6">
                    <div className="w-14 h-14 bg-[#DB422A]/10 border border-[#DB422A]/30 rounded-2xl flex items-center justify-center shadow-lg shadow-[#DB422A]/5">
                        <Lock className="text-[#DB422A] w-7 h-7" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-sans font-bold text-2xl tracking-tight text-[#F1E1BF]">
                            Create New Password
                        </h2>
                        <p className="text-sm text-[#DBCCAB]/80 px-2 leading-relaxed">
                            Setting a new password for <br />
                            <span className="text-[#E48520] font-semibold">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
                        {/* New Password */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-[#DBCCAB]/70 font-semibold">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isResettingPassword}
                                    className="w-full p-3 pr-10 rounded-lg input-field text-sm text-[#F1E1BF] bg-[#242424]/80 shadow-inner focus:border-[#DB422A] disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#DBCCAB] hover:text-[#F1E1BF] focus:outline-none bg-transparent border-none cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-[#DBCCAB]/70 font-semibold">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isResettingPassword}
                                    className="w-full p-3 pr-10 rounded-lg input-field text-sm text-[#F1E1BF] bg-[#242424]/80 shadow-inner focus:border-[#DB422A] disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#DBCCAB] hover:text-[#F1E1BF] focus:outline-none bg-transparent border-none cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Passwords Match Indicator */}
                        {confirmPassword && (
                            <div className="flex items-center gap-2 pt-1 text-xs">
                                {newPassword === confirmPassword ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                                    </span>
                                ) : (
                                    <span className="text-rose-400 font-medium">
                                        Passwords do not match
                                    </span>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isResettingPassword}
                            className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white mt-4 shadow-lg active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                        >
                            {isResettingPassword ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                "Update Password & Login"
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
