import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{F as t,L as n,N as r,T as i,X as a,Z as o,_ as s,_t as c,at as l,b as u,f as d,g as f,ht as p,j as m,l as h,st as g,x as _,y as v,yt as y}from"./modules/shiki-CIbCI1ze.js";import{St as b,nt as x,rt as S}from"./index-Dh0rQGq4.js";import{t as C}from"./bonn-content-BaCDofZ1.js";import{t as w}from"./leaflet-C4wuUIIQ.js";import{t as T}from"./lib-DSgk6v-w.js";var E=e(w()),D={class:`raster-georef-task`},O={class:`task-columns`},k={class:`image-panel`},A=[`src`],j={class:`transform-panel`},ee={class:`matrix-equation`,"aria-label":`Editable affine transformation matrix`},te={class:`matrix-bracket`},M={class:`matrix-row`},N={class:`matrix-row`},P={class:`state-line`},F={class:`error-line`,role:`alert`},I={class:`map-panel`},L=`+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs`,R=47,z=46,B=`❯ gdalinfo Sentinel2_RGB_cloudfree_EPSG32632.tif
Driver: GTiff/GeoTIFF
Files: Sentinel2_RGB_cloudfree_EPSG32632.tif
Size is 47, 46
Coordinate System is:
PROJCRS["WGS 84 / UTM zone 32N",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["UTM zone 32N",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",9,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Navigation and medium accuracy spatial referencing."],
        AREA["Between 6°E and 12°E, northern hemisphere between equator and 84°N, onshore and offshore. Algeria. Austria. Cameroon. Denmark. Equatorial Guinea. France. Gabon. Germany. Italy. Libya. Liechtenstein. Monaco. Netherlands. Niger. Nigeria. Norway. Sao Tome and Principe. Svalbard. Sweden. Switzerland. Tunisia. Vatican City State."],
        BBOX[0,6,84,12]],
    ID["EPSG",32632]]
Data axis to CRS axis mapping: 1,2
Origin = (365110.000000000000000,5621210.000000000000000)
Pixel Size = (10.000000000000000,-10.000000000000000)
Metadata:
  AREA_OR_POINT=Area
Image Structure Metadata:
  LAYOUT=COG
  COMPRESSION=LZW
  INTERLEAVE=PIXEL
Corner Coordinates:
Upper Left  (  365110.000, 5621210.000) (  7d 5'19.61"E, 50d43'37.24"N)
Lower Left  (  365110.000, 5620750.000) (  7d 5'20.21"E, 50d43'22.35"N)
Upper Right (  365580.000, 5621210.000) (  7d 5'43.57"E, 50d43'37.63"N)
Lower Right (  365580.000, 5620750.000) (  7d 5'44.17"E, 50d43'22.74"N)
Center      (  365345.000, 5620980.000) (  7d 5'31.89"E, 50d43'29.99"N)
Band 1 Block=256x256 Type=UInt16, ColorInterp=Gray
  Description = red
Band 2 Block=256x256 Type=UInt16, ColorInterp=Undefined
  Description = green
Band 3 Block=256x256 Type=UInt16, ColorInterp=Undefined
  Description = blue`,V=b({__name:`RasterGeorefTaskDemo`,setup(e){let{$slidev:i,$nav:a,$clicksContext:s,$clicks:c,$page:_,$renderContext:b,$frontmatter:x}=S(),C=new URL(`/teaching/env320/assets/Sentinel2_RGB_cloudfree_EPSG32632-BwIDglOw.png`,``+import.meta.url).href;T.defs(`EPSG:32632`,L);let w=[`a`,`b`,`E0`,`d`,`e`,`N0`],V=l({a:``,b:``,E0:``,d:``,e:``,N0:``}),H=g(null),U=g(``),W=g(`Fill all six entries, then transform`),G=null,K=null,q=null,J=null,Y=!0,X=null,Z=null;function Q(e,t,n){return[n.a*e+n.b*t+n.E0,n.d*e+n.e*t+n.N0]}function $(e,t){let[n,r]=T(`EPSG:32632`,`EPSG:4326`,[e,t]);if(!Number.isFinite(n)||!Number.isFinite(r))throw Error(`The transform produced invalid geographic coordinates.`);if(n<-180||n>180||r<-85.05112878||r>85.05112878)throw Error(`The transformed image cannot be displayed on the map.`);return[r,n]}function ne(){let e={};for(let t of w){if(V[t]===``)throw Error(`Fill all six matrix entries.`);let n=Number(V[t]);if(!Number.isFinite(n))throw Error(`All matrix entries must be finite numbers.`);e[t]=n}let t=e.a*e.e-e.b*e.d;if(!Number.isFinite(t)||Math.abs(t)<1e-9)throw Error(`The affine matrix is singular.`);return e}function re(e){return[$(...Q(0,0,e)),$(...Q(R,0,e)),$(...Q(R,z,e)),$(...Q(0,z,e))]}function ie(){try{let e=re(ne()),t=E.default.latLngBounds(e);if(!t.isValid())throw Error(`The transformed image bounds are invalid.`);J?.remove(),K=E.default.imageOverlay(C,t,{opacity:.9,interactive:!1,className:`nearest-neighbor-raster`}),q=E.default.polygon(e,{color:`#f2c300`,weight:2,fill:!1,interactive:!1}),J=E.default.layerGroup([K,q]),Y&&J.addTo(G),X&&(X.disabled=!1),G.invalidateSize({pan:!1}),G.fitBounds(t,{padding:[18,18],maxZoom:18,animate:!1}),U.value=``,W.value=`Image transformed and placed on the map`}catch(e){U.value=e instanceof Error?e.message:`Could not transform the image.`,W.value=K?`Previous valid transform retained`:`No image placed yet`}}async function ae(){if(await m(),!H.value||G)return;G=E.default.map(H.value,{zoomControl:!0,attributionControl:!0}).setView([50.724998,7.092192],16),E.default.tileLayer(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`,{maxZoom:19,attribution:`© OpenStreetMap contributors`}).addTo(G);let e=E.default.control({position:`topright`});e.onAdd=()=>{let e=E.default.DomUtil.create(`div`,`leaflet-control raster-layer-control`);return e.innerHTML=`
      <label class="visibility-option">
        <input class="raster-visibility" type="checkbox" checked disabled>
        <span>Raster</span>
      </label>
    `,E.default.DomEvent.disableClickPropagation(e),E.default.DomEvent.disableScrollPropagation(e),X=e.querySelector(`.raster-visibility`),X.addEventListener(`change`,()=>{Y=X.checked,J&&(Y?J.addTo(G):J.remove())}),e},e.addTo(G),Z=new ResizeObserver(()=>G?.invalidateSize({pan:!1})),Z.observe(H.value)}return t(ae),r(()=>{Z?.disconnect(),G?.remove(),G=null}),(e,t)=>(n(),v(`div`,D,[f(`div`,O,[f(`section`,k,[f(`img`,{src:p(C),alt:`Sentinel-2 RGB image to georeference`},null,8,A)]),f(`section`,j,[t[15]||=f(`div`,{class:`crs-label`},`EPSG:32632 · WGS 84 / UTM zone 32N · metres`,-1),f(`form`,{novalidate:``,onSubmit:d(ie,[`prevent`,`stop`])},[f(`div`,ee,[t[13]||=f(`div`,{class:`matrix-name`},`A =`,-1),f(`div`,te,[f(`div`,M,[o(f(`input`,{"onUpdate:modelValue":t[0]||=e=>V.a=e,"aria-label":`Coefficient a`,type:`number`,step:`10`,onKeydown:t[1]||=d(()=>{},[`stop`])},null,544),[[h,V.a]]),o(f(`input`,{"onUpdate:modelValue":t[2]||=e=>V.b=e,"aria-label":`Coefficient b`,type:`number`,step:`10`,onKeydown:t[3]||=d(()=>{},[`stop`])},null,544),[[h,V.b]]),o(f(`input`,{"onUpdate:modelValue":t[4]||=e=>V.E0=e,"aria-label":`Easting origin E zero`,type:`number`,step:`100`,onKeydown:t[5]||=d(()=>{},[`stop`])},null,544),[[h,V.E0]])]),f(`div`,N,[o(f(`input`,{"onUpdate:modelValue":t[6]||=e=>V.d=e,"aria-label":`Coefficient d`,type:`number`,step:`10`,onKeydown:t[7]||=d(()=>{},[`stop`])},null,544),[[h,V.d]]),o(f(`input`,{"onUpdate:modelValue":t[8]||=e=>V.e=e,"aria-label":`Coefficient e`,type:`number`,step:`10`,onKeydown:t[9]||=d(()=>{},[`stop`])},null,544),[[h,V.e]]),o(f(`input`,{"onUpdate:modelValue":t[10]||=e=>V.N0=e,"aria-label":`Northing origin N zero`,type:`number`,step:`100`,onKeydown:t[11]||=d(()=>{},[`stop`])},null,544),[[h,V.N0]])]),t[12]||=f(`div`,{class:`matrix-row fixed-row`},[f(`span`,null,`0`),f(`span`,null,`0`),f(`span`,null,`1`)],-1)])]),t[14]||=f(`div`,{class:`controls`},[f(`button`,{type:`submit`},`Transform`)],-1)],32),f(`div`,P,y(W.value),1),f(`div`,F,y(U.value),1)]),f(`section`,I,[f(`div`,{ref_key:`mapElement`,ref:H,class:`map`,"aria-label":`Leaflet map for the georeferenced Sentinel-2 image`},null,512)])]),t[16]||=f(`div`,{class:`gdal-description`},[u(` The `),f(`a`,{href:`https://gdal.org/en/stable/programs/gdalinfo.html`,target:`_blank`,rel:`noopener noreferrer`},`gdalinfo`),u(` output below provides metadata for this georeferenced image. `)],-1),f(`textarea`,{class:`gdal-output`,value:B,readonly:``,spellcheck:`false`,"aria-label":`Scrollable gdalinfo output`})]))}},[[`__scopeId`,`data-v-f56260d8`]]),H={__name:`slides.md__slidev_48`,setup(e){let{$slidev:t,$nav:r,$clicksContext:o,$clicks:l,$page:u,$renderContext:d,$frontmatter:m}=S();return o.setup(),(e,t)=>{let r=V;return n(),s(C,c(i(p(x)(p(m),47))),{default:a(()=>[t[0]||=f(`h1`,null,`Task: Georeference this Image`,-1),_(r)]),_:1},16)}}};export{H as default};