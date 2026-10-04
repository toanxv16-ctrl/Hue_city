// Theo doi bien dong nuoc mat song Huong trong mua mua lu 2016-2025.
// Chay toan bo tep nay trong Google Earth Engine Code Editor.
//
// LUU Y KHOA HOC: Sentinel-2 khong co band PAN. B11 20 m duoc noi suy
// bilinear ve luoi 10 m; day la spatial resampling, KHONG phai pan-sharpening.
// Landsat SR duoc giu o 30 m; khong tron pixel Landsat va Sentinel-2.

// ===============================
// 1. KHU VUC NGHIEN CUU
// ===============================
var aoiAsset = 'projects/potent-pursuit-362612/assets/study_area';
var hueBoundary = ee.FeatureCollection(aoiAsset).geometry();

// Mac dinh giu nguyen AOI Hue da chon. De chi phan tich song Huong, hay ve
// geometry (polygon/duong song) trong Code Editor va thay dong sau bang:
// var roi = geometry;
var roi = hueBoundary;

var CONFIG = {
  startYear: 2016,
  endYear: 2025,
  startMonth: 10,
  endMonth: 12,
  maxCloud: 60,
  // 0 = khong buffer. Chi dat > 0 khi roi la duong/tuyen song da ve.
  corridorBufferMeters: 0,
  otsuBins: 100,
  scale: 20, // B11 Sentinel-2 co do phan giai goc 20 m.
  minConnectedPixels: 8,
  fallbackThreshold: 0.0,
  RUN_MONTHLY_ANALYSIS: false,
  ENABLE_EXPORT: false,
  exportFolder: 'GEE_Hue_River_MNDWI'
};

var analysisRegion = CONFIG.corridorBufferMeters > 0 ? roi.buffer(CONFIG.corridorBufferMeters) : roi;

// ===============================
// 2. DU LIEU VA CLOUD SHADOW MASK
// ===============================
var S2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var L8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
var L9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');

// SCL: loai saturated/defective (1), shadow (3), unclassified (7),
// cloud medium/high (8,9), cirrus (10) va snow/ice (11).
function maskSentinel2(image) {
  var scl = image.select('SCL');
  var clear = scl.neq(1).and(scl.neq(3)).and(scl.neq(7))
    .and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11));
  var visible = image.select(['B2', 'B3', 'B4', 'B8'], ['Blue', 'Green', 'Red', 'NIR'])
    .multiply(0.0001);
  // B11 20 m -> noi suy ve luoi 10 m; khong tao thong tin khong gian moi.
  var swir = image.select('B11').multiply(0.0001).resample('bilinear').rename('SWIR');
  return visible.addBands(swir).updateMask(clear).copyProperties(image, image.propertyNames());
}

// QA_PIXEL Landsat C2: bits 0 Fill, 1 Dilated cloud, 2 Cirrus, 3 Cloud,
// 4 Cloud shadow, 5 Snow. QA_RADSAT != 0 la pixel bao hoa.
function maskLandsat(image) {
  var qa = image.select('QA_PIXEL');
  var clear = qa.bitwiseAnd(1).eq(0).and(qa.bitwiseAnd(1 << 1).eq(0))
    .and(qa.bitwiseAnd(1 << 2).eq(0)).and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0)).and(qa.bitwiseAnd(1 << 5).eq(0));
  var scaled = image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6'],
      ['Blue', 'Green', 'Red', 'NIR', 'SWIR'])
    .multiply(0.0000275).add(-0.2);
  return scaled.updateMask(clear).updateMask(image.select('QA_RADSAT').eq(0))
    .copyProperties(image, image.propertyNames());
}

function datesFor(year, month) {
  var eeYear = ee.Number(year);
  var start = ee.Date.fromYMD(eeYear, month || CONFIG.startMonth, 1);
  var end = month ? start.advance(1, 'month') : ee.Date.fromYMD(eeYear.add(1), 1, 1);
  return {start: start, end: end};
}

