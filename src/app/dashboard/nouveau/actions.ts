// src/app/dashboard/nouveau/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Fonction utilitaire pour attendre un certain temps.
 * @param ms - Le temps d'attente en millisecondes.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyse un devis PDF avec une stratégie de tentatives et de fallback.
 * Tente d'utiliser 'gemini-3.5-flash' et bascule sur 'gemini-3.5-flash-lite' en cas d'échecs répétés (503).
 * @param base64Data - Le contenu du fichier en Base64.
 * @param mimeType - Le type MIME du fichier (ex: 'application/pdf').
 * @returns Le résultat de l'analyse par l'IA.
 */
async function analyzeWithRetry(base64Data: string, mimeType: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const primaryModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const prompt = `Analyse ce devis de travaux et retourne UNIQUEMENT un objet JSON valide avec les clés suivantes. Sépare bien les actions (verbe à l'infinitif) des matériaux :
  - "reference" (ex: D-260449)
  - "client_name" (Le nom de famille ou l'entreprise, ex: NGO)
  - "client_address" (L'adresse d'intervention complète, ex: 4 Allée Bougainville 77200 Torcy France)
  - "tasks" (Un tableau de chaînes de caractères listant uniquement les actions à réaliser, ex: ["Dépose papiers peint, enduit...", "Pose de carrelage au sol"])
  - "supplies" (Un tableau de chaînes de caractères listant uniquement les matériaux et fournitures, ex: ["Peinture Tollens Blanc Mat", "Carrelage 60x60cm"])
  - "total_ttc" (Le montant total TTC, ex: 429,00)
  Ne renvoie aucun autre texte, pas de balises markdown, uniquement le JSON pur.`;

  const contentRequest = [prompt, { inlineData: { data: base64Data, mimeType } }];

  let retries = 3;
  let currentDelay = 1000;

  while (retries > 0) {
    try {
      console.log(`Tentative d'appel à gemini-3.5-flash. Essais restants: ${retries}`);
      const result = await primaryModel.generateContent(contentRequest);
      console.log("✅ Devis analysé avec succès par : gemini-3.5-flash");
      return result;
    } catch (error: any) {
      if (error.message.includes('503')) {
        retries--;
        if (retries === 0) break; // Sortir de la boucle pour utiliser le fallback
        console.warn(`Erreur 503. Nouvelle tentative dans ${currentDelay}ms...`);
        await delay(currentDelay);
        currentDelay *= 2; // Double le délai pour la prochaine tentative
      } else {
        throw error; // Si ce n'est pas une erreur 503, on la rejette immédiatement
      }
    }
  }

  // Si toutes les tentatives ont échoué, on utilise le modèle de secours
  console.log("Les tentatives sur le modèle principal ont échoué. Basculement sur gemini-3.1-flash-lite.");
  const result = await fallbackModel.generateContent(contentRequest);
  console.log("⚠️ Devis analysé in extremis par le modèle de secours : gemini-3.1-flash-lite");
  return result;
}

export async function createProject(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const file = formData.get('devis') as File
  if (!file || file.size === 0) {
    return redirect('/dashboard/nouveau?message=Aucun fichier fourni.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  
  // 3. Convertir en Base64 pour l'API Gemini
  const base64Data = buffer.toString('base64');
  
  try {
    // Appel à l'IA avec la nouvelle logique de tentatives
    const result = await analyzeWithRetry(base64Data, 'application/pdf');

    const rawText = result.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(cleanJson);
  
    // 7. Préparer les données pour Supabase
    const name = `Chantier - ${extractedData.client_name}`;
    const description = `Devis réf: ${extractedData.reference}
Adresse: ${extractedData.client_address}
Montant total: ${extractedData.total_ttc} € TTC

Travaux à réaliser :
- ${extractedData.tasks.join('\n- ')}

Fournitures :
- ${extractedData.supplies?.join('\n- ') || 'Aucune fourniture détaillée'}`;
  
    // --- PLACE ICI LA SUITE DE TON CODE (L'insertion dans Supabase projects & project_members) ---
    // 1. Création du chantier
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        address: extractedData.client_address,
        status: 'en_preparation'
      })
      .select()
      .single()
  
    if (projectError || !project) {
      console.error("Erreur détaillée Supabase (création projet) :", projectError)
      redirect('/dashboard/nouveau?message=Erreur lors de la création')
    }
  
    // 2. Assignation de l'utilisateur au chantier (Crucial pour la RLS)
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'maitre_oeuvre'
      })
  
    if (memberError) {
      console.error("Erreur détaillée Supabase (assignation membre) :", memberError)
      redirect('/dashboard/nouveau?message=Erreur lors de l\'assignation')
    }
  
  } catch (error) {
    console.error("Erreur d'analyse IA :", error);
    redirect('/dashboard/nouveau?message=Erreur lors de l\'analyse du devis par l\'IA');
  }

  // 3. Rechargement du dashboard et redirection
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function deleteProject(formData: FormData) {
  const projectId = formData.get('id') as string;
  console.log("=== DEBUG SUPPRESSION ===");
  console.log("1. ID du chantier :", projectId);
  
  // 1. Initialisation de Supabase et vérification stricte de la session
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log("2. ERREUR AUTH : Serveur incapable de lire la session.", authError?.message);
    // On stoppe tout et on redirige
    redirect('/login?message=Session expirée ou introuvable. Veuillez vous reconnecter.');
  }
  
  console.log("2. ID Utilisateur serveur :", user.id);

  // --- LA SUITE DE TON CODE (La requête .delete() avec Supabase) ---
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select();
  
  console.log("3. Réponse Supabase - Erreur :", error);
  
  if (error) {
    console.log("ERREUR SQL CRITIQUE :", error.message);
    return { error: 'Erreur SQL: ' + error.message };
  }
  
  if (!data || data.length === 0) {
    console.log("Suppression silencieusement bloquée (RLS ou introuvable).");
    return { error: 'Erreur de droits de suppression.' };
  }

  // 6. Succès : revalidation et redirection
  revalidatePath('/dashboard');
  return { success: true };
}