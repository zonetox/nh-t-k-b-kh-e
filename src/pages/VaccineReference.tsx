import React from 'react';
import { Shield, Syringe, Info, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tcmrVaccines = [
  { id: 1, name: 'Lao (BCG)', schedule: 'Sơ sinh (càng sớm càng tốt)', desc: 'Phòng bệnh Lao' },
  { id: 2, name: 'Viêm gan B', schedule: 'Trong 24h sau sinh', desc: 'Phòng bệnh Viêm gan B lây truyền từ mẹ' },
  { id: 3, name: '5 trong 1 (DPT-VGB-Hib)', schedule: '2, 3, 4 tháng tuổi', desc: 'Phòng Bạch hầu, Ho gà, Uốn ván, Viêm gan B, Viêm phổi/màng não do vi khuẩn Hib' },
  { id: 4, name: 'Bại liệt uống (OPV)', schedule: '2, 3, 4 tháng tuổi', desc: 'Phòng bệnh bại liệt (đường uống)' },
  { id: 5, name: 'Bại liệt tiêm (IPV)', schedule: '5 tháng tuổi', desc: 'Phòng bệnh bại liệt (đường tiêm)' },
  { id: 6, name: 'Sởi', schedule: '9 tháng tuổi', desc: 'Phòng bệnh Sởi' },
  { id: 7, name: 'Viêm não Nhật Bản', schedule: '12 tháng tuổi (2 mũi đầu cách nhau 1-2 tuần)', desc: 'Phòng bệnh Viêm não Nhật Bản' },
  { id: 8, name: 'Sởi - Rubella (MR)', schedule: '18 tháng tuổi', desc: 'Mũi nhắc phòng Sởi và Rubella' },
  { id: 9, name: 'Bạch hầu-Ho gà-Uốn ván (DPT)', schedule: '18 tháng tuổi', desc: 'Mũi nhắc lần 4' },
  { id: 10, name: 'Tả', schedule: '2-5 tuổi (vùng nguy cơ cao)', desc: 'Phòng bệnh tả (uống 2 liều)' },
  { id: 11, name: 'Thương hàn', schedule: '3-10 tuổi (vùng nguy cơ cao)', desc: 'Phòng bệnh Thương hàn' },
  { id: 12, name: 'Uốn ván', schedule: 'Phụ nữ có thai, tuổi sinh đẻ', desc: 'Phòng uốn ván sơ sinh' },
];

const serviceVaccines = [
  { id: 1, name: 'Tiêu chảy do rotavirus', schedule: 'Từ 6 tuần tuổi (uống 2-3 liều)', desc: 'Ngừa tiêu chảy cấp nguy hiểm ở trẻ nhỏ. (Rotarix, Rotateq)' },
  { id: 2, name: '6 trong 1', schedule: '2, 3, 4 tháng tuổi', desc: 'Thay thế 5 trong 1 + Bại liệt. Tiêm ít mũi hơn, giảm đau cho bé. (Hexaxim, Infanrix Hexa)' },
  { id: 3, name: 'Phế cầu khuẩn', schedule: 'Từ 6 tuần tuổi', desc: 'Ngừa viêm màng não, viêm tai giữa, viêm phổi do phế cầu (Prevenar 13, Synflorix).' },
  { id: 4, name: 'Cúm mùa', schedule: 'Từ 6 tháng tuổi', desc: 'Nhắc lại hàng năm (Vaxigrip, Influvac).' },
  { id: 5, name: 'Thủy đậu', schedule: 'Từ 9 tháng tuổi', desc: 'Phòng bệnh thủy đậu lây lan (Varivax, Varilrix).' },
  { id: 6, name: 'Viêm gan A', schedule: 'Từ 12 tháng tuổi', desc: 'Phòng bệnh viêm gan A (Avaxim, Twinrix).' },
  { id: 7, name: 'Não mô cầu BC/ACWY', schedule: 'Từ 2 hoặc 6 tháng tuổi tùy loại', desc: 'Phòng viêm màng não não mô cầu cực kỳ nguy hiểm (Mengoc BC, Menactra).' },
  { id: 8, name: 'Sởi - Quai bị - Rubella (MMR)', schedule: 'Từ 9-12 tháng tuổi', desc: 'Vắc xin kết hợp tiện lợi (MMR II, Priorix).' },
  { id: 9, name: 'Ung thư cổ tử cung (HPV)', schedule: 'Từ 9 tuổi', desc: 'Phòng các bệnh do vi rút HPV cho cả nam và nữ (Gardasil, Gardasil 9).' },
];

const VaccineReference: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-xl">
              <Syringe className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Thông Tin Vắc Xin</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 mb-24 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Sơ Đồ & Lịch Tiêm Chủng Tham Khảo</h1>
          <p className="text-muted-foreground">
            Thông tin được tổng hợp từ hướng dẫn chính thức của Bộ Y Tế và hệ thống trung tâm tiêm chủng (VNVC, Nhi Đồng,...).
            Việc tiêm phòng đầy đủ giúp bé thiết lập hàng rào miễn dịch vững chắc ngay từ những năm tháng đầu đời.
          </p>
        </div>

        <Tabs defaultValue="tcmr" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-1/2">
            <TabsTrigger value="tcmr" className="gap-2">
              <Shield className="h-4 w-4" />
              Tiêm Chủng Mở Rộng
            </TabsTrigger>
            <TabsTrigger value="service" className="gap-2">
              <Info className="h-4 w-4" />
              Tiêm Chủng Dịch Vụ
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tcmr">
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Chương Trình Tiêm Chủng Mở Rộng (TCMR)
                </CardTitle>
                <CardDescription>
                  12 loại vắc xin quan trọng được nhà nước hỗ trợ miễn phí tại các trạm y tế xã phường trên toàn quốc.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {tcmrVaccines.map(v => (
                    <div key={v.id} className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-base">{v.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1 mb-2">{v.desc}</p>
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">
                            {v.schedule}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="service">
            <Card>
              <CardHeader className="bg-blue-50 dark:bg-blue-950/20 border-b">
                <CardTitle className="text-xl text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Các Mũi Tiêm Chủng Dịch Vụ Khuyến Nghị
                </CardTitle>
                <CardDescription>
                  Bên cạnh TCMR, Bộ Y Tế khuyến cáo phụ huynh nên cho bé tiêm thêm các mũi dịch vụ (nếu có điều kiện) 
                  để phòng chống toàn diện các bệnh truyền nhiễm nguy hiểm khác.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {serviceVaccines.map(v => (
                    <div key={v.id} className="p-4 border rounded-xl bg-card hover:border-blue-500/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Syringe className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-base">{v.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1 mb-2">{v.desc}</p>
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-xs font-medium">
                            {v.schedule}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VaccineReference;
