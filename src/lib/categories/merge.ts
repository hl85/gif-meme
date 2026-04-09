import type { KlipyGif } from '@/lib/klipy/types';

export type CategoryCardForMerge = {
  id: string;
  position: number;
  imageUrl: string;
  imageName: string;
  linkUrl?: string;
};

export function mergeCategoryCards(gifs: KlipyGif[], cards: CategoryCardForMerge[]): KlipyGif[] {
  if (cards.length === 0) {
    return gifs;
  }

  // Sort cards by position ascending
  const sortedCards = [...cards].sort((a, b) => a.position - b.position);
  
  const result: KlipyGif[] = [];
  let apiIndex = 0;
  let cardIndex = 0;
  const totalLength = gifs.length + cards.length;

  for (let i = 0; i < totalLength; i++) {
    const currentCard = sortedCards[cardIndex];
    
    if (currentCard && (currentCard.position === i || apiIndex >= gifs.length)) {
      // Convert card to KlipyGif format
      const cardGif: KlipyGif = {
        id: `card-${currentCard.id}`,
        url: currentCard.imageUrl,
        preview_url: currentCard.imageUrl,
        title: currentCard.imageName,
        width: 300,
        height: 300,
        source: '',
      };
      result.push(cardGif);
      cardIndex++;
    } else if (apiIndex < gifs.length) {
      result.push(gifs[apiIndex]);
      apiIndex++;
    }
  }

  return result;
}
