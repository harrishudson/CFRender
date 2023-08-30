/**
 * THREDDS_utils.js 
 *
 * Universal helper functions to parse artefacts from THREDDS TDS servers
 * Eg, process "catalog.xml" and subset server "metadata.xml" XML responses from THREDDS TDS servers.
 * 
 * This script has no external dependencies and is browser ready
 * 
 * Author: Copyright (c) 2023 Harris Hudson  harris@harrishudson.com 
 **/

class TDSCatalogParser {
 constructor(src) {
  this.xmlCatalog = src
  this.catalog_subpath = '/thredds/catalog/'
  this.catalog_dataset_refs = this.getCatalogRefList()
  this.catalog_dataset_datasets = this.getCatalogDatasetList()
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

class TDSMetadataParser {
 constructor(src) {
  this.xmlDataset = src
  this.LatLonBox = this.getLatLonBox()
  this.LonStride = Math.abs(this.LatLonBox.west - this.LatLonBox.east)
  // HorizStrideScaleFactor - An arbitrary constant.
  // Minimum of 4 pixels per cell for 'getHorizStride'
  // Default setting; 4 is suitable for fullscreen maps
  // Change (reduce) if required for non-fullscreen maps
  this.HorizStrideScaleFactor = 4
  this.Axes = this.getAxes()
 }

 getLatLonBox() {
  // TODO cater for Lon covering date meridian
  let LatLonBox = this.xmlDataset.querySelector('gridDataset > LatLonBox')
  let east = LatLonBox.querySelector('east')
  let west = LatLonBox.querySelector('west')
  let north = LatLonBox.querySelector('north')
  let south = LatLonBox.querySelector('south')
  return {"east": east.textContent, "west": west.textContent, 
         "north": north.textContent, "south": south.textContent}
 }

 getAxes() {
  let theseAxes = {}
  let Axes = this.xmlDataset.querySelectorAll('gridDataset > axis')
  if (Axes) {
   for (let i=0; i<Axes.length; i++) {
    var name = null, axisType = null, units = null, values = null, CoordRef = null, axisType = 'Unbound';
    let axis = Axes[i];
    name = axis.getAttribute('name');
    axisType = axis.getAttribute('axisType');
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

 getHorizStride(MapLon1, MapLon2, MapWidthInPixels) {
  let GridLonCells = this.getAxisByType('Lon').values.length
  let CellsPerDegree = parseFloat(GridLonCells / this.LonStride)
  let MapLonStride = Math.abs(MapLon2 - MapLon1)
  let DesiredCellCount = MapWidthInPixels / this.HorizStrideScaleFactor
  let ViewPortCells = CellsPerDegree * MapLonStride
  let HorizStride = parseInt(Math.max(0, ViewPortCells / DesiredCellCount ))
  return HorizStride
 }

 getGridVariableList() {
  let gridSets = this.xmlDataset.querySelectorAll('gridDataset > gridSet')
  if (!gridSets)
   return null
  var ResultList = []
  for (let gs = 0; gs < gridSets.length; gs++) {
   let gridSet = gridSets[gs]
   let grids = gridSet.querySelectorAll("grid")
   if (!grids)
    continue
   for (let g = 0; g < grids.length; g++) {
    let grid = grids[g]
    let name = grid.getAttribute("name") 
    let desc = grid.getAttribute("desc") 
    ResultList.push({"name": name, "desc": desc})
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
  const resolution = this.parseAttributeValue(valuesNode, "resolution")
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
