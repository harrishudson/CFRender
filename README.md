# CFRender - A NetCDF CF Grid Rendering Toolkit. 
A toolkit to enable browser based processing of NetCDF (v3.0) files in CF (Climate Forecasting) convention with a basic 2D grid renderer.  Can be used to generate imagery stand-alone or with 2D mapping tools.  Designed with no external dependencies and intended to be run in the browser.

![Screenshot](https://harrishudson.com/github/CFRender_snapshot1.png)

## Demo
Basic Examples
[Basic Examples](https://harrishudson.com/CFRender/examples/)

Integrated Examples
[vistamanifest.com](https://vistamanifest.com/) 
[Related Repo](https://github.com/harrishudson/VistaManifest)


## Requirements
No external dependencies.  Simply requires a modern browser.  Designed to work with NetCDF version 3.0 files in Climate Forecasting (CF) convention.

## Basic Usage
```js
import { CFUtils, CFRender } from 'CFRender.js';
```

## Reference

### Constructor Example
```js
 // General invocation example;
 let CF = new CFRender(src, extentCache, projectionCache, longitudeWrap);

 // Empty invocation example;
 let CF1 = new CFRender();
```

|Factory|Description|
|--|--|
|CFRender(src, extentCache, projectionCache, longitudeWrap)|Instantiates an object based on a NetCDF (v3.0) (in CF convention) file passed as an ArrayBuffer as the **src** parameter.  Performs initial validation and bounds determination if possible.  Returns an object that can be used for grid rendering.|
|CFRender()|Instantiates an object based on an empty constructor.  This method is primarily provided to be used when explicitly setting a **data2DGrid** that can be used for querying a previously constructed grid for cell values.  This is provided as a method to not have to process an entire NetCDF file if a data2DGrid has been constructed via a prior invocation.|

|Parameter|DataType|Parameter Type|Description|
|--|--|--|--|
|src|ArrayBuffer|Required|Mandatory parameter.  'src' should be an ArrayBuffer representation of a NetCDF version 3.0 file, in CF convention, to be processed.  May be loaded in the browser as an Ajax request or as a local file.  This needs to be a **ArrayBuffer** representation of the binary NetCDF file.|
|extentCache|Array|Optional|Optional parameter to pass in a previously saved cache of the spatial extent of the NetCDF file.  Refer to the Advanced Caching section below.|
|projectionCache|Object|Optional|Optional parameter to pass in a previously saved cache of the projected latitudes and longitudes within the NetCDF file.  Refer to the Advanced Caching section below.|
|longitudeWrap|Boolean|Optional|Optional parameter to pass in.  If set to 'true' then the X ordinates of the NetCDF file will be treated as Longitudes (almost always the case) and these longitude values will be normalised into the range 0 - 360.  Further, when rendering grids, cells that span more than 180 degrees longitude will be omitted from renderings.  This parameter is provided to; help work with datasets that may vary the longitude values dependent upon the query window and also to help mitigate against possible graphical artifacts occurring when rendering geodesic real world data on a 2d plane.  If you are consuming data from a THREDDS TDS server, then you should also consider to set longitudeWrap along with the THREDDS dataset processing (see below).|

## Basic Invocation Example
````js
 var CF = new CFRender(src)
````

### Creating a Grid Image (Constructor)
|Factory|Description|
|--|--|
|draw2DbasicGrid(DataVariable, DimensionFilter, XYprojectionFunction, ImageType, ImageStyle)|Returns a promise that resolves to an image.  Renders a basic grid image from the current CFRender object.  As a side effect, this will populate a member object called data2DGrid that can later be used for querying cell values.|

|Parameter|Datatype|Description|
|--|--|--|
|DataVariable|String|A data variable within the NetCDF that is made up of X and Y dimensions and possibly other dimensions.  This variable is the basis of the grid rendering|
|DimensionFilter|Object|A set of name/value pairs to act as the other dimension filters.  Note that only a single image will be generated, so all other dimensions must be specified to enable a single grid image to be generated.  If some dimensions are unbound, or set to a non-existent value, a validation error will occur.|
|XYprojectionFunction|Function|If null, then the rendered image will be unprojected and simply in the X,Y ordinate values.  Passing in a projection function will allow reprojection of X,Y ordinates to a possible map projection.  Note that the projection function must be written to expect an array of 2 values which will be the X ordinate and the Y ordinate unprojected.  The XYprojectionFunction should then return an array of 2 values of the X,Y in projected space.  Note, that common mapping libraries may provide projection functions written slightly differently (expecting different format of parameters and output), so it may be necessary to write a simple wrapper to a provided mapping projection function to work correctly here as expected.|
|ImageType|String|Either; 'svg','canvas','image','url'.  Depicts the type of object to be returned by the rendering function.  'svg' will return a scalable svg element of the rendering, 'canvas' will return a canvas element of the rendering, 'image' will return a scalable img element, and 'url' will return only the image src as dataURL.  Default: 'image'.  Note, when using in a web worker, the only ImageType that can be used is 'url' as the other ImageType's will interact with DOM elements.  See below for further details.|
|ImageStyle|Object|An optional object that can specify specific rendering style that may or may not be pertinent to the ImageType.  See ImageStyle next.|

#### ImageStyle
|Property|Datatype|Description|
|--|--|--|
|canvasContext|String|Applicable when a canvas is used for image generation.  Ie, where the ImageType is not 'svg'.  Internally, this value will be passed to the 'canvas.getContext' constructor specifying the context to be used.  Currently, this is limited to one of these 3 values; either; **'2d'**, **'webgl'** or **'experimental-webgl'**.  The default is '2d'.|
|stroke|String or Function|Depicts the stroke color when rendering a cell.  If no stroke is required, omit this property.  Default: "none".  If a string value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate stroke value. Note that 'stroke' styling is not currently supported when using 'webgl' or 'experimental-webg' as the canvasContext.  That is, if you wish to use stroke styling, switch the canvasContext to '2d' or use 'svg' as the ImageType.|
|strokeWidth|Number or Function|Depicts the width of the cell stroke (perimeter) to be rendered in pixel dimensions.  Default: 0.  If a numeric value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate strokeWidth value. Not currently supported for 'webgl' or 'experimental-webgl'.|
|fill|String or Function|Depicts the fill color when rendering a cell.  If no fill is required, then set this to "none". Default: "#000000" (black).  If a string value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate fill value.  Please note, when using 'webgl' or 'experimental-webgl', this color must be a hex triplet, whereas when using a canvasContext of '2d' or ImageType of 'svg', this color value may be any valid HTML color string.|
|opacity|Number or Function|Depicts the opacity value when rendering a cell.  If not passed, the default value is 1.  If a numeric value is passed, that value will be used.  If a function is passed, then the function will be passed the 'cellData' and the function should return an appropriate opacity value.|
|omit|Boolean or Function|Evaluated as a boolean expression.  If evaluates to 'true', then the particular cell will be omitted from the rendering.  Can be either a boolean value or a function.  Omitting certain cells may improve the visual presentation in general and may also significantly improve image generation times (as when a cell is omitted, no further processing is performed in relation to rendering that particular cell).  Default: false.|
|idealCellSize|Number|Only applicable when ImageType is; 'canvas', 'image' or 'url'.  Will be the ideal cell width in pixel space (eg, pixel width or height).  May be overridden if it is determined that the internal image is too large to render within the browser.  Set this to higher values for higher image resolution.  Set to lower values for better performance and lower image resolution.  Default: 4.  That means, a given cell will attempted to be rendered in a 4x4 pixel cell.  For large grids, consider setting as low as 2. However, very low values may introduce artifacts into the image.  Generally not necessary to change this value as the default value of 4 provides a good compromise between image quality and speed of image generation.|
|imageFormat|String|Only applicable when ImageType is; 'canvas', 'image' or 'url'.  This will be used as the rendered image mime type.  Eg; 'image/png', 'image/gif' or 'image/webp', etc.  This is optional - if not specified, will use the browser default image rendering image type.|
|imageQuality|Number|A value between 0 and 1.  If a lossy 'imageFormat' has been specified then this may be used as lossy encoder quality option.  Smaller values will result in smaller overlays but at the expense of rendering quality. |
|meridianSkip|Number|If this value is passed, when rendering cells that cross over this meridian value (longitudes), such cells will be omitted from the renderings.  This is provided to be able to mitigate against potential graphical artifacts when rendering geodesic data on a 2d plane.  For example, passing in a meridianSkip of 180 might be needed when rendering data that spans the whole globe on a Mollweide zero centered projection as such cells might be rendered on the back plane and otherwise cause artifacts.  See below for an additional discussion.|
|eventListeners|Array of eventListener|Only applicable when ImageType is 'svg'. Allows interactive event listeners to be added to the rendered cell.|

#### eventListener (array)
|Array Offset|Datatype|Description|
|--|--|--|
|0|String|The event to be listened for.  Eg, 'click','mouseover', etc.|
|1|Function|A function to be passed to the event listener.|
|2|Object|Optional data to be passed to the event listener.|

#### Creating a Grid Image (Example 1)
```js
let img = await CF.draw2DbasicGrid('tos', 
                                   {"time": 1234}, 
                                   SphericalProjection,  
                                   'url',
                                   {"fill": tos_fillStyle,
                                    "stroke": "none",
                                    "strokeWidth": 0,
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
 let svgElem = await CF.draw2DbasicGrid('tos', 
                                        {"time": 1234}, 
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
- The 'time' dimension of the 'tos' data variable has been bound to value; '1234'.
- 'SphericalProjection' is a provided XY projection function
- The image will be returned as an SVG element ('svg')
- 'tos_fillStyle' is a provided fill function
- 'show_data' and 'clear_data' are defined functions to handle cell user events

#### Projection Function Example
When using projection functions, the functions should be written to accept an array of 2 ordinates (x,y) and return an array of 2 ordinates in projected space (px, py).  Eg;
```js
function myProj(coords) {
 let x = coords[0];
 let y = corrds[1];
 ... Do some projection returning px and py
 return [px, py];
};
```

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
Returns a 'cleansed' array of the netCDF data variable named 'name'.  Here cleansed means that the array will be flattened and *'_FillValue'* or *'missing_value'* data values will be replaced with null.  Any required unpacking of the data will also be performed.

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

#### getCellValue(DataVariable, DimensionFilter, X, Y, Omit)
Will lookup a cell value for a given X and Y dimension.  Here, normally X would map to Longitude and Y would map to Latitude.  The data variable name will need to be passed in and if there are any unbound dimensions - then a DimensionFilter must also be provided.  The 'Omit' parameter accepts a function that will be passed cell values and expected to return a boolean.  Omit function invocations returning 'true' will omit those particular cells.  This is provided because the cell ordinates are searched in possible projected space - and in projected space there is no certainty that cell polygons are contiguous - they could be disjoint and certain values may need to be omitted.  The getCellValue function requires a **data2DGrid** to be available for internal querying.  Such grids are constructed as a side effect of invoking **draw2DbasicGrid** (although a datagrid can be manually imported into an empty CFRender object - see below).  This function may be useful for doing value lookups from say a map click for example.

#### generateCaches(XYprojectionFunction)
Refer to the Advanced section for details relating to caching.  This function generally does not need to be used except possibly in the context if you were to use web-workers to parallelise image rendering.  This function will generate both an extentCache and a projectionCache from the given XYBounds for dimensions that have been ascertained to represent map dimensions (ie, Lon and Lat).  This can be done to pregenerate caches when renderings of related grids may subsequently be done.


### Web Workers
Using CFRender to draw grid images in web workers is now supported and is a great way to offload image generation processing from the main UI thread.  However, there are some restrictions that you will need to be aware of.  Firstly, the only imageType available for transferring imagery back from a web worker is; *'url'*.  The other imageTypes such as; 'canvas', 'image' or 'svg' need to interact with the DOM to create such HTML elements and, as such, are not suited for use within a web worker context.  Another restriction relates to the potential transferring of related **data2dGrid** data grids, that are associated with imagery, to query the cell information between the main UI thread and web workers.  Because functions are not serializable, data2DGrids have to be slightly modified to be able to be transferred.  See, the member function; **getTransferableData2DGrid** method that can be used.  It simply removes the 'XYprojectionFunction' component of the data grid so it can be transferred from a web worker.  You will need to explicitly reassign the XYprojectionFunction (if being used) in the main UI thread prior to querying the data grid for cell information.

### Data Grids
Because CFRender now supports NetCDF both unprojected and projected, it now populates a member object called **data2DGrid** as a side effect of invoking **draw2DbasicGrid**.  This data grid is essentially a 2d array in projected space that can be queried when using the **getCellValue** method.  Such a grid must exist in order to call 'getCellValue'.  Again, this grid is automatically populated as a side effect of invoking 'draw2DbasicGrid'.  The grid can be manually set using the 'setDataGrid' and even fetched using 'get2dataGrid' methods.  Because data grids may potentially contain projection functions as one of their elements, there are some restrictions in transferring data grids from web workers.

If you use CFRender in your main UI thread, there is generally no need to re-import a data2DGrid back in for cell value querying.  Consider the following 2 examples;

Example 1 - drawing a grid and later querying the grid with getCellValue in the main UI thread
```js
let CFR = new CFRender(src)
let img = await CFR.draw2DbasicGrid(variable,
                                    null,
                                    SphericalProjection,
                                    'url',
                                    {"fill": fillCell,
                                     "opacity": opacityCell,
                                     "omit": omitCell,
                                     "stroke": "none",
                                     "strokeWidth" 0
                                     })
let v = CFR.getCellValue(variable, null, lng, lat)
```

Example 2 - drawing a grid in one thread, exporting the data grid and querying the data grid in another thread
```js
// Thread 1 (lets assume its a web worker)
let CFR1 = new CFRender(src)
let img = await CFR1.draw2DbasicGrid(variable,
                                     DimensionFilter,
                                     SphericalProjection,
                                     'url',
                                     {"fill": fillCell,
                                      "opacity": opacityCell,
                                      "omit": omitCell,
                                      "stroke": "none",
                                      "strokeWidth" 0
                                      })
let grid = CFR1.getTransferableData2DGrid()

// Thread 2 - querying a previously constructed data grid
grid["XYprojectionFunction"] = SphericalProjection  // Functions not serializable from web workers
let CFR2 = new CFRender()
CFR2.setdata2DGrid(grid)
let v = CFR2.getCellValue(variable, DimensionFilter, evt.latlng.lng, evt.latlng.lat, null)
// Note that in the CFR2 instance of CFRender - we only import the grid and do not reread the entire NetCDF
```

Where 'SphericalProjection' is a an XYprojectionFunction.

### Noteworthy properties of CFRender

#### Get access to the NetCDF object
```js
var netCDF = CF.netCDF
```
Note, this netCDF object is slightly modified due to a naming conflict with the "header" element and has been named "headers" instead of "header".  For further information on the NetCDF object, refer to NetCDFjs reference (which has been embedded into this library);  [https://github.com/cheminfo/netcdfjs](https://github.com/cheminfo/netcdfjs)

#### Setting Axes manually if "Axis" attributes have not been specified for X and Y dimensions
If your NetCDF is in Climate Forecasting (CF) convention, then generally all the Axes should be
automatically determined.  However, should an Axes not automatically be determined - they can be
manually assigned;

```js
CF.Axes['X'] = 'longitude'
CF.Axes['Y'] = 'latitude'
```
Where 'longitude' and 'latitude' are X and Y dimensions ordinate variables respectively.  Setting Axes manually is only necessary if this has not been defined in variable attributes 'Axis'.

## CFUtils

Another class called 'CFUtils' is included in the CFRender.js.  CFUtils contains some member functions that may assist in data dependent cell styling.

### Members

|Function|Description|
|--|--|
|linearHexColor(value, minValue, maxValue, minHexColor, maxHexColor)|For a given *value* that is between *minValue* and *maxValue*, a proportionally produced HTML hex color will be returned that is between *minHexColor* and *maxHexColor*.  Here, *value*, *minValue* and *maxValue* are numeric, and *minHexColor* and *maxHexColor* are HTML hex color codes.|
|linearOpacity(value, minValue, maxValue, minOpacity, maxOpacity)|Similar to linearHexColor, this function accepts a *value*, *minValue* and *maxValue* and will return a proportional numeric value that is between *minOpacity* and *maxOpacity*.  All parameters are numeric and default value of *minOpacity* is 0 and default value of *maxOpacity* is 1.|
|steppedHexColor(value, colorStops)|For a given *value*  will return an interpolated hex color that falls within the provided *colorStops*.  colorStops is an array of objects with 'value' and 'color' properties.  Where value will be the stop value and color must be a hex color value.  Example of a colorStops; [{"value": 0, "color": "#FF0000"},{"value": 10, "color": "#00FF00"},{"value": 30: "color": "#0000FF"}].|
|steppedOpacity(value, opacityStops)|For a given *value*  will return an interpolated opacity value between 0 and 1 that falls within the provided *opacityStops*.  opacityStops is an array of objects with 'value' and 'opacity' properties.  Where value will be the stop value and opacity must be a numeric value.  Example of a opacityStops; [{"value": 0, "opacity": 0.1},{"value": 10, "opacity": 0.2},{"value": 30: "opacity": 0.5}].|
|getTimeISOString(value, units)|A support function for dealing with NetCDF time "units".  *Value* should be a time dimension variable value and *units* should be the NetCDF time 'units' attribute.  This function will attempt to resolve the time value and units accordingly to convert to an actual legible (readable) time value for possible display purposes.  As there are some heuristics involved, should the conversion fail for any reason, then the original *value* will simply be returned.|

## THREDDS_utils.js
Another script is included in this bundle called *THREDDS_utils.js*.  This script contains a set of utilities to facilitate interacting with possible THREDDS TDS server responses.  To use the assorted functions, it will first be necessary to transform the appropriate THREDDS server response into an XML document (eg, see DOM.parser) and then use the embedded functions.  The embedded functions are designed to make it easier to work with THREDDS server responses in native javascirpt objects instead of XML.  The embedded functions facilitate processing of THREDDS TDS *Catalog*  (catalog.xml) and *Subsetting*  (dataset.xml) responses to perform appropriate pre-processing.  This may be useful, if your content is served via a THREDDS TDS server and you need to analyse/process such responses.  If your NetCDF files are just served via a normal HTTP server or are local files - then the included THREDDS_utils.js will not be necessary in your case.

### THREDDS_utils.js Basic Usage
```js
import { TDSCatalogParser, TDSMetadataParser } from 'THREDDS_utils.js';
```

### Constructor Example
```js
 let meta1 = new TDSCatalogParser(src);

 let meta2 = new TDSMetadataParser(src, longitudeWrap);
```

|Factory|Description|
|--|--|
|TDSCatalogParser(src)|Instantiates an object based on a THREDDS TDS 'catalog.xml' parsed XML src object.  Will provide member objects and functions to assist in programatically querying this metadata.|
|TDSMetadataParse(src, longitudeWrap)|Instantiates an object based on THREDDS TDS NetCDF subsetting 'dataset.xml' parsed XML src object.  Will provide member objects and functions to assist in programatically querying this metadata.  The **longitudeWrap** is an optional boolean parameter.  If passed as 'true', then any bounding box queries of this metadata will have longitude values normalised to the range of 0 - 360.  The longitudeWrap parameter is provided to mitigate against graphical artificats when rendering imagery.  You should use longitudeWrap in a consistent way between CFRender and THREDDS_utils if you are dealing with THREDDS server responses.|

## Advanced Topics

### Handling NetCDF version 3.0

The CFRender.js javascript script is a self contained script with no external dependencies.  Embedded within this script is the NetCDF parser from Cheminfo (referenced above) that enables consumption of NetCDF files in the browser.  Unfortunately, this parser can only handle NetCDF files version 3.0 at the time of publishing this app.  That means, to effectively use this renderer, you may need to downgrade your input NetCDF files to version 3.0 if you are using later versions.  

If you are using the Python module NetCDF4 to generate your NetCDF output files, this may be 
possible by specifying the **NETCDF3_CLASSIC** as a file format directive.  Eg;

```
import netCDF4 as nc

# Create a new NetCDF file
nc_file = nc.Dataset('output.nc', 'w', format='NETCDF3_CLASSIC')
```

If you are using the THREDDS Data Server (TDS) NetCDF subset service (NCSS) to deliver your NetCDF data, you may be able to append **&accept=netcdf&format=netcdf3** to a subsetting URL request string to request NetCDF files in version 3.  For example;

```
 https://<Thredds subsetting service>?var=<Variable>&accept=netcdf&format=netcdf3
```

### Caching

Often NetCDF CF data files may contain an identical coordinate referencing system.  Ie, the latitudes and longitudes of separate but related NetCDF files may be congruent or identical.  The CFRender **draw2DbasicGrid** function will cache and reuse coordinate systems if invoked for separate time slice requests for example.  However, this cache set can also be passed between separate invocations of the the CFRender utility if you are dealing with multiple NetCDF files that have identical coordinate grids.  Utilising caching may result in significant performance improvements of subsequent rendering of NetCDF files that have an identical coordinate system.

In essence, you might want to look in coordinate caching if the following apply to your situation;

- You have multiple NetCDF files that have an identical lat/long coordinate grid
- You will be rendering these multiple files within a web page or application
- You are using a coordinate **XYprojectionFunction** projection function to translate the NetCDF lat/long data to a web mapping visualisation

By passing a cache between multiple instances of CFRender, in these above circumstances, you may save on CPU overhead incurred as both part of determining the spatial extent and also reprojecting coordinates - as these will simply be fetched from the cache instead of recomputing.  To use coordinate caching between 2 separate invocations of CFRender for 2 coordinate congruent data files, consider the following example.  The caching components that need to be passed are; **extentCache** (a cache of the NetCDF spatial extent) and **projectionCache** (a cache of the entire coordinate system with the projection function applied).

In the following example, suppose we have 2 arrayBuffers (**arrayBuffer1** and **arrayBuffer2**) representing 2 separate (but related) NetCDF files that have been loaded in the browser.  The respective caches will be populated as a side effect of running the **draw2DbasicGrid** function and, as such, can be passed as follows between the 2 separate renderings.  Where the latter rendering may benefit significantly in reduced rendering times (as it will not recalculate the spatial extent nor reproject the lat/longs);

```
var projectionCache = null;
var extentCache = null;

// Image 1
var CFR1 = new CFRender(arrayBuffer1)
let img1 = CFR1.draw2DbasicGrid(.....)

// Save the projected coordinate caches to local variables from Image 1
extentCache = CFR1.extentCache
projectionCache = CFR1.projectionCache  // or;  projectionCache = CFR1.getProjectionCache()

// Image 2
var CFR2 = new CFRender(arrayBuffer2, extentCache, projectionCache)
let img2 = CFR2.draw2DbasicGrid(.....)
```

### Mitigation against Graphical Artifacts

CFRender core component is to render a NetCDF grid as a 2d planar image.  When dealing with geodesic input data that spans real world coordinates, there may be graphical artifacts in imagery particularly where cell values cross longitude meridians if the imagery is in a planar projection.  Such meridians are possibly likely to occur at; 0, 180 or 360 degrees longitude.  By making use of either, or both, of the abovementioned *longitudeWrap* and *meridianSkip* paramters in respective components - it should generally be possible to remove such artifacts from imagery even when dealing with THREDDS server responses that may not produce consistent (wrapped) bounding boxes when imagery is being clipped in the viewport.  Some experimentation may be required but it should be possible to work out how to remove artifacts when rendering geodesic full globe data on a 2d plane.

### Acknowledgement

The author of CFRender acknowledges the great work behind the **NetCDFjs** library that has been incorporated into this CFRender toolkit.  The embedded NetCDFjs library performs the heavy lifting of actually reading the passed NetCDF data.  More information about the NetCDFjs library can be found here;

[https://github.com/cheminfo/netcdfjs](https://github.com/cheminfo/netcdfjs)


### Attention Publishers of Open Datasets (Re: CORS http headers)

If you are a custodian or publisher of an open data NetCDF resource - whether that be delivered via a HTTP server or a THREDDS TDS server, if your data set is truly an open dataset, then please consider adding CORS http headers to your http responses so that such resources can be consumed directly in browsers in third party contexts.  For this app (*CFRender*) to really function in an optimal way - and facilitate development of a truly open data application - it is really vital that publishers of such open datasets add the appropriate CORS headers to their datasets when delivering over https protocol.  At the time of going live with this code base - it was noted anecdotally that most public facing THREDDS TDS servers that are delivering open NetCDF data do not actually appear to have CORS enabled.  This is a real shame.  Please consider to add these vital CORS http headers whenever you are delivering open NetCDF datasets.  Thank you.

## Future work
Some future work currently under consideration;
- Really need to cater for NetCDF files after version 3.0.
- Need a vector (wind) visualisation in addition to a simple 2D grid. 

## Author 
Harris Hudson

## Donate

[https://harrishudson.com/#sponsor](https://harrishudson.com/#sponsor)
