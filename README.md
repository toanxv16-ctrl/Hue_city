# Đề tài: Theo dõi biến động diện tích mặt nước từ ảnh viễn thám

## Giai đoạn 1 — Chốt phạm vi

### 1. Mục tiêu đề tài

Đánh giá sự thay đổi diện tích mặt nước tại khu vực nghiên cứu qua các mốc thời gian lựa chọn, dựa trên ảnh viễn thám. Kết quả nhằm xác định xu hướng tăng/giảm mặt nước và cung cấp bản đồ biến động để phục vụ theo dõi tài nguyên nước.

### 2. Khu vực nghiên cứu

- **Khu vực:** Thành phố Huế, Việt Nam.
- **Phạm vi không gian dự kiến:** Toàn bộ vùng mặt nước và vùng đệm lân cận trong ranh giới hành chính Thành phố Huế.
- **Hệ tọa độ dự kiến:** WGS 84 (EPSG:4326) khi thu thập dữ liệu; có thể chuyển sang hệ UTM phù hợp khi tính diện tích.

### 3. Mốc thời gian

Để hạn chế sai lệch do mùa vụ, các ảnh cần được chọn cùng mùa hoặc gần cùng tháng giữa các năm.

| Mốc | Thời gian dự kiến | Mục đích |
| --- | --- | --- |
| T0 | Năm cơ sở (ví dụ: 2016) | Xác định hiện trạng ban đầu |
| T1 | Năm giữa kỳ (ví dụ: 2021) | Nhận diện biến động trung hạn |
| T2 | Năm gần nhất (ví dụ: 2026) | Đánh giá hiện trạng và biến động tổng thể |

**Tiêu chí chọn ảnh:** mây thấp, độ phân giải phù hợp, cùng mùa quan sát; ưu tiên Sentinel-2 hoặc Landsat 8/9.

### 4. Câu hỏi nghiên cứu

1. Diện tích mặt nước tại khu vực nghiên cứu thay đổi như thế nào giữa các mốc thời gian?
2. Mức tăng hoặc giảm diện tích mặt nước là bao nhiêu (ha và %)?
3. Biến động tập trung tại những vị trí nào trong khu vực nghiên cứu?
4. Xu hướng biến động có nhất quán giữa các giai đoạn hay không?

### 5. Sản phẩm đầu ra của phạm vi này

- Ranh giới khu vực nghiên cứu đã xác nhận.
- Danh sách ảnh vệ tinh đáp ứng tiêu chí cho từng mốc thời gian.
- Bản đồ mặt nước từng mốc và bản đồ tăng/giảm mặt nước.
- Bảng thống kê diện tích, chênh lệch và tỷ lệ biến động.

### 6. Thông tin cần xác nhận trước giai đoạn 2

- Ba mốc thời gian chính xác và mùa quan sát mong muốn.
- Nguồn ảnh ưu tiên (Sentinel-2 hay Landsat) và độ chính xác mong muốn.
- Ranh giới hành chính cần áp dụng (đặc biệt nếu nghiên cứu so sánh các năm có thay đổi địa giới).

## Giai đoạn 2 — Chuẩn bị AOI

### AOI đã tạo

- **Tệp:** `study_area.geojson`
- **Khu vực:** Thành phố Huế (mã hành chính 46).
- **Kiểu hình học:** `MultiPolygon` theo WGS 84 / EPSG:4326.
- **Hộp bao (kinh độ, vĩ độ):** 107.032540, 15.996149, 108.192161, 16.743931.
- **Diện tích tham chiếu của nguồn:** 4.947,11 km².

### Kiểm tra hình học

- Một đối tượng (Feature) duy nhất.
- 2.259 tọa độ; vòng ranh giới khép kín.
- Tất cả tọa độ nằm trong miền hợp lệ của WGS 84.

### Nguồn dữ liệu

Ranh giới được trích từ bộ **Vietnamese Provinces Database** (GIS Dataset), mã 46 — Huế. Bộ dữ liệu công bố hình học theo WGS 84 và cho biết ranh giới GIS được dẫn xuất từ Bản đồ tham chiếu đơn vị hành chính Việt Nam của Nhà xuất bản Tài nguyên, Môi trường và Bản đồ Việt Nam.

### Lưu ý sử dụng trong GEE

Nếu các ảnh lịch sử có trước khi Thành phố Huế trực thuộc trung ương được thành lập, AOI này vẫn được giữ cố định để so sánh cùng một không gian. Khi cần phân tích theo địa giới lịch sử, cần thay bằng ranh giới đúng tại từng thời điểm.

## Giai đoạn 3 — Tạo dự án GEE

### Tệp mã

`01_load_aoi.js` nạp AOI từ Google Earth Engine Assets, đưa ranh giới lên bản đồ, phóng bản đồ vào AOI và in diện tích trong Console.

### Cách chạy

1. Mở [Earth Engine Assets](https://code.earthengine.google.com/assets), chọn **NEW → Table upload** và tải `study_area.geojson`.
2. Sau khi GEE xử lý xong, sao chép **Asset ID** (thường có dạng `users/<tên_tài_khoản>/study_area`).
3. Tạo script mới trong GEE Code Editor, dán nội dung `01_load_aoi.js`, rồi thay giá trị `aoiAsset` bằng Asset ID vừa sao chép.
4. Nhấn **Run**. Lớp `AOI — Thành phố Huế` sẽ hiện bằng đường viền vàng; Console sẽ in thông tin và diện tích AOI.

## Giai đoạn 4 — Lấy ảnh Sentinel-2

### Tệp mã

`02_sentinel2_collection.js` sử dụng bộ sưu tập `COPERNICUS/S2_SR_HARMONIZED`, lọc ảnh theo AOI, cửa sổ ngày và `CLOUDY_PIXEL_PERCENTAGE ≤ 20`.

### Mốc mặc định

| Mốc | Khoảng lấy ảnh |
| --- | --- |
| T0 | 01/03/2018 – 31/08/2018 |
| T1 | 01/03/2021 – 31/08/2021 |
| T2 | 01/03/2025 – 31/08/2025 |

Các cửa sổ này cùng mùa và có thể sửa ở biến `periods`. Khi chạy, Console cho biết số ảnh còn lại; các lớp RGB được thêm vào bản đồ nhưng mặc định tắt, trừ ảnh ít mây nhất của T0 để kiểm tra nhanh.

## Giai đoạn 5 — Lọc mây và tạo composite

### Tệp mã

`03_cloud_mask_composite.js` dùng band `SCL` của Sentinel-2 để che pixel không có dữ liệu, pixel lỗi, bóng mây, mây xác suất trung bình/cao và cirrus. Các band phản xạ được đưa về thang 0–1 trước khi tạo ảnh `median()`.

### Kết quả khi chạy

- Ba lớp composite mùa sạch mây (`T0_2018`, `T1_2021`, `T2_2025`) hiển thị ngay trên bản đồ.
- Mười tám lớp composite tháng (tháng 3–8 cho từng mốc) nằm trong bảng **Layers**, mặc định tắt.
- Console in số ảnh đã dùng cho mỗi composite mùa.

