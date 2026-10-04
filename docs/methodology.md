# Phương pháp theo dõi nước mặt Thành phố Huế 2018, 2021, 2025

## Phạm vi và thiết kế

AOI là ranh giới Thành phố Huế trong Asset `study_area`. Phân tích dùng Sentinel-2 Surface Reflectance Harmonized tại ba mốc T0_2018, T1_2021, T2_2025. Mỗi mốc lấy cùng cửa sổ 01/03–31/08 để giảm ảnh hưởng mùa vụ khi so sánh liên năm. Không dùng Landsat và không trộn nhiều cảm biến.

## Quy trình

AOI → lọc Sentinel-2 theo biên, ngày và mây metadata → che mây/bóng mây bằng SCL → composite median theo mốc → MNDWI → ngưỡng cố định → lọc pixel liên thông → diện tích (ha) → bản đồ biến động → hiển thị/xuất.

Các bước tương ứng mã: `01_load_aoi.js` → `02_sentinel2_collection.js` → `03_cloud_mask_composite.js` → `04_mndwi_water_change.js` → `05_export_mndwi_results.js`.

## Dữ liệu và band

| Cảm biến | Collection | Green | SWIR1 | Độ phân giải |
| --- | --- | --- | --- | --- |
| Sentinel-2 SR | `COPERNICUS/S2_SR_HARMONIZED` | B3, 10 m | B11, 20 m | Composite và thống kê dùng scale 20 m |

Band phản xạ được nhân `0.0001` để về khoảng 0–1 trước khi tính chỉ số (`03`–`05`).

## MNDWI và ngưỡng

MNDWI = `(B3 − B11) / (B3 + B11)`. Nước hấp thụ mạnh SWIR nên MNDWI của nước thường cao hơn đất và thực vật. Ngưỡng mặc định là `mndwiThreshold = 0.0`. Giá trị này phải được kiểm tra bằng cách chồng lớp MNDWI với RGB. Nếu đổi ngưỡng, `04` và `05` phải dùng cùng một số.

## Che mây, bóng mây và composite

SCL loại pixel: 0 (no data), 1 (saturated/defective), 3 (cloud shadow), 8 (cloud medium), 9 (cloud high), 10 (thin cirrus). `02` lọc `CLOUDY_PIXEL_PERCENTAGE ≤ 20` để xem ảnh thô. `03`–`05` nới metadata lên 80% vì pixel mây đã bị mask theo SCL; composite `median()` giảm mây sót và giá trị bất thường. Median đại diện cả cửa sổ 01/03–31/08, không phải ảnh đúng một ngày.

`03` còn tạo composite tháng (tháng 3–8) để kiểm tra chất lượng theo tháng; các lớp này mặc định tắt trên bản đồ.

## Hậu xử lý water mask

Pixel ứng viên là `MNDWI > ngưỡng`. `connectedPixelCount` với `minConnectedPixels = 8` loại cụm quá nhỏ. Lọc quá mạnh có thể mất nhánh sông hẹp; lọc quá nhẹ giữ ao nhỏ, bóng tối đô thị hoặc đất ẩm.

## Bản đồ biến động

So sánh từng cặp mốc (2018→2021, 2021→2025):

- 1 — xanh dương: nước ổn định (có ở cả hai mốc)
- 2 — xanh lá: nước tăng (chỉ có ở mốc sau)
- 3 — đỏ: nước giảm (chỉ có ở mốc trước)

Diện tích từng mốc tính bằng `ee.Image.pixelArea()` trên water mask, chia `1e4` để ra hecta, `reduceRegion` tại geometry AOI, scale 20 m.

## Xuất kết quả

`05_export_mndwi_results.js` tạo task Drive (thư mục `GEE_Hue_MNDWI`): MNDWI và water mask từng mốc, hai lớp biến động, CSV `hue_mndwi_water_area_summary.csv`. Người dùng phải Run từng task trong tab Tasks.
