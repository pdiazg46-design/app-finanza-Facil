"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function InAppBrowserGuard() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Reglas de detección para los navegadores in-app más comunes que bloquean Google Auth
    const rules = [
      /Instagram/i,
      /FBAN/i, // Facebook App
      /FBAV/i, // Facebook App Version
      /LinkedInApp/i, // LinkedIn
      /WhatsApp/i, // WhatsApp (a veces usa webview)
      /Line/i,
      /Twitter/i,
      /Snapchat/i,
    ];

    const isDetected = rules.some((rule) => rule.test(userAgent));
    setIsInAppBrowser(isDetected);
  }, []);

  const handleOpenInBrowser = () => {
    // Intentar forzar la apertura en el navegador del sistema
    // Esto funciona en algunos casos al intentar navegar a la misma URL
    window.location.href = window.location.href;
  };

  return (
    <AnimatePresence>
      {isInAppBrowser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-md space-y-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-500/50"
            >
              <XCircle className="h-12 w-12 text-red-500" />
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Navegador No Soportado
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Por seguridad, Google no permite iniciar sesión desde dentro de esta aplicación (Instagram, Facebook, etc.).
              </p>
            </div>

            <div className="space-y-4 rounded-xl bg-white/10 p-6 text-left ring-1 ring-white/10">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <span className="font-bold text-white">1</span>
                </div>
                <p className="text-gray-200">
                  Busca el menú de opciones (generalmente <span className="font-bold">•••</span> o tres puntos) en la esquina superior.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <span className="font-bold text-white">2</span>
                </div>
                <p className="text-gray-200">
                  Selecciona la opción <span className="font-bold text-white">"Abrir en el navegador"</span> o "Open in Browser".
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleOpenInBrowser}
                className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-lg rounded-full"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Intentar Abrir
              </Button>
               <p className="mt-4 text-xs text-gray-500">
                Si el botón no funciona, sigue los pasos manuales de arriba.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
