# Bao cao du an theo doi bien dong nuoc mat song Huong

## 1 Gioi thieu

Du an theo doi bien dong dien tich nuoc mat trong mua mua lu thang 10-12 tai Hue giai doan 2016-2025. Muc tieu la tao chuoi thoi gian dien tich nuoc mat bang MNDWI, khong dong nhat toan bo nuoc phat hien duoc voi nuoc lu. Phan mo rong nuoc chi co the duoc dien giai la co kha nang lien quan den ngap lut khi co du lieu nen va kiem chung bo sung.

## 2 Du lieu va phuong phap

Du lieu gom Sentinel-2 Surface Reflectance Harmonized va Landsat 8/9 Collection 2 Level 2 Surface Reflectance. MNDWI su dung Green va SWIR1. Sentinel-2 dung B3 va B11; Landsat dung SR_B3 va SR_B6. Chi anh thang 10-12 duoc loc theo ROI va ty le may truoc khi che may/bong may bang SCL hoac QA_PIXEL.

Quy trinh la ROI -> loc anh -> mask -> composite median -> spatial resampling -> MNDWI -> histogram -> Otsu -> loc hinh thai -> dien tich -> chuoi thoi gian -> hien thi/xuat. Otsu chon nguong toi uu tu phuong sai giua hai lop histogram thay vi ap dung mot nguong co dinh cho moi nam.

### 2 1 Du lieu dau vao

| Cam bien | Collection GEE | Khoang ap dung trong du an | Green | SWIR1 | Chat luong |
| --- | --- | --- | --- | --- | --- |
| Sentinel-2 MSI SR | `COPERNICUS/S2_SR_HARMONIZED` | Chuoi chinh tu 2017 den 2025 | B3, 10 m | B11, 20 m | SCL |
| Landsat 8 OLI SR | `LANDSAT/LC08/C02/T1_L2` | Nen nam 2016 va doi chieu | SR_B3, 30 m | SR_B6, 30 m | QA_PIXEL, QA_RADSAT |
| Landsat 9 OLI-2 SR | `LANDSAT/LC09/C02/T1_L2` | Bo sung tu 2021 | SR_B3, 30 m | SR_B6, 30 m | QA_PIXEL, QA_RADSAT |

Sentinel-2 duoc uu tien khi co anh hop le vi do phan giai khong gian cao hon. Landsat bao dam chuoi co gia tri cho nam 2016, khi Sentinel-2 SR chua co du lieu phu hop. Hai sensor duoc xu ly rieng va chi chon mot composite chinh cho tung nam; cach nay tranh tao anh lai co pixel khac nhau ve do phan giai va dap ung pho.

### 2 2 Chi so MNDWI

MNDWI duoc tinh theo cong thuc `(Green - SWIR) / (Green + SWIR)`. Nuoc hap thu manh nang luong SWIR, nen gia tri MNDWI cua nuoc thuong cao hon dat kho, be tong va thuc vat. Green va SWIR duoc doi ten thong nhat cho moi sensor truoc khi tinh, cho phep mot ham MNDWI dung chung. Ket qua la anh chi so lien tuc, chua phai ban do nuoc.

### 2 3 Nguong Otsu

Histogram MNDWI trong ROI duoc chia thanh cac lop gia tri. Tai moi nguong `t`, Otsu tinh phuong sai giua hai nhom: `sigma2_between(t) = w0(t) w1(t) [mu0(t) - mu1(t)]2`. Nguong co phuong sai lon nhat tach hai nhom tot nhat theo histogram va duoc tinh rieng tung nam. Neu histogram khong ton tai do khong co pixel hop le, ma dung nguong fallback 0.0 va ket qua phai duoc kiem tra trong Console; fallback khong duoc xem la ket qua khoa hoc da xac nhan.

### 2 4 Che may bong may va composite

Sentinel-2 dung Scene Classification Layer. Cac lop saturated/defective, shadow, unclassified, cloud medium/high, cirrus va snow/ice bi loai. Landsat dung QA_PIXEL: fill, dilated cloud, cirrus, cloud, cloud shadow va snow bi loai; QA_RADSAT loai pixel bao hoa. Anh hop le trong thang 10-12 duoc tong hop median de giam may con sot va gia tri bat thuong. Median la trang thai dai dien cua ca mua, khong phai anh cua dung dinh lu.

