// src/app/dashboard/parametres/page.tsx
"use client";

import { useDictionary } from "@/components/DictionaryProvider";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // Ajuste ce chemin selon ton projet

export default function SettingsPage() {
  const router = useRouter();
  const dict = useDictionary();
  
  // États pour stocker la prévisualisation visuelle
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // États pour stocker les fichiers physiques à envoyer
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');

  const [userRole, setUserRole] = useState<string | null>(null);
  // État de chargement pour le bouton
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchInitialImages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('logo_url, favicon_url, company_name, role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération du profil:", error.message);
        return;
      }

      if (profile?.logo_url) setLogoPreview(profile.logo_url);
      if (profile?.favicon_url) setFaviconPreview(profile.favicon_url);
      if (profile?.company_name) setCompanyName(profile.company_name);
      if (profile?.role) setUserRole(profile.role);
    };
    fetchInitialImages();
  }, [supabase]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!logoFile && !faviconFile && !companyName) return;
    
    setIsSaving(true);

    try {
      // 1. Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autorisé");

      // 1.5. Gestion du nom de l'entreprise
      if (companyName) {
        await supabase.from('profiles')
          .update({ company_name: companyName })
          .eq('id', user.id);
      }
      // 2. Gestion du Logo
      if (logoFile) {
        const logoPath = `logos/${user.id}-${Date.now()}`;
        
        // Upload dans le bucket
        const { error: uploadError } = await supabase.storage
          .from('assets_utilisateurs')
          .upload(logoPath, logoFile, { upsert: true });
          
        if (uploadError) throw uploadError;

        // Récupération de l'URL publique et mise à jour de la BDD
        const { data: { publicUrl: logoUrl } } = supabase.storage.from('assets_utilisateurs').getPublicUrl(logoPath);
        await supabase.from('profiles')
          .update({ logo_url: logoUrl })
          .eq('id', user.id);
      }

      // 3. Gestion du Favicon
      if (faviconFile) {
        const faviconPath = `favicons/${user.id}-${Date.now()}`; // Nom de fichier unique
        
        const { error: uploadError } = await supabase.storage
          .from('assets_utilisateurs')
          .upload(faviconPath, faviconFile, { upsert: true });
          
        if (uploadError) throw uploadError;

        const { data: { publicUrl: faviconUrl } } = supabase.storage.from('assets_utilisateurs').getPublicUrl(faviconPath);
        await supabase.from('profiles')
          .update({ favicon_url: faviconUrl })
          .eq('id', user.id);
      }

      // 4. Rafraîchir l'interface et confirmer
      router.refresh();
      alert("Paramètres mis à jour avec succès !");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
      console.error("Erreur détaillée de Supabase :", errorMessage);
      alert(`Une erreur est survenue lors de l'enregistrement.
Détail : ${errorMessage}`);

    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-gray-50 pt-8 pb-12">
      <button
        onClick={() => router.back()}
        className="absolute left-4 sm:left-6 lg:left-8 top-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors px-3 py-2 rounded-md cursor-pointer w-fit z-10"
        aria-label="Retour à la page précédente"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Retour</span>
      </button>

      <div className="w-full max-w-4xl mx-auto px-4 flex flex-col">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-left mb-1">{dict.settings_page_title}</h1>
          <p className="text-gray-500 text-left mb-8">{dict.settings_page_subtitle}</p>
        </div>

        {userRole !== 'sous_traitant' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Personnalisation</h2>
              <p className="mt-1 text-sm text-gray-500">
                Adaptez l'interface aux couleurs de votre entreprise.
              </p>
            </div>

            <div className="p-6 space-y-8">
              
              {/* Nom de l'entreprise */}
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                  Nom de l'entreprise
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    className="block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Le nom de votre entreprise"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>

              {/* Upload du Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de l'entreprise
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-4 text-center w-full">
                    {logoPreview && (
                      <div className="flex justify-center mb-4">
                        <img src={logoPreview} alt="Aperçu du logo" className="h-20 object-contain" />
                      </div>
                    )}
                    
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>{logoPreview ? "Changer l'image" : "Téléverser un fichier"}</span>
                        <input 
                          id="logo-upload" 
                          name="logo-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                          onChange={handleLogoChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, SVG ou WEBP jusqu'à 2MB</p>
                  </div>
                </div>
              </div>

              {/* Upload du Favicon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon (Icône de l'onglet)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-4 text-center w-full">
                    {faviconPreview && (
                      <div className="flex justify-center mb-4">
                        <img src={faviconPreview} alt="Aperçu du favicon" className="h-10 w-10 object-contain rounded-md shadow-sm border border-gray-200" />
                      </div>
                    )}

                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="favicon-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>{faviconPreview ? "Changer l'image" : "Téléverser un fichier"}</span>
                        <input 
                          id="favicon-upload" 
                          name="favicon-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/png, image/x-icon, image/webp" 
                          onChange={handleFaviconChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">Fichier carré recommandé (PNG, ICO, WEBP).</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSaveChanges}
                  disabled={isSaving || (!logoFile && !faviconFile && !companyName)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>

            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}