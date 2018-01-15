/* 
  Name      : geet.js
  Author    : Eduardo Ribeiro. Lacerda
  e-mail    : eduardolacerdageo@gmail.com
  Version   : 0.0.14 (Alpha)
  Date      : 15-01-2018
  Description: Lib to write small EE apps or big/complex apps with a lot less code.
*/

/*
  SVM:
  Function to apply SVM classification to a image.

  Params:
  (ee.Image) image - The input image to classify
  (ee.List) trainingData - Training data (samples)  
  (string) fieldName - The name of the column that contains the class names

  Usage:
  var geet = require('users/eduardolacerdageo/default:Functions/GEET');
  var imgClass = geet.SVM(image, samplesfc, landcover);
*/
exports.svm = function (image, trainingData, fieldName, kernelType) {
  var kernel = 'RBF';
  if (kernelType !== undefined) {
    kernel = kernelType;
  }

  var training = image.sampleRegions({
    collection: trainingData,
    properties: [fieldName],
    scale: 30
  });

  var classifier = ee.Classifier.svm({
    kernelType: kernel,
    cost: 10
  });

  var trained = classifier.train(training, fieldName);
  var classified = image.classify(trained);
  return classified;
};

/*
  CART:
  Function to apply CART classification to a image.

  Params:
  (ee.Image) image - The input image to classify
  (ee.List) trainingData - Training data (samples) 
  (string) fieldName - The name of the column that contains the class names

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var imgClass = geet.CART(image, samplesfc, landcover);
*/
exports.cart = function (image, trainingData, fieldName) {
  var training = image.sampleRegions({
    collection: trainingData,
    properties: [fieldName],
    scale: 30
  });

  var classifier = ee.Classifier.cart().train({
    features: training,
    classProperty: fieldName
  });

  var classified = image.classify(classifier);
  return classified;
};


/*
  RF:
  Function to apply RandomForest classification to an image.

  Params:
  (ee.Image) image - The input image to classify
  (ee.List) trainingData - Training data (samples)
  (string) fieldName - the name of the column that contains the class names
  (ee.Number) numOfTrees - the number of trees that the model will create

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var imgClass = geet.RF(image, samplesfc, landcover, 10);
*/
exports.rf = function (image, trainingData, fieldName, _numOfTrees) {
  var numOfTrees = 10;
  if (_numOfTrees !== undefined) {
    numOfTrees = _numOfTrees;
  }

  var training = image.sampleRegions({
    collection: trainingData,
    properties: [fieldName],
    scale: 30
  });

  var classifier = ee.Classifier.randomForest(numOfTrees).train({
    features: training,
    classProperty: fieldName
  });

  var classified = image.classify(classifier);
  return classified;
};

exports.kmeans = function(image, roi, _numClusters, _scale, _numPixels) {
  if (roi === undefined) {
    print("Error: You need to define and pass a roi as argument to collect the samples for the classfication process.")
  } 
  
  if (_numClusters === undefined) {
    var numClusters = 15;
  } else {
    numClusters = _numClusters;
  }

  if (_scale === undefined) {
    var scale = 30;
  } else {
    scale = _scale;
  }

  if (_numPixels === undefined) {
    var numPixels = 5000;
  } else {
    numPixels = _numPixels;
  }

  // Make the training dataset.
  var training = image.sample({
    region: roi,
    scale: scale,
    numPixels: numPixels
  });

  // Instantiate the clusterer and train it.
  var clusterer = ee.Clusterer.wekaKMeans(numClusters).train(training);

  // Cluster the input using the trained clusterer.
  var result = image.cluster(clusterer);
  Map.addLayer(result.randomVisualizer(), {}, 'clusters');
  return result;
}

/*
  simpleNDVIChangeDetection:
  Function to detect changes between two input images using the NDVI index 
  and a threshold paramter. 
  The function adds the two masked indices and return the sum of the two.
  Its a good choice to call the plotClass function to visualize the result.
  Ex: geet.plotClass(ndviChange, 3, 'change_detection');
  
  Params: 
  (string) sensor = The name of the sensor that will be used. 'L5' or 'L8.
  (ee.Image) img1 = The first input image.
  (ee.Image) img2 = The second input image.
  (ee.Number) threshold = The number of the threshold. All the values at the 
                          image that is gte (grater of equal) to this number 
                          will be selected.   
                          
  Usage: 
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var ndviChange = geet.simpleNDVIChangeDetection('L8', image_2014, image_2015, 0.5);
*/
exports.simpleNDVIChangeDetection = function (img1, img2, sensor, threshold) {
  if (sensor === 'L8') {
    var i_ndvi_1 = img1.normalizedDifference(['B5', 'B4']).rename('NDVI');
    var i_ndvi_2 = img2.normalizedDifference(['B5', 'B4']).rename('NDVI');
  } else if (sensor === 'L5') {
    var i_ndvi_1 = img1.normalizedDifference(['B4', 'B3']).rename('NDVI');
    var i_ndvi_2 = img2.normalizedDifference(['B4', 'B3']).rename('NDVI');
  } else {
    print('wrong sensor. Choose between L5 or L8');
    return;
  }
  var i_ndvi_1_mask = i_ndvi_1.select('NDVI').gte(threshold);
  var i_ndvi_2_mask = i_ndvi_2.select('NDVI').gte(threshold);
  var imgSoma = i_ndvi_1_mask.add(i_ndvi_2_mask);
  Map.addLayer(imgSoma, { min: 0, max: 2, palette: [COLOR.SHADOW, COLOR.URBAN, COLOR.PASTURE] }, 'ndvi_cd');
  return imgSoma;
}

