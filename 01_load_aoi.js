// Giai đoạn 3 — Nạp và hiển thị AOI Thành phố Huế trong Google Earth Engine.
//
// 1. Mở https://code.earthengine.google.com/ rồi vào tab Assets.
// 2. NEW > Table upload > chọn tệp AOI đã chuyển sang Shapefile (.zip).
// 3. Sau khi xử lý xong, sao chép Asset ID và dán vào biến aoiAsset bên dưới.

var aoiAsset = 'projects/potent-pursuit-362612/assets/study_area';

// Đọc ranh giới từ Assets. Nếu Asset của bạn là FeatureCollection, giữ nguyên dòng này.
var aoi = ee.FeatureCollection(aoiAsset);

// Thiết lập hiển thị.
var aoiStyle = {
  color: 'FFD700',
  fillColor: '00000000',
  width: 2
};

Map.centerObject(aoi, 9);
Map.addLayer(aoi.style(aoiStyle), {}, 'AOI — Thành phố Huế');

// Kiểm tra trong Console.
print('AOI — Thành phố Huế', aoi);
print('Diện tích AOI (km²)', aoi.geometry().area().divide(1e6));

// Các bước tiếp theo sẽ sử dụng biến `aoi` để lọc ảnh vệ tinh:
// var images = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
//   .filterBounds(aoi);
