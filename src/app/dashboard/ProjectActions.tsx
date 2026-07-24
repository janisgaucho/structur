'use client'

import { useTransition } from 'react'
import { deleteProject } from './nouveau/actions'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useDictionary } from '@/components/DictionaryProvider'

export function ProjectActions({ projectId }: { projectId: string }) {
  const dict = useDictionary()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData()
      if (projectId) {
        formData.append('id', projectId)
      }
      await deleteProject(formData)
    })
  }

  return (
    <DropdownMenuItem
      onClick={handleDelete}
      disabled={isPending}
      className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 rounded-lg p-2 text-sm"
      onSelect={(e) => e.preventDefault()} // Empêche la fermeture du menu avant la fin
    >
      {isPending
        ? dict.equipe_bouton_suppression_en_cours
        : dict.dashboard_project_card_delete}
    </DropdownMenuItem>
  )
}