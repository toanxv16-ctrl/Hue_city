// Giai đoạn 5 — Tính MNDWI, lập bản đồ nước mặt và đo biến động tại Huế.
// Chạy độc lập trong Google Earth Engine sau khi đã kiểm tra AOI và composite.

var aoiAsset = 'projects/potent-pursuit-362612/assets/study_area';
var aoi = ee.FeatureCollection(aoiAsset);
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Cùng mùa ít mưa để giảm biến động theo mùa trong so sánh liên năm.
var periods = [
  {label: 'T0_2018', start: '2018-03-01', end: '2018-08-31'},
  {label: 'T1_2021', start: '2021-03-01', end: '2021-08-31'},
  {label: 'T2_2025', start: '2025-03-01', end: '2025-08-31'}
];

// Cần kiểm tra trên bản đồ và điều chỉnh nếu cần. MNDWI > 0 là ngưỡng khởi đầu.
var mndwiThreshold = 0.0;
var minConnectedPixels = 8;

function maskCloudAndShadow(image) {
  var scl = image.select('SCL');
  var clear = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10));

  return image.select(['B2', 'B3', 'B4', 'B8', 'B11'])
    .multiply(0.0001)
    .updateMask(clear)
    .copyProperties(image, image.propertyNames());
}

function getComposite(period) {
  var collection = s2
    .filterBounds(aoi)
    .filterDate(period.start, period.end)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 80))
    .map(maskCloudAndShadow);

  print(period.label + ' — số ảnh dùng cho composite', collection.size());
  return collection.median().clip(aoi);
}

function getWater(composite) {
  var mndwi = composite.normalizedDifference(['B3', 'B11']).rename('MNDWI');
  var candidateWater = mndwi.gt(mndwiThreshold);
  var connected = candidateWater.connectedPixelCount(minConnectedPixels, true);
  var water = candidateWater.updateMask(connected.gte(minConnectedPixels)).rename('water');
  return {mndwi: mndwi, water: water};
}

function waterAreaHa(water) {
  var areaImage = ee.Image.pixelArea().updateMask(water);
  return ee.Number(areaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi.geometry(),
    scale: 20,
    maxPixels: 1e13
  }).get('area')).divide(1e4);
}

var rgbVis = {bands: ['B4', 'B3', 'B2'], min: 0.02, max: 0.30, gamma: 1.2};
var mndwiVis = {min: -0.5, max: 0.5, palette: ['8c510a', 'f6e8c3', 'c7eae5', '01665e']};
var waterVis = {palette: ['1f78b4']};
var results = {};

Map.centerObject(aoi, 9);
Map.addLayer(aoi.style({color: 'FFD700', fillColor: '00000000', width: 2}), {}, 'AOI — Thành phố Huế');

periods.forEach(function(period, index) {
  var composite = getComposite(period);
  var result = getWater(composite);
  results[period.label] = result;

  print(period.label + ' — diện tích nước mặt (ha)', waterAreaHa(result.water));
  Map.addLayer(composite, rgbVis, period.label + ' — RGB sạch mây', false);
  Map.addLayer(result.mndwi, mndwiVis, period.label + ' — MNDWI', false);
  Map.addLayer(result.water.selfMask(), waterVis, period.label + ' — nước mặt', index === 0);
});

function addChangeLayer(fromLabel, toLabel) {
  var fromWater = results[fromLabel].water.unmask(0).eq(1);
  var toWater = results[toLabel].water.unmask(0).eq(1);
  var stableWater = fromWater.and(toWater).multiply(1);
  var waterGain = toWater.and(fromWater.not()).multiply(2);
  var waterLoss = fromWater.and(toWater.not()).multiply(3);
  var change = stableWater.add(waterGain).add(waterLoss).selfMask();

  Map.addLayer(
    change,
    {min: 1, max: 3, palette: ['1f78b4', '33a02c', 'e31a1c']},
    fromLabel + ' → ' + toLabel + ' — xanh: ổn định, lục: tăng, đỏ: giảm',
    false
  );
}

addChangeLayer('T0_2018', 'T1_2021');
addChangeLayer('T1_2021', 'T2_2025');
