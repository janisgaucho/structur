'use server'

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";

/**
 * Récupère tous les profils utilisateurs depuis la base de données.
 */
export async function getEquipe() {
  const supabase = createClient(); // Client standard pour la session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return []; // Si pas d'utilisateur, pas d'équipe à montrer
  }

  const supabaseAdmin = createAdminClient( // Client admin pour lire les données
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('created_by', user.id); // Filtre pour ne voir que les utilisateurs créés par le manager

  if (error) {
    console.error("Erreur Supabase [getEquipe]:", error);
    return [];
  }
  return data;
}

/**
 * Récupère tous les projets pour les menus de sélection.
 */
export async function getProjects() {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erreur Supabase [getProjects]:", error);
    return [];
  }
  return data;
}

/**
 * Récupère les valeurs possibles pour l'enum 'user_role' depuis la base de données.
 */
export async function getRoles(): Promise<string[]> {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Exécute une requête SQL pour lister les valeurs de l'enum 'user_role'
  const { data, error } = await supabaseAdmin.rpc('get_enum_values', {
    type_name: 'user_role'
  });

  if (error) {
    console.error("Erreur Supabase [getRoles]:", error);
    // Retourne une liste vide en cas d'erreur pour ne pas afficher de fausses données.
    return [];
  }

  return data || [];
}
/**
 * Ajoute un nouvel utilisateur (auth) et son profil.
 * Nécessite les droits d'administration (service_role).
 */
export async function addUser(formData: FormData) {
  const supabase = createClient(); // Client standard pour la session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  const supabaseAdmin = createAdminClient( // Client admin pour les opérations privilégiées
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = formData.get('email') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const role = formData.get('role') as string;

  // Étape 1: Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/creation-mot-de-passe`
  });

  if (authError || !authData.user) {
    console.error("Erreur Supabase Auth [addUser]:", authError);
    return { error: authError?.message || "Erreur lors de la création de l'authentification." };
  }

  // Étape 2: Créer le profil correspondant dans la table 'profiles'
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      role: role,
      email: email, // Assurer la cohérence de l'email dans le profil
      created_by: user.id, // Lier le nouveau profil au manager
    }, {
      onConflict: 'id' // Précise que le conflit est sur la colonne 'id'
    });

  if (profileError) {
    console.error("Erreur Supabase Profile [addUser]:", profileError);
    // Idéalement, il faudrait supprimer l'utilisateur créé à l'étape 1 pour nettoyer
    return { error: profileError.message || "Erreur lors de la création du profil." };
  }

  // Nettoyage rigoureux de l'ID du chantier
  const rawProjectId = formData.get('project_id');
  const projectId = typeof rawProjectId === 'string' ? rawProjectId.trim() : null;
  const isValidProject = projectId && projectId !== 'undefined' && projectId !== 'null' && projectId !== '';

  // Étape 3: Si un chantier est sélectionné de manière valide, lier l'utilisateur
  if (isValidProject) {
    const { error: memberError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: authData.user.id,
        role: role, // Le rôle sur le projet est le même que son rôle général
      });
  
    if (memberError) {
      console.error("Erreur Supabase [addUser to project]:", memberError);
      // On renvoie le message d'erreur natif pour faciliter le débogage
      return { error: `Erreur d'assignation : ${memberError.message}` };
    }
  }


  revalidatePath('/dashboard/equipe');
  return { success: true };
}

/**
 * Met à jour le profil d'un utilisateur existant.
 * Nécessite les droits d'administration (service_role).
 */
export async function updateUser(userId: string, formData: FormData) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "La clé de service Supabase n'est pas configurée côté serveur." };
  }

  const email = formData.get('email') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const role = formData.get('role') as string;

  const projectIdsRaw = formData.get('project_ids') as string | null;
  let projectIds: string[] = [];
  if (projectIdsRaw) {
    try {
      // On filtre les valeurs "null" ou "undefined" qui pourraient venir du formulaire
      const parsed = JSON.parse(projectIdsRaw);
      projectIds = Array.isArray(parsed) ? parsed.filter(id => id && id !== 'null' && id !== 'undefined') : [];
    } catch (e) {
      console.error("Erreur parsing project_ids", e);
    }
  }

  // Étape 1: Mettre à jour le profil dans la table 'profiles'
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      role: role,
      email: email, // On met aussi à jour l'email dans le profil pour la cohérence
    })
    .eq('id', userId);

  if (profileError) {
    console.error("Erreur Supabase Profile [updateUser]:", profileError);
    return { error: profileError.message || "Erreur lors de la mise à jour du profil." };
  }

  // Étape 2: Mettre à jour l'email dans Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });

  if (authError) {
    console.error("Erreur Supabase Auth [updateUser]:", authError);
    return { error: authError.message || "Erreur lors de la mise à jour de l'email." };
  }

  // Étape 3: Gérer les assignations aux chantiers (relation plusieurs-à-plusieurs)
  // a. On supprime d'abord les anciennes assignations de cet utilisateur
  const { error: deleteError } = await supabaseAdmin
    .from('project_members')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error("Erreur Supabase [updateUser project cleanup]:", deleteError);
    return { error: "Erreur lors du nettoyage des anciens chantiers." };
  }

  // b. On insère les nouvelles assignations s'il y en a
  if (projectIds.length > 0) {
    const insertData = projectIds.map(projectId => ({
      project_id: projectId,
      user_id: userId,
      role: role,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('project_members')
      .insert(insertData);

    if (insertError) {
      console.error("Erreur Supabase [updateUser project assignment]:", insertError);
      return { error: `Erreur lors de l'assignation : ${insertError.message}` };
    }
  }

  revalidatePath('/dashboard/equipe');
  return { success: true };
}

/**
 * Supprime un utilisateur (auth et profil).
 * Nécessite les droits d'administration (service_role).
 */
export async function deleteUser(userId: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "La clé de service Supabase n'est pas configurée côté serveur." };
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Erreur Supabase Auth [deleteUser]:", error);
    // Gérer l'erreur, peut-être retourner un message
    return { error: error.message || "Impossible de supprimer l'utilisateur." };
  }

  // La suppression du profil se fait en cascade grâce à la clé étrangère
  // configurée dans la base de données.

  revalidatePath('/dashboard/equipe');
  return { success: true };
}