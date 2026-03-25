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
import 'jspdf-autotable';
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
      // @ts-ignore - jspdf types might be missing autotable
      const doc = new jsPDF();
      
      // Đăng ký font Roboto để hỗ trợ tiếng Việt
      doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto");
      
      // Title - Remove accents for default font compatibility if necessary, or use standard
      doc.setFontSize(20);
      doc.text('SỔ TIÊM CHỦNG ĐIỆN TỬ', 105, 15, { align: 'center' });
      
      // Baby Info
      doc.setFontSize(12);
      doc.text(`Họ tên bé: ${selectedBaby.name}`, 14, 25);
      doc.text(`Ngày sinh: ${format(new Date(selectedBaby.dob), 'dd/MM/yyyy')}`, 14, 32);
      doc.text(`Tiến độ: ${stats.completionRate}% (${stats.done}/${stats.total} mũi)`, 14, 39);
      
      // Table Header and Body
      const tableColumn = ["Stt", "Vắc-xin", "Mũi", "Ngày dự kiến", "Trạng thái", "Ngày tiêm thực tế"];
      const tableRows = schedules.map((s, index) => [
        index + 1,
        s.vaccines?.short_name || s.vaccines?.name,
        s.dose_number,
        format(new Date(s.scheduled_date), 'dd/MM/yyyy'),
        s.status === 'done' ? 'Đã tiêm' : s.status === 'overdue' ? 'Quá hạn' : 'Chưa tiêm',
        s.vaccine_history?.[0] ? format(new Date(s.vaccine_history[0].injected_date), 'dd/MM/yyyy') : '-'
      ]);

      // @ts-ignore
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        styles: { font: 'Roboto' }, // Hỗ trợ tiếng Việt trong bảng
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
