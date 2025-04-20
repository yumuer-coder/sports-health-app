export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: number
          phone: string
          password: string
          name: string | null
          gender: string | null
          birthday: string | null
          height: number | null
          weight: number | null
          bmi: number | null
          avatar: string | null
          role: string
          permissionCode: string | null
          createdAt: string
          updatedAt: string
          isFirstLogin: boolean
          totalExerciseSeconds: number
          todayExerciseSeconds: number
          lastExerciseDate: string | null
        }
        Insert: {
          id?: number
          phone: string
          password: string
          name?: string | null
          gender?: string | null
          birthday?: string | null
          height?: number | null
          weight?: number | null
          bmi?: number | null
          avatar?: string | null
          role?: string
          permissionCode?: string | null
          createdAt?: string
          updatedAt?: string
          isFirstLogin?: boolean
          totalExerciseSeconds?: number
          todayExerciseSeconds?: number
          lastExerciseDate?: string | null
        }
        Update: {
          id?: number
          phone?: string
          password?: string
          name?: string | null
          gender?: string | null
          birthday?: string | null
          height?: number | null
          weight?: number | null
          bmi?: number | null
          avatar?: string | null
          role?: string
          permissionCode?: string | null
          createdAt?: string
          updatedAt?: string
          isFirstLogin?: boolean
          totalExerciseSeconds?: number
          todayExerciseSeconds?: number
          lastExerciseDate?: string | null
        }
      }
      WorkoutPlan: {
        Row: {
          id: number
          userId: number
          goal: string
          plan: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          userId: number
          goal: string
          plan: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          userId?: number
          goal?: string
          plan?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      Video: {
        Row: {
          id: number
          title: string
          description: string | null
          type: string
          coverImage: string
          videoUrl: string
          duration: number
          uploadedAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          type: string
          coverImage: string
          videoUrl: string
          duration: number
          uploadedAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          type?: string
          coverImage?: string
          videoUrl?: string
          duration?: number
          uploadedAt?: string
          updatedAt?: string
        }
      }
      Favorite: {
        Row: {
          id: number
          userId: number
          videoId: number
          createdAt: string
        }
        Insert: {
          id?: number
          userId: number
          videoId: number
          createdAt?: string
        }
        Update: {
          id?: number
          userId?: number
          videoId?: number
          createdAt?: string
        }
      }
      Like: {
        Row: {
          id: number
          userId: number
          videoId: number
          createdAt: string
        }
        Insert: {
          id?: number
          userId: number
          videoId: number
          createdAt?: string
        }
        Update: {
          id?: number
          userId?: number
          videoId?: number
          createdAt?: string
        }
      }
      Food: {
        Row: {
          id: number
          name: string
          category: string
          unit: string
          calories: number
          image: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          category: string
          unit: string
          calories: number
          image?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          unit?: string
          calories?: number
          image?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      DietEntry: {
        Row: {
          id: number
          userId: number
          date: string
          mealType: string
          totalCalories: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          userId: number
          date?: string
          mealType: string
          totalCalories?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          userId?: number
          date?: string
          mealType?: string
          totalCalories?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      DietItem: {
        Row: {
          id: number
          dietEntryId: number
          foodId: number
          quantity: number
          calories: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          dietEntryId: number
          foodId: number
          quantity: number
          calories: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          dietEntryId?: number
          foodId?: number
          quantity?: number
          calories?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      Token: {
        Row: {
          id: number
          token: string
          userId: number
          expires: string
          createdAt: string
        }
        Insert: {
          id?: number
          token: string
          userId: number
          expires: string
          createdAt?: string
        }
        Update: {
          id?: number
          token?: string
          userId?: number
          expires?: string
          createdAt?: string
        }
      }
      VerificationCode: {
        Row: {
          id: number
          phone: string
          code: string
          expiresAt: string
          createdAt: string
        }
        Insert: {
          id?: number
          phone: string
          code: string
          expiresAt: string
          createdAt?: string
        }
        Update: {
          id?: number
          phone?: string
          code?: string
          expiresAt?: string
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 