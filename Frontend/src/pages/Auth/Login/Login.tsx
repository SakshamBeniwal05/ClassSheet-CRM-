import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { userStore } from "../../../store/userStore"
import { Database, Eye, EyeOff } from "lucide-react"
import SubSelectToggleDemo from "../../../components/ui/sub-select-toggle/demo"
import SubSelectToggle from "../../../components/ui/sub-select-toggle"
import type { MenuItem } from "../../../components/ui/sub-select-toggle"
import { motion, AnimatePresence } from "motion/react"

const loadThreeJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if ((window as any).THREE) {
            resolve((window as any).THREE);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js";
        script.async = true;
        script.onload = () => {
            resolve((window as any).THREE);
        };
        script.onerror = (err) => {
            reject(err);
        };
        document.body.appendChild(script);
    });
};

const INITIAL_TAB: [MenuItem, MenuItem] = [
    { label: "Login", value: "login" },
    { label: "Register", value: "register" },
];
const SUB_TABS: [MenuItem, MenuItem] = [
    { label: "New Org", value: "newOrg" },
    { label: "Existing Org", value: "existingOrg" },
];

const Login = () => {
    const [tab, setTab] = useState<MenuItem>(INITIAL_TAB[0])
    const [subTab, setSubTab] = useState<MenuItem>(SUB_TABS[0]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showSignInPassword, setShowSignInPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    const {
        isLoggingIn,
        isRegistering,
        isJoining,
        login,
        sendRegistrationMail,
        setCurrentPage
    } = (userStore as any)();

    const { register: registerSignIn, handleSubmit: handleSignInSubmit } = useForm<any>();
    const { register: registerAuth, handleSubmit: handleRegisterSubmit } = useForm<any>();

    // Dynamic 3D Geometric Animation Background using ThreeJS CDN
    useEffect(() => {
        let active = true;
        let renderer: any = null;
        let animationFrameId: number;

        const initThree = async () => {
            try {
                const THREE = await loadThreeJS();
                if (!active || !containerRef.current) return;

                const container = containerRef.current;
                const width = container.clientWidth || window.innerWidth;
                const height = container.clientHeight || window.innerHeight;

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

                renderer.setSize(width, height);
                renderer.setPixelRatio(window.devicePixelRatio || 1);
                container.appendChild(renderer.domElement);

                // Geometry: A wireframe dodecahedron and a surrounding cloud of particles
                const geometry = new THREE.IcosahedronGeometry(2, 1);
                const material = new THREE.MeshPhongMaterial({
                    color: 0xDB422A,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8
                });
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);

                // Inner core
                const coreGeo = new THREE.SphereGeometry(0.8, 16, 16);
                const coreMat = new THREE.MeshPhongMaterial({
                    color: 0xE48520,
                    emissive: 0xDB422A,
                    emissiveIntensity: 0.5
                });
                const core = new THREE.Mesh(coreGeo, coreMat);
                scene.add(core);

                // Particles
                const particlesGeometry = new THREE.BufferGeometry();
                const particlesCount = 500;
                const posArray = new Float32Array(particlesCount * 3);

                for (let i = 0; i < particlesCount * 3; i++) {
                    posArray[i] = (Math.random() - 0.5) * 10;
                }

                particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
                const particlesMaterial = new THREE.PointsMaterial({
                    size: 0.05,
                    color: 0xDBCCAB,
                    transparent: true,
                    opacity: 0.6
                });
                const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
                scene.add(particlesMesh);

                // Lights
                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.position.set(1, 1, 2);
                scene.add(light);
                scene.add(new THREE.AmbientLight(0x404040));

                camera.position.z = 5;

                const animate = () => {
                    if (!active) return;
                    animationFrameId = requestAnimationFrame(animate);
                    mesh.rotation.y += 0.005;
                    mesh.rotation.x += 0.003;
                    core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
                    particlesMesh.rotation.y -= 0.001;
                    renderer.render(scene, camera);
                };

                const handleResize = () => {
                    if (!container) return;
                    const w = container.clientWidth || window.innerWidth;
                    const h = container.clientHeight || window.innerHeight;
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                };

                window.addEventListener('resize', handleResize);
                animate();

                // Save references for clean up
                (container as any)._cleanup = () => {
                    window.removeEventListener('resize', handleResize);
                };
            } catch (err) {
                console.error("Failed to load Three.js library", err);
            }
        };

        initThree();

        return () => {
            active = false;
            cancelAnimationFrame(animationFrameId);
            if (renderer) {
                renderer.dispose();
            }
            if (containerRef.current) {
                const container = containerRef.current;
                if ((container as any)._cleanup) {
                    (container as any)._cleanup();
                }
                container.innerHTML = "";
            }
        };
    }, []);

    const onSubmitSignIn = async (data: any) => {
        await login(data);
    };

    const onSubmitRegister = async (data: any) => {
        const details = {
            name: data.name,
            email: data.email,
            password: data.password,
            registrationPath: subTab.value,
            organisationName: subTab.value === "newOrg" ? data.organisationName : undefined,
            inviteToken: subTab.value === "existingOrg" ? data.inviteToken : undefined
        };
        localStorage.setItem("registration_details", JSON.stringify(details));
        const success = await sendRegistrationMail(data.email);
        if (success) {
            setCurrentPage('otp');
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-colorSecondary text-tPrimary">
            {/* Left Side: Form Section */}
            <section className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 md:px-12 z-10 custom-scrollbar overflow-y-auto bg-colorSecondary">
                <div className="w-full max-w-md space-y-6 py-8">
                    {/* Branding */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-colorPrimary flex items-center justify-center rounded-lg">
                            <Database className="text-white w-6 h-6" />
                        </div>
                        <h1 className="font-sans font-semibold text-2xl tracking-tighter text-tInverted">Core CRM</h1>
                    </div>

                    {/* Toggle UI using original SubSelectToggleDemo switch */}
                    <div className="w-full">
                        <SubSelectToggleDemo tab={tab} setTab={setTab} disabled={isLoggingIn || isRegistering || isJoining} />
                    </div>

                    {/* Sign In Form */}
                    <AnimatePresence mode="wait">
                        {tab.value === "login" && (
                            <motion.div
                                key="login-form"
                                initial={{ height: 0, opacity: 0, y: 15 }}
                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: 15 }}
                                transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                                className="overflow-hidden w-full"
                            >
                                <form className="space-y-4" onSubmit={handleSignInSubmit(onSubmitSignIn)}>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Email Address
                                        </label>
                                        <input
                                            className="w-full p-3 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                            placeholder="name@company.com"
                                            type="email"
                                            required
                                            disabled={isLoggingIn}
                                            {...registerSignIn("email")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Password
                                            </label>
                                            <a className="text-xs text-colorPrimary hover:underline" href="#">
                                                Forgot?
                                            </a>
                                        </div>
                                        <div className="relative">
                                            <input
                                                className="w-full p-3 pr-10 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                                placeholder="••••••••"
                                                type={showSignInPassword ? "text" : "password"}
                                                required
                                                disabled={isLoggingIn}
                                                {...registerSignIn("password")}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSignInPassword(!showSignInPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-tPrimary hover:text-tInverted focus:outline-none bg-transparent border-none cursor-pointer"
                                            >
                                                {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white mt-6 shadow-lg active:scale-95 disabled:opacity-50"
                                        type="submit"
                                        disabled={isLoggingIn}
                                    >
                                        {isLoggingIn ? "Accessing Dashboard..." : "Access Dashboard"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Register Form */}
                        {tab.value === "register" && (
                            <motion.div
                                key="register-forms"
                                initial={{ height: 0, opacity: 0, y: 15 }}
                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: 15 }}
                                transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                                className="overflow-hidden w-full"
                            >
                                <form className="space-y-4" onSubmit={handleRegisterSubmit(onSubmitRegister)}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Full Name
                                            </label>
                                            <input
                                                className="w-full p-3 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                                placeholder="John Doe"
                                                type="text"
                                                required
                                                disabled={isRegistering || isJoining}
                                                {...registerAuth("name")}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Email
                                            </label>
                                            <input
                                                className="w-full p-3 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                                placeholder="john@work.com"
                                                type="email"
                                                required
                                                disabled={isRegistering || isJoining}
                                                {...registerAuth("email")}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                className="w-full p-3 pr-10 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                                placeholder="Create a strong password"
                                                type={showRegisterPassword ? "text" : "password"}
                                                required
                                                disabled={isRegistering || isJoining}
                                                {...registerAuth("password")}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-tPrimary hover:text-tInverted focus:outline-none bg-transparent border-none cursor-pointer"
                                            >
                                                {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Registration Path Toggle inside register form */}
                                    <div className="pt-2 flex flex-col items-start gap-2">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Registration Path
                                        </label>
                                        <div className="w-full flex justify-center">
                                            <SubSelectToggle
                                                id="auth-sub-tabs"
                                                tabs={SUB_TABS}
                                                tab={subTab}
                                                setTab={setSubTab}
                                                disabled={isRegistering || isJoining}
                                            />
                                        </div>
                                    </div>

                                    {/* Conditional fields based on selected Registration Path */}
                                    <AnimatePresence mode="wait">
                                        {subTab.value === "newOrg" ? (
                                            <motion.div
                                                key="org-name-field"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-1 pt-2 overflow-hidden"
                                            >
                                                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                    Organization Name
                                                </label>
                                                <input
                                                    className="w-full p-3 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                                    placeholder="Acme Corp"
                                                    type="text"
                                                    required
                                                    disabled={isRegistering || isJoining}
                                                    {...registerAuth("organisationName")}
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="invite-token-field"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-1 pt-2 overflow-hidden"
                                            >
                                                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                    Invite Token
                                                </label>
                                                <input
                                                    className="w-full p-3 rounded-lg input-field text-sm text-tInverted disabled:opacity-50"
                                                    placeholder="CRT-XXXX-XXXX"
                                                    type="text"
                                                    required
                                                    disabled={isRegistering || isJoining}
                                                    {...registerAuth("inviteToken")}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white mt-6 shadow-lg active:scale-95 disabled:opacity-50"
                                        type="submit"
                                        disabled={isRegistering || isJoining}
                                    >
                                        {isRegistering || isJoining
                                            ? "Registering..."
                                            : subTab.value === "newOrg"
                                            ? "Create Account"
                                            : "Register & Join"}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Meta */}
                    <div className="pt-6 text-center">
                        <p className="text-xs text-on-surface-variant/60">
                            By continuing, you agree to our <a className="underline text-colorPrimary" href="#">Terms of Service</a> and <a className="underline text-colorPrimary" href="#">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Right Side: Immersive Section */}
            <section className="hidden md:flex w-1/2 h-full relative overflow-hidden items-center justify-center bg-colorSecondary">
                {/* 3D Geometric Animation Canvas Container */}
                <div ref={containerRef} className="absolute inset-0 w-full h-full" />
                {/* Overlay Content */}
                <div className="relative z-10 w-full max-w-xl px-12 text-left">
                    <div className="glass-panel p-8 rounded-xl space-y-6 shadow-2xl">
                        <div className="inline-block px-3 py-1 bg-colorPrimary/20 border border-colorPrimary/30 rounded font-semibold text-xs text-colorPrimary uppercase tracking-[0.2em] mb-2">
                            Enterprise Ready
                        </div>
                        <h2 className="font-sans font-bold text-3xl text-on-surface leading-tight text-tPrimary">
                            Powering the next <br /><span className="text-colorTertiary italic">generation</span> of client relationships.
                        </h2>
                        <p className="text-sm text-on-surface-variant max-w-md font-sans text-tPrimary">
                            Experience a CRM built for speed, density, and precision. Core CRM transforms complex data into actionable authority.
                        </p>
                        <div className="flex gap-6 pt-4 text-left">
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-on-surface text-tInverted">99.9%</span>
                                <span className="text-xs text-on-surface-variant uppercase font-semibold text-tPrimary">Uptime</span>
                            </div>
                            <div className="w-px h-10 bg-outline-variant" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-on-surface text-tInverted">256-bit</span>
                                <span className="text-xs text-on-surface-variant uppercase font-semibold text-tPrimary">Encryption</span>
                            </div>
                            <div className="w-px h-10 bg-outline-variant" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-on-surface text-tInverted">1.2ms</span>
                                <span className="text-xs text-on-surface-variant uppercase font-semibold text-tPrimary">Latency</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Atmospheric Particle/Grid Decoration */}
                <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none">
                    <div className="grid grid-cols-6 gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Login;
