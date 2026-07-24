// src/app/login/page.tsx
import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  // On "attend" la résolution de la promesse pour lire le message
  const resolvedParams = await searchParams;
  const message = resolvedParams?.message;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <Link href="/">
            <Image 
              src="/logo_structur.png"
              alt="Varman Rénovation"
              width={200}
              height={56}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        <form className="flex flex-col w-full gap-4 bg-white p-8 rounded-2xl shadow-sm border border-black/5">
          {message && (
            <p className="p-3 bg-red-50 text-red-600 text-center text-sm font-medium rounded-lg mb-2">
              {message}
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-600">
            Adresse Email
            <input name="email" type="email" required placeholder="jean@exemple.com" className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-600 mt-1">
            Mot de passe
            <input name="password" type="password" required className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
          </label>

          <div className="flex flex-col gap-3 mt-4">
            <button formAction={login} className="bg-[#0071E3] text-white font-semibold py-3 rounded-lg hover:bg-[#0077ED] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0071E3] cursor-pointer">
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}