### 2 5 Spatial sharpening va phan biet pan sharpening

Sentinel-2 khong co band panchromatic. B11 20 m duoc noi suy bilinear ve luoi 10 m de dong bo voi B3, nhung noi suy khong tao chi tiet moi. Vi vay bao cao goi dung la spatial resampling, khong goi la pan-sharpening. Landsat Surface Reflectance co do phan giai 30 m va duoc giu nguyen. Band PAN 15 m ton tai o san pham Landsat khac, nhung khong duoc dung mac dinh de tranh tron du lieu TOA/PAN voi Surface Reflectance va tao sai lech buc xa trong chuoi thoi gian.

### 2 6 Hau xu ly water mask

Sau khi MNDWI lon hon nguong Otsu, phep focal opening va closing giam diem nhiễu, lo trong va duong vien rang cua pixel. Connected-pixel filtering loai cac thanh phan qua nho. Nguong so pixel toi thieu la tham so can kiem tra bang RGB, vi loc qua manh co the lam mat nhanh song hep, trong khi loc qua nhe de giu lai bong toi do thi va ao nho.

### 2 7 Cac buoc xu ly

| Buoc | Muc dich | Dau vao | Cach thuc hien | Dau ra |
| --- | --- | --- | --- | --- |
| ROI/corridor | Gioi han vung phan tich | Asset Hue hoac geometry | Dung AOI mac dinh; nguoi dung co the ve roi song va buffer | analysisRegion |
| Loc anh | Chon du lieu cung mua | ImageCollection | Loc 1/10-31/12, ROI va cloud metadata | Collection theo sensor |
| Mask | Loai pixel khong tin cay | SCL hoac QA_PIXEL | Mask rieng cho tung sensor | Anh SR sach hon |
| Composite | Giam may con sot | Anh da mask | `median()` theo nam | RGB/Green/SWIR dai dien |
| MNDWI/Otsu | Tach nuoc tu nen | Composite | Tinh MNDWI, histogram va nguong Otsu | Water candidate |
| Loc va thong ke | Giam nhieu, do dien tich | Water candidate | Focal, connected pixels, pixelArea | km2 theo nam |
| Hien thi/xuat | Kiem tra va bao cao | Anh, FeatureCollection | Map, Console, Chart, Export tuy chon | Ban do va CSV |

## 3 Ket qua va thao luan

Phan nay chi duoc dien sau khi chay GEE. Bao cao ket qua du kien: RGB kiem tra chat luong, MNDWI, water mask, bang dien tich theo nam va bieu do chuoi thoi gian. Nam co mua lon co the co dien tich nuoc mat lon hon, nhung khong duoc ket luan thay doi hinh thai lau dai chi tu mot composite mua mua.

Can trinh bay toi thieu bon san pham: (1) RGB de kiem tra mây va vi tri song, (2) MNDWI de kiem tra phan bo gia tri, (3) water mask sau Otsu va loc, (4) bieu do dien tich 2016-2025. Bang ket qua phai ghi sensor duoc chon, so anh, nguong Otsu va dien tich km2. Neu mot nam dung Landsat con cac nam khac dung Sentinel-2, can danh dau ro tren bieu do vi khac biet do phan giai co the anh huong dien tich cac nhanh song nho.

## 4 Han che

May day trong mua mua lu, bong may/cong trinh, luc binh, khac biet sensor va do phan giai, Otsu phu thuoc histogram, va anh khong chac chup dung dinh lu la cac han che chinh. Sentinel-2 khong co PAN; noi suy B11 chi la resampling. ROI mac dinh la toan Hue, nen can ve ROI/corridor song Huong de loai dam pha va cac mat nuoc ngoai song.

## 5 Huong phat trien

Co the bo sung Sentinel-1 SAR de giam anh huong may, du lieu mua/muc nuoc/DEM, NDVI-NDBI de giam nham lan, transect va phan tich dich chuyen bo song.
