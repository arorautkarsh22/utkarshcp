import { supabase } from '../lib/supabase';
import manifest from '../data/generated-manifest.json';

// Default initial companies from manifest
const DEFAULT_COMPANIES = [
  { id: 'bp-aws', section_id: 'brochures-posters', name: 'AWS', sort_order: 1 },
  { id: 'bp-auraweb', section_id: 'brochures-posters', name: 'AuraWeb', sort_order: 2 },
  { id: 'bp-bavanya', section_id: 'brochures-posters', name: 'Bavanya', sort_order: 3 },
  { id: 'bp-log10', section_id: 'brochures-posters', name: 'Log10', sort_order: 4 },
  { id: 'bp-hindustan', section_id: 'brochures-posters', name: 'Hindustan Water Solution', sort_order: 5 },
  { id: 'bp-peakfreaks', section_id: 'brochures-posters', name: 'The Peak Freaks', sort_order: 6 },
  { id: 'clothing-debug', section_id: 'clothing', name: 'DEBUG', sort_order: 1 },
  { id: 'logos-aws', section_id: 'logos', name: 'AWS', sort_order: 1 },
  { id: 'logos-bavanya', section_id: 'logos', name: 'Bavanya', sort_order: 2 },
  { id: 'logos-log10', section_id: 'logos', name: 'Log10', sort_order: 3 },
  { id: 'logos-rabal', section_id: 'logos', name: 'Rabal', sort_order: 4 },
  { id: 'logos-uiorbit', section_id: 'logos', name: 'UI Orbit', sort_order: 5 },
  { id: 'socials-auraweb', section_id: 'socials', name: 'AuraWeb', sort_order: 1 },
  { id: 'socials-aws', section_id: 'socials', name: 'AWS', sort_order: 2 },
  { id: 'webdev-sge', section_id: 'web-development', name: 'SGE Real Estates', sort_order: 1 },
];

/**
 * Fetch all companies, with section mapping
 */
export async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_COMPANIES;
    }
    return data;
  } catch (err) {
    console.warn('Error fetching companies, using default fallback:', err);
    return DEFAULT_COMPANIES;
  }
}

/**
 * Add a new company/brand under a specific section
 */
export async function addCompany({ sectionId, name, websiteUrl = '' }) {
  const cleanName = name.trim();
  const slug = `${sectionId}-${cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

  const { data, error } = await supabase
    .from('companies')
    .insert([
      {
        id: slug,
        section_id: sectionId,
        name: cleanName,
        website_url: websiteUrl.trim(),
        sort_order: 99,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Delete a company
 */
export async function deleteCompany(companyId) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
}

/**
 * Load portfolio data merged from local manifest + Supabase additions - deleted items
 */
export async function getMergedPortfolioData() {
  let deletedIds = new Set();
  let supabaseItems = [];

  try {
    // 1. Fetch deleted items
    const { data: delData } = await supabase.from('deleted_items').select('id');
    if (delData) {
      deletedIds = new Set(delData.map((d) => d.id));
    }

    // 2. Fetch new custom portfolio items from Supabase
    const { data: customData } = await supabase.from('portfolio_items').select('*');
    if (customData) {
      supabaseItems = customData;
    }
  } catch (err) {
    console.warn('Could not sync with Supabase items, using local manifest:', err);
  }

  // Clone local manifest and filter out deleted photos
  const result = {};
  for (const [secId, items] of Object.entries(manifest)) {
    result[secId] = items.filter((item) => !deletedIds.has(item.id));
  }

  // Append Supabase items to their respective section
  supabaseItems.forEach((item) => {
    if (!deletedIds.has(item.id)) {
      if (!result[item.section_id]) {
        result[item.section_id] = [];
      }
      result[item.section_id].unshift({
        id: item.id,
        title: item.title,
        subcategory: item.subcategory,
        full: item.full,
        thumb: item.thumb || item.full,
        original: item.full,
        instagram: item.is_instagram || false,
        isBrochure: item.is_brochure || false,
        isCustom: true,
      });
    }
  });

  return result;
}

/**
 * Upload a photo to Supabase Storage and create a portfolio item record
 */
export async function uploadAndAddPhoto({
  file,
  imageUrl,
  sectionId,
  subcategory,
  title,
  isInstagram = false,
  isBrochure = false,
}) {
  let finalUrl = imageUrl;

  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${sectionId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(fileName);

    finalUrl = publicUrlData.publicUrl;
  }

  if (!finalUrl) {
    throw new Error('Please select an image file or provide an image URL.');
  }

  const itemId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert([
      {
        id: itemId,
        section_id: sectionId,
        subcategory: subcategory?.trim() || 'Misc',
        title: title.trim(),
        full: finalUrl,
        thumb: finalUrl,
        is_instagram: isInstagram,
        is_brochure: isBrochure,
      },
    ])
    .select();

  if (error) {
    throw new Error(`Failed to save photo record: ${error.message}`);
  }

  return data?.[0];
}

/**
 * Remove a photo (handles both custom uploaded and initial manifest photos)
 */
export async function removePhoto(photoId) {
  // Try deleting from portfolio_items
  await supabase.from('portfolio_items').delete().eq('id', photoId);

  // Also record in deleted_items so local manifest photos stay hidden
  await supabase.from('deleted_items').insert([{ id: photoId }]);
}
