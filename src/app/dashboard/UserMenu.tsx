// src/app/dashboard/UserMenu.tsx
'use client'

import { useDictionary } from '@/components/DictionaryProvider';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UserMenu({ 
  firstName, 
  lastName, 
  status,
  role
}: { 
  firstName: string; 
  lastName: string; 
  status: string;
  role?: string | null;
}) {
  const router = useRouter()
  const supabase = createClient()
  const dict = useDictionary();

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-sm font-semibold text-gray-900">
          {firstName} {lastName}
        </span>
        <span className="text-xs text-gray-500">
          {status}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-gray-200" aria-label={dict.user_menu_open_label}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-lg border border-black/4 py-1 z-50 overflow-hidden">
          <DropdownMenuItem className="cursor-pointer p-0">
            <Link href="/dashboard/compte" className="block w-full px-4 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors font-medium  rounded-lg">{dict.user_menu_my_account}</Link>
          </DropdownMenuItem>
          {role !== 'sous_traitant' && (
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link href="/dashboard/equipe" className="block w-full px-4 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors font-medium  rounded-lg">{dict.menu_gestion_equipe}</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="cursor-pointer p-0">
            <Link href="/dashboard/parametres" className="block w-full px-4 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors font-medium rounded-lg">{dict.user_menu_settings}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuItem className="cursor-pointer p-0">
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium cursor-pointer rounded-lg">{dict.user_menu_logout}</button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="p-2 text-center text-[10px] text-gray-500">
            <p>© 2026 Janis Botella.</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Link href="/legal/cgu" className="hover:text-gray-900 transition-colors">CGU</Link>
              <span>-</span>
              <Link href="/legal/confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}