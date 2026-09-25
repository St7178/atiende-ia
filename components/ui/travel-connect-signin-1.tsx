"use client";

import React, { forwardRef, useActionState, useRef, useState } from "react";
import { Eye, EyeOff, ArrowRight, Bot, Headset, MessageCircle, Users, Workflow } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { BrandLogo } from "@/components/BrandLogo";
import { login, type LoginState } from "@/app/login/actions";
import { brand } from "@/lib/brand";

// Diseño basado en "travel-connect-signin-1": el mapa de puntos del panel
// izquierdo se reemplazo por un AnimatedBeam (WhatsApp -> portal -> IA/asesores)
// y los azules por los colores de la marca (lib/brand.ts).

// Custom Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

const Button = ({ children, variant = "default", className = "", ...props }: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

  const variantStyles = {
    default: "bg-gradient-to-r from-brand to-brand-2 text-white hover:brightness-95",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Custom Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

const Circle = forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode; title?: string }>(
  ({ className, children, title }, ref) => {
    return (
      <div
        ref={ref}
        title={title}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full border-2 border-brand-soft-2 bg-white p-3 text-brand-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
Circle.displayName = "Circle";

const WhatsAppIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 175.216 175.552" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wa-grad" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#57d163" />
        <stop offset="1" stopColor="#23b33a" />
      </linearGradient>
    </defs>
    <path
      d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
      fill="#ffffff"
    />
    <path
      d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"
      fill="url(#wa-grad)"
    />
    <path
      d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
      fill="#ffffff"
      fillRule="evenodd"
    />
  </svg>
);

// Diagrama animado: clientes de WhatsApp entran al portal y este los
// reparte entre el asistente de IA, los asesores y los flujos de n8n.
const BeamNetwork = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  const beam = {
    gradientStartColor: brand.colors.brand,
    gradientStopColor: brand.colors.brand2,
    pathColor: brand.colors.brand2,
    pathOpacity: 0.15,
  };

  return (
    <div className="relative flex h-[290px] w-full items-center justify-center overflow-hidden px-8" ref={containerRef}>
      <div className="flex size-full max-w-sm max-h-[250px] flex-col items-stretch justify-between gap-4">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} title="WhatsApp" className="p-2.5">
            <WhatsAppIcon />
          </Circle>
          <Circle ref={div5Ref} title="Asistente IA">
            <Bot className="size-6" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref} title="Clientes">
            <MessageCircle className="size-6" />
          </Circle>
          <Circle ref={div4Ref} className="size-24 border-brand-soft-2 p-0">
            <BrandLogo className="size-full" />
          </Circle>
          <Circle ref={div6Ref} title="Asesores">
            <Headset className="size-6" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref} title="Contactos">
            <Users className="size-6" />
          </Circle>
          <Circle ref={div7Ref} title="Automatizaciones">
            <Workflow className="size-6" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam {...beam} containerRef={containerRef} fromRef={div1Ref} toRef={div4Ref} curvature={-75} endYOffset={-10} duration={5} />
      <AnimatedBeam {...beam} containerRef={containerRef} fromRef={div2Ref} toRef={div4Ref} duration={5.5} />
      <AnimatedBeam {...beam} containerRef={containerRef} fromRef={div3Ref} toRef={div4Ref} curvature={75} endYOffset={10} duration={6} />
      <AnimatedBeam {...beam} containerRef={containerRef} fromRef={div5Ref} toRef={div4Ref} curvature={-75} endYOffset={-10} reverse duration={5.2} />
      <AnimatedBeam {...beam} containerRef={containerRef} fromRef={div6Ref} toRef={div4Ref} reverse duration={5.8} />
      <AnimatedBeam {...beam} containerRef={containerRef} fromRef={div7Ref} toRef={div4Ref} curvature={75} endYOffset={10} reverse duration={6.3} />
    </div>
  );
};

const LOGIN_ERRORS: Record<string, string> = {
  google_no_account: "Tu cuenta de Google no está registrada en el portal. Pídele al administrador que agregue tu correo.",
  google_error: "No se pudo iniciar sesión con Google. Intenta de nuevo.",
  google_off: "El acceso con Google no está configurado.",
  inactive: "Tu usuario fue desactivado o tu sesión ya no es válida.",
};

type SignInProps = { from?: string; googleEnabled?: boolean; error?: string };

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const SignInCard = ({ from, googleEnabled, error }: SignInProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, {});
  const errorMessage = state.error ?? (error ? LOGIN_ERRORS[error] : undefined);

  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        {/* Left side - Animated beam */}
        <div className="hidden md:block w-1/2 h-[600px] relative overflow-hidden border-r border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-soft to-brand-soft-2">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full mb-6"
              >
                <BeamNetwork />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="font-heading text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2"
              >
                {brand.name}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-sm text-center text-gray-600 max-w-xs"
              >
                {brand.loginDescription}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BrandLogo className="size-20 mb-6 md:hidden shadow-md" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1 text-gray-800">Bienvenido de nuevo</h1>
            <p className="text-gray-500 mb-8">Ingresa a tu cuenta del portal</p>

            {googleEnabled && (
              <>
                <a
                  href={`/api/auth/google${from ? `?from=${encodeURIComponent(from)}` : ""}`}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-all duration-300 text-gray-700 shadow-sm"
                >
                  <GoogleIcon />
                  <span>Continuar con Google</span>
                </a>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o con tu usuario</span>
                  </div>
                </div>
              </>
            )}

            <form action={formAction} className="space-y-5">
              <input type="hidden" name="from" value={from ?? ""} />
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario <span className="text-brand-2">*</span>
                </label>
                <Input
                  id="user"
                  name="user"
                  type="text"
                  autoComplete="username"
                  placeholder="Ingresa tu usuario"
                  required
                  className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full focus:border-brand"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña <span className="text-brand-2">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    required
                    className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pr-10 focus:border-brand"
                  />
                  <button
                    type="button"
                    aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {errorMessage}
                </p>
              )}

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    "w-full relative overflow-hidden py-2 rounded-lg transition-all duration-300",
                    isHovered ? "shadow-lg shadow-brand-soft-2" : ""
                  )}
                >
                  <span className="flex items-center justify-center">
                    {isPending ? "Ingresando..." : "Ingresar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                  {isHovered && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </Button>
              </motion.div>

              <p className="text-center mt-6 text-sm text-gray-500">
                ¿Olvidaste tu contraseña? Contacta al administrador del portal.
              </p>
              {brand.credit && <p className="text-center text-xs text-gray-400">{brand.credit}</p>}
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const SignInPage = ({ from, googleEnabled, error }: SignInProps) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-brand-soft to-brand-soft-2 p-4">
      <SignInCard from={from} googleEnabled={googleEnabled} error={error} />
    </div>
  );
};

export default SignInPage;
