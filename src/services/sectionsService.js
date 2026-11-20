import { supabase } from '../lib/supabase';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/portfolio';

export async function getSections() {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Using local default categories fallback:', error?.message);
      return DEFAULT_CATEGORIES.map((cat, idx) => ({
        id: cat.id,
        title: cat.title,
        subtitle: cat.subtitle || '',
        sort_order: idx + 1,
        visible: true,
      }));
    }

    return data;
  } catch (err) {
    console.warn('Error fetching sections, falling back:', err);
    return DEFAULT_CATEGORIES.map((cat, idx) => ({
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle || '',
      sort_order: idx + 1,
      visible: true,
    }));
  }
}

export async function addSection({ id, title, subtitle, sort_order = 99, visible = true }) {
  const { data, error } = await supabase
    .from('sections')
    .insert([
      {
        id: id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-'),
        title: title.trim(),
        subtitle: subtitle.trim(),
        sort_order,
        visible,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateSection(id, updates) {
  const { data, error } = await supabase
    .from('sections')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deleteSection(id) {
  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderSections(orderedSections) {
  const updates = orderedSections.map((sec, idx) => 
    supabase
      .from('sections')
      .update({ sort_order: idx + 1 })
      .eq('id', sec.id)
  );
  await Promise.all(updates);
}