/*
  simpleNDWIChangeDetection:
  Function to detect changes between two input images using the NDWI index 
  and a threshold paramter. 
  The function adds the two masked indices and return the sum of the two.
  Its a good choice to call the plotClass function to visualize the result.
  Ex: geet.plotClass(ndwiChange, 3, 'change_detection');

  Params: 
  (string) sensor = The name of the sensor that will be used. 'L5' or 'L8.
  (ee.Image) img1 = The first input image.
  (ee.Image) img2 = The second input image.
  (ee.Number) threshold = The number of the threshold. All the values at the 
                          image that is gte (grater of equal) to this number 
                          will be selected.   
                          
  Usage: 
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var ndwiChange = geet.simpleNDWIChangeDetection('L8', image_2014, image_2015, 0.5);
*/
exports.simpleNDWIChangeDetection = function (img1, img2, sensor, threshold) {
  if (sensor === 'L8') {
    var i_ndwi_1 = img1.normalizedDifference(['B4', 'B6']).rename('NDWI');
    var i_ndwi_2 = img2.normalizedDifference(['B4', 'B6']).rename('NDWI');
  } else if (sensor === 'L5') {
    var i_ndwi_1 = img1.normalizedDifference(['B3', 'B5']).rename('NDWI');
    var i_ndwi_2 = img2.normalizedDifference(['B3', 'B5']).rename('NDWI');
  } else {
    print('wrong sensor. Choose between L5 or L8');
    return;
  }
  var i_ndwi_1_mask = i_ndwi_1.select('NDWI').gte(threshold);
  var i_ndwi_2_mask = i_ndwi_2.select('NDWI').gte(threshold);
  var imgSoma = i_ndwi_1_mask.add(i_ndwi_2_mask);
  Map.addLayer(imgSoma, { min: 0, max: 2, palette: [COLOR.SHADOW, COLOR.URBAN, COLOR.PASTURE] }, 'ndwi_cd');
  return imgSoma;
}

/*
  simpleNDBIChangeDetection:
  Function to detect changes between two input images using the NDBI index 
  and a threshold paramter. 
  The function adds the two masked indices and return the sum of the two.
  Its a good choice to call the plotClass function to visualize the result.
  Ex: geet.plotClass(ndbiChange, 3, 'change_detection');

  Params: 
  (string) sensor = The name of the sensor that will be used. 'L5' or 'L8.
  (ee.Image) img1 = The first input image.
  (ee.Image) img2 = The second input image.
  (ee.Number) threshold = The number of the threshold. All the values at the 
                          image that is gte (grater of equal) to this number 
                          will be selected.   
                          
  Usage: 
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var ndbiChange = geet.simpleNDVIChangeDetection('L8', image_2014, image_2015, 0.5);
*/
exports.simpleNDBIChangeDetection = function (img1, img2, sensor, threshold) {
  if (sensor === 'L8') {
    var i_ndbi_1 = img1.normalizedDifference(['B6', 'B5']).rename('NDBI');
    var i_ndbi_2 = img2.normalizedDifference(['B6', 'B5']).rename('NDBI');
  } else if (sensor === 'L5') {
    var i_ndbi_1 = img1.normalizedDifference(['B5', 'B4']).rename('NDBI');
    var i_ndbi_2 = img2.normalizedDifference(['B5', 'B4']).rename('NDBI');
  } else {
    print('wrong sensor. Choose between L5 or L8');
    return;
  }
  var i_ndbi_1_mask = i_ndbi_1.select('NDBI').gte(threshold);
  var i_ndbi_2_mask = i_ndbi_2.select('NDBI').gte(threshold);
  var imgSoma = i_ndbi_1_mask.add(i_ndbi_2_mask);
  Map.addLayer(imgSoma, { min: 0, max: 2, palette: [COLOR.SHADOW, COLOR.URBAN, COLOR.PASTURE] }, 'ndbi_cd');
  return imgSoma;
}

