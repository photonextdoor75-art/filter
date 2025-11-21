
/**
 * SERVICE DÉSACTIVÉ POUR LE MODE HORS LIGNE
 * 
 * Cette application fonctionne maintenant entièrement côté client via HTML5 Canvas.
 * Aucune clé API ni connexion serveur n'est requise.
 */

export const editImage = async (
  base64Image: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  throw new Error("This app works offline. API services are disabled.");
};
