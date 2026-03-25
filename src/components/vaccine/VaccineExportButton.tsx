import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useVaccine } from '@/contexts/VaccineContext';
import { useBaby } from '@/contexts/BabyContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// We assume jspdf and jspdf-autotable are installed
// If not, the user should run: npm install jspdf jspdf-autotable
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
      // @ts-ignore - jspdf types might be missing autotable
      const doc = new jsPDF();
      
      /**
       * LƯU Ý CHO NGƯỜI DÙNG:
       * Để hỗ trợ tiếng Việt có dấu đầy đủ trong PDF, bạn cần nhúng font Unicode (.ttf)
       * Bạn có thể tải font (VD: Roboto-Regular.ttf), chuyển sang base64 và dùng doc.addFileToVFS()
       * Hiện tại đang dùng font mặc định (không dấu hoặc font hệ thống)
       */
      
      // Title - Remove accents for default font compatibility if necessary, or use standard
      doc.setFontSize(20);
      doc.text('SO TIEM CHUNG DIEN TU', 105, 15, { align: 'center' });
      
      // Baby Info
      doc.setFontSize(12);
      doc.text(`Ho ten be: ${selectedBaby.name}`, 14, 25);
      doc.text(`Ngay sinh: ${format(new Date(selectedBaby.dob), 'dd/MM/yyyy')}`, 14, 32);
      doc.text(`Tiến độ: ${stats.completionRate}% (${stats.done}/${stats.total} mũi)`, 14, 39);
      
      // Table Header and Body
      const tableColumn = ["Stt", "Vac-xin", "Mui", "Ngay du kien", "Trang thai", "Ngay tiem thuc te"];
      const tableRows = schedules.map((s, index) => [
        index + 1,
        s.vaccines?.short_name || s.vaccines?.name,
        s.dose_number,
        format(new Date(s.scheduled_date), 'dd/MM/yyyy'),
        s.status === 'done' ? 'Da tiem' : s.status === 'overdue' ? 'Qua han' : 'Chua tiem',
        s.vaccine_history?.[0] ? format(new Date(s.vaccine_history[0].injected_date), 'dd/MM/yyyy') : '-'
      ]);

      // @ts-ignore
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] },
      });

      const fileName = `Lich_tiem_${selectedBaby.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyy')}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Thành công',
        description: 'Đã tải xuống sổ tiêm chủng PDF',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo file PDF. Vui lòng thử lại sau.',
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
