'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Ajuste le chemin selon l'endroit où est ton client Supabase

export default function CreationMotDePasse() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient() // Instanciation de ton client Supabase front-end

  useEffect(() => {
    // Vérifie si l'URL contient des tokens d'authentification
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Extraction des paramètres
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        // Force l'établissement de la session Supabase
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }).then(({ error }) => {
          if (!error) {
            // Nettoie l'URL pour sécuriser les tokens et éviter les bugs de rafraîchissement
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            console.error("Erreur lors de l'établissement de la session:", error);
          }
        });
      }
    }
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      setLoading(false)
      return
    }

    // Mise à jour du mot de passe de l'utilisateur (déjà authentifié par le lien de l'e-mail)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error("Erreur de mise à jour du mot de passe :", error);
      setError(`Erreur : ${error.message}`);
      setLoading(false);
    } else {
      // Succès ! On le redirige vers le tableau de bord
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Bienvenue sur Structur
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Veuillez configurer votre mot de passe pour accéder à vos chantiers.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0071E3] focus:border-[#0071E3] sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0071E3] disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Accéder à mes chantiers'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}