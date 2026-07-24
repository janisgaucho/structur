import { getDictionary } from '@/lib/dictionary'
import { getEquipe, getProjects, getRoles } from '@/actions/equipe'
import { AddUserModal } from './AddUserModal'
import EquipePageWrapper from './EquipePageWrapper'
import { EditUserModal } from './EditUserModal'
import { DeleteUserButton } from './DeleteUserButton'

import { Metadata } from 'next'
export const metadata: Metadata = {
  title: "Gestion d'équipe",
};

export default async function EquipePage() {
  const dict = await getDictionary()
  const users = await getEquipe()
  const projects = await getProjects()
  const roles = await getRoles()

  return (
    <EquipePageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{dict.equipe_titre || "Mon Équipe"}</h1>
          <AddUserModal projects={projects} roles={roles} />
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dict.equipe_col_nom || 'Nom'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dict.equipe_col_email || 'Email'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dict.equipe_col_role || 'Rôle'}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'artisan' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
{(dict as Record<string, string>)[`equipe_role_${user.role}`] || user.role.replace('_', ' ')}                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <EditUserModal user={user} projects={projects} roles={roles} />
                      <DeleteUserButton userId={user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>{dict.equipe_no_user || "Vous n'avez pas encore ajouté de membre à votre équipe."}</p>
          </div>
        )}
      </div>
    </EquipePageWrapper>
  );
}