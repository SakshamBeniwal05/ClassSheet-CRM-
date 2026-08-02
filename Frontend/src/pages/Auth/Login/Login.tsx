import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { userStore } from "../../../store/userStore"
import { Database } from "lucide-react"
import SubSelectToggleDemo from "../../../components/ui/sub-select-toggle/demo"
import type { MenuItem } from "../../../components/ui/sub-select-toggle"

const loadThreeJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if ((window as any).THREE) {
            resolve((window as any).THREE);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r125/three.min.js";
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

    const {
        isLoggingIn,
        isRegistering,
        isJoining,
        login,
        registerUserWithNewOrg,
        regitserwithExistingOrg,
        joinOrg
    } = (userStore as any)();

    const { register: registerSignIn, handleSubmit: handleSignInSubmit } = useForm<any>();
    const { register: registerNewOrg, handleSubmit: handleNewOrgSubmit } = useForm<any>();
    const { register: registerJoinOrg, handleSubmit: handleJoinOrgSubmit } = useForm<any>();

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

    const onSubmitNewOrg = async (data: any) => {
        await registerUserWithNewOrg(data);
    };

    const onSubmitJoinOrg = async (data: any) => {
        const { name, email, password, inviteToken } = data;
        const registered = await regitserwithExistingOrg({ name, email, password });
        if (registered && inviteToken) {
            await joinOrg({ inviteToken });
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-colorSecondary">
            {/* Left Side: Form Section */}
            <section className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 md:px-12 z-10 custom-scroll overflow-y-auto bg-colorSecondary">
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
                        <SubSelectToggleDemo tab={tab} setTab={setTab} subTab={subTab} setSubTab={setSubTab} />
                    </div>

                    {/* Sign In Form */}
                    {tab.value === "login" && (
                        <form className="space-y-4" onSubmit={handleSignInSubmit(onSubmitSignIn)}>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                    Email Address
                                </label>
                                <input
                                    className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                    placeholder="name@company.com"
                                    type="email"
                                    required
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
                                <input
                                    className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                    placeholder="••••••••"
                                    type="password"
                                    required
                                    {...registerSignIn("password")}
                                />
                            </div>
                            <button
                                className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white mt-6 shadow-lg active:scale-95 disabled:opacity-50"
                                type="submit"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? "Accessing Dashboard..." : "Access Dashboard"}
                            </button>
                        </form>
                    )}

                    {/* Register Forms */}
                    {tab.value === "register" && (
                        <div className="space-y-4">
                            {/* New Org Registration Form */}
                            {subTab.value === "newOrg" && (
                                <form className="space-y-4 animate-in fade-in duration-300" onSubmit={handleNewOrgSubmit(onSubmitNewOrg)}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Full Name
                                            </label>
                                            <input
                                                className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                                placeholder="John Doe"
                                                type="text"
                                                required
                                                {...registerNewOrg("name")}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Email
                                            </label>
                                            <input
                                                className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                                placeholder="john@work.com"
                                                type="email"
                                                required
                                                {...registerNewOrg("email")}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Password
                                        </label>
                                        <input
                                            className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                            placeholder="Create a strong password"
                                            type="password"
                                            required
                                            {...registerNewOrg("password")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Organization Name
                                        </label>
                                        <input
                                            className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                            placeholder="Acme Corp"
                                            type="text"
                                            required
                                            {...registerNewOrg("organisationName")}
                                        />
                                    </div>
                                    <button
                                        className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white mt-6 shadow-lg active:scale-95 disabled:opacity-50"
                                        type="submit"
                                        disabled={isRegistering}
                                    >
                                        {isRegistering ? "Creating Account..." : "Create Account"}
                                    </button>
                                </form>
                            )}

                            {/* Existing Org Registration Form */}
                            {subTab.value === "existingOrg" && (
                                <form className="space-y-4 animate-in fade-in duration-300" onSubmit={handleJoinOrgSubmit(onSubmitJoinOrg)}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Full Name
                                            </label>
                                            <input
                                                className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                                placeholder="John Doe"
                                                type="text"
                                                required
                                                {...registerJoinOrg("name")}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                                Email
                                            </label>
                                            <input
                                                className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                                placeholder="john@work.com"
                                                type="email"
                                                required
                                                {...registerJoinOrg("email")}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Password
                                        </label>
                                        <input
                                            className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                            placeholder="Create a strong password"
                                            type="password"
                                            required
                                            {...registerJoinOrg("password")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                                            Invite Token
                                        </label>
                                        <input
                                            className="w-full p-3 rounded-lg input-field text-sm text-tInverted"
                                            placeholder="CRT-XXXX-XXXX"
                                            type="text"
                                            required
                                            {...registerJoinOrg("inviteToken")}
                                        />
                                    </div>
                                    <button
                                        className="w-full py-3 rounded-lg primary-btn font-semibold text-base text-white mt-6 shadow-lg active:scale-95 disabled:opacity-50"
                                        type="submit"
                                        disabled={isRegistering || isJoining}
                                    >
                                        {isRegistering || isJoining ? "Joining Organisation..." : "Register & Join"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

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

                {/* Background Overlay for Text Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-colorSecondary via-transparent to-transparent opacity-60 pointer-events-none" />
                <div className="absolute inset-0 bg-colorSecondary/10 backdrop-blur-[2px] pointer-events-none" />

                {/* Overlay Content */}
                <div className="relative z-10 w-full max-w-xl px-12 text-left">
                    <div className="glass-panel p-8 rounded-xl space-y-6 shadow-2xl">
                        <div className="inline-block px-3 py-1 bg-colorPrimary/20 border border-colorPrimary/30 rounded font-semibold text-xs text-colorPrimary uppercase tracking-[0.2em] mb-2">
                            Enterprise Ready
                        </div>
                        <h2 className="font-sans font-bold text-3xl text-on-surface leading-tight">
                            Powering the next <br /><span className="text-colorPrimary italic">generation</span> of client relationships.
                        </h2>
                        <p className="text-sm text-on-surface-variant max-w-md font-sans">
                            Experience a CRM built for speed, density, and precision. Core CRM transforms complex data into actionable authority.
                        </p>
                        <div className="flex gap-6 pt-4 text-left">
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-on-surface">99.9%</span>
                                <span className="text-xs text-on-surface-variant uppercase font-semibold">Uptime</span>
                            </div>
                            <div className="w-px h-10 bg-outline-variant" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-on-surface">256-bit</span>
                                <span className="text-xs text-on-surface-variant uppercase font-semibold">Encryption</span>
                            </div>
                            <div className="w-px h-10 bg-outline-variant" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-on-surface">1.2ms</span>
                                <span className="text-xs text-on-surface-variant uppercase font-semibold">Latency</span>
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
