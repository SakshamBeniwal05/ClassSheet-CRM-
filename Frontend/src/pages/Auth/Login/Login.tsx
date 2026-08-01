import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { userStore } from '../../../store/userStore';

/**
 * Iron & Sand CRM - Login & Registration Screen
 * 
 * Design System: {{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}
 * Palette: #DB422A (Primary), #242424 (Surface), #E48520 (Accent), #DBCCAB (Muted)
 */

const Login = () => {
  const [mode, setMode] = useState('signin'); // 'signin' or 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organisationName, setOrganisationName] = useState('');

  const login = userStore((state: any) => state.login);
  const registerUserWithNewOrg = userStore((state: any) => state.registerUserWithNewOrg);
  const isLoggingIn = userStore((state: any) => state.isLoggingIn);
  const isRegistering = userStore((state: any) => state.isRegistering);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      await login({ email, password });
    } else {
      await registerUserWithNewOrg({ name, email, password, organisationName });
    }
  };

  return (
    <div className="min-h-screen bg-[#191302] text-[#DBCCAB] font-inter flex items-center justify-center p-6 selection:bg-[#DB422A]/30">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Form */}
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DB422A] rounded-lg flex items-center justify-center shadow-lg shadow-[#DB422A]/20">
              <div className="w-4 h-4 bg-white/20 rounded-full blur-[1px]"></div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Core CRM</h1>
          </div>

          <div className="bg-[#221b06] p-1 rounded-xl flex">
            <button 
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === 'signin' ? 'bg-[#413820] text-white shadow-sm' : 'text-[#DBCCAB]/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === 'register' ? 'bg-[#413820] text-white shadow-sm' : 'text-[#DBCCAB]/60 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-widest font-bold text-[#DBCCAB]/50">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border-none rounded-lg py-4 px-4 text-[#191302] placeholder:text-[#191302]/40 focus:ring-2 focus:ring-[#DB422A] transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-[#DBCCAB]/50">Password</label>
                  <button type="button" className="text-[11px] font-bold text-[#DB422A] hover:underline">Forgot?</button>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border-none rounded-lg py-4 px-4 text-[#191302] placeholder:text-[#191302]/40 focus:ring-2 focus:ring-[#DB422A] transition-all outline-none"
                />
              </div>

              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-[#DBCCAB]/50">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === 'register'}
                      className="w-full bg-white border-none rounded-lg py-4 px-4 text-[#191302] placeholder:text-[#191302]/40 focus:ring-2 focus:ring-[#DB422A] transition-all outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-[#DBCCAB]/50">Organisation Name</label>
                    <input 
                      type="text" 
                      placeholder="Acme Corp"
                      value={organisationName}
                      onChange={(e) => setOrganisationName(e.target.value)}
                      required={mode === 'register'}
                      className="w-full bg-white border-none rounded-lg py-4 px-4 text-[#191302] placeholder:text-[#191302]/40 focus:ring-2 focus:ring-[#DB422A] transition-all outline-none font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn || isRegistering}
              className="w-full bg-[#DB422A] hover:bg-[#c43621] text-white font-bold py-4 rounded-lg shadow-xl shadow-[#DB422A]/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(isLoggingIn || isRegistering) ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{mode === 'signin' ? 'Accessing Dashboard...' : 'Creating Account...'}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Access Dashboard' : 'Create Account'}</span>
              )}
            </button>

            <p className="text-[12px] text-center text-[#DBCCAB]/40">
              By continuing, you agree to our <span className="text-[#DB422A] cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[#DB422A] cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </form>
        </div>

        {/* Right Side: Hero/Animation Placeholder */}
        <div className="hidden md:block relative h-[600px] rounded-3xl bg-[#221b06] overflow-hidden border border-[#413820]/30 group">
          {/* Mock Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#DB422A] via-transparent to-transparent blur-3xl"></div>
          </div>

          <div className="relative h-full flex flex-col justify-center p-12 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DB422A]/10 border border-[#DB422A]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DB422A] animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#DB422A]">Enterprise Ready</span>
            </div>

            <h2 className="text-5xl font-black text-white leading-tight italic">
              Powering the next <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DB422A] to-[#E48520]">generation</span> of client <br/>
              relationships.
            </h2>

            <p className="text-lg text-[#DBCCAB]/60 max-w-sm leading-relaxed">
              Experience a CRM built for speed, density, and precision. Core CRM transforms complex data into actionable authority.
            </p>

            <div className="grid grid-cols-3 gap-8 pt-12 border-t border-[#413820]/50">
              <div>
                <div className="text-2xl font-black text-white">99.9%</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#DBCCAB]/40">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">256-bit</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#DBCCAB]/40">Encryption</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">1.2ms</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#DBCCAB]/40">Latency</div>
              </div>
            </div>
          </div>
          
          {/* Interactive Element Placeholder */}
          <div className="absolute bottom-6 right-6 flex gap-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#DBCCAB]/10 group-hover:bg-[#DB422A]/40 transition-colors"></div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;