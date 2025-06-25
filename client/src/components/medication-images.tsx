import adapaleneImage from '../assets/adapalene.webp';
import differinAdapaleneImage from '../assets/differin-adapalene.png';
import benzoylPeroxideImage from '../assets/benzoyl-peroxide.jpg';
import azelaicAcidImage from '../assets/azelaic-acid.jpg';

// Map of medication names to their image sources
export const medicationImages: Record<string, string> = {
  'Adapalene': differinAdapaleneImage, // Using the new Differin Adapalene image
  'Benzoyl Peroxide': benzoylPeroxideImage,
  'Azelaic Acid': azelaicAcidImage,
};

// Helper function to get image for medication
export function getMedicationImage(medicationName: string, fallbackImageUrl: string): string {
  return medicationImages[medicationName] || fallbackImageUrl;
}