'use client'

import { useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { updateProfile } from './actions'

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
}

export function AccountForm({ user, profile, dict, message, successMessage }: { user: User, profile: Profile | null, dict: any, message?: string, successMessage?: string }) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <form action={updateProfile} className="bg-white rounded-3xl p-8 shadow-sm border border-black/4 flex flex-col gap-6">
        {message && (
          <p className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl">
            {message}
          </p>
        )}
        {successMessage && (
          <p className="p-4 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl">
            {successMessage}
          </p>
        )}

        {/* Champs Prénom et Nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="first_name" className="text-sm font-medium text-gray-500">{dict.account_label_firstname}</label>
            {isEditing ? (
              <input type="text" id="first_name" name="first_name" defaultValue={profile?.first_name || ''} placeholder={dict.account_placeholder_firstname} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-semibold text-gray-800 capitalize" />
            ) : (
              <p className="text-lg font-semibold text-gray-800 capitalize">{profile?.first_name || '...'}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="last_name" className="text-sm font-medium text-gray-500">{dict.account_label_lastname}</label>
            {isEditing ? (
              <input type="text" id="last_name" name="last_name" defaultValue={profile?.last_name || ''} placeholder={dict.account_placeholder_lastname} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-semibold text-gray-800 capitalize" />
            ) : (
              <p className="text-lg font-semibold text-gray-800 capitalize">{profile?.last_name || '...'}</p>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full my-2"></div>

        {/* Section Mot de passe (visible en mode édition) */}
        {isEditing && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="new_password" className="text-sm font-medium text-gray-500">Nouveau mot de passe</label>
                <input type="password" id="new_password" name="new_password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-semibold text-gray-800" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="confirm_password" className="text-sm font-medium text-gray-500">Confirmer le mot de passe</label>
                <input type="password" id="confirm_password" name="confirm_password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-semibold text-gray-800" />
              </div>
            </div>
            <div className="h-px bg-gray-100 w-full my-2"></div>
          </>
        )}

        {/* Infos non modifiables */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-500">{dict.account_label_email}</span>
          <span className="text-lg font-semibold text-gray-400 select-none cursor-not-allowed">
            {user.email} <span className="text-xs font-normal ml-2">{dict.account_email_unmodifiable}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-sm font-medium text-gray-500">{dict.account_label_role}</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-fit">
            {dict.header_user_status}
          </span>
        </div>

        {/* Boutons d'action */}
        <div className="mt-4 pt-6 border-t border-gray-100 flex justify-end">
          {isEditing ? (
            <div className='flex gap-3'>
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                {dict.account_button_cancel}
              </button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                {dict.account_button_save}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
              {dict.account_button_edit}
            </button>
          )}
        </div>
      </form>
  );
}