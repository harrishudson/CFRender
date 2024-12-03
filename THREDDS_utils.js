/**
 * THREDDS_utils.js 
 *
 * Universal helper functions to parse artefacts from THREDDS TDS servers
 * Eg, process "catalog.xml" and subset server "metadata.xml" XML responses from THREDDS TDS servers.
 * 
 * This script has no external dependencies and is browser ready
 * 
 * Author: Copyright (c) 2024 Harris Hudson  harris@harrishudson.com 
 **/

export class TDSCatalogParser {
 constructor(src) {
  this.xmlCatalog = src
  this.catalog_subpath = '/thredds/catalog/'
  this.catalog_dataset_refs = this.getCatalogRefList()
  this.catalog_dataset_datasets = this.getCatalogDatasetList()
  this.catalog_singular_dataset = this.getCatalogSingularDataset()
 }

 getCatalogRefList() {
  let Datasets = this.xmlCatalog.querySelectorAll('catalog > dataset')
  if (!Datasets)
   return null
  var ResultList = []
  for (let d = 0; d < Datasets.length; d++) {
   let Dataset = Datasets[d]
   let dataset_name = Dataset.getAttribute("name")
   let dataset_ID = Dataset.getAttribute("ID")
   let RefList = Dataset.querySelectorAll('catalogRef')
   for (let r = 0; r < RefList.length; r++) {
    let Ref = RefList[r]
    let href = Ref.getAttributeNS("http://www.w3.org/1999/xlink", "href")
    let title = Ref.getAttributeNS("http://www.w3.org/1999/xlink", "title")
    let ID = Ref.getAttribute("ID")
    let name = Ref.getAttribute("name")
    ResultList.push({"dataset_list_name": dataset_name,
                     "dataset_list_ID": dataset_ID,
                     "href": href,
                     "title": title,
                     "ID": ID,
                     "name": name})

    }
   }
  return ResultList
 }

 getCatalogDatasetList() {
  let Datasets = this.xmlCatalog.querySelectorAll('catalog > dataset')
  if (!Datasets)
   return null
  var ResultList = []
  for (let d = 0; d < Datasets.length; d++) {
   let Dataset = Datasets[d]
   let dataset_name = Dataset.getAttribute("name")
   let dataset_ID = Dataset.getAttribute("ID")
   let DatasetList = Dataset.querySelectorAll('dataset')
   if (DatasetList) {
    for (let ds = 0; ds <DatasetList.length; ds++) {
     let thisDataset = DatasetList[ds]
     let name = thisDataset.getAttribute("name")
     let ID = thisDataset.getAttribute("ID")
     let urlPath = thisDataset.getAttribute("urlPath")
     ResultList.push({"dataset_list_name": dataset_name,
                      "dataset_list_ID": dataset_ID,
                      "name": name,
                      "ID": ID,
                      "urlPath": urlPath})
    }
   }
  }
  return ResultList
 }

 getCatalogSingularDataset() {
  let Datasets = this.xmlCatalog.querySelectorAll('catalog > dataset')
  if (!Datasets)
   return null
  if (Datasets.length != 1)
   return null
  let Dataset = Datasets[0]
  let name = Dataset.getAttribute("name")
  let ID = Dataset.getAttribute("ID")
  let urlPath = Dataset.getAttribute("urlPath")
  return {"name": name,
          "ID": ID,
          "urlPath": urlPath}
 }

 getCatalogRefHref(title, dataset_list_name) {
  // title must be passed, dataset_list_name is optional
  if (!title)
   return null
  for (let r = 0; r < this.catalog_dataset_refs.length; r++) {
   let ref = this.catalog_dataset_refs[r]
   if (
       (((dataset_list_name) && (dataset_list_name == ref.dataset_list_name)) || (!dataset_list_name)) 
        &&
       (title == ref.title)
      ) {
    return ref["href"]
   }
  }
  return null  
 }

 getDatasetHTTPServerSubPath(name, dataset_list_name) {
  // name must be passed, dataset_list_name is optional
  if (!name)
   return null
  let service = this.xmlCatalog.querySelector('service[serviceType="HTTPServer"]')
  if (!service)
   return null
  let http_base = service.getAttribute('base')
  for (let d = 0; d < this.catalog_dataset_datasets.length; d++) {
   let dataset = this.catalog_dataset_datasets[d]
   if (
       (((dataset_list_name) && (dataset_list_name == dataset.dataset_list_name)) || (!dataset_list_name)) 
       &&
       (name == dataset.name)
      ) {
    return http_base + dataset["urlPath"]
   }
  }
  return null 
 }

 getDatasetSubsetServerSubPath(name, dataset_list_name) {
  if (!name)
   return null
  let service = this.xmlCatalog.querySelector('service[serviceType="NetcdfSubset"]')
  if (!service)
   return null
  let http_base = service.getAttribute('base')
  for (let d = 0; d < this.catalog_dataset_datasets.length; d++) {
   let dataset = this.catalog_dataset_datasets[d]
   if (
       (((dataset_list_name) && (dataset_list_name == dataset.dataset_list_name)) || (!dataset_list_name)) 
       &&
       (name == dataset.name)
      ) {
    return http_base + dataset["urlPath"]
   }
  }
  return null
 }

