# Mẫu báo cáo kết quả MNDWI — Thành phố Huế

## 1. Thiết kế phân tích

- AOI: Toàn thành phố Huế.
- Dữ liệu: Sentinel-2 Surface Reflectance Harmonized (`COPERNICUS/S2_SR_HARMONIZED`).
- Các mốc: 2018, 2021, 2025; cùng cửa sổ 01/03–31/08.
- Chỉ số: MNDWI = `(B3 - B11) / (B3 + B11)`.
- Ngưỡng nước đã dùng: `_____`.
- Che mây/bóng mây: các lớp SCL 0, 1, 3, 8, 9, 10 bị loại.

## 2. Kiểm tra chất lượng

| Mốc | Số ảnh composite | Lớp RGB đã kiểm tra? | Nhận xét về mây/bóng tối |
| --- | ---: | --- | --- |
| T0_2018 | | | |
| T1_2021 | | | |
| T2_2025 | | | |

Ghi rõ lý do chọn ngưỡng MNDWI bằng cách đối chiếu lớp MNDWI với RGB. Nếu điều chỉnh ngưỡng, chạy lại `04_mndwi_water_change.js` và `05_export_mndwi_results.js` với cùng giá trị.

## 3. Diện tích nước mặt

| Mốc | Diện tích nước mặt (ha) | Chênh lệch so với mốc trước (ha) | Nhận xét |
| --- | ---: | ---: | --- |
| T0_2018 | | — | |
| T1_2021 | | | |
| T2_2025 | | | |

Dùng tệp `hue_mndwi_water_area_summary.csv` xuất từ GEE để điền diện tích.

## 4. Diễn giải bản đồ biến động

- **Xanh dương:** nước xuất hiện ở cả hai mốc (ổn định).
- **Xanh lá:** nước xuất hiện ở mốc sau nhưng không có ở mốc trước (tăng).
- **Đỏ:** nước có ở mốc trước nhưng không có ở mốc sau (giảm).

Mô tả các vị trí tăng/giảm nổi bật. Không diễn giải trực tiếp phần tăng/giảm là lũ vì các ảnh được tổng hợp theo mùa và mục tiêu là biến động nước mặt liên năm.

## 5. Hạn chế

- Kết quả phụ thuộc ngưỡng MNDWI và còn có thể lẫn đất ẩm, bóng địa hình hoặc thực vật thủy sinh.
- Band B11 có độ phân giải 20 m, nên diện tích và ranh giới nước nhỏ có độ bất định.
- Composite median đại diện cho trạng thái điển hình của cả cửa sổ thời gian, không phải một ngày cụ thể.
- Ranh giới AOI cố định theo địa giới hiện tại; các thay đổi địa giới lịch sử không được mô phỏng.
