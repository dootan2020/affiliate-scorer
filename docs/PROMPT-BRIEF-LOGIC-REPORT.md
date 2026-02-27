Báo cáo chi tiết logic tạo Brief trên trang /production. KHÔNG SỬA GÌ, chỉ đọc code và báo cáo.

---

## YÊU CẦU

Đọc toàn bộ code liên quan đến luồng tạo Brief và trả lời các câu hỏi sau:

### 1. Luồng tạo Brief từ đầu đến cuối

Truy vết code từ lúc user bấm "Tạo Briefs" đến khi brief hiển thị:
- File nào xử lý nút bấm? (component nào, handler nào)
- Gọi API endpoint nào? (URL, method, body gửi đi)
- API route file nào xử lý? (path trong app/api/...)
- API route gọi hàm AI nào? (callAI, callClaude, callGemini, ...)
- Prompt gửi cho AI chứa những gì?
- Response AI trả về format gì?
- Brief được lưu ở đâu? (DB table nào, fields nào)

### 2. Dữ liệu sản phẩm truyền vào prompt

Khi tạo brief, dữ liệu sản phẩm nào được đưa vào prompt AI?

Liệt kê CỤ THỂ:
- [ ] Tên sản phẩm (title)
- [ ] Mô tả sản phẩm (description)
- [ ] Giá bán (price)
- [ ] Hoa hồng (commission / commissionRate)
- [ ] Danh mục (category)
- [ ] Đánh giá (rating)
- [ ] Số lượng bán (soldCount / salesVolume)
- [ ] Tên shop (shopName)
- [ ] Link sản phẩm (sourceUrl)
- [ ] Ảnh sản phẩm (imageUrl)
- [ ] Điểm số AI (combinedScore / aiScore)
- [ ] Dữ liệu FastMoss gốc (rawData)
- [ ] Thông tin khác?

### 3. Nội dung prompt AI

Copy nguyên văn prompt template đang dùng để tạo brief. Bao gồm:
- System prompt (nếu có)
- User prompt
- Các placeholder / variable được thay thế

### 4. Kết quả brief hiển thị

Sau khi AI trả về, brief hiển thị những gì?
- Hooks (câu mở đầu)?
- Script (kịch bản)?
- Hashtags?
- CTA (kêu gọi hành động)?
- Góc quay gợi ý?
- Thông tin nào khác?

### 5. Vấn đề phát hiện

Dựa trên code đã đọc, liệt kê:
- Dữ liệu nào ĐANG được dùng trong prompt
- Dữ liệu nào CÓ TRONG DB nhưng KHÔNG được dùng trong prompt
- Prompt có đủ context để AI tạo brief hay không
- Nếu chỉ truyền title → brief sẽ chung chung vì AI không biết giá, commission, đặc điểm SP

---

## FORMAT BÁO CÁO

Tạo file `docs/BRIEF-LOGIC-REPORT.md` với format:

```markdown
# Báo cáo logic tạo Brief

## 1. Luồng code
[truy vết từng bước, ghi rõ file:line]

## 2. Dữ liệu truyền vào prompt
[bảng: field | có/không | giá trị mẫu]

## 3. Prompt template
[copy nguyên văn]

## 4. Output format
[brief hiển thị gì]

## 5. Vấn đề
[liệt kê vấn đề + đề xuất cải thiện]
```

Commit: "docs: báo cáo logic tạo brief"
