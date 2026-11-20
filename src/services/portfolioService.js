import { supabase } from '../lib/supabase.js';
import manifest from '../data/generated-manifest.json' with { type: 'json' };

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

const CDN_BASE = 'https://hqhuxfhommtkcvulruqr.supabase.co/storage/v1/object/public/portfolio-media/';

/**
 * Synchronous initial portfolio data using local manifest mapped to Supabase CDN URLs.
 * Ensures instant first paint with zero blank elements while Supabase syncs in background.
 */
export function getInitialPortfolioData() {
  const result = {};
  for (const [secId, items] of Object.entries(manifest)) {
    result[secId] = items.map((it, idx) => {
      const p0 = it.pages?.[0];
      const rawFull = it.full || p0?.full || '';
      const rawThumb = it.thumb || p0?.thumb || rawFull;
      const fullUrl = rawFull.startsWith('http') ? rawFull : `${CDN_BASE}${rawFull}`;
      const thumbUrl = rawThumb.startsWith('http') ? rawThumb : `${CDN_BASE}${rawThumb}`;
      return {
        ...it,
        section_id: secId,
        full: fullUrl,
        thumb: thumbUrl,
        original: fullUrl,
        sort_order: it.sort_order || idx + 1,
        pages: it.pages
          ? it.pages.map((p) => ({
              ...p,
              full: p.full.startsWith('http') ? p.full : `${CDN_BASE}${p.full}`,
              thumb: p.thumb.startsWith('http') ? p.thumb : `${CDN_BASE}${p.thumb}`,
            }))
          : null,
      };
    });
  }
  return result;
}

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

    // 2. Fetch portfolio items from Supabase
    const { data: customData } = await supabase
      .from('portfolio_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (customData && customData.length > 0) {
      supabaseItems = customData;
    }
  } catch (err) {
    console.warn('Could not sync with Supabase items, using local manifest:', err);
  }

  // If Supabase has items, build directly from Supabase!
  if (supabaseItems.length > 0) {
    const result = {};
    for (const item of supabaseItems) {
      if (deletedIds.has(item.id)) continue;
      if (!result[item.section_id]) result[item.section_id] = [];

      const imgUrl = item.image_url || item.full;
      result[item.section_id].push({
        id: item.id,
        section_id: item.section_id,
        title: item.title,
        subcategory: item.subcategory,
        full: imgUrl,
        thumb: item.thumb_url || item.thumb || imgUrl,
        original: imgUrl,
        instagram: Boolean(item.is_instagram),
        isBrochure: Boolean(item.is_brochure),
        pages: item.pages || null,
        sort_order: item.sort_order || 0,
        isCustom: true,
      });
    }
    return result;
  }

  // Fallback to local manifest if Supabase is empty or unreachable
  const result = {};
  for (const [secId, items] of Object.entries(manifest)) {
    result[secId] = items.filter((item) => !deletedIds.has(item.id));
  }
  return result;
}

/**
 * Upload a photo or multi-page brochure/poster to Supabase Storage and create a portfolio item record
 */
export async function uploadAndAddPhoto({
  file,
  files = [],
  imageUrl,
  sectionId,
  subcategory,
  title,
  mediaType = 'poster', // 'poster' | 'brochure' | 'instagram' | 'standard'
  isInstagram = false,
  isBrochure = false,
}) {
  const isBrochureType = isBrochure || mediaType === 'brochure' || (files && files.length > 1);
  const isInstagramType = isInstagram || mediaType === 'instagram';

  // Handle multi-page brochure upload
  if (isBrochureType && files && files.length > 0) {
    const pages = [];
    for (let i = 0; i < files.length; i++) {
      const pageFile = files[i];
      const fileExt = pageFile.name.split('.').pop();
      const fileName = `${sectionId}/${Date.now()}-page-${i + 1}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-media')
        .upload(fileName, pageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload page ${i + 1}: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('portfolio-media')
        .getPublicUrl(fileName);

      pages.push({
        full: publicUrlData.publicUrl,
        thumb: publicUrlData.publicUrl,
        original: publicUrlData.publicUrl,
        title: `${title} - Page ${i + 1}`,
      });
    }

    // Compute next sort order
    let nextSortOrder = 99;
    try {
      const { data: maxRow } = await supabase
        .from('portfolio_items')
        .select('sort_order')
        .eq('section_id', sectionId)
        .order('sort_order', { ascending: false })
        .limit(1);
      if (maxRow && maxRow.length > 0 && typeof maxRow[0].sort_order === 'number') {
        nextSortOrder = maxRow[0].sort_order + 1;
      }
    } catch {
      // fallback
    }

    const itemId = `brochure-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert([
        {
          id: itemId,
          section_id: sectionId,
          subcategory: subcategory?.trim() || 'Misc',
          title: title.trim(),
          image_url: pages[0].full,
          thumb_url: pages[0].thumb,
          is_instagram: false,
          is_brochure: true,
          pages: pages,
          sort_order: nextSortOrder,
        },
      ])
      .select();

    if (error) {
      throw new Error(`Failed to save brochure: ${error.message}`);
    }

    return data?.[0];
  }

  // Handle single file (Poster, Logo, Clothing, Socials)
  let finalUrl = imageUrl;

  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${sectionId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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

  // Compute next sort order
  let nextSortOrder = 99;
  try {
    const { data: maxRow } = await supabase
      .from('portfolio_items')
      .select('sort_order')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: false })
      .limit(1);
    if (maxRow && maxRow.length > 0 && typeof maxRow[0].sort_order === 'number') {
      nextSortOrder = maxRow[0].sort_order + 1;
    }
  } catch {
    // fallback
  }

  const itemId = `${mediaType || 'photo'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert([
      {
        id: itemId,
        section_id: sectionId,
        subcategory: subcategory?.trim() || 'Misc',
        title: title.trim(),
        image_url: finalUrl,
        thumb_url: finalUrl,
        is_instagram: isInstagramType,
        is_brochure: false,
        pages: null,
        sort_order: nextSortOrder,
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

/**
 * Persist the updated sort order for a list of photos
 */
export async function reorderPhotos(orderedPhotosList) {
  const updates = orderedPhotosList.map((photo, index) =>
    supabase
      .from('portfolio_items')
      .update({ sort_order: index + 1 })
      .eq('id', photo.id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) {
    throw firstError;
  }
}

