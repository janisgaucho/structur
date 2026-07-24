'use client'

import { useTransition } from 'react'
import { deleteUser } from '@/actions/equipe'
import { useDictionary } from '@/components/DictionaryProvider'

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const dict = useDictionary()

  const handleClick = () => {
    if (confirm(dict.equipe_confirm_delete)) {
      startTransition(async () => {
        const result = await deleteUser(userId)
        if (result?.error) {
          alert(result.error)
        }
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
    >
      {isPending ? dict.equipe_bouton_suppression_en_cours : dict.equipe_bouton_supprimer}
    </button>
  )
}