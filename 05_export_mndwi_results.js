// Giai đoạn 6 — Xuất MNDWI, bản đồ nước mặt, biến động và bảng diện tích.
// Sau khi chạy mã này, tự bấm Run cho từng tác vụ trong tab Tasks của GEE.

var aoiAsset = 'projects/potent-pursuit-362612/assets/study_area';
var aoi = ee.FeatureCollection(aoiAsset);
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

var periods = [
  {label: 'T0_2018', start: '2018-03-01', end: '2018-08-31'},
  {label: 'T1_2021', start: '2021-03-01', end: '2021-08-31'},
  {label: 'T2_2025', start: '2025-03-01', end: '2025-08-31'}
];

// Dùng cùng ngưỡng đã kiểm tra ở 04_mndwi_water_change.js.
var mndwiThreshold = 0.0;
var minConnectedPixels = 8;
var exportFolder = 'GEE_Hue_MNDWI';
var exportRegion = aoi.geometry();

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
    .updateMask(clear);
}

function makeResult(period) {
  var collection = s2
    .filterBounds(aoi)
    .filterDate(period.start, period.end)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 80))
    .map(maskCloudAndShadow);

  var composite = collection.median().clip(aoi);
  var mndwi = composite.normalizedDifference(['B3', 'B11']).rename('MNDWI');
  var candidateWater = mndwi.gt(mndwiThreshold);
  var connected = candidateWater.connectedPixelCount(minConnectedPixels, true);
  var water = candidateWater
    .updateMask(connected.gte(minConnectedPixels))
    .rename('water')
    .toByte();

  var areaHa = ee.Number(ee.Image.pixelArea().updateMask(water).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: exportRegion,
    scale: 20,
    maxPixels: 1e13
  }).get('area')).divide(1e4);

  return {
    period: period,
    collection: collection,
    mndwi: mndwi,
    water: water,
    areaHa: areaHa
  };
}

var results = {};
var summaryFeatures = [];

periods.forEach(function(period) {
  var result = makeResult(period);
  results[period.label] = result;

  summaryFeatures.push(ee.Feature(null, {
    label: period.label,
    start: period.start,
    end: period.end,
    mndwi_threshold: mndwiThreshold,
    images_used: result.collection.size(),
    water_area_ha: result.areaHa
  }));

  Export.image.toDrive({
    image: result.mndwi,
    description: 'Hue_MNDWI_' + period.label,
    folder: exportFolder,
    fileNamePrefix: 'hue_mndwi_' + period.label,
    region: exportRegion,
    scale: 20,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });

  Export.image.toDrive({
    image: result.water.unmask(0),
    description: 'Hue_water_' + period.label,
    folder: exportFolder,
    fileNamePrefix: 'hue_water_' + period.label,
    region: exportRegion,
    scale: 20,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });
});

function exportChange(fromLabel, toLabel) {
  var fromWater = results[fromLabel].water.unmask(0).eq(1);
  var toWater = results[toLabel].water.unmask(0).eq(1);
  var stableWater = fromWater.and(toWater).multiply(1);
  var waterGain = toWater.and(fromWater.not()).multiply(2);
  var waterLoss = fromWater.and(toWater.not()).multiply(3);
  var change = stableWater.add(waterGain).add(waterLoss).rename('water_change').toByte();

  Export.image.toDrive({
    image: change,
    description: 'Hue_water_change_' + fromLabel + '_to_' + toLabel,
    folder: exportFolder,
    fileNamePrefix: 'hue_water_change_' + fromLabel + '_to_' + toLabel,
    region: exportRegion,
    scale: 20,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });
}

exportChange('T0_2018', 'T1_2021');
exportChange('T1_2021', 'T2_2025');

var areaSummary = ee.FeatureCollection(summaryFeatures);
print('Bảng diện tích nước mặt (ha)', areaSummary);

Export.table.toDrive({
  collection: areaSummary,
  description: 'Hue_MNDWI_water_area_summary',
  folder: exportFolder,
  fileNamePrefix: 'hue_mndwi_water_area_summary',
  fileFormat: 'CSV'
});
