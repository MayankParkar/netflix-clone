// This interface mirrors the Movie model in backend/prisma/schema.prisma
// Keeping frontend and backend types in sync prevents an entire class of bugs
// where the frontend expects a field the backend doesn't send
export interface Movie {
  id: number;
  title: string;
  year: number | null;
  quality: string;
  codec: string;
  filename: string;
  extension: string;
  sizeGB: number;
  filePath: string;
  tmdbId: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  rating: number | null;
  runtime: number | null;
  genres: string | null;
  createdAt: string;
  updatedAt: string;
}

// The shape every API response follows — matches our Express controllers
export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
}
