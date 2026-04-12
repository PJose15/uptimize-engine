'use client';

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UsePdfExportOptions {
  elementId: string;
  filename: string;
}

export function usePdfExport({ elementId, filename }: UsePdfExportOptions) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    const el = document.getElementById(elementId);
    if (!el) {
      setError('Report element not found');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      // Force light mode for PDF capture
      el.classList.add('print-mode');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      el.classList.remove('print-mode');

      // A4 dimensions in mm
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      const MARGIN = 10;
      const contentWidth = A4_WIDTH - MARGIN * 2;
      const contentHeight = A4_HEIGHT - MARGIN * 2 - 10; // 10mm for footer

      // Scale canvas to fit A4 width
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const totalPages = Math.ceil(imgHeight / contentHeight);

      const doc = new jsPDF('p', 'mm', 'a4');

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();

        // Clip to current page region
        const srcY = (page * contentHeight * canvas.width) / imgWidth;
        const srcHeight = (contentHeight * canvas.width) / imgWidth;

        // Create a page-sized canvas slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(srcHeight, canvas.height - srcY);
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(
          canvas,
          0, srcY,
          canvas.width, pageCanvas.height,
          0, 0,
          canvas.width, pageCanvas.height,
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        const sliceHeight = (pageCanvas.height * imgWidth) / canvas.width;
        doc.addImage(pageImgData, 'PNG', MARGIN, MARGIN, imgWidth, sliceHeight);

        // Diagonal watermark
        doc.saveGraphicsState();
        doc.setFontSize(60);
        doc.setTextColor(200, 200, 200);
        const gState = doc.GState({ opacity: 0.12 });
        doc.setGState(gState);
        doc.text('UPTIMIZE', A4_WIDTH / 2, A4_HEIGHT / 2, {
          align: 'center',
          angle: 45,
        });
        doc.restoreGraphicsState();

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated ${new Date().toLocaleDateString()} | Page ${page + 1} of ${totalPages}`,
          A4_WIDTH / 2,
          A4_HEIGHT - 5,
          { align: 'center' },
        );
      }

      doc.save(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setExporting(false);
      // Ensure class is removed even on error
      const el2 = document.getElementById(elementId);
      el2?.classList.remove('print-mode');
    }
  }, [elementId, filename]);

  return { exporting, exportPdf, error };
}