// TODO
exports.filterDateRange = function (imgCol, start, finish, field) {
  var imgCol_filtered = imgCol.filter(ee.Filter.calendarRange(start, finish, field));
  return imgCol_filtered;
}

/*
  Texture:
  Function generate a texture filter on the image.

  Params:
  (ee.Image) image = The input image.
  (ee.Number) radius = the radius number that defines the effect level of the filter. 
                       Bigger numbers generalize more the result. 
  
   Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var texture = geet.texture(image_from_rio, 1);
*/
exports.texture = function (image, radius) {
  var texture = image.reduceNeighborhood({
    reducer: ee.Reducer.stdDev(),
    kernel: ee.Kernel.circle(radius),
  });
  return texture;
}

/*
  Majority:
  Function to filter the final classification image and clear the salt n' pepper effect.

  Params:
  (ee.Image) image = The input image.
  (ee.Number) radius = the radius number that defines the effect level of the filter. 
                       Bigger numbers generalize more the result. 
  
   Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var majority = geet.majority(image_from_rio, 1);
*/
exports.majority = function (image, radius) {
  var majority = image.reduceNeighborhood({
    reducer: ee.Reducer.mode(),
    kernel: ee.Kernel.circle(radius),
  });
  return majority;
}

// COLOR OBJECT
var COLOR = {
  WATER: '0066ff',
  FOREST: '009933',
  PASTURE: '99cc00',
  URBAN: 'ff0000',
  SHADOW: '000000',
  NULL: '808080'
};

/*
  color:
  Function to return a valid color value from the object COLOR.

  Params:
  (string) color - the name of the desired color.
                   Valid options are water, forest, pasture, urban, shadow or null

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  geet.color('water');
*/
exports.color = function(_color) {
  var color = _color.toLowerCase(); 
  switch (color) {
    case 'water':
      return COLOR.WATER;
      break;
    case 'forest':
      return COLOR.FOREST;
      break;
    case 'PASTURE':
      return COLOR.PASTURE;
      break;
    case 'URBAN':
      return COLOR.URBAN;
      break;
    case 'SHADOW':
      return COLOR.SHADOW;
      break;
    case 'NULL':
      return COLOR.NULL;
      break;
    default:
      return 'Error: Valid options are water, forest, pasture, urban, shadow or null! Remember to pass the argument as a string.'
      break;
  }
}

/*
  plotRGB:
  Function to plot a RGB image.

  Params:
  (ee.Image) image - the image to display
  (string) title - the layer title

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  geet.plotRGB(image, 'rgb_image');
*/
exports.plotRGB = function (image, title) {
  Map.addLayer(image, { bands: ['B4', 'B3', 'B2'], max: 0.3 }, title);
};

/*
  plotNDVI:
  Function to plot a NDVI image index.

  Params:
  (ee.Image) image - the image to display
  (string) title - the layer title

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  geet.plotNDVI(ndvi, 'ndvi_image');
*/
exports.plotNDVI = function (image, title) {
  Map.addLayer(image, { min: -1, max: 1, palette: ['FF0000', '00FF00'] }, title);
};

/*
  plotNDWI:
  Function to plot a NDWI image index.

  Params:
  (ee.Image) image - the image to display
  (string) title - the layer title

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  geet.plotNDWI(ndwi, 'ndwi_image');
*/
exports.plotNDWI = function (image, title) {
  Map.addLayer(image, { min: -1, max: 1, palette: ['00FFFF', '0000FF'] }, title);
};

/*
  plotClass:
  Function to plot the final classification map.
  
  Params:
  (ee.Image) image - the image to process
  (number) numClasses - the number of classes that your classification map has. It variates from 2 to 5 max classes only.
  (string) title - the layer title 
  
  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  geet.plotClass(classified, 4, 'class_final');
*/
exports.plotClass = function (image, numClasses, _title) {
  var title = 'class_final';
  if (_title !== undefined) {
    title = _title;
  }

  switch (numClasses) {
    case 2:
      Map.addLayer(image, { min: 0, max: numClasses - 1, palette: [COLOR.SHADOW, COLOR.NULO] }, title);
      break;
    case 3:
      Map.addLayer(image, { min: 0, max: numClasses - 1, palette: [COLOR.URBAN, COLOR.FOREST, COLOR.WATER] }, title);
      break;
    case 4:
      Map.addLayer(image, { min: 0, max: numClasses - 1, palette: [COLOR.URBAN, COLOR.FOREST, COLOR.PASTURE, COLOR.WATER] }, title);
      break;
    case 5:
      Map.addLayer(image, { min: 0, max: numClasses - 1, palette: [COLOR.URBAN, COLOR.FOREST, COLOR.PASTURE, COLOR.WATER, COLOR.SHADOW] }, title);
      break;
    default:
      print("Wrong number of classes. plotClass supports a number of classes from 2 to 5 only.");
      break;
  }
};

