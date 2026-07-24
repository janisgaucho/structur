'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDictionary } from '@/components/DictionaryProvider'
import { addUser } from '@/actions/equipe'
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

type Project = {
  id: string;
  name: string;
};

export function AddUserModal({ projects, roles }: { projects: Project[], roles: any[] }) {
  const dict = useDictionary()
  const [open, setOpen] = useState(false)
  
  // 1. Ajout des états locaux pour contrôler l'affichage des Selects
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')

  const handleFormAction = async (formData: FormData) => {
    const result = await addUser(formData)
    if (result?.error) {
      alert(result.error)
    } else {
      setOpen(false) 
      // 2. On vide les sélections lors de la fermeture ou du succès
      setSelectedRole('')
      setSelectedProject('')
    }
  }

  // 3. Fonction d'aide pour garantir un affichage propre du rôle
  const getRoleDisplayName = (val: string) => {
    if (!val) return "";
    let displayName = (dict as Record<string, string>)[`equipe_role_${val}`];
    
    if (!displayName) {
      const withSpaces = val.replace(/_/g, ' ');
      displayName = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    }
    return displayName;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 bg-[#0071E3] text-white pl-4 pr-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#0077ED] transition-colors shadow-sm h-full cursor-pointer">
        <Plus className="h-4 w-4" />
        {dict.equipe_bouton_ajouter}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dict.equipe_modal_titre}</DialogTitle>
          <DialogDescription>{dict.equipe_modal_desc}</DialogDescription>
        </DialogHeader>
        <form action={handleFormAction}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">{dict.equipe_label_prenom}</Label>
              <input id="first_name" name="first_name" required placeholder={dict.equipe_placeholder_prenom} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">{dict.equipe_label_nom}</Label>
              <input id="last_name" name="last_name" required placeholder={dict.equipe_placeholder_nom} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{dict.equipe_col_email}</Label>
              <input id="email" name="email" type="email" required placeholder={dict.equipe_placeholder_email} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">{dict.equipe_label_role}</Label>
              {/* Le composant est maintenant contrôlé via value et onValueChange */}
              <Select name="role" required value={selectedRole} onValueChange={(val) => setSelectedRole(val || '')}>
                <SelectTrigger className="w-full">
                  {/* On injecte explicitement le nom propre dans le SelectValue */}
                  <SelectValue placeholder={dict.equipe_label_role}>
                    {selectedRole ? getRoleDisplayName(selectedRole) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
              <Select name="project_id" value={selectedProject} onValueChange={(val) => setSelectedProject(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dict.equipe_placeholder_chantier}>
                    {selectedProject ? projects.find(p => p.id === selectedProject)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              {dict.equipe_bouton_valider}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}