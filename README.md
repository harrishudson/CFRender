# CFRender - A NetCDF CF Grid Rendering Toolkit.  Proof-of-Concept
A toolkit to enable browser based processing of NetCDF (v3.0) files in CF (Climate Forecasting) convention with a basic 2D grid renderer.  Can be used to generate imagery stand-alone or with 2D mapping tools.  Designed with no external dependencies and intended to be run in the browser.

## Demo
[Examples](http://harrishudson.com/CFRender/examples/).

## Requirements
No external dependencies.  Simply requires a modern browser.


## Basic Usage
````js
  <script src="CFRender.js"></script>
````

## Reference

### Constructor Example
```js
 var CF = new CFRender(ArrayBuffer)
```

|Factory|Description|
|--|--|
|CFRender(ArrayBuffer)|Instantiates an object based on a NetCDF (v3.0) (in CF convention) file passed as an ArrayBuffer.  Performs initial validation and bounds determination if possible.  Returns an object that can be used for grid rendering|

### Noteworthy properties of CFRender

#### Get access to the NetCDF object
```js
var netCDF = CF.netCDF
```
Note, this netCDF object is slightly modified due to a naming conflict with the "header" element and has been named "headers" instead of "header".  For further information on the NetCDF object, refer to NetCDFjs reference (which has been embedded into this library);  [https://github.com/cheminfo/netcdfjs](https://github.com/cheminfo/netcdfjs)

#### Setting Axes manually if "Axis" attributes have not been specified for X and Y dimensions
```js
CF.Axes['X'] = 'longitude'
CF.Axes['Y'] = 'latitude'
```
Where 'longitude' and 'latitude' are X and Y dimensions ordinate variables respectively.  Setting Axes manually is only necessary if this has not been defined in variable attributes 'Axis'.

### Creating a Grid Image (Constructor)
|Factory|Description|
|--|--|
|draw2DbasicGrid(DataVariable, DimensionFilter, XYprojectionFunction, ImageType, ImageStyle)|Renders a basic grid image from the current CFRender object|

|Parameter|Datatype|Description|
|--|--|--|
|DataVariable|String|A data variable within the NetCDF that is made up of X and Y dimensions and possibly other dimensions.  This variable is the basis of the grid rendering|
|DimensionFilter|Object|A set of name/value pairs to act as the other dimension filters.  Note that only a single image will be generated, so all other dimensions must be specified to enable a single grid image to be generated.  If some dimensions are unbound, or set to a non-existent value, a validation error will occur.|
|XYprojectionFunction|Function|If null, then the rendered image will be unprojected and simply in the X,Y ordinate values.  Passing in a projection function will allow reprojection of X,Y ordinates to a possible map projection.  Note that the projection function must be written to expect an array of 2 values which will be the X ordinate and the Y ordinate unprojected.  The XYprojectionFunction should then return an array of 2 values of the X,Y in projected space.  Note, that common mapping libraries may provide projection functions written slightly differently (expecting different format of parameters and output), so it may be necessary to write a simple wrapper to a provided mapping projection function to work correctly here as expected.|
|ImageType|String|Either; 'svg','canvas','image','url'.  Depicts the type of object to be returned by the rendering function.  'svg' will return a scalable svg element of the rendering, 'canvas' will return a canvas element of the rendering, 'image' will return a scalable img element, and 'url' will return only the image src as dataURL.  Default: 'image'.|
|ImageStyle|Object|An optional object that can specify specific rendering style that may or may not be pertinent to the ImageType.  See ImageStyle next.|

#### ImageStyle
|Property|Datatype|Description|
|--|--|--|
|stroke|String or Function|Depicts the stroke color when rendering a cell.  If no stroke is required, omit this property.  Default: "none".  If a string value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate stroke value.|
|strokeWidth|Number or Function|Depicts the width of the cell stroke (perimeter) to be rendered in pixel dimensions.  Default: 0.  If a numeric value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate strokeWidth value.|
|fill|String or Function|Depicts the fill color when rendering a cell.  If no fill is required, then set this to "none". Default: "black".  If a string value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate fill value.|
|opacity|Number or Function|Depicts the opacity value when rendering a cell.  If not passed, the default value is 1.  If a numeric value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate opacity value.|
|idealCellSize|Number|Only applicable when ImageType is; 'canvas', 'image' or 'url'.  Will be the ideal cell width in pixel space (eg, pixel width or height).  May be overidden if it is determined that the internal image is too large to render within the browser.  Set this to higher values for higher image resolution.  Set to lower values for better performance and lower image resolution.  Default: 25.  For large grids, consider setting as low as 2. However, very low values may introduce artefacts into the image.|
|imageFormat|String|Only applicable when ImageType is; 'canvas', 'image' or 'url'.  This will be used as the rendered image mime type.  Eg; 'image/png' or 'image/gif', etc.  This is optional - if not specified, will use the browser default image rendering image type.|
|imageQuality|Number|A value between 0 and 1.  If a lossy 'imageFormat' has been specified then this may be used as lossy encoder quality option.  Smaller values will result in smaller overlays but at the expense of rendering quality. |
|eventListeners|Array of eventListener|Only applicable when ImageType is 'svg'. Allows interactive event listeners to be added to the rendered cell.|

#### eventListener (array)
|Array Offset|Datatype|Description|
|--|--|--|
|0|String|The event to be listened for.  Eg, 'click','mouseover', etc.|
|1|Function|A function to be passed to the event listener.|
|2|Object|Optional data to be passed to the event listener.|

#### Creating a Grid Image (Example 1)
```js
let img = CF.draw2DbasicGrid('tos', 
	                         {"time": '1234'}, 
	                         SphericalProjection,  
	                         'url',
	                         {"fill": tos_fillStyle,
                              "stroke": "none",
                              "strokeWidth": 0,
	                           "idealCellSize": 2,
	                           "imageFormat": "image/gif",
	                           "imageQuality": 0.5
	                         })

```

Where;
- 'tos' is the data variable in the NetCDF
- The 'time' dimension of the 'tos' data variable has been bound to value; '1234'.
- 'SphericalProjection' is a provided XY projection function
- The image will be returned as a DataURL ('url')
- 'tos_fillStyle' is a provided fill function

#### Creating a Grid Image (Example 2)
```js
 let svgElem = CF.draw2DbasicGrid('tos', 
	                              {"time": '1234'}, 
	                              SphericalProjection, 
	                              'svg',
	                              {"fill": tos_fillStyle,
                                   "stroke": "none",
				                   "strokeWidth": 0,
	                               "eventListeners": [
	                                 ['mouseover',show_data,null],
	                                 ['click',show_data,null],
	                                 ['mouseout',clear_data,null]
	                                ]
	                              })
```	                        
Where;
- 'tos' is the data variable in the NetCDF
- The 'time' dimenson of the 'tos' data variable has been bound to value; '1234'.
- 'SphericalProjection' is a provided XY projection function
- The image will be returned as an SVG element ('svg')
- 'tos_fillStyle' is a provided fill function
- 'show_data' and 'clear_data' are defined functions to handle cell user events

#### cellData
For ImageStyle properties that support the use of a function, when invoked, the function will be passed a 'cellData' object.  This object is made up of as follows;

|Property|Datatype|Description|
|--|--|--|
|dimensions|Object|An object of name/value pairs all the data variable dimensions that make up this cell.|
|value||The cell data value|

#### SVG dataset attributes
If the ImageType is set to 'svg', the paths within the generated svg element will have data attributes added.  These attributes may be useful when adding eventListeners. These are added as follows;

|HTML data attribute name|Meaning/Use|
|--|--|
|*data-dimension_\<Variable Name\>*| Where "Variable Name" is the name of the NetCDF data variable.|
|*data-value*|The value of the cell (path)|


### Other supporting member functions of CFRender class

#### DimsIndexOfName(name)
Internal function.

#### getCleansedDataVariable(name)
Returns a 'cleansed' array of the netCDF data variable named 'name'.  Here cleansed means that the array will be flattened and *'_FillValue'* or *'missing_value'* data values will be replaced with null.

#### getNumDataVariableStats(name)
Returns an object with a collection of statistics for the numeric netCDF data variable named 'name'.  Gathering variable statistics may be problematic for extremely large datasets - and may crash the browser in those cases.  However, statistics may be useful to assist with composing value dependent rendering functions.  The statistics returned are as follows;

|Name|Meaning|
|--|--|
|min|Minimum Value|
|max|Maximum Value|
|sum|The total of all Values|
|mean|Average Value|
|median|Median Value|
|nullCount|The total number of null values|
|count|The total number of values|

#### searchBounds(Axis)
Internal function.

#### searchVariablesForAxis(Axis)
Internal function.

#### getXYBBox()
Examines X,Y Axis data of the netCDF and returns an object as follows;

|Property|Description
|--|--|
|bbox|The extent of the X,Y Axis as a bounding box in X,Y unprojected space|
|mode|If the netCDF contained "bounds" as defined by the CF convention, for the given X,Y data variables then the bbox will be ascertained from these bounds and the returned mode will be *'definitive'*.  If the netCDF did not come with any bounds information for the X and Y Axis, then the bounding box (bbox) will be constructed by interpolating midpoints between subsequent X and Y values.  In this case "mode" will be *'interpolated'*.|

Also refer to the abovementioned 'Axes' property that may need to be manually set if the netCDF is missing 'Axis' X and Y attribute information.


## CFUtils

Another class called 'CFUtils' is included in the CFRender.js.  CFUtils contains some member functions that may assist in data dependent cell styling.

### Members

|Function|Description|
|--|--|
|linearHexColor(value, minValue, maxValue, minHexColor, maxHexColor)|For a given *value* that is between *minValue* and *maxValue*, a proportionally produced HTML hex color will be returned that is between *minHexColor* and *maxHexColor*.  Here, *value*, *minValue* and *maxValue* are numeric, and *minHexColor* and *maxHexColor* are HTML Hex color codes.|
|linearOpacity(value, minValue, maxValue, minOpacity, maxOpacity)|Similar to linearHexColor, this function accepts a *value*, *minValue* and *maxValue* and will return a proportional numeric value that is between *minOpacity* and *maxOpacity*.  All parameters are numeric and default value of *minOpacity* is 0 and default value of *maxOpacity* is 1.|

## Future work
This is a simple Proof-of-Concept and is not quite production ready.  In order to make this production ready, the following would need to be looked into;
- Add ability to limit 'NetCDFjs.getDataVariable()' by a given grid *offset* and *gridsize*.  Ie, to be able to limit returned data by a given dimension filter.  Currently, all records are returned by 'getDataVariable()' and then this is filtered based on other dimensions.  This is not really scalable for very large datasets and may crash the browser.
- Need more complex visualisations than just a simple 2D grid.  Eg,
complex visualisaitons that are zoom dependent. Eg, for wind and text labels, etc. Requires more work.




## Author 
Harris Hudson
