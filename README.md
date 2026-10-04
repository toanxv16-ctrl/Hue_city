# Theo doi bien dong nuoc mat song Huong bang MNDWI

## Muc tieu

Theo doi dien tich nuoc mat trong mua mua lu thang 10-12 tai Hue giai doan 2016-2025 bang MNDWI va nguong Otsu tu dong. AOI Hue dang co duoc giu nguyen. De chuyen tu pham vi Hue sang chi song Huong, ve ROI/corridor trong GEE theo huong dan ben duoi.

## Cau truc

```text
gee/hue_river_mndwi_2016_2025.js  Ma GEE day du
docs/methodology.md                Giai thich phuong phap
report/project_report.md           Bao cao khoa hoc de hoan thien sau khi chay
study_area.geojson                 AOI Hue goc
study_area.zip                     Shapefile nen de upload GEE
01_load_aoi.js ... 05_export_mndwi_results.js  Ma cua quy trinh MNDWI cu, giu lai de tham khao
```

## Cach chay

1. Upload `study_area.zip` vao Assets neu Asset chua ton tai.
2. Mo `gee/hue_river_mndwi_2016_2025.js`, sao chep toan bo sang GEE Code Editor va bam Run.
3. Xem Console: bang ket qua, Otsu threshold va bieu do dien tich nuoc theo nam.
4. Xem Layers: ROI, RGB 2016/2025, MNDWI va water mask.
5. Chi khi ket qua dat yeu cau, dat `CONFIG.ENABLE_EXPORT = true`, chay lai, sau do tu bam Run cac task trong tab Tasks.

## Thay ROI

Mac dinh: `var roi = hueBoundary;` giu nguyen khu vuc da chon. De phan tich rieng song Huong, dung cong cu Geometry trong GEE de ve polygon hoac centerline roi thay dong nay thanh `var roi = geometry;`. Neu ve centerline, dat `corridorBufferMeters` lon hon 0. Khong hard-code polygon song trong ma vi khong co nguon ranh gioi song da xac minh.

## Luu y phuong phap

- Sentinel-2 B11 la 20 m; noi suy ve luoi 10 m chi la spatial resampling, khong phai pan-sharpening that.
- Landsat 8/9 SR giu 30 m. Khong tron pixel Landsat va Sentinel-2 trong cung mot composite.
- Otsu la nguong chinh theo tung nam; can kiem tra lai water mask voi RGB.
- Nuoc phat hien trong mua mua lu la nuoc mat; khong tu dong dong nghia voi nuoc lu.