 setCatalogSubPath(path) {
  this.catalog_subpath = path
 }
}

export class TDSMetadataParser {
 constructor(src, longitudeWrap) {
  this.xmlDataset = src
  this.longitudeWrap = longitudeWrap
  this.LatLonBox = this.getLatLonBox()
  // HorizStrideDefaultCellSize - An arbitrary constant.
  // Minimum of number pixels per cell for 'getHorizStride'
  // Default setting; 4 is suitable for fullscreen maps
  // Change (reduce) if required for non-fullscreen maps.
  // Reduce to produce higher image resolution.
  // If using the CFRender draw2DbasicGrid to draw grids,
  // then this generally this should match the 'idealCellSize' 
  // parameter in most use cases which also defaults to 
  // 'defaultIdealCellSize' value of 4.
  this.HorizStrideDefaultCellSize = 4
  // Minimum image dimension (x or y) in pixel dimensions
  // to not scale to smaller sizes when considering 
  // HorizontalStride
  this.HorizStrideMinPixelScale = 150
  this.Axes = this.getAxes()
  this.GridVariableList = this.getGridVariableList()
 }

 WorldWrap(lon, longitudeWrap) {
  if (longitudeWrap || ((this.longitudeWrap !== undefined) && (this.longitudeWrap))) {
   if (lon === null || lon === undefined || isNaN(lon)) 
    return lon
   lon = parseFloat(lon)
   while (lon > 360) lon -= 360
   while (lon < 0) lon += 360
   return lon
  } else 
   return lon 
 }

 getLatLonBox() {
  let LatLonBox = this.xmlDataset.querySelector('gridDataset > LatLonBox')
  let east = LatLonBox.querySelector('east')
  let west = LatLonBox.querySelector('west')
  let north = LatLonBox.querySelector('north')
  let south = LatLonBox.querySelector('south')
  if (this.longitudeWrap) {
   let east_wrapped = this.WorldWrap(east.textContent, true)
   let west_wrapped = this.WorldWrap(west.textContent, true)
   // Special case longitudes spanning exactly entire globe
   if ((east_wrapped == 180) && (west_wrapped == 180))
    return {"east": 360,
            "west": 0,
            "north": north.textContent, 
            "south": south.textContent}
   else
    return {"east": east_wrapped,
            "west": west_wrapped,
            "north": north.textContent, 
            "south": south.textContent}
  } else
  return {"east": east.textContent,
          "west": west.textContent, 
          "north": north.textContent, 
          "south": south.textContent}
 }

 getAxes() {
  let theseAxes = {}
  let Axes = this.xmlDataset.querySelectorAll('gridDataset > axis')
  if (Axes) {
   for (let i=0; i<Axes.length; i++) {
    var name = null, axisType = null, units = null, values = null, CoordRef = null, axisType = 'Unbound'
    let axis = Axes[i]
    name = axis.getAttribute('name')
    axisType = axis.getAttribute('axisType')
    let unitsNode = axis.querySelector('attribute[name="units"]')
    if (unitsNode) 
     units = unitsNode.getAttribute('value')
    let coordRefNode = axis.querySelector('attribute[name="_CoordinateAxisType"]')
    if (coordRefNode) 
     CoordRef = coordRefNode.getAttribute('value')
    if (['Lon','Lat','Time'].indexOf(CoordRef) >=0) 
     axisType = CoordRef
    else if (['Lon','Lat','Time'].indexOf(name) >= 0)
     axisType = name
    let valuesNode = axis.querySelector('values')
    values = this.getValuesFromNode(valuesNode) 
    theseAxes[name] = {"name": name,
                       "units": units,
                       "axisType": axisType,
                       "values": values}
   }
  }
  return theseAxes
 }

 getAxisByType(axisType) {
  if (!axisType)
   return null
  if (this.Axes) {
   for (let axisKey in this.Axes) {
    let Axis = this.Axes[axisKey]
    if (Axis['axisType'] == axisType)
     return Axis
   }
  }
  return null
 }

 searchAxisTypes(axisTypes) {
  for (let i=0; i<axisTypes.length; i++) {
   let axis = this.getAxisByType(axisTypes[i])
   if (axis)
    return axis
   }
  return null
 }

