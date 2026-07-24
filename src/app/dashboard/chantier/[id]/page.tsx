'use client'

import { useDictionary } from '@/components/DictionaryProvider'
import { createClient } from '@/utils/supabase/client'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  Euro,
  FileText,
  MapPin,
  Map,
  Navigation,
  ChevronRight,
  ArrowLeft,
  ImagePlus,
  Check,
  Edit,
  Pencil,
  GripVertical,
  X,
  Undo2,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, use } from 'react';
import { updateProjectNotes, updateProjectTasks } from './actions';

export default function ChantierDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('fiche')
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [complementaryNotes, setComplementaryNotes] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [modalTask, setModalTask] = useState<{ index: number; text: string } | null>(null);
  const [supplies, setSupplies] = useState<string[]>([]);
  const [initialTasks, setInitialTasks] = useState<string[]>([]);
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
  const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false); // Nouvel état pour le mode de réorganisation
  const [tasksHistory, setTasksHistory] = useState<string[][]>([]); // Historique pour l'annulation


  
  // Nouvel état pour gérer les tâches cochées
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  
  const dict = useDictionary();
  const supabase = createClient()

  useEffect(() => {
    const fetchProject = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) redirect('/login')

      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !projectData) {
        notFound()
      }
      setProject(projectData)
      setComplementaryNotes(projectData.notes || ''); // Initialiser les notes

      // Initialiser l'état des tâches à partir de la description
      const descriptionLines = projectData.description?.split('\n') || [];
      const tasksLineIndex = descriptionLines.findIndex((line: string) => line.startsWith('Travaux à réaliser :'));
      const suppliesLineIndex = descriptionLines.findIndex((line: string) => line.startsWith('Fournitures :'));
      
      const tasksEndIndex = suppliesLineIndex !== -1 ? suppliesLineIndex : descriptionLines.length;
      const initialTasks = tasksLineIndex !== -1 ? descriptionLines.slice(tasksLineIndex + 1, tasksEndIndex).filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.replace('-', '').trim()) : [];
      setTasks(initialTasks); // État pour la liste modifiable
      setInitialTasks(initialTasks); // État pour comparer l'ordre initial
      setTasksHistory([initialTasks]); // Initialiser l'historique

      // Initialiser l'état des fournitures
      const initialSupplies = suppliesLineIndex !== -1 ? descriptionLines.slice(suppliesLineIndex + 1).filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.replace('-', '').trim()) : [];
      setSupplies(initialSupplies);
    }
    fetchProject()
  }, [id, supabase])

  // --- Extraction des données depuis la description ---
  const descriptionLines = project?.description?.split('\n') || []
  const referenceLine = descriptionLines.find((line: string) => line.startsWith('Devis réf:'))
  const totalLine = descriptionLines.find((line: string) => line.startsWith('Montant total:'))
  const tasksLineIndex = descriptionLines.findIndex((line: string) => line.startsWith('Travaux à réaliser :'))

  const reference = referenceLine ? referenceLine.replace('Devis réf: ', '').trim() : dict.chantier_ref_not_available
  const total = totalLine ? parseFloat(totalLine.match(/(\d+[.,]?\d*)/)?.[0].replace(',', '.') || '0') : 0

  // Calcul du pourcentage de progression
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  if (!project) {
    return <div className="w-full flex-1 flex items-center justify-center text-gray-500">{dict.chantier_loading}</div>
  }

  const handleTaskClick = (index: number) => {
    setActiveTab('taches'); 
    setSelectedTaskIndex(index);
  }

  // Fonction pour cocher/décocher une tâche
  const toggleTask = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Empêche le clic de rediriger vers l'onglet des tâches
    setCompletedTasks(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }

  // Fonction pour traduire dynamiquement les statuts
  const getTranslatedStatus = (status: string) => {
    return dict[`status_${status}`] || status.replace('_', ' ');
  }

  // Fonction pour sauvegarder les notes
  const handleSaveNotes = async () => {
    await updateProjectNotes(project.id, complementaryNotes);
    setProject({ ...project, notes: complementaryNotes }); // Met à jour l'état local
    setIsEditingNotes(false);
  }

  // --- Fonctions pour l'édition des tâches ---
  const handleEditTask = (index: number) => {
    setModalTask({ index, text: tasks[index] });
  };

  const handleSaveTask = async () => {
    if (!modalTask) return;

    const newTasks = [...tasks];
    newTasks[modalTask.index] = modalTask.text;

    const result = await updateProjectTasks(project.id, newTasks);

    if (!result.error) {
      setTasks(newTasks); // Mettre à jour l'état local
      setModalTask(null); // Fermer la modale
    } else {
      // Gérer l'erreur (par exemple, afficher une notification)
      console.error("Erreur lors de la sauvegarde de la tâche:", result.error);
    }
  }

  const handleDeleteTask = async () => {
    if (modalTask === null) return;

    const newTasks = tasks.filter((_, i) => i !== modalTask.index);

    const result = await updateProjectTasks(project.id, newTasks);

    if (!result.error) {
      setTasks(newTasks);
      setInitialTasks(newTasks); // Mettre à jour l'état initial aussi
      setTasksHistory([newTasks]);
      setModalTask(null); // Fermer la modale
      setSelectedTaskIndex(0); // Réinitialiser la sélection
    } else {
      console.error("Erreur lors de la suppression de la tâche:", result.error);
    }
  };

  // Détermine si le texte de la tâche dans la modale a été modifié
  const isTaskUnchanged = modalTask !== null && tasks[modalTask.index] === modalTask.text;

  // Détermine si l'ordre des tâches a été modifié
  const isOrderUnchanged = JSON.stringify(tasks) === JSON.stringify(initialTasks);

  // --- Fonctions pour le Drag-and-Drop des tâches ---
  const handleDragStart = (index: number) => {
    setDraggedTaskIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverTaskIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedTaskIndex === null || dragOverTaskIndex === null || draggedTaskIndex === dragOverTaskIndex) {
      setDraggedTaskIndex(null);
      setDragOverTaskIndex(null);
      return;
    }

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedTaskIndex, 1);
    newTasks.splice(dragOverTaskIndex, 0, draggedItem);

    // Sauvegarder l'état précédent dans l'historique
    setTasksHistory(prev => [...prev, tasks]);

    setTasks(newTasks);
    setDraggedTaskIndex(null);
    setDragOverTaskIndex(null);
  };

  const handleSaveTaskOrder = async () => {
    setIsSavingOrder(true);
    const result = await updateProjectTasks(project.id, tasks);

    if (!result.error) {
      setInitialTasks(tasks); // Met à jour l'état initial pour refléter le nouvel ordre
      setTasksHistory([tasks]); // Réinitialiser l'historique après sauvegarde
      setIsOrdering(false); // Quitter le mode de réorganisation
    } else {
      // En cas d'erreur, on pourrait revenir à l'ordre initial ou afficher une notification
      console.error("Erreur lors de la sauvegarde de l'ordre des tâches:", result.error);
      setTasks(initialTasks); // Optionnel: revenir à l'état précédent
    }
    setIsSavingOrder(false);
  };

  const handleCancelOrdering = () => {
    setTasks(initialTasks);
    setIsOrdering(false);
    setTasksHistory([initialTasks]);
  };

  const handleUndoLastMove = () => {
    if (tasksHistory.length > 1) {
      const previousTasks = tasksHistory[tasksHistory.length - 1];
      setTasks(previousTasks);
      setTasksHistory(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="w-full flex flex-col pt-4 px-6 md:px-8 lg:px-12 pb-12">
      {/* Nouvel En-tête de page intégré */}
      <div className="mb-10 flex flex-col gap-6">
        {/* Ligne 1: Retour et Statut */}
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {dict.chantier_back_to_projects}
          </Link>
        </div>

        {/* Ligne 2: Titre, Adresse et Boutons GPS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-gray-950">
              {project.name}
            </h1>
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {project.address || dict.chantier_no_address}
            </p>
          </div>
          {project.address && (
            <div className="flex flex-wrap items-center gap-3">
              <a href={`https://maps.google.com/?q=${encodeURIComponent(project.address)}`} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                <Map className="w-4 h-4" /> {dict.chantier_google_maps}
              </a>
              <a href={`https://waze.com/ul?q=${encodeURIComponent(project.address)}`} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                <Navigation className="w-4 h-4" /> {dict.chantier_waze}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Progression</h3>
          <span className="text-sm text-gray-500">{completedTasks.length} / {tasks.length} tâches</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-[#0071E3] transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-lg font-semibold tracking-tighter text-gray-900">{progressPercentage}%</span>
        </div>
      </div>

      {/* Sélecteur d'onglets (maintenant sous le header) */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('fiche')} className={`cursor-pointer px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === 'fiche' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-t-lg'}`}>
            {dict.chantier_tab_sheet}
          </button>
          <button onClick={() => setActiveTab('taches')} className={`cursor-pointer px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === 'taches' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-t-lg'}`}>
            {dict.chantier_tab_tasks}
          </button>
          <button onClick={() => setActiveTab('fournitures')} className={`cursor-pointer x-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === 'fournitures' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-t-lg'}`}>
            {dict.chantier_tab_supplies || "Fournitures"}
          </button>
          <button onClick={() => setActiveTab('plans')} className={`cursor-pointer px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === 'plans' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-t-lg'}`}>
            {dict.chantier_tab_plans || "Plans"}
          </button>
        </div>
      </div>

      {activeTab === 'fiche' && (
        <>

          {/* Grille de contenu */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne Principale (lg:col-span-2) - L'Opérationnel */}
            <div className="lg:col-span-2 space-y-8">
              {/* Section: VAT (Visite Avant Travaux) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                {/* Galerie */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">V.A.T (Visite Avant Travaux)</h3>
                  <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                    <ImagePlus className="w-4 h-4" /> Ajouter photo(s)
                  </button>
                </div>
                <div className="text-center text-gray-400 text-sm py-8 bg-gray-50 rounded-lg">Aucune photo de visite avant travaux.</div>
              </div>

              {/* Section: Informations complémentaires */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
                    Informations complémentaires
                  </h2>
                  {!isEditingNotes ? (
                    <button onClick={() => setIsEditingNotes(true)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <Edit className="w-3.5 h-3.5" /> Modifier
                    </button>
                  ) : (
                    <button onClick={handleSaveNotes} className="flex items-center gap-2 text-sm font-medium text-white bg-[#0071E3] hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                      <Check className="w-3.5 h-3.5" /> Enregistrer
                    </button>
                  )}
                </div>
                {isEditingNotes ? (
                  <textarea
                    className="w-full h-40 p-4 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#0071E3] focus:border-transparent transition-colors text-sm text-gray-700 placeholder-gray-400"
                    placeholder="Ajoutez des notes, des détails importants ou toute autre information pertinente sur le chantier..."
                    value={complementaryNotes}
                    onChange={(e) => setComplementaryNotes(e.target.value)}
                  />
                ) : (
                  <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                    {complementaryNotes ? <p>{complementaryNotes}</p> : <p className="text-gray-400 italic">Aucune information complémentaire pour le moment.</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Latérale (lg:col-span-1) - L'Administratif */}
            <div className="space-y-6">

              {/* Carte 1: Finances */}
              <div className="rounded-2xl border border-gray-100 p-6 bg-white shadow-sm sticky top-28">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">{dict.chantier_finances_title}</h3>
                <div className="flex items-start gap-3">
                  <Euro className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-600">{dict.chantier_total_amount_label}</span>
                    <span className="text-3xl font-semibold tracking-tighter text-gray-900">
                      {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Carte 2: Informations */}
              <div className="rounded-2xl border border-gray-100 p-6 bg-white shadow-sm sticky top-64">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">{dict.chantier_info_title}</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-gray-600">{dict.chantier_created_date_label}</span>
                      <span className="font-medium text-gray-800">
                        {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-gray-600">{dict.chantier_quote_ref_label}</span>
                      <span className="font-mono text-gray-800">{reference}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'taches' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Colonne de Gauche (Liste des Tâches avec Drag-and-Drop) */}
          <div className="sticky top-28 md:top-32 space-y-4">
            {/* Barre d'outils pour la réorganisation */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Liste des tâches</h3>
              {!isOrdering ? (
                <button onClick={() => setIsOrdering(true)} className="cursor-pointer px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
                  Modifier l'ordre
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleUndoLastMove} disabled={tasksHistory.length <= 1} className="p-2 text-gray-500 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" title="Rétablir le dernier déplacement">
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleCancelOrdering} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Annuler
                  </button>
                  <button 
                    onClick={handleSaveTaskOrder}
                    disabled={isOrderUnchanged || isSavingOrder}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSavingOrder ? "Sauvegarde..." : "Enregistrer"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              {tasks.map((task: string, index: number) => (
                <div
                  key={task + index}
                  draggable={isOrdering}
                  onDragStart={isOrdering ? () => handleDragStart(index) : undefined}
                  onDragEnter={isOrdering ? () => handleDragEnter(index) : undefined}
                  onDragEnd={isOrdering ? handleDragEnd : undefined}
                  onDragOver={(e) => e.preventDefault()}
                  className={`
                    group flex items-center justify-between p-4 border-b border-gray-100 transition-all duration-300
                    ${selectedTaskIndex === index ? 'bg-white rounded-t-lg' : 'hover:bg-gray-50'}
                    ${isOrdering ? 'cursor-grab' : 'cursor-pointer'}
                    ${draggedTaskIndex === index ? 'opacity-50' : ''}
                    ${dragOverTaskIndex === index ? 'border-t-2 border-t-blue-500' : 'border-t-transparent border-t-2'}
                  `}
                  onClick={() => setSelectedTaskIndex(index)}
                >
                  <div className="flex items-center gap-4">
                    {isOrdering && <GripVertical className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-medium text-gray-400 w-6 text-center">{index + 1}.</span>
                    <span className={`text-sm font-medium ${selectedTaskIndex === index ? 'text-gray-900' : 'text-gray-600'}`}>{task}</span>
                  </div>
                  {!isOrdering && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditTask(index); }} 
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-md"
                        title="Modifier la tâche"
                      >
                        <Pencil className="cursor-pointer w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Colonne de Droite (Fiche Technique) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm min-h-150 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight mb-4">
              {tasks[selectedTaskIndex]}
            </h2>

            {/* Fil d'activité */}
            <div className="flex-1 overflow-y-auto space-y-6 py-4 px-2 -mx-2">
              {/* Message Ouvrier (gauche) */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-md">
                  <p className="text-sm text-gray-800">J'ai fini la préparation du mur, tout est prêt pour la peinture.</p>
                  <p className="text-xs text-gray-400 mt-1 text-right">Artisan A - 10:32</p>
                </div>
              </div>

              {/* Événement Upload Photo (gauche) */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-md">
                  <p className="text-sm text-gray-500 italic">A ajouté une photo :</p>
                  <div className="mt-2 w-40 h-40 bg-gray-300 rounded-md"></div>
                  <p className="text-xs text-gray-400 mt-1 text-right">Artisan A - 10:33</p>
                </div>
              </div>

              {/* Message Chef de chantier (droite) */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-[#0071E3] text-white p-3 rounded-lg rounded-tr-none max-w-md">
                  <p className="text-sm">Parfait, merci. Tu peux commencer la première couche.</p>
                  <p className="text-xs text-blue-200 mt-1 text-left">Vous - 10:35</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-200 shrink-0"></div>
              </div>
            </div>

            {/* Zone de saisie (Composer) */}
            <div className="mt-auto border-t border-gray-200 -mx-8 px-8 pt-4">
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <button className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-full transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  placeholder="Ajouter une note ou une photo..."
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-500"
                />
                <button className="p-2 bg-[#0071E3] text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mb-4">{dict.chantier_tab_plans || "Plans"}</h2>
          <p className="text-gray-500">Contenu à venir pour la gestion des plans du chantier.</p>
        </div>
      )}

      {activeTab === 'fournitures' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mb-6">{dict.chantier_tab_supplies || "Fournitures"}</h2>
          {supplies.length > 0 ? (
            <ul className="space-y-3">
              {supplies.map((supply, index) => (
                <li key={index} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">{supply}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-500">Aucune fourniture détaillée pour ce chantier.</p>}
        </div>
      )}

      {/* Modale d'édition de tâche */}
      {modalTask !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalTask(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Modifier la tâche</h3>
              <button onClick={() => setModalTask(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label htmlFor="task-name-input" className="block text-sm font-medium text-gray-700 mb-2">
                Modifier le nom
              </label>
              <textarea
                id="task-name-input"
                value={modalTask.text}
                onChange={(e) => setModalTask({ ...modalTask, text: e.target.value })}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
                placeholder="Entrez le nouveau nom de la tâche..."
              />
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-b-xl">
              <button onClick={handleDeleteTask} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Supprimer la tâche">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Transformer en fourniture
                </button>
                <button 
                  onClick={handleSaveTask} 
                  disabled={isTaskUnchanged}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}