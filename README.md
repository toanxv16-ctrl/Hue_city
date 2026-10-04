# Đề tài: Theo dõi biến động nước mặt tại Huế bằng chỉ số MNDWI từ ảnh Sentinel-2

## Mục tiêu

Lập bản đồ nước mặt tại toàn thành phố Huế cho các mốc năm 2018, 2021 và 2025, sau đó định lượng và trực quan hóa nơi diện tích nước mặt tăng, giảm hoặc ổn định. Nước mặt trong đề tài gồm sông, hồ, ao, đầm phá và các mặt nước quan sát được ở cùng mùa đã chọn; đây không phải đề tài xác định nước lũ.

## Lộ trình thực hiện

| Giai đoạn | Công việc | Công cụ | Kết quả |
| --- | --- | --- | --- |
| 1. Chốt thiết kế | Xác định AOI, các mốc 2018/2021/2025 và cùng mùa ít mưa (tháng 3–8). | — | Phạm vi, mốc thời gian, tiêu chí so sánh. |
| 2. Nạp AOI | Tải AOI lên Assets và kiểm tra ranh giới. | GEE | `01_load_aoi.js` |
| 3. Chọn Sentinel-2 | Lọc `COPERNICUS/S2_SR_HARMONIZED` theo AOI, thời gian và mây. | GEE | `02_sentinel2_collection.js` |
| 4. Che mây, composite | Dùng SCL che mây/bóng mây và tạo ảnh median cùng mùa. | GEE | `03_cloud_mask_composite.js` |
| 5. MNDWI và biến động | Tính MNDWI, tách nước, tính diện tích và so sánh các mốc. | GEE | `04_mndwi_water_change.js` |
| 6. Xuất kết quả | Xuất MNDWI, lớp nước, lớp biến động và bảng diện tích sang Google Drive. | GEE | `05_export_mndwi_results.js` |
| 7. Kiểm tra, báo cáo | Kiểm tra ngưỡng với RGB, diễn giải biến động và hoàn thiện báo cáo. | GEE/QGIS | `06_results_template.md`, bản đồ, bảng diện tích, nhận xét. |

## Khu vực và mốc thời gian

- **AOI:** `study_area.geojson`, ranh giới toàn thành phố Huế.
- **Hệ tọa độ đầu vào:** WGS 84 / EPSG:4326.
- **Asset ID đang dùng:** `projects/potent-pursuit-362612/assets/study_area`.

| Mốc | Khoảng tổng hợp |
| --- | --- |
| T0_2018 | 01/03/2018 – 31/08/2018 |
| T1_2021 | 01/03/2021 – 31/08/2021 |
| T2_2025 | 01/03/2025 – 31/08/2025 |

Giữ nguyên cùng khoảng thời gian cho các năm để hạn chế nhầm biến động mùa vụ với biến động nước mặt.

## Cách chạy trong GEE

1. Vào [Code Editor](https://code.earthengine.google.com/) và mở tab **Assets**.
2. Nếu AOI chưa có, chọn **NEW → Table upload**, chọn `study_area.zip` (Shapefile nén), rồi chờ tác vụ hoàn tất.
3. Dán từng file theo thứ tự `01` → `02` → `03` → `04` vào Code Editor và bấm **Run**.
4. Ở giai đoạn 5, xem lớp RGB và lớp `MNDWI` để kiểm tra ngưỡng `mndwiThreshold`. Điều chỉnh ngưỡng nếu lớp nước lẫn nhiều đất ướt/bóng tối hoặc bỏ sót nước.
5. Ghi diện tích nước mặt (ha) xuất hiện trong **Console**. Bật lớp biến động: xanh dương là nước ổn định, xanh lá là nước tăng, đỏ là nước giảm.
6. Khi ngưỡng đã chốt, dán `05_export_mndwi_results.js`, bấm **Run**, mở tab **Tasks** và tự bấm **Run** cho các tệp muốn xuất. Dùng `06_results_template.md` để tổng hợp kết quả.

## Quy tắc phương pháp

- **MNDWI** = `(Green − SWIR1) / (Green + SWIR1)` = `(B3 − B11) / (B3 + B11)`.
- Ngưỡng khởi đầu là `MNDWI > 0`; đây là tham số cần kiểm tra bằng ảnh RGB, không phải giá trị cố định cho mọi khu vực.
- Che mây và bóng mây bằng band `SCL` trước khi tạo median composite.
- Tính diện tích ở `scale: 20` m vì band SWIR1 (`B11`) có độ phân giải 20 m.
