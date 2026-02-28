import { saveAs } from 'file-saver';

/**
 * Robustly downloads a file from a URL.
 * Handles cross-origin issues by fetching as a blob if possible.
 * Detects if the response is HTML (which usually means an error page or SPA index).
 */
export const downloadFile = async (url: string, fileName: string) => {
  if (!url) {
    console.error('Download failed: URL is empty');
    return;
  }

  try {
    // If it's a relative URL, make it absolute if we can guess the host
    // or just let the browser handle it (but relative is likely the cause of HTML downloads)
    const isRelative = !url.startsWith('http');
    const fullUrl = isRelative ? `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}` : url;

    // Fetch the file to ensure we're getting what we expect
    const response = await fetch(fullUrl, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('text/html')) {
      // If we get HTML when we expect a file, it's likely the SPA index.html or an error page
      console.warn('Received HTML response for file download. Likely a 404 or redirect to home.');
      throw new Error('The file was not found or the link is invalid (returned HTML).');
    }

    const blob = await response.blob();
    saveAs(blob, fileName);
  } catch (error: any) {
    console.error('Download error:', error);
    // Fallback to direct download if fetch fails (e.g. CORS)
    // although if fetch failed due to CORS, saveAs(url) might also fail or behave weirdly
    try {
      saveAs(url, fileName);
    } catch (fallbackError) {
      alert(`Download failed: ${error.message || 'Unknown error'}`);
    }
  }
};
