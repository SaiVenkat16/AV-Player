export interface Video {
  id: string;
  path: string;
  title: string;
  duration: number;
  width: number;
  height: number;
  sizeBytes: number;
  thumbnailUri: string | null;
}
