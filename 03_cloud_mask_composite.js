// Giai đoạn 4 — Che mây/bóng mây bằng SCL và tạo composite Sentinel-2.
// SCL (Scene Classification Layer) có trong COPERNICUS/S2_SR_HARMONIZED.

var aoiAsset = 'projects/potent-pursuit-362612/assets/study_area';
var aoi = ee.FeatureCollection(aoiAsset);
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Giữ cùng mùa ít mưa giữa các năm để việc so sánh nước mặt có ý nghĩa hơn.
var periods = [
  {label: 'T0_2018', start: '2018-03-01', end: '2018-08-31', year: 2018},
  {label: 'T1_2021', start: '2021-03-01', end: '2021-08-31', year: 2021},
  {label: 'T2_2025', start: '2025-03-01', end: '2025-08-31', year: 2025}
];

// Che pixel không quan sát được, bóng mây, mây xác suất trung bình/cao và cirrus.
// SCL: 0 = No data, 1 = Saturated/defective, 3 = Cloud shadow,
// 8 = Cloud medium probability, 9 = Cloud high probability, 10 = Thin cirrus.
function maskCloudAndShadow(image) {
  var scl = image.select('SCL');
  var clear = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10));

  // Các band phản xạ Sentinel-2 SR được chuẩn hóa về 0–1.
  var reflectance = image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
    .multiply(0.0001)
    .updateMask(clear);

  return reflectance.copyProperties(image, image.propertyNames());
}

function filteredMaskedCollection(start, end) {
  return s2
    .filterBounds(aoi)
    .filterDate(start, end)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 80))
    .map(maskCloudAndShadow);
}

function seasonalComposite(period) {
  var collection = filteredMaskedCollection(period.start, period.end);
  var composite = collection.median().clip(aoi)
    .set({label: period.label, start: period.start, end: period.end});

  print(period.label + ' — số ảnh trước composite', collection.size());
  return composite;
}

var rgbVis = {bands: ['B4', 'B3', 'B2'], min: 0.02, max: 0.30, gamma: 1.2};
Map.centerObject(aoi, 9);
Map.addLayer(aoi.style({color: 'FFD700', fillColor: '00000000', width: 2}), {}, 'AOI — Thành phố Huế');

// Composite median cho cả mùa. Chỉ bật mặc định mốc đầu để các lớp không che nhau.
periods.forEach(function(period, index) {
  var composite = seasonalComposite(period);
  Map.addLayer(composite, rgbVis, period.label + ' — composite mùa sạch mây', index === 0);
});

// Composite median từng tháng (thêm vào Layers nhưng mặc định tắt).
periods.forEach(function(period) {
  for (var month = 3; month <= 8; month++) {
    var start = ee.Date.fromYMD(period.year, month, 1);
    var end = start.advance(1, 'month');
    var monthly = filteredMaskedCollection(start, end).median().clip(aoi);
    var monthLabel = period.label + '_' + (month < 10 ? '0' : '') + month;
    Map.addLayer(monthly, rgbVis, monthLabel + ' — composite tháng sạch mây', false);
  }
});
