/**
 * Utilitários para processamento, upload e compressão de fotos e imagens
 */

export interface PresetImage {
  id: string;
  label: string;
  url: string;
}

export const PRESET_SERVER_ICONS: PresetImage[] = [
  { id: 'tech', label: 'Tech & Código', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80' },
  { id: 'gaming', label: 'Gaming & Jogos', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80' },
  { id: 'cyber', label: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80' },
  { id: 'synth', label: 'Synthwave Retrô', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80' },
  { id: 'chill', label: 'Chill & Lo-Fi', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
  { id: 'space', label: 'Espaço Cósmico', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop&q=80' },
  { id: 'anime', label: 'Ilustração Art', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80' },
  { id: 'music', label: 'Música & Áudio', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80' },
];

export const PRESET_SERVER_BANNERS: PresetImage[] = [
  { id: 'b-cyber', label: 'Cyber Grid Neon', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80' },
  { id: 'b-space', label: 'Nebulosa Cósmica', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80' },
  { id: 'b-synth', label: 'Horizonte Synthwave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
  { id: 'b-dark', label: 'Geometria Dark', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
];

/**
 * Converte e compacta um arquivo de imagem local em DataURL (Base64 JPEG/PNG)
 * para exibição instantânea e persistência leve em memória e Firestore.
 */
export const compressImageFile = (file: File, maxDim = 500, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Formato de arquivo inválido. Escolha uma imagem PNG, JPG, GIF ou WebP.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Fundo escuro sutil para manter transparência limpa
        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(format, quality));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
