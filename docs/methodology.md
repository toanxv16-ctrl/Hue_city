# Phuong phap theo doi nuoc mat song Huong 2016 den 2025

## Pham vi va thiet ke

AOI mac dinh la ranh gioi Hue dang co trong Asset. De ket qua chi dai dien song Huong, nguoi dung can ve polygon hoac centerline cua song trong GEE va thay `var roi = hueBoundary;` bang `var roi = geometry;`. Neu `roi` la centerline, dat `corridorBufferMeters` de tao hanh lang phan tich. Khong dung polygon tu tao de tranh sai lech khong gian.

Chuoi thoi gian chay 2016-2025 va chi dung du lieu tu 1/10 den 31/12. Sentinel-2 SR la chuoi chinh tu 2017; Landsat 8/9 SR la fallback va doi chieu. Khong tron pixel hai sensor trong mot composite.

## Quy trinh

ROI -> loc Landsat/Sentinel-2 -> loc thang 10-12 -> che may va bong may -> composite median theo nam -> spatial resampling -> MNDWI -> histogram -> Otsu -> loc hinh thai va connected pixels -> dien tich -> chuoi thoi gian -> hien thi/xuat.

## Du lieu va band

| Sensor | Collection | Green | NIR | SWIR1 | Do phan giai |
| --- | --- | --- | --- | --- | --- |
| Sentinel-2 SR | `COPERNICUS/S2_SR_HARMONIZED` | B3 | B8 | B11 | B3/B8 10 m, B11 20 m |
| Landsat 8/9 SR | `LANDSAT/LC08/C02/T1_L2`, `LANDSAT/LC09/C02/T1_L2` | SR_B3 | SR_B5 | SR_B6 | 30 m |

## MNDWI va Otsu

MNDWI = `(Green - SWIR) / (Green + SWIR)`. Nuoc thuong co MNDWI cao hon dat va thuc vat vi SWIR bi nuoc hap thu manh. Nguong duoc xac dinh rieng cho tung nam bang Otsu: histogram MNDWI duoc chia thanh hai lop va chon nguong co phuong sai giua lop lon nhat. Neu histogram rong, ma dung nguong fallback 0.0 va Console cho phep kiem tra lai.

## Cloud shadow va loc nhieu

Sentinel-2 dung SCL de loai pixel loi, bong may, may va cirrus. Landsat dung QA_PIXEL bits fill, dilated cloud, cirrus, cloud, cloud shadow va snow, dong thoi loai pixel QA_RADSAT bao hoa. Sau Otsu, focal opening/closing va connected-pixel filtering giam ao nho va nhieu ven song; can kiem tra de tranh xoa nhanh song hep.

## Spatial sharpening

Sentinel-2 khong co panchromatic band. Ma chi noi suy B11 tu 20 m sang luoi 10 m de dong bo voi Green; day khong lam tang thong tin thuc va khong duoc goi la pan-sharpening. Landsat Surface Reflectance giu 30 m; band PAN 15 m thuoc san pham khac va khong duoc trộn voi SR trong quy trinh mac dinh do nguy co khac biet buc xa.
