import React, { useEffect } from 'react'
import { HeartCrack } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-surface border border-surface-hover rounded-3xl w-full max-w-sm p-6 shadow-premium animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
            <HeartCrack className="w-8 h-8 text-rose-500" />
          </div>
          
          <h2 className="text-2xl font-black text-foreground">
            هتمشي وتسيبنا بدرّي؟ 🥺
          </h2>
          
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            إحنا لسه ما شبعناش منك! قعدتك معانا بتفرق، متأكد إنك عاوز تسجل خروج دلوقتي وتسيب عروضنا الجامدة؟
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-surface-hover">
          <Button 
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-12 text-lg rounded-xl shadow-lg shadow-emerald-500/20"
          >
            لا، خليني شوية معاكم ✨
          </Button>
          <Button 
            variant="ghost" 
            onClick={onConfirm}
            className="w-full text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 h-11 rounded-xl font-medium"
          >
            أيوه، هسجل خروج 😢
          </Button>
        </div>
      </div>
    </div>
  )
}
