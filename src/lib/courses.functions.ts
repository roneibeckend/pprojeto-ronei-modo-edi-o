import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Tipos para validação Zod
const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string(),
  description: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  intro_video_url: z.string().optional().nullable(),
  level: z.string().default('beginner'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  order_index: z.number().int().default(0),
});

const ModuleSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  order_index: z.number().int().default(0),
});

const LessonSchema = z.object({
  id: z.string().uuid().optional(),
  module_id: z.string().uuid(),
  title: z.string().min(2),
  slug: z.string(),
  description: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  duration_minutes: z.number().int().default(0),
  order_index: z.number().int().default(0),
  is_free: z.boolean().default(false),
});

// Funções de Servidor
export const upsertCourse = createServerFn({ method: "POST" })
  .input(CourseSchema)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase
      .from('courses')
      .upsert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  });

export const upsertModule = createServerFn({ method: "POST" })
  .input(ModuleSchema)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase
      .from('course_modules')
      .upsert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  });

export const upsertLesson = createServerFn({ method: "POST" })
  .input(LessonSchema)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase
      .from('course_lessons')
      .upsert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  });

export const updateOrders = createServerFn({ method: "POST" })
  .input(z.object({
    table: z.enum(['course_modules', 'course_lessons']),
    items: z.array(z.object({
      id: z.string().uuid(),
      order_index: z.number().int()
    }))
  }))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from(data.table)
      .upsert(data.items);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteItem = createServerFn({ method: "POST" })
  .input(z.object({
    table: z.enum(['courses', 'course_modules', 'course_lessons']),
    id: z.string().uuid()
  }))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from(data.table)
      .delete()
      .eq('id', data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
