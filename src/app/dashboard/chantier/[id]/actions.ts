'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Met à jour les notes d'un projet spécifique.
 * @param projectId - L'ID du projet à mettre à jour.
 * @param notes - Le nouveau contenu des notes.
 */
export async function updateProjectNotes(projectId: string, notes: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase
    .from('projects')
    .update({ notes: notes })
    .eq('id', projectId);

  if (error) {
    console.error("Erreur Supabase [updateProjectNotes]:", error);
    return { error: "Erreur lors de la sauvegarde des notes." };
  }

  revalidatePath(`/dashboard/chantier/${projectId}`);
  return { success: true };
}

/**
 * Met à jour la liste des tâches d'un projet.
 * @param projectId - L'ID du projet à mettre à jour.
 * @param newTasks - Le nouveau tableau de chaînes de caractères pour les tâches.
 */
export async function updateProjectTasks(projectId: string, newTasks: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  // 1. Récupérer la description actuelle pour ne pas écraser les autres infos
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('description')
    .eq('id', projectId)
    .single();

  if (fetchError || !project) {
    console.error("Erreur Supabase [updateProjectTasks - fetch]:", fetchError);
    return { error: "Impossible de récupérer les données du projet." };
  }

  // 2. Reconstruire la description
  const descriptionLines = project.description?.split('\n') || [];
  const tasksLineIndex = descriptionLines.findIndex((line: string) => line.startsWith('Travaux à réaliser :'));
  const suppliesLineIndex = descriptionLines.findIndex((line: string) => line.startsWith('Fournitures :'));
  
  // Garder les lignes avant la section des tâches
  const headerLines = tasksLineIndex !== -1 ? descriptionLines.slice(0, tasksLineIndex) : descriptionLines;
  
  // Garder les lignes de fournitures si elles existent
  const supplyLines = suppliesLineIndex !== -1 ? descriptionLines.slice(suppliesLineIndex) : [];

  // Créer les nouvelles lignes de tâches
  const taskLines = newTasks.map(task => `- ${task}`);

  const newDescription = [
    ...headerLines,
    'Travaux à réaliser :',
    ...taskLines,
    '', // Ligne vide pour la séparation
    ...supplyLines
  ].join('\n');

  // 3. Mettre à jour le projet avec la nouvelle description
  const { error: updateError } = await supabase
    .from('projects')
    .update({ description: newDescription })
    .eq('id', projectId);

  if (updateError) {
    console.error("Erreur Supabase [updateProjectTasks - update]:", updateError);
    return { error: "Erreur lors de la sauvegarde des tâches." };
  }

  revalidatePath(`/dashboard/chantier/${projectId}`);
  return { success: true };
}