function emptyComposite() {
  return ee.Image.constant([0, 0, 0, 0, 0])
    .rename(['Blue', 'Green', 'Red', 'NIR', 'SWIR']).updateMask(ee.Image(0));
}

function collectionFor(sensor, dates) {
  var source = sensor === 'S2' ? S2 : L8.merge(L9);
  var masker = sensor === 'S2' ? maskSentinel2 : maskLandsat;
  var cloudField = sensor === 'S2' ? 'CLOUDY_PIXEL_PERCENTAGE' : 'CLOUD_COVER';
  return source.filterBounds(analysisRegion).filterDate(dates.start, dates.end)
    .filter(ee.Filter.lte(cloudField, CONFIG.maxCloud)).map(masker);
}

// ===============================
// 3. MNDWI, OTSU VA HAU XU LY
// ===============================
function calculateMNDWI(image) {
  return image.normalizedDifference(['Green', 'SWIR']).rename('MNDWI');
}

function otsu(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var indices = ee.List.sequence(1, size.subtract(1));
  var bss = indices.map(function(i) {
    i = ee.Number(i);
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMean = means.slice(0, 0, i).multiply(aCounts)
      .reduce(ee.Reducer.sum(), [0]).get([0]).divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(bCount).multiply(aMean.subtract(bMean).pow(2));
  });
  return means.sort(bss).get([-1]);
}

function calculateOtsuThreshold(mndwi) {
  var histogram = mndwi.reduceRegion({
    reducer: ee.Reducer.histogram({maxBuckets: CONFIG.otsuBins, minBucketWidth: 0.001}),
    geometry: analysisRegion, scale: CONFIG.scale, maxPixels: 1e13, bestEffort: true
  }).get('MNDWI');
  return ee.Number(ee.Algorithms.If(histogram, otsu(ee.Dictionary(histogram)), CONFIG.fallbackThreshold));
}

function cleanWaterMask(mask) {
  var opened = mask.focalMin(1).focalMax(1);
  var closed = opened.focalMax(1).focalMin(1);
  var connected = closed.connectedPixelCount(CONFIG.minConnectedPixels, true);
  return closed.updateMask(connected.gte(CONFIG.minConnectedPixels)).rename('water');
}

function areaKm2(mask) {
  var value = ee.Image.pixelArea().updateMask(mask).reduceRegion({
    reducer: ee.Reducer.sum(), geometry: analysisRegion, scale: CONFIG.scale,
    maxPixels: 1e13, bestEffort: true
  }).get('area');
  return ee.Number(ee.Algorithms.If(value, value, 0)).divide(1e6);
}

// Xu ly mot nam hoac mot thang. Sentinel-2 la chuoi chinh tu 2017; Landsat
// 8/9 la fallback cho 2016 va doi chieu, khong tron pixel giua hai cam bien.
function processPeriod(year, month) {
  var dates = datesFor(year, month);
  var s2Collection = collectionFor('S2', dates);
  var landsatCollection = collectionFor('LANDSAT', dates);
  var hasS2 = s2Collection.size().gt(0);
  var primaryCollection = ee.ImageCollection(ee.Algorithms.If(hasS2, s2Collection, landsatCollection));
  var composite = ee.Image(ee.Algorithms.If(primaryCollection.size().gt(0),
    primaryCollection.median(), emptyComposite())).clip(analysisRegion);
  var mndwi = calculateMNDWI(composite);
  var threshold = calculateOtsuThreshold(mndwi);
  var water = cleanWaterMask(mndwi.gt(threshold));
  var sensor = ee.String(ee.Algorithms.If(hasS2, 'Sentinel-2 SR', 'Landsat 8/9 SR'));
  return ee.Dictionary({
    year: year, month: month || 0, sensor: sensor,
    image_count: primaryCollection.size(), otsu_threshold: threshold,
    water_area_km2: areaKm2(water), composite: composite, mndwi: mndwi, water: water
  });
}