 getHorizStride(image_size, image_bounds, ScaleFactor = this.HorizStrideDefaultCellSize, longitudeWrap) {
  ScaleFactor = ScaleFactor || this.HorizStrideScaleFactor
  ScaleFactor = Math.max(ScaleFactor, 1)
  let imgAspectRatio = image_size.y / image_size.x
  if ((image_size.x < this.HorizStrideMinPixelScale) ||
      (image_size.y < this.HorizStrideMinPixelScale)) {
   image_size.x = this.HorizStrideMinPixelScale
   image_size.y = this.HorizStrideMinPixelScale * imgAspectRatio
  }
  let GridLonCells = 
   this.searchAxisTypes(['Lon','GeoX','ProjectionX','Easting','X']).values.length
  let GridLatCells = 
   this.searchAxisTypes(['Lat','GeoY','ProjectionY','Northing','Y']).values.length
  let TotalCellCount = GridLonCells * GridLatCells
  let LatLonBox = this.getLatLonBox(longitudeWrap)
  let LonStride = Math.abs(this.LatLonBox.west - this.LatLonBox.east)
  let LatStride = Math.abs(this.LatLonBox.south - this.LatLonBox.north)
  let imgLonStride = Math.abs(image_bounds[0][0] - image_bounds[1][0]) 
  let imgLatStride = Math.abs(image_bounds[0][1] - image_bounds[1][1]) 
  let relativeLonStride = Math.max(0, Math.min(1, imgLonStride / LonStride))
  let relativeLatStride = Math.max(0, Math.min(1, imgLatStride / LatStride))
  let relativeLonCells = relativeLonStride * GridLonCells
  let relativeLatCells = relativeLatStride * GridLatCells
  let cellCount = relativeLonCells * relativeLatCells
  let DesiredCellCount = (image_size.x * image_size.y) / (ScaleFactor ** 2)
  let imgCellCount = Math.sqrt(cellCount / DesiredCellCount)
  let HorizStride = Math.round(Math.max(0, imgCellCount))
  return HorizStride
 }

 getGridVariableList() {
  let gridSets = this.xmlDataset.querySelectorAll('gridDataset > gridSet')
  if (!gridSets) 
   return null
  let ResultList = []
  for (let gs = 0; gs < gridSets.length; gs++) {
    let gridSet = gridSets[gs]
    let grids = gridSet.querySelectorAll("grid")
    if (!grids) continue
    for (let g = 0; g < grids.length; g++) {
      let grid = grids[g]
      let gridAttributes = {}
      for (let i = 0; i < grid.attributes.length; i++) {
        let attr = grid.attributes[i]
        gridAttributes[attr.name] = attr.value
      }
      let nestedAttributes = {}
      let attributeElements = grid.querySelectorAll("attribute")
      for (let a = 0; a < attributeElements.length; a++) {
        let attrElem = attributeElements[a]
        let name = attrElem.getAttribute("name")
        let value = attrElem.getAttribute("value")
        if (name && value) {
          nestedAttributes[name] = value
        }
      }
      gridAttributes["nestedAttributes"] = nestedAttributes
      ResultList.push(gridAttributes)
    }
  }
  return ResultList
 }

 getGridVariableMetadata(variable) {
  if (!variable)
   return null
  let gridSets = this.xmlDataset.querySelectorAll('gridDataset > gridSet')
  if (!gridSets)
   return null
  for (let g = 0; g < gridSets.length; g++) {
   let gridSet = gridSets[g]
   let grid = gridSet.querySelector(`grid[name="${variable}"]`)
   if (!grid)
    continue
   let desc = grid.getAttribute("desc") 
   let axisRefs = gridSet.querySelectorAll('axisRef')
   if (!axisRefs)
    continue
   let gridResult = {}
   gridResult['name'] = variable
   gridResult['desc'] = desc
   gridResult['Axes'] = {}
   for (let a = 0; a < axisRefs.length; a++) {
    let axisRef = axisRefs[a]
    let axisName = axisRef.getAttribute('name')
    gridResult['Axes'][axisName] = this.Axes[axisName]
   }
   return gridResult
  }
 return null
 }

 parseAttributeValue(node, attribute) {
  return parseFloat(node.getAttribute(attribute))
 }

 getValuesFromNode(valuesNode) {
  if (!valuesNode) {
   return []
  }
  const dataValues = valuesNode.textContent.trim()
  if (dataValues) {
   // If actual data values are present, parse and return them
   return dataValues.split(/\s+/).map(parseFloat)
  }
  const start = this.parseAttributeValue(valuesNode, "start")
  const end = this.parseAttributeValue(valuesNode, "end")
  var resolution = this.parseAttributeValue(valuesNode, "resolution")
  if (!resolution)
   resolution = 1
  const increment = this.parseAttributeValue(valuesNode, "increment")
  const npts = parseInt(valuesNode.getAttribute("npts"))
  if (!isNaN(start) && !isNaN(end) && !isNaN(resolution) && !isNaN(npts)) {
   // Generate values based on start, end, resolution, and npts
   const values = []
   for (let i = 0; i < npts; i++) {
     values.push(start + i * resolution)
   }
   return values
  } else if (!isNaN(start) && !isNaN(increment) && !isNaN(npts)) {
   // Generate values based on start, increment, and npts
   const values = []
   for (let i = 0; i < npts; i++) {
    values.push(start + i * increment)
   }
   return values
  } else {
   //console.error("Invalid or unsupported attributes for generating values.")
   return []
  }
 }

}
