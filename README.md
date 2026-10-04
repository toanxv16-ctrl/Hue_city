# Theo dõi biến động nước mặt Thành phố Huế bằng MNDWI

## Mục tiêu

Theo dõi diện tích nước mặt trên toàn Thành phố Huế tại ba mốc **2018, 2021, 2025**, cùng cửa sổ **01/03–31/08**, bằng Sentinel-2 và chỉ số MNDWI. Mục tiêu là so sánh liên năm, không đồng nhất nước phát hiện được với nước lũ.

## Cấu trúc

```text
01_load_aoi.js                  Nạp và hiển thị AOI Huế
02_sentinel2_collection.js      Lọc bộ sưu tập Sentinel-2 theo mùa
03_cloud_mask_composite.js      Che mây/bóng mây (SCL) và composite median
04_mndwi_water_change.js        MNDWI, water mask, diện tích, bản đồ biến động
05_export_mndwi_results.js      Xuất GeoTIFF, bản đồ thay đổi và CSV
06_results_template.md          Mẫu điền kết quả sau khi chạy GEE
docs/methodology.md             Giải thích phương pháp
report/project_report.md        Báo cáo khoa học (điền số liệu sau khi xuất)
study_area.geojson              AOI Huế gốc
study_area.zip                  Shapefile nén để upload GEE
```

Các bước `01`–`05` chạy độc lập trong GEE Code Editor. Sao chép từng tệp, không cần ghép thành một script.

## Cách chạy

1. Upload `study_area.zip` vào Assets nếu Asset chưa tồn tại. Asset ID mặc định: `projects/potent-pursuit-362612/assets/study_area`. Đổi `aoiAsset` trong mỗi script nếu ID khác.
2. Chạy `01_load_aoi.js` để kiểm tra ranh giới AOI.
3. Chạy `02_sentinel2_collection.js` để xem số ảnh và RGB sau lọc mây metadata.
4. Chạy `03_cloud_mask_composite.js` để kiểm tra composite sạch mây (mùa và từng tháng).
5. Chạy `04_mndwi_water_change.js`: đối chiếu RGB, MNDWI và water mask. Điều chỉnh `mndwiThreshold` nếu cần, rồi chạy lại.
6. Khi ngưỡng đã ổn, đặt cùng giá trị trong `05_export_mndwi_results.js`, Run, sau đó tự bấm Run từng task trong tab Tasks. Kết quả vào thư mục Drive `GEE_Hue_MNDWI`.
7. Điền `06_results_template.md` và phần kết quả trong `report/project_report.md` từ CSV và bản đồ đã xuất.

## Tham số mặc định

| Tham số | Giá trị | File |
| --- | --- | --- |
| AOI | Toàn Thành phố Huế | mọi script |
| Collection | `COPERNICUS/S2_SR_HARMONIZED` | `02`–`05` |
| Mốc | T0_2018, T1_2021, T2_2025 | `02`–`05` |
| Cửa sổ | 01/03–31/08 | `02`–`05` |
| Ngưỡng mây metadata | 20% (`02`), 80% sau khi mask SCL (`03`–`05`) | |
| Ngưỡng MNDWI | `0.0` (kiểm tra trên bản đồ rồi chỉnh) | `04`, `05` |
| Pixel liên thông tối thiểu | 8 | `04`, `05` |
| Scale xuất / diện tích | 20 m | `04`, `05` |

## Lưu ý phương pháp

- MNDWI = `(B3 − B11) / (B3 + B11)`. Nước thường có giá trị cao hơn đất khô và thực vật.
- B11 gốc 20 m; diện tích được tính ở scale 20 m. Không gọi đây là pan-sharpening.
- Composite median là trạng thái điển hình của cả mùa, không phải một ngày cụ thể.
- Nước mặt phát hiện được không tự động đồng nghĩa với ngập lũ.
