/**
 * Utility function to download a blob as a file
 * @param blob The blob to download
 * @param filename The name of the file to download
 */
export const download = (blob: Blob, filename: string) => {
  // Create a download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}; 