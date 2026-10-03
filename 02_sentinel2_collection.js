// Giai đoạn 4 — Lấy bộ sưu tập Sentinel-2 cho AOI Thành phố Huế.
//
// Thay bằng Asset ID AOI của bạn trên Google Earth Engine.
var aoiAsset = 'projects/potent-pursuit-362612/assets/study_area';
var aoi = ee.FeatureCollection(aoiAsset);

// Chọn các cửa sổ cùng mùa để giảm ảnh hưởng mùa vụ.
// Có thể sửa ngày bắt đầu/kết thúc phù hợp với mục tiêu nghiên cứu.
var periods = [
  {label: 'T0_2018', start: '2018-03-01', end: '2018-08-31'},
  {label: 'T1_2021', start: '2021-03-01', end: '2021-08-31'},
  {label: 'T2_2025', start: '2025-03-01', end: '2025-08-31'}
];

// CLOUDY_PIXEL_PERCENTAGE là tỷ lệ mây của cả ảnh vệ tinh, không chỉ AOI.
// Giảm xuống 10 nếu vẫn còn nhiều mây; tăng lên 30 nếu bộ sưu tập quá ít ảnh.
var maxCloudPercentage = 20;

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

function getCollection(period) {
  return s2
    .filterBounds(aoi)
    .filterDate(period.start, period.end)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', maxCloudPercentage))
    .sort('CLOUDY_PIXEL_PERCENTAGE');
}

// Tham số hiển thị ảnh màu tự nhiên Sentinel-2.
var rgbVis = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};

Map.centerObject(aoi, 9);
Map.addLayer(aoi.style({color: 'FFD700', fillColor: '00000000', width: 2}), {}, 'AOI — Thành phố Huế');

periods.forEach(function(period) {
  var collection = getCollection(period);
  var composite = collection.median().clip(aoi);

  print(period.label + ' — số ảnh sau lọc mây', collection.size());
  print(period.label + ' — danh sách ảnh', collection);
  Map.addLayer(composite, rgbVis, period.label + ' — Sentinel-2 RGB', false);
});

// Ví dụ: lấy ảnh ít mây nhất trong một giai đoạn để kiểm tra trực quan.
var t0BestImage = getCollection(periods[0]).first();
Map.addLayer(t0BestImage.clip(aoi), rgbVis, 'T0_2018 — ảnh ít mây nhất', true);
