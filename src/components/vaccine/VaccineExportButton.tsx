import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useVaccine } from '@/contexts/VaccineContext';
import { useBaby } from '@/contexts/BabyContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoBase64 } from '@/lib/fonts';

const VaccineExportButton: React.FC = () => {
  const { schedules, stats } = useVaccine();
  const { selectedBaby } = useBaby();
  const { isPremium } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!isPremium) {
      toast({
        title: 'Tính năng Premium',
        description: 'Vui lòng nâng cấp gói thành viên để sử dụng tính năng xuất báo cáo PDF.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedBaby || schedules.length === 0) return;

    setIsExporting(true);
    try {
      // Robust helper to convert remote URL to compatible DataURL using Canvas
      const getNormalizedImageDataUrl = async (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Crucial for Supabase CORS
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            // Convert to JPEG for smallest PDF size while maintaining quality
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
          img.src = url;
        });
      };

      // @ts-ignore - jspdf types might be missing autotable
      const doc = new jsPDF();
      
      // Đăng ký font Roboto để hỗ trợ tiếng Việt
      doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto");
      
      // Header Section
      let currentY = 15;
      
      // 1. Baby Avatar (if exists)
      if (selectedBaby.avatar_url) {
        try {
          const avatarBase64 = await getNormalizedImageDataUrl(selectedBaby.avatar_url);
          doc.addImage(avatarBase64, 'JPEG', 14, 10, 25, 25);
          // Adjust header text to be next to avatar
          doc.setFontSize(22);
          doc.text('SỔ TIÊM CHỦNG ĐIỆN TỬ', 45, 20);
          doc.setFontSize(12);
          doc.text(`Bé: ${selectedBaby.name}`, 45, 28);
          doc.text(`Ngày sinh: ${format(new Date(selectedBaby.dob), 'dd/MM/yyyy')}`, 45, 34);
          currentY = 45;
        } catch (e) {
          console.error("Failed to load avatar for PDF:", e);
          // Fallback if avatar fails
          doc.setFontSize(20);
          doc.text('SỔ TIÊM CHỦNG ĐIỆN TỬ', 105, 15, { align: 'center' });
          doc.setFontSize(12);
          doc.text(`Họ tên bé: ${selectedBaby.name}`, 14, 25);
          doc.text(`Ngày sinh: ${format(new Date(selectedBaby.dob), 'dd/MM/yyyy')}`, 14, 32);
          currentY = 42;
        }
      } else {
        doc.setFontSize(20);
        doc.text('SỔ TIÊM CHỦNG ĐIỆN TỬ', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Họ tên bé: ${selectedBaby.name}`, 14, 25);
        doc.text(`Ngày sinh: ${format(new Date(selectedBaby.dob), 'dd/MM/yyyy')}`, 14, 32);
        currentY = 42;
      }

      doc.setFontSize(12);
      doc.text(`Tiến độ: ${stats.completionRate}% (${stats.done}/${stats.total} mũi)`, 14, currentY - 5);
      
      // 2. Main Vaccination Table
      const tableColumn = ["Stt", "Vắc-xin", "Mũi", "Ngày dự kiến", "Cơ sở / Mã lô", "Ngày tiêm thực tế"];
      const tableRows = schedules.map((s, index) => {
        let scheduledDateStr = '-';
        try {
          scheduledDateStr = format(new Date(s.scheduled_date), 'dd/MM/yyyy');
        } catch (e) {}

        let injectedDateStr = '-';
        let detailStr = '-';
        if (s.vaccine_history?.[0]) {
          const hist = s.vaccine_history[0];
          try {
            injectedDateStr = format(new Date(hist.injected_date), 'dd/MM/yyyy');
          } catch (e) {}
          
          const parts = [];
          if (hist.location) parts.push(hist.location);
          if (hist.batch_number) parts.push(`Lô: ${hist.batch_number}`);
          detailStr = parts.join('\n') || '-';
        }

        return [
          index + 1,
          s.vaccines?.short_name || s.vaccines?.name || 'Vắc-xin',
          s.dose_number,
          scheduledDateStr,
          detailStr,
          injectedDateStr
        ];
      });

      // @ts-ignore
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 9 },
        headStyles: { fillColor: [66, 133, 244], fontStyle: 'normal' },
        columnStyles: {
          4: { cellWidth: 45 }, // Details column wider
        }
      });

      // 3. Appendix: Certificate Images
      const allImages: { url: string; label: string }[] = [];
      schedules.forEach(s => {
        if (s.vaccine_history?.[0]?.vaccine_history_images) {
          s.vaccine_history[0].vaccine_history_images.forEach(img => {
            if (img.image_url) {
              allImages.push({ 
                url: img.image_url, 
                label: `${s.vaccines?.name} (Mũi ${s.dose_number})` 
              });
            }
          });
        }
      });

      if (allImages.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('PHỤ LỤC: HÌNH ẢNH CHỨNG NHẬN', 105, 20, { align: 'center' });
        
        let imgY = 30;
        let imgX = 14;
        const imgWidth = 85;
        const imgHeight = 60;
        const gutter = 10;

        for (let i = 0; i < allImages.length; i++) {
          try {
            const imgData = await getNormalizedImageDataUrl(allImages[i].url);
            
            // Check if we need a new page
            if (imgY + imgHeight + 15 > 280) {
              doc.addPage();
              imgY = 20;
            }

            doc.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
            doc.setFontSize(8);
            doc.text(allImages[i].label, imgX, imgY + imgHeight + 5);

            // Alternate columns
            if (imgX === 14) {
              imgX = 14 + imgWidth + gutter;
            } else {
              imgX = 14;
              imgY += imgHeight + 15;
            }
          } catch (e) {
            console.error("Failed to add appendix image:", e);
          }
        }
      }

      const safeBabyName = selectedBaby.name ? selectedBaby.name.replace(/\s+/g, '_') : 'Be';
      const fileName = `So_tiem_chung_${safeBabyName}_${format(new Date(), 'ddMMyy')}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Thành công',
        description: 'Đã tải xuống sổ tiêm chủng PDF hoàn thiện',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo file PDF chi tiết. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2 text-xs h-8 border-primary/20 hover:bg-primary/5"
      onClick={handleExport}
      disabled={isExporting || !selectedBaby}
    >
      {isExporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5 text-primary" />
      )}
      Xuất PDF
    </Button>
  );
};

export default VaccineExportButton;