// ===============================
// 4. CHUOI THOI GIAN VA HIEN THI
// ===============================
var years = ee.List.sequence(CONFIG.startYear, CONFIG.endYear);
var yearlyTable = ee.FeatureCollection(years.map(function(year) {
  var result = processPeriod(ee.Number(year));
  return ee.Feature(null, {
    year: result.get('year'), sensor: result.get('sensor'), image_count: result.get('image_count'),
    otsu_threshold: result.get('otsu_threshold'), water_area_km2: result.get('water_area_km2')
  });
}));
print('Bang ket qua theo nam', yearlyTable);

var chart = ui.Chart.feature.byFeature(yearlyTable.sort('year'), 'year', 'water_area_km2')
  .setChartType('LineChart')
  .setOptions({title: 'Dien tich nuoc mat thang 10-12', hAxis: {title: 'Nam'},
    vAxis: {title: 'Dien tich nuoc (km2)'}, lineWidth: 2, pointSize: 4});
print(chart);

var firstResult = processPeriod(CONFIG.startYear);
var lastResult = processPeriod(CONFIG.endYear);
var rgbVis = {bands: ['Red', 'Green', 'Blue'], min: 0.02, max: 0.30, gamma: 1.2};
var mndwiVis = {min: -0.5, max: 0.5, palette: ['8c510a', 'f6e8c3', 'c7eae5', '01665e']};
Map.centerObject(analysisRegion, 10);
Map.addLayer(ee.FeatureCollection([ee.Feature(analysisRegion)]), {color: 'FFD700'}, 'ROI / corridor');
Map.addLayer(ee.Image(firstResult.get('composite')), rgbVis, 'RGB ' + CONFIG.startYear, false);
Map.addLayer(ee.Image(lastResult.get('composite')), rgbVis, 'RGB ' + CONFIG.endYear, true);
Map.addLayer(ee.Image(lastResult.get('mndwi')), mndwiVis, 'MNDWI ' + CONFIG.endYear, false);
Map.addLayer(ee.Image(lastResult.get('water')).selfMask(), {palette: ['1f78b4']}, 'Nuoc mat ' + CONFIG.endYear, true);
print('Otsu threshold ' + CONFIG.endYear, lastResult.get('otsu_threshold'));

// Phan tich theo thang la tuy chon de tranh tai tinh toan khi khong can thiet.
if (CONFIG.RUN_MONTHLY_ANALYSIS) {
  var monthlyTable = ee.FeatureCollection(years.map(function(year) {
    return ee.List.sequence(CONFIG.startMonth, CONFIG.endMonth).map(function(month) {
      var r = processPeriod(ee.Number(year), ee.Number(month));
      return ee.Feature(null, {year: r.get('year'), month: r.get('month'), sensor: r.get('sensor'),
        image_count: r.get('image_count'), otsu_threshold: r.get('otsu_threshold'), water_area_km2: r.get('water_area_km2')});
    });
  }).flatten());
  print('Bang ket qua theo thang', monthlyTable);
}

if (CONFIG.ENABLE_EXPORT) {
  Export.table.toDrive({collection: yearlyTable, description: 'Hue_river_MNDWI_2016_2025_summary',
    folder: CONFIG.exportFolder, fileNamePrefix: 'hue_river_mndwi_2016_2025_summary', fileFormat: 'CSV'});
  Export.image.toDrive({image: ee.Image(lastResult.get('mndwi')), description: 'Hue_MNDWI_' + CONFIG.endYear,
    folder: CONFIG.exportFolder, region: analysisRegion, scale: CONFIG.scale, maxPixels: 1e13});
  Export.image.toDrive({image: ee.Image(lastResult.get('water')).unmask(0), description: 'Hue_water_' + CONFIG.endYear,
    folder: CONFIG.exportFolder, region: analysisRegion, scale: CONFIG.scale, maxPixels: 1e13});
}
