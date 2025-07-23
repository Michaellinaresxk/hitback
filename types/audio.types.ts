export interface Track {
  id: string;
  title: string;
  artist: string;
  year: number;
  decade: string;
  genre: string;
  previewUrl: string;
  duration: number;
  lyrics?: string;
}