/*
  spectralIndices:
  Function to take an input image and generate indexes like:
  NDVI, NDWI, NDBI...
  
  More indices and features will be added in the future!

  Supported indices:
  NDVI, NDWI, NDBI, NRVI, EVI, SAVI and GOSAVI

  Params:
  (ee.Image) image - the image to process
  (string) sensor - the sensor that you are working on Landsat 5 ('L5') or 8 ('L8')
  (string or string array) index (optional) - you can specify the index that you want
                     if you dont specify any index the function will create all possible indices.
  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/indexGen');
  var result = geet.spectralIndices(image, 'L5'); // Will create all possible indices.

  or specifying the index to generate:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var result = geet.spectralIndices(image, 'L5', 'savi'); // This will create only SAVI.
*/
exports.spectralIndices = function (image, sensor, index) {
  if (index != null) {
    switch (index) {
      case 'NDVI':
        if (sensor == 'L5') {
          var i_ndvi = image.normalizedDifference(['B4', 'B3']).rename('NDVI');
          var newImage = image.addBands(i_ndvi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
          var newImage = image.addBands(i_ndvi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
      case 'NDWI':
        if (sensor == 'L5') {
          var i_ndwi = image.normalizedDifference(['B3', 'B5']).rename('NDWI');
          var newImage = image.addBands(i_ndwi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_ndwi = image.normalizedDifference(['B4', 'B6']).rename('NDWI');
          var newImage = image.addBands(i_ndwi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
      case 'NDBI':
        if (sensor == 'L5') {
          var i_ndbi = image.normalizedDifference(['B5', 'B4']).rename('NDBI');
          var newImage = image.addBands(i_ndbi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_ndbi = image.normalizedDifference(['B6', 'B5']).rename('NDBI');
          var newImage = image.addBands(i_ndbi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
      case 'NRVI':
        if (sensor == 'L5') {
          var i_nrvi = image.expression(
            '(RED/NIR - 1) / (RED/NIR + 1)', {
              'NIR': image.select('B4'),
              'RED': image.select('B3')
            }).rename('NRVI');
          var newImage = image.addBands(i_nrvi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_nrvi = image.expression(
            '(RED/NIR - 1) / (RED/NIR + 1)', {
              'NIR': image.select('B5'),
              'RED': image.select('B4')
            }).rename('NRVI');
          var newImage = image.addBands(i_nrvi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
      case 'EVI':
        if (sensor == 'L5') {
          var i_evi = image.expression(
            '2.5 * ((NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1)', {
              'NIR': image.select('B4'),
              'RED': image.select('B3'),
              'BLUE': image.select('B1')
            }).rename('EVI');
          var newImage = image.addBands(i_evi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_evi = image.expression(
            '2.5 * ((NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1)', {
              'NIR': image.select('B5'),
              'RED': image.select('B4'),
              'BLUE': image.select('B2')
            }).rename('EVI');
          var newImage = image.addBands(i_evi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
      case 'SAVI':
        if (sensor == 'L5') {
          var i_savi = image.expression(
            '(1 + L) * (NIR - RED) / (NIR + RED + L)', {
              'NIR': image.select('B4'),
              'RED': image.select('B3'),
              'L': 0.2
            }).rename('SAVI');
          var newImage = image.addBands(i_savi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_savi = image.expression(
            '(1 + L) * (NIR - RED) / (NIR + RED + L)', {
              'NIR': image.select('B5'),
              'RED': image.select('B4'),
              'L': 0.2
            }).rename('SAVI');
          var newImage = image.addBands(i_savi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
      case 'GOSAVI':
        if (sensor == 'L5') {
          var i_gosavi = image.expression(
            '(NIR - GREEN) / (NIR + GREEN + Y)', {
              'NIR': image.select('B4'),
              'GREEN': image.select('B2'),
              'Y': 0.16
            }).rename('GOSAVI');
          var newImage = image.addBands(i_gosavi);
          return newImage;
        } else if (sensor == 'L8') {
          var i_gosavi = image.expression(
            '(NIR - GREEN) / (NIR + GREEN + Y)', {
              'NIR': image.select('B5'),
              'GREEN': image.select('B3'),
              'Y': 0.16
            }).rename('GOSAVI');
          var newImage = image.addBands(i_gosavi);
          return newImage;
        } else {
          print('Wrong sensor!');
        }
        break;
    }
  } else { // END OF SWITCH 
    // Gen ALL indices
    if (sensor == 'L5') {
      var i_ndvi = image.normalizedDifference(['B4', 'B3']).rename('NDVI');
      var i_ndwi = image.normalizedDifference(['B2', 'B4']).rename('NDWI');
      var i_ndbi = image.normalizedDifference(['B5', 'B4']).rename('NDBI');
      var i_nrvi = image.expression(
        '(RED/NIR - 1) / (RED/NIR + 1)', {
          'NIR': image.select('B4'),
          'RED': image.select('B3')
        }).rename('NRVI');
      var i_evi = image.expression(
        '2.5 * ((NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1)', {
          'NIR': image.select('B4'),
          'RED': image.select('B3'),
          'BLUE': image.select('B1')
        }).rename('EVI');
      var i_savi = image.expression(
        '(1 + L) * (NIR - RED) / (NIR + RED + L)', {
          'NIR': image.select('B4'),
          'RED': image.select('B3'),
          'L': 0.2
        }).rename('SAVI');
      var i_gosavi = image.expression(
        '(NIR - GREEN) / (NIR + GREEN + Y)', {
          'NIR': image.select('B4'),
          'GREEN': image.select('B2'),
          'Y': 0.16
        }).rename('GOSAVI');
      var newImage = image.addBands([i_ndvi, i_ndwi, i_ndbi, i_evi, i_savi, i_gosavi]);
      return newImage;
    } else if (sensor == 'L8') {
      var i_ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
      var i_ndwi = image.normalizedDifference(['B3', 'B5']).rename('NDWI');
      var i_ndbi = image.normalizedDifference(['B6', 'B5']).rename('NDBI');
      var i_nrvi = image.expression(
        '(RED/NIR - 1) / (RED/NIR + 1)', {
          'NIR': image.select('B5'),
          'RED': image.select('B4')
        }).rename('NRVI');
      var i_evi = image.expression(
        '2.5 * ((NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1)', {
          'NIR': image.select('B5'),
          'RED': image.select('B4'),
          'BLUE': image.select('B2')
        }).rename('EVI');
      var i_savi = image.expression(
        '(1 + L) * (NIR - RED) / (NIR + RED + L)', {
          'NIR': image.select('B5'),
          'RED': image.select('B4'),
          'L': 0.2
        }).rename('SAVI');
      var i_gosavi = image.expression(
        '(NIR - GREEN) / (NIR + GREEN + Y)', {
          'NIR': image.select('B5'),
          'GREEN': image.select('B3'),
          'Y': 0.16
        }).rename('GOSAVI');
      var newImage = image.addBands([i_ndvi, i_ndwi, i_ndbi, i_evi, i_savi, i_gosavi]);
      return newImage;
    } else {
      print("Wrong sensor input!");
      print("Choose 'L5' to process Landsat 5 images or 'L8' for Landsat 8");
    }
  }
};

/*
   loadImg:
   Function to get an example image to debug or test some code. 

   Params:
   (string) collection - the type of the collection that will be filtered: RAW, TOA or SR.
   (number) year - the year of the image that you want to get.
   optional (list) roi - the latitude and longitude of a roi.
   optional (string) title - the title of the plotted image.
   
   Usage:
   var geet = require('users/eduardolacerdageo/default:Functions/GEET');
   var image = geet.loadImg(); // Returns a TOA image

   or 

   var geet = require('users/eduardolacerdageo/default:Functions/GEET');
   var image = geet.loadImg('SR'); // Returns a SR image
*/
exports.loadImg = function (_collection, _year, _roi, _title) {
  // Setup
  var collection = 'TOA';
  var year = 2015;
  var roi = ee.Geometry.Point(-43.25, -22.90);
  var title = 'loadImg';
  var visParams = { bands: ['B4', 'B3', 'B2'], max: 0.3 };

  // Check year
  if (_year !== undefined) {
    year = _year;
  } else {
    print('ERRO: You need to specify the year parameter.')
  }

  // Check roi
  if (_roi !== undefined) {
    roi = _roi;
  }

  // Check title
  if (_title !== undefined) {
    title = _title;
  }

  // Check collection
  if (year >= 2013) {
    if (collection !== undefined) {
      collection = _collection;
      if (collection === 'RAW') {
        collection = 'LANDSAT/LC8_L1T';
        visParams = {
          bands: ['B4', 'B3', 'B2'], min: 6809, max: 12199
        };
      } else if (collection === 'TOA') {
        collection = 'LANDSAT/LC8_L1T_TOA';
      } else if (collection === 'SR') {
        collection = 'LANDSAT/LC8_SR';
        visParams = {
          bands: ['B4', 'B3', 'B2'], min: 104, max: 1632
        };
      } else {
        print("Wrong collection type. Possible inputs: 'RAW', 'TOA' or 'SR'.");
      }
    }
  } else if (year < 2013 && year >= 1985) {
    if (collection !== undefined) {
      collection = _collection;
      if (collection === 'RAW') {
        collection = 'LANDSAT/LT5_L1T';
        visParams = {
          bands: ['B4', 'B3', 'B2'], min: 6809, max: 12199
        };
      } else if (collection === 'TOA') {
        collection = 'LANDSAT/LT5_L1T_TOA_FMASK';
      } else if (collection === 'SR') {
        collection = 'LANDSAT/LT5_SR';
        visParams = {
          bands: ['B4', 'B3', 'B2'], min: 104, max: 1632
        };
      } else {
        print("Wrong collection type. Possible inputs: 'RAW', 'TOA' or 'SR'.");
      }
    }
  } else {
    print('ERROR: Wrong year parameter');
  }

  // Get Image
  var start = '-01-01';
  var finish = '-12-31';
  var l8 = ee.ImageCollection(collection);
  var image = ee.Image(l8
    .filterBounds(roi)
    .filterDate(year.toString() + start, year.toString() + finish)
    .sort('CLOUD_COVER')
    .first());

  var titleName = title + '_' +  year.toString();

  Map.addLayer(image, visParams, titleName);
  print(image);
  return image;
};

/*
  toaRadiance:
  Function to do a band conversion of digital numbers (DN) to Top of Atmosphere (TOA) Radiance

  Params:
  (ee.Image) image - The image to process.
  (number) band - The number of the band that you want to process.

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var new_toa_radiance = geet.toaRadiance(img, 10); // ee.Image

  Information:
  Formula:     Lλ = MLQcal + AL
  Lλ           = TOA spectral radiance (Watts/( m2 * srad * μm))
  ML           = Band-specific multiplicative rescaling factor from the metadata (RADIANCE_MULT_BAND_x, where x is the band number)
  AL           = Band-specific additive rescaling factor from the metadata (RADIANCE_ADD_BAND_x, where x is the band number)
  Qcal         = Quantized and calibrated standard product pixel values (DN)
*/
exports.toaRadiance = function(image, band) {
  var band_to_toa = image.select('B' + band.toString());
  var radiance_multi_band = ee.Number(image.get('RADIANCE_MULT_BAND_' + band.toString())); // Ml
  var radiance_add_band = ee.Number(image.get('RADIANCE_ADD_BAND_' + band.toString())); // Al
  var toa = band_to_toa.expression(
    '(Ml * image) + Al', {
      'Ml': radiance_multi_band,
      'Al': radiance_add_band,
      'image': band_to_toa
    }).rename('B' + band.toString() + '_TOA_Radiance');
  return toa;
}

/*
  toaReflectance:
  Function to do a band conversion of digital numbers (DN) to Top of Atmosphere (TOA) Reflectance

  Params:
  (ee.Image) image - The image to process.
  (number) band - The number of the band that you want to process.

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var new_toa_reflectance = geet.toaReflectance(img, 10); // ee.Image

  Information:
  Formula:      ρλ' = MρQcal + Aρ
  ρλ'           = TOA planetary reflectance, without correction for solar angle.  Note that ρλ' does not contain a correction for the sun angle.
  Mρ            = Band-specific multiplicative rescaling factor from the metadata (REFLECTANCE_MULT_BAND_x, where x is the band number)
  Aρ            = Band-specific additive rescaling factor from the metadata (REFLECTANCE_ADD_BAND_x, where x is the band number)
  Qcal          = Quantized and calibrated standard product pixel values (DN)
*/
exports.toaReflectance = function(image, band) {
  var band_to_toa = image.select('B' + band.toString());
  var reflectance_multi_band = ee.Number(image.get('REFLECTANCE_MULT_BAND_' + band.toString())); // Mp
  var reflectance_add_band = ee.Number(image.get('REFLECTANCE_ADD_BAND_' + band.toString())); // Ap
  var toa = band_to_toa.expression(
    '(Mp * image) + Ap', {
      'Mp': reflectance_multi_band,
      'Ap': reflectance_add_band,
      'image': band_to_toa
    }).rename('B' + band.toString() + '_TOA_Reflectance');
  return toa;
}

// Solar Angle function for Landsat 8 Reflectance correction processing (Local sun elevation angle)
function solarAngleElevation(original_img, raw_reflectance) {
  var sun_elevation = ee.Number(original_img.get('SUN_ELEVATION'));
  var sin_sun_elevation = sun_elevation.sin();
  var toa = raw_reflectance.divide(sin_sun_elevation).rename('TOA_Reflectance_SE');
  return toa;
}

// Solar Angle function for Landsat 8 Reflectance correction processing (Local solar zenith angle)
function solarAngleZenith(original_img, raw_reflectance) {
  var sun_elevation = ee.Number(original_img.get('SUN_ELEVATION'));
  var solar_zenith = ee.Number(90).subtract(sun_elevation);
  var cos_sun_elevation = solar_zenith.cos();
  var toa = raw_reflectance.divide(cos_sun_elevation).rename('TOA_Reflectance_SZ');
  return toa;
}

/*
  toaReflectanceL8:
  Function to do a band conversion of digital numbers (DN) to Top of Atmosphere (TOA) Reflectance
  Landsat 8 version with Solar Angle correction.

  Params:
  (ee.Image) image - The image to process.
  (number) band - The number of the band that you want to process.
  (string) solarAngle - The solar angle mode. 'SE' for local sun elevation angle and 'SZ' for local solar zenith angle.

  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var new_toa_reflectance_sz = geet.toaReflectanceL8(img, 10, 'SZ'); // ee.Image

  or

  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var new_toa_reflectance_se = geet.toaReflectanceL8(img, 10, 'SE'); // ee.Image

  Information:
  Formula:      ρλ' = MρQcal + Aρ
  ρλ'           = TOA planetary reflectance, without correction for solar angle.  Note that ρλ' does not contain a correction for the sun angle.
  Mρ            = Band-specific multiplicative rescaling factor from the metadata (REFLECTANCE_MULT_BAND_x, where x is the band number)
  Aρ            = Band-specific additive rescaling factor from the metadata (REFLECTANCE_ADD_BAND_x, where x is the band number)
  Qcal          = Quantized and calibrated standard product pixel values (DN)

  SE = Local sun elevation angle. The scene center sun elevation angle in degrees is provided in the metadata (SUN_ELEVATION).
  SZ = Local solar zenith angle: SZ = 90° - SE
*/
exports.toaReflectanceL8 = function (image, band, _solarAngle) {
  if (_solarAngle !== undefined) {
    var solarAngle = _solarAngle;
    if (solarAngle !== 'SZ' && solarAngle !== 'SE') {
      print("Error: You need to choose one of two modes:");
      print("Error: 'SE' for the local sun elevation angle or 'SZ' for the Local solar zenith angle.");
      print("Warning: 'SZ' will be set as default mode.")
      solarAngle = 'SZ';
    }
  } else {
    solarAngle = 'SZ';
  }

  if (solarAngle === 'SE') {
    var band_to_toa = image.select('B' + band.toString());
    var reflectance_multi_band = ee.Number(image.get('REFLECTANCE_MULT_BAND_' + band.toString())); // Mp
    var reflectance_add_band = ee.Number(image.get('REFLECTANCE_ADD_BAND_' + band.toString())); // Ap
     var toa = band_to_toa.expression(
       '(Mp * image) + Ap', {
         'Mp': reflectance_multi_band,
         'Ap': reflectance_add_band,
         'image': band_to_toa
       }).rename('B' + band.toString() + '_TOA_Reflectance_SE');
    var img_se = solarAngleElevation(image, toa);
    return img_se;
   }

  if (solarAngle === 'SZ') {
     var band_to_toa = image.select('B' + band.toString());
     var reflectance_multi_band = ee.Number(image.get('REFLECTANCE_MULT_BAND_' + band.toString())); // Mp
     var reflectance_add_band = ee.Number(image.get('REFLECTANCE_ADD_BAND_' + band.toString())); // Ap
     var toa = band_to_toa.expression(
       '(Mp * image) + Ap', {
         'Mp': reflectance_multi_band,
         'Ap': reflectance_add_band,
         'image': band_to_toa
       }).rename('B' + band.toString() + '_TOA_Reflectance_SZ');
     var img_sz = solarAngleZenith(image, toa);
     return img_sz;
  } 
}


/*
  brightnessTempL5:
  Function to convert the Top of Atmosphere image to Top of Atmosphere Brightness Temperature.
  This one works only for Landsat 5 data.

  Params:
  (ee.Image) image - the Top of Atmosphere (TOA) image to convert.
  
  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var brightness_temp_img = geet.brightnessTempL5(toa_image); // ee.Image

  T           = Top of atmosphere brightness temperature (K)
  Lλ          = TOA spectral radiance (Watts/( m2 * srad * μm))
  K1          = Band-specific thermal conversion constant from the metadata (K1_CONSTANT_BAND_x, where x is the thermal band number)
  K2          = Band-specific thermal conversion constant from the metadata (K2_CONSTANT_BAND_x, where x is the thermal band number)
*/
exports.brightnessTempL5 = function(image) {
  // landsat 5 constants
  var K1 = 607.76
  var K2 = 1260.56

  var brightness_temp_semlog = image.expression(
    'K1 / B6 + 1', {
      'K1': K1,
      'B6': image.select('B6')
    });

  var brightness_temp_log = brightness_temp_semlog.log();

  var brightness_temp = image.expression(
    'K2 / brightness_temp_log', {
      'K2': K2,
      'brightness_temp_log': brightness_temp_log
    });
  return brightness_temp;
}

/*
  brightnessTempL7:
  Function to convert the Top of Atmosphere image to Top of Atmosphere Brightness Temperature.
  This one works only for Landsat 7 data.

  Params:
  (ee.Image) image - the Top of Atmosphere (TOA) image to convert.
  
  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var brightness_temp_img = geet.brightnessTempL7(toa_image); // ee.Image

  T           = Top of atmosphere brightness temperature (K)
  Lλ          = TOA spectral radiance (Watts/( m2 * srad * μm))
  K1          = Band-specific thermal conversion constant from the metadata (K1_CONSTANT_BAND_x, where x is the thermal band number)
  K2          = Band-specific thermal conversion constant from the metadata (K2_CONSTANT_BAND_x, where x is the thermal band number)
*/
exports.brightnessTempL7 = function (image) {
  // landsat 7 constants
  var K1 = 666.09
  var K2 = 1282.71

  var brightness_temp_semlog = image.expression(
    'K1 / B6 + 1', {
      'K1': K1,
      'B6': image.select('B6')
    });

  var brightness_temp_log = brightness_temp_semlog.log();

  var brightness_temp = image.expression(
    'K2 / brightness_temp_log', {
      'K2': K2,
      'brightness_temp_log': brightness_temp_log
    });
  return brightness_temp;
}

/*
  brightnessTempL8:
  Function to convert the Top of Atmosphere image to Top of Atmosphere Brightness Temperature.
  This one works only for Landsat 8 data.

  Params:
  (ee.Image) image - the Top of Atmosphere (TOA) image to convert.
  (boolean) single - if false, will process only the B10 band, if true, will consider B11 too. Default its true!
  
  Usage:
  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var brightness_temp_img = geet.brightnessTempL8(toa_image); // ee.Image

  or 

  var geet = require('users/eduardolacerdageo/default:Function/GEET');
  var brightness_temp_img = geet.brightnessTempL8(toa_image, false); // ee.Image

  T           = Top of atmosphere brightness temperature (K)
  Lλ          = TOA spectral radiance (Watts/( m2 * srad * μm))
  K1          = Band-specific thermal conversion constant from the metadata (K1_CONSTANT_BAND_x, where x is the thermal band number)
  K2          = Band-specific thermal conversion constant from the metadata (K2_CONSTANT_BAND_x, where x is the thermal band number)
*/
exports.brightnessTempL8 = function (image, _single) {
  var single = (arguments[1] !== void 1 ? false : true);
  // default is true - double band (B10 and B11) processing
  if (single === true) {
    var K1_10 = ee.Number(image.get('K1_CONSTANT_BAND_10'));
    var K2_10 = ee.Number(image.get('K2_CONSTANT_BAND_10'));
    var K1_11 = ee.Number(image.get('K1_CONSTANT_BAND_11'));
    var K2_11 = ee.Number(image.get('K2_CONSTANT_BAND_11'));

    var brightness_temp_semlog = image.expression(
      'K1 / B10 + 1', {
        'K1': K1_10,
        'B10': image.select('B10')
      });

    var brightness_temp_log = brightness_temp_semlog.log();

    var brightness_temp = image.expression(
      'K2 / brightness_temp_log', {
        'K2': K2_10,
        'brightness_temp_log': brightness_temp_log
      });
    return brightness_temp;
  } else {
    // false - single band (B10) processing
    var K1_10 = ee.Number(image.get('K1_CONSTANT_BAND_10'));
    var K2_10 = ee.Number(image.get('K2_CONSTANT_BAND_10'));

    var brightness_temp_semlog = image.expression(
      'K1 / B10 + 1', {
        'K1': K1_10,
        'B10': image.select('B10')
      });

    var brightness_temp_log = brightness_temp_semlog.log();

    var brightness_temp = image.expression(
      'K2 / brightness_temp_log', {
        'K2': K2_10,
        'brightness_temp_log': brightness_temp_log
      });
    return brightness_temp;
  }
}

