// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import UserMenu from './UserMenu'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getDictionary } from '@/lib/dictionary';
import { DictionaryProvider } from '@/components/DictionaryProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, logo_url, role, created_by')
    .eq('id', user.id)
    .single()
  const dict = await getDictionary();
  const firstName = profile?.first_name || dict.header_default_user
  const lastName = profile?.last_name || ''

  console.log("--- DEBUG LOGO ---");
  console.log("Profil utilisateur connecté:", profile);
  
  let logoUrl = `/logo_structur.png`; // Logo par défaut

  if (profile?.role === 'sous_traitant' && profile.created_by) {
    console.log("Rôle 'sous_traitant' détecté. Recherche du logo de l'admin.");
    console.log("ID du créateur (admin) :", profile.created_by);
    // Si c'est un sous-traitant, on cherche le logo de son créateur (admin)
    // On utilise le client Admin pour outrepasser les RLS de l'utilisateur connecté
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('logo_url')
      .eq('id', profile.created_by)
      .maybeSingle(); // Utilise maybeSingle() pour plus de sécurité, gère 0 ou 1 résultat sans erreur.
    
    if(adminError) console.error("Erreur lors de la récupération du profil admin:", adminError.message);
    console.log("Profil de l'admin récupéré:", adminProfile);

    logoUrl = adminProfile?.logo_url || logoUrl;
  } else if (profile?.logo_url) {
    console.log("Utilisateur non-sous-traitant ou sans créateur, utilisation de son propre logo.");
    // Sinon, on utilise son propre logo s'il existe
    logoUrl = profile.logo_url;
  }
  console.log("URL du logo final:", logoUrl);
  console.log("--- FIN DEBUG LOGO ---");
  // Approche dynamique et robuste pour obtenir le nom du rôle
  const roleKey = profile?.role ? `role_${profile.role}` as keyof typeof dict : null;
  // Utilise la traduction si elle existe, sinon le nom du rôle formaté comme fallback.
  const status = (roleKey && dict[roleKey]) || profile?.role?.replace(/_/g, ' ') || '';

  return (
    <DictionaryProvider dictionary={dict}>
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-black/4 px-8 md:px-12 flex justify-between items-center">
          <Link href="/dashboard" aria-label={dict.layout_return_to_dashboard_label}>
            <div className="flex items-center">
              <img
                src={logoUrl}
                alt={dict.layout_logo_alt} 
                className="h-20 object-contain"
              />
            </div>
          </Link>

          {/* On appelle notre nouveau Client Component ici */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />
            <UserMenu firstName={firstName} lastName={lastName} status={status} role={profile?.role} />
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>

      </div>
    </DictionaryProvider>
  )
}