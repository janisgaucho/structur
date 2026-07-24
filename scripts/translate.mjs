import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// 1. Récupération de la clé API depuis .env.local
try {
  const envFile = readFileSync(resolve('.env.local'), 'utf-8');
  const apiKeyMatch = envFile.match(/GOOGLE_TRANSLATE_API_KEY=(.*)/);
  // Nettoyage des guillemets (simples ou doubles) et des retours chariot invisibles
  const apiKey = apiKeyMatch ? apiKeyMatch[1].replace(/['"\r]/g, '').trim() : null;
  
  if (apiKey) {
    console.log(`Clé API chargée (début) : ${apiKey.substring(0, 8)}...`);
  }

  if (!apiKey) {
    console.error("❌ ERREUR : Clé GOOGLE_TRANSLATE_API_KEY introuvable dans .env.local");
    process.exit(1);
  }

  // 2. Configuration
  const TARGET_LANGUAGES = ['es', 'ur', 'en']; // Portugais, Polonais, Roumain
  const SOURCE_FILE = resolve('src/dictionaries/fr.json');
  
  // Lecture du dictionnaire français
  const sourceData = JSON.parse(readFileSync(SOURCE_FILE, 'utf-8'));
  const keys = Object.keys(sourceData);
  const values = Object.values(sourceData);

  console.log(`Lancement de la traduction pour ${keys.length} expressions...`);

  // 3. Boucle de traduction
  for (const lang of TARGET_LANGUAGES) {
    console.log(`⏳ Traduction en cours vers : ${lang}...`);
    
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: values,          // Envoi de toutes les phrases d'un coup
        target: lang,
        source: 'fr',
        format: 'text'
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error(`❌ Erreur Google API pour ${lang}:`, data.error.message);
      continue;
    }

    const translations = data.data.translations.map(t => t.translatedText);
    
    // 4. Reconstruction du fichier JSON
    const newDict = {};
    keys.forEach((key, index) => {
      newDict[key] = translations[index];
    });

    // 5. Sauvegarde
    writeFileSync(
      resolve(`src/dictionaries/${lang}.json`), 
      JSON.stringify(newDict, null, 2)
    );
    console.log(`✅ Fichier src/dictionaries/${lang}.json généré avec succès !`);
  }
  
  console.log("🎉 Traduction globale terminée !");

} catch (error) {
  console.error("❌ Erreur critique :", error);
}