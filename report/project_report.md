# Báo cáo dự án theo dõi biến động nước mặt Thành phố Huế

## 1 Giới thiệu

Dự án theo dõi biến động diện tích nước mặt tại Thành phố Huế trên ba mốc 2018, 2021 và 2025. Ảnh được tổng hợp trong cùng cửa sổ 01/03–31/08 để so sánh liên năm ít bị lệch mùa. Mục tiêu là lập bản đồ nước mặt bằng MNDWI và đo thay đổi diện tích; không đồng nhất toàn bộ nước phát hiện được với ngập lũ.

## 2 Dữ liệu và phương pháp

Dữ liệu là Sentinel-2 Surface Reflectance Harmonized (`COPERNICUS/S2_SR_HARMONIZED`). MNDWI dùng B3 (Green, 10 m) và B11 (SWIR1, 20 m). AOI là ranh giới Thành phố Huế đã upload lên GEE Assets.

Quy trình: AOI → lọc ảnh → mask SCL → composite median → MNDWI → ngưỡng cố định → lọc pixel liên thông → diện tích (ha) → bản đồ biến động → xuất. Chi tiết mã nằm ở `01_load_aoi.js` đến `05_export_mndwi_results.js`.

### 2.1 Dữ liệu đầu vào

| Cảm biến | Collection GEE | Mốc trong dự án | Green | SWIR1 | Chất lượng |
| --- | --- | --- | --- | --- | --- |
| Sentinel-2 MSI SR | `COPERNICUS/S2_SR_HARMONIZED` | T0_2018, T1_2021, T2_2025 (01/03–31/08) | B3, 10 m | B11, 20 m | SCL |

Chỉ dùng một cảm biến để tránh trộn độ phân giải và đáp ứng phổ. Cửa sổ tháng 3–8 được chọn vì thường ít mây hơn mùa mưa, phù hợp so sánh trạng thái nước mặt điển hình giữa các năm.

### 2.2 Chỉ số MNDWI

MNDWI = `(B3 − B11) / (B3 + B11)`. Nước hấp thụ mạnh năng lượng SWIR nên giá trị MNDWI của nước thường cao hơn đất khô, bê tông và thực vật. Kết quả là ảnh chỉ số liên tục, chưa phải bản đồ nước.

### 2.3 Ngưỡng nước

Ngưỡng mặc định là `0.0` (`MNDWI > 0`). Đây là điểm khởi đầu, không phải ngưỡng tối ưu tự động. Ngưỡng phải được kiểm tra bằng cách chồng MNDWI với RGB; nếu chỉnh, chạy lại `04_mndwi_water_change.js` và `05_export_mndwi_results.js` với cùng giá trị và ghi vào `06_results_template.md`.

### 2.4 Che mây, bóng mây và composite

Sentinel-2 dùng Scene Classification Layer. Các lớp no data (0), saturated/defective (1), cloud shadow (3), cloud medium/high (8, 9) và thin cirrus (10) bị loại. Ảnh hợp lệ được tổng hợp `median()` theo từng mốc. Median là trạng thái đại diện của cả mùa, không phải ảnh của một ngày cụ thể.

### 2.5 Độ phân giải B11

B11 gốc 20 m. Mã tính diện tích và xuất ảnh ở scale 20 m. Sentinel-2 không có band panchromatic trong quy trình này; không gọi xử lý là pan-sharpening.

### 2.6 Hậu xử lý water mask

Sau `MNDWI > ngưỡng`, `connectedPixelCount` với tối thiểu 8 pixel loại cụm nhỏ. Ngưỡng này cần kiểm tra trên RGB: lọc quá mạnh có thể mất nhánh sông hẹp; lọc quá nhẹ giữ ao nhỏ, bóng tối hoặc đất ẩm.

### 2.7 Các bước xử lý

| Bước | Mục đích | Đầu vào | Cách thực hiện | Đầu ra |
| --- | --- | --- | --- | --- |
| AOI | Giới hạn vùng phân tích | `study_area` | `01_load_aoi.js` | FeatureCollection Huế |
| Lọc ảnh | Chọn dữ liệu cùng mùa | ImageCollection | Biên AOI, 01/03–31/08, mây metadata | Collection theo mốc |
| Mask | Loại pixel không tin cậy | SCL | Loại lớp 0, 1, 3, 8, 9, 10 | Ảnh SR sạch hơn |
| Composite | Giảm mây còn sót | Ảnh đã mask | `median()` theo mốc | RGB/B3/B11 đại diện |
| MNDWI | Tách nước từ nền | Composite | `(B3 − B11) / (B3 + B11)`, ngưỡng cố định | Water candidate |
| Lọc và thống kê | Giảm nhiễu, đo diện tích | Water candidate | Connected pixels, pixelArea | ha theo mốc |
| Biến động | So sánh hai mốc | Water mask | Ổn định / tăng / giảm | Bản đồ 3 lớp |
| Hiển thị/xuất | Kiểm tra và báo cáo | Ảnh, FeatureCollection | Map, Console, Export Drive | GeoTIFF và CSV |

## 3 Kết quả và thảo luận

Phần này chỉ được điền sau khi chạy GEE (`04` để kiểm tra, `05` để xuất). Dùng `06_results_template.md` làm khung điền số.

Báo cáo kết quả cần tối thiểu: (1) RGB để kiểm tra mây và vị trí mặt nước, (2) MNDWI để kiểm tra phân bố giá trị, (3) water mask sau ngưỡng và lọc liên thông, (4) bản đồ biến động 2018→2021 và 2021→2025, (5) bảng diện tích (ha) từ `hue_mndwi_water_area_summary.csv`.

Ghi rõ ngưỡng MNDWI đã dùng, số ảnh mỗi mốc và nhận xét mây/bóng tối. Không kết luận thay đổi hình thái lâu dài hay lũ chỉ từ composite theo mùa.

## 4 Hạn chế

Kết quả phụ thuộc ngưỡng cố định; có thể lẫn đất ẩm, bóng địa hình, công trình tối hoặc thực vật thủy sinh. B11 20 m làm ranh giới nước nhỏ bất định. Composite median không đại diện một ngày cụ thể. AOI theo địa giới hiện tại; ao, sông, đầm phá trong thành phố đều được đếm nếu vượt ngưỡng. Mây còn sót sau SCL vẫn có thể làm thiếu pixel nước.

## 5 Hướng phát triển

Có thể thử ngưỡng theo từng mốc (ví dụ Otsu) sau khi đã có bộ RGB kiểm chứng, thu hẹp ROI theo hành lang sông nếu chỉ quan tâm một thủy hệ, bổ sung Sentinel-1 khi mây dày, hoặc đối chiếu mưa / mực nước / hiện trạng sử dụng đất.
