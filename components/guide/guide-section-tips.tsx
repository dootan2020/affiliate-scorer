import { GuideCallout } from "./guide-callout";

function TipGroup({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="not-prose rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h4>
      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 ml-1">{children}</div>
    </div>
  );
}

function TipTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p className="font-semibold text-gray-900 dark:text-gray-100">{children}</p>;
}

export function GuideSectionTips(): React.ReactElement {
  return (
    <section id="meo">
      <h2>15. Mẹo sử dụng</h2>
      <p>Tổng hợp mẹo giúp bạn dùng PASTR hiệu quả hơn, chia theo 5 nhóm.</p>

      {/* Nhóm 1: Quản lý dữ liệu */}
      <TipGroup icon="📦" title="Quản lý dữ liệu">
        <div>
          <TipTitle>Cập nhật FastMoss đúng thời điểm</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li><strong>8:00 - 9:00 sáng</strong> — Dữ liệu đêm qua đã ổn định. Thấy rõ SP nào trending. Thời điểm tốt nhất, kết hợp đọc Bản tin sáng.</li>
            <li><strong>13:00 - 14:00 chiều</strong> — Dữ liệu buổi sáng đã cập nhật. Phát hiện SP mới đang lên trong ngày.</li>
            <li><strong>Không nên upload sau 20:00</strong> — Dữ liệu chưa ổn định, điểm số có thể nhảy lung tung.</li>
          </ul>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tần suất: ít nhất 1 lần/ngày vào sáng. Nếu rảnh, thêm 1 lần chiều.</p>
        </div>
        <div>
          <TipTitle>Giữ Hộp sản phẩm gọn gàng</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>SP điểm &lt; 40 sau 7 ngày → nên xóa hoặc lưu trữ</li>
            <li>Không để quá 200 SP — AI phân tích chậm hơn khi danh sách quá lớn</li>
            <li>Dọn dẹp mỗi tuần: xóa SP hết xu hướng, giữ SP bền vững</li>
          </ul>
        </div>
        <div>
          <TipTitle>Sao lưu dữ liệu quan trọng</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Brief hay → lưu vào Thư viện, đánh dấu yêu thích</li>
            <li>Phản hồi chi tiết → ghi rõ ràng, đây là &ldquo;nhiên liệu&rdquo; cho AI học</li>
          </ul>
        </div>
      </TipGroup>

      {/* Nhóm 2: Chọn SP thông minh */}
      <TipGroup icon="🎯" title="Chọn sản phẩm thông minh">
        <div>
          <TipTitle>Hiểu ý nghĩa điểm số</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li><strong>80-100:</strong> SP đang hot, cạnh tranh cao — cần hook thật sáng tạo để nổi bật.</li>
            <li><strong>70-79:</strong> Vùng lý tưởng. Đủ nhu cầu, chưa quá đông. Nên ưu tiên nhóm này.</li>
            <li><strong>50-69:</strong> Tiềm năng nhưng rủi ro. Chỉ quay nếu có góc nhìn độc đáo.</li>
            <li><strong>Dưới 50:</strong> Thường không đáng đầu tư thời gian, trừ thị trường ngách.</li>
          </ul>
        </div>
        <div>
          <TipTitle>Đánh giá shop trước khi quay</TipTitle>
          <p className="mt-1 text-gray-600 dark:text-gray-400">SP tốt nhưng shop tệ = tiền mất tật mang. Kiểm tra:</p>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Shop &lt; 4.5 sao → tỷ lệ hoàn hàng cao, hoa hồng bị trừ</li>
            <li>Shop mới &lt; 3 tháng → rủi ro đóng bất ngờ</li>
            <li>Ít đánh giá (&lt; 100) → chưa đủ tin cậy</li>
            <li>Kiểm tra thêm: thời gian giao hàng, chính sách đổi trả</li>
          </ul>
        </div>
        <div>
          <TipTitle>Tận dụng mùa khuyến mãi</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li><strong>1/1, 2/2, 3/3, 4/4, 5/5</strong> — Khuyến mãi đầu tháng (quy mô nhỏ)</li>
            <li><strong>8/3, 20/10</strong> — Quà tặng phụ nữ (mỹ phẩm, phụ kiện bán rất chạy)</li>
            <li><strong>6/6, 7/7, 8/8, 9/9</strong> — Khuyến mãi giữa năm (quy mô lớn)</li>
            <li><strong>11/11, 12/12</strong> — Khuyến mãi lớn nhất năm</li>
            <li><strong>Thứ Sáu Đen</strong> — Cuối tháng 11</li>
          </ul>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Bắt đầu chuẩn bị 7 ngày trước sale. Đăng video 3-5 ngày trước để thuật toán đẩy kịp.</p>
        </div>
      </TipGroup>

      {/* Nhóm 3: Tạo brief hiệu quả */}
      <TipGroup icon="✍️" title="Tạo brief hiệu quả">
        <div>
          <TipTitle>Chọn mô hình AI phù hợp từng tình huống</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>SP đơn giản (gia dụng, đồ rẻ dưới 100k): <strong>Haiku</strong> đủ tốt, nhanh, rẻ</li>
            <li>SP cần kể chuyện (mỹ phẩm, thời trang): <strong>Sonnet</strong> trở lên</li>
            <li>SP khó bán, cần góc nhìn sáng tạo: <strong>Opus</strong> cho brief đầu tiên, rồi lấy làm tham khảo</li>
          </ul>
        </div>
        <div>
          <TipTitle>Tạo nhiều brief, kết hợp cái hay nhất</TipTitle>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Cùng 1 SP, mỗi lần tạo brief AI cho kết quả khác nhau. Chiến lược:</p>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Tạo 2-3 brief cho cùng 1 SP</li>
            <li>Chọn câu mở đầu hay nhất từ brief 1</li>
            <li>Kết hợp kịch bản từ brief 2</li>
            <li>Lấy hashtags từ brief 3</li>
            <li>Ghép thành 1 brief hoàn hảo</li>
          </ul>
        </div>
        <div>
          <TipTitle>Các dạng câu mở đầu hiệu quả trên TikTok Việt Nam</TipTitle>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-1">Thứ tự từ hiệu quả cao → thấp:</p>
          <ol className="list-decimal ml-4 space-y-1 text-gray-600 dark:text-gray-400">
            <li><strong>Câu hỏi:</strong> &ldquo;Bạn có biết...?&rdquo;, &ldquo;Tại sao...?&rdquo;</li>
            <li><strong>POV (Góc nhìn):</strong> &ldquo;POV: Khi bạn...&rdquo;</li>
            <li><strong>Giá gây bất ngờ:</strong> &ldquo;49k mà ai cũng hỏi mua ở đâu&rdquo;</li>
            <li><strong>Bằng chứng xã hội:</strong> &ldquo;3 ngày bán 10.000 đơn&rdquo;</li>
            <li><strong>Gây tranh cãi nhẹ:</strong> &ldquo;Đừng mua cái này nếu...&rdquo;</li>
          </ol>
        </div>
      </TipGroup>

      {/* Nhóm 4: Tối ưu vòng lặp học */}
      <TipGroup icon="🔄" title="Tối ưu vòng lặp học">
        <div>
          <TipTitle>Ghi nhật ký đều đặn — kể cả video thất bại</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Video 0 lượt xem cũng cần ghi → AI biết combo SP + hook nào không hiệu quả</li>
            <li>Ghi rõ lý do: video kém? SP hết hàng? Sai thời điểm? Hook nhàm chán?</li>
            <li>Phản hồi chi tiết = Học chính xác hơn</li>
          </ul>
        </div>
        <div>
          <TipTitle>Khi nào chạy Học (Learning)?</TipTitle>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Tối thiểu: sau khi có <strong>10 phản hồi mới</strong> trở lên</li>
            <li>Tốt nhất: cuối mỗi tuần (Chủ nhật tối hoặc Thứ Hai sáng)</li>
            <li>Sau mỗi đợt khuyến mãi lớn (nhiều dữ liệu mới)</li>
            <li>Không cần hàng ngày — tuần 1 lần là đủ</li>
          </ul>
        </div>
        <div>
          <TipTitle>Đọc Sổ tay chiến lược định kỳ</TipTitle>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Mỗi 2 tuần, vào Phân tích → Sổ tay chiến lược và tự hỏi:</p>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Loại SP nào lặp lại trong top? (phong thủy luôn bán tốt?)</li>
            <li>Thời điểm nào video hay được đẩy? (18-20h tối?)</li>
            <li>Dạng hook nào hay thất bại? → Ghi nhớ và tránh</li>
            <li>Mức giá nào chuyển đổi tốt nhất? (50k-150k?)</li>
          </ul>
        </div>
      </TipGroup>

      {/* Nhóm 5: Tiết kiệm chi phí AI */}
      <TipGroup icon="💰" title="Tiết kiệm chi phí AI">
        <div>
          <TipTitle>Nguyên tắc 80/20</TipTitle>
          <p className="mt-1 text-gray-600 dark:text-gray-400">80% chi phí AI nằm ở &ldquo;Tạo Brief&rdquo; vì prompt dài nhất. Cách tiết kiệm:</p>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Chấm điểm SP: luôn dùng <strong>Haiku</strong> (nhanh, rẻ, đủ chính xác)</li>
            <li>Bản tin sáng: <strong>Haiku</strong> (chỉ tóm tắt, không cần sáng tạo)</li>
            <li>Tạo Brief: <strong>Sonnet</strong> (hay hơn Haiku 60%, rẻ hơn Opus 80%)</li>
            <li>Chỉ dùng Opus khi SP quan trọng, cần brief đặc biệt hay</li>
          </ul>
        </div>
        <div>
          <TipTitle>Ước tính chi phí thực tế (preset Cân bằng)</TipTitle>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Giả sử mỗi ngày: chấm 10 SP, tạo 3 brief, 1 bản tin sáng:</p>
          <div className="mt-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-3 text-xs space-y-1">
            <p>10 SP × Haiku chấm điểm ≈ $0.01/ngày</p>
            <p>3 brief × Sonnet ≈ $0.03/ngày</p>
            <p>1 bản tin sáng × Haiku ≈ $0.003/ngày</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 pt-1 border-t border-gray-200 dark:border-slate-700">
              Tổng: ≈ 32.000đ/tháng (~$1,3) — rẻ hơn 1 ly cà phê sữa đá
            </p>
          </div>
        </div>
      </TipGroup>

      <GuideCallout variant="success">
        <strong>Mẹo tổng hợp:</strong> Upload FastMoss mỗi sáng → Ưu tiên SP điểm 70-79 → Tạo 2-3 brief bằng Sonnet →
        Log kết quả mỗi tối → Chạy Học mỗi tuần. Vòng lặp này giúp AI ngày càng hiểu phong cách của bạn.
      </GuideCallout>
    </section>
  );
}
