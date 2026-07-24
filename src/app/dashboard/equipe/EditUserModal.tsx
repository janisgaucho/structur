'use client'

import { useState } from 'react'
import { useDictionary } from '@/components/DictionaryProvider'
import { updateUser, deleteUser } from '@/actions/equipe'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"

type Project = {
  id: string;
  name: string;
};

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
};

export function EditUserModal({ user, projects, roles }: { user: User, projects: Project[], roles: any[] }) {
  const dict = useDictionary()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>(user.role || '')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const getRoleDisplayName = (val: string) => {
    if (!val) return "";
    let displayName = (dict as Record<string, string>)[`equipe_role_${val}`];
    if (!displayName) {
      const withSpaces = val.replace(/_/g, ' ');
      displayName = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    }
    return displayName;
  }

  const handleFormAction = async (formData: FormData) => {
    const result = await updateUser(user.id, formData)
    if (result?.error) {
      alert(result.error)
    } else {
      setOpen(false) // Ferme la modale en cas de succès
    }
  }

  const handleDelete = async () => {
    if (confirm(dict.equipe_confirm_delete || "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      setIsDeleting(true);
      const result = await deleteUser(user.id);
      if (result?.error) {
        alert(result.error);
      } else {
        setOpen(false); // Ferme la modale en cas de succès
      }
      setIsDeleting(false);
    }
  }

  const projectOptions = projects.map(p => ({ label: p.name, value: p.id }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer">
          {dict.equipe_bouton_modifier || 'Modifier'}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dict.equipe_modal_titre_modifier || "Modifier l'utilisateur"}</DialogTitle>
          <DialogDescription>{dict.equipe_modal_desc_modifier || "Mettez à jour les informations de l'utilisateur."}</DialogDescription>
        </DialogHeader>
        <form action={handleFormAction}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">{dict.equipe_label_prenom}</Label>
              <input id="first_name" name="first_name" required defaultValue={user.first_name || ''} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">{dict.equipe_label_nom}</Label>
              <input id="last_name" name="last_name" required defaultValue={user.last_name || ''} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{dict.equipe_col_email}</Label>
              <input id="email" name="email" type="email" required defaultValue={user.email || ''} className="w-full bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-200 px-3 py-2 rounded-lg" readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">{dict.equipe_label_role}</Label>
              <Select name="role" required value={selectedRole} onValueChange={(val) => setSelectedRole(val || '')}>
                <SelectTrigger className="w-full bg-gray-50 border border-gray-200 px-3 py-5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <SelectValue placeholder={dict.equipe_label_role}>
                    {selectedRole ? getRoleDisplayName(selectedRole) : undefined}
                  </SelectValue>
                </SelectTrigger>
                {/* @ts-expect-error - La propriété position est supportée par Radix mais absente des types Shadcn par défaut */}
                <SelectContent position="popper" side="bottom" sideOffset={4} className="w-[var(--radix-select-trigger-width)] z-50">
                  {roles.map((roleObj: any) => {
                    const rawValue = typeof roleObj === 'string' 
                      ? roleObj 
                      : (roleObj?.enum_value || roleObj?.enumlabel || Object.values(roleObj)[0]);
                    if (!rawValue || typeof rawValue !== 'string') return null;
                    return (
                      <SelectItem key={rawValue} value={rawValue}>
                        {getRoleDisplayName(rawValue)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project_id">{dict.equipe_label_chantier}</Label>
              <MultiSelect
                options={projectOptions}
                onValueChange={setSelectedProjects}
                defaultValue={selectedProjects}
                placeholder="Sélectionner des chantiers..."
                maxCount={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              />
            </div>
          </div>
          <input type="hidden" name="role" value={selectedRole} />
          <input type="hidden" name="project_ids" value={JSON.stringify(selectedProjects)} />
          <DialogFooter className="-mx-4 -mb-4 mt-6 flex flex-col-reverse items-center gap-2 border-t p-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto text-left sm:text-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed mt-4 sm:mt-0 cursor-pointer"
            >
              {isDeleting ? (dict.equipe_bouton_suppression_en_cours || 'Suppression...') : (dict.equipe_bouton_supprimer || 'Supprimer')}
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">
              {dict.equipe_bouton_valider_modification || 'Enregistrer les modifications'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}