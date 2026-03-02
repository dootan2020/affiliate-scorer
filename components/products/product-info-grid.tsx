import { formatVND, formatPercent, formatNumber, formatPlatform, formatSource } from "@/lib/utils/format";

interface ProductInfoGridProps {
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  category: string | null;
  shopName: string | null;
  kolOrderRate: number | null;
  sales7d: number | null;
  salesTotal: number | null;
  revenue7d: number | null;
  revenueTotal: number | null;
  source: string;
}

export function ProductInfoGrid(props: ProductInfoGridProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Thông tin sản phẩm</p>
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          <InfoRow label="Giá bán" value={formatVND(props.price)} />
          <InfoRow label="Hoa hồng" value={`${formatPercent(props.commissionRate)} (${formatVND(props.commissionVND)})`} />
          <InfoRow label="Nền tảng" value={formatPlatform(props.platform)} />
          <InfoRow label="Danh mục" value={props.category} />
          <InfoRow label="Shop" value={props.shopName} />
          {props.kolOrderRate !== null && (
            <InfoRow label="Tỷ lệ chốt đơn KOL" value={`${props.kolOrderRate.toFixed(1)}%`} />
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Dữ liệu bán hàng</p>
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {props.sales7d !== null && <InfoRow label="Bán 7 ngày" value={formatNumber(props.sales7d)} />}
          {props.salesTotal !== null && <InfoRow label="Tổng bán" value={formatNumber(props.salesTotal)} />}
          {props.revenue7d !== null && <InfoRow label="Doanh thu 7 ngày" value={formatVND(props.revenue7d)} />}
          {props.revenueTotal !== null && <InfoRow label="Tổng doanh thu" value={formatVND(props.revenueTotal)} />}
          <InfoRow label="Nguồn" value={formatSource(props.source)} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }): React.ReactElement | null {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-50">{value}</span>
    </div>
  );
}
