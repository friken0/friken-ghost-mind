export const reliefWaveModes=Object.freeze({center:0,rim:1,pulse:2,spiral:3});

// Shared tangent-space displacement and occlusion for ANSI++ material samplers.
export const reliefRaySource=`float envelope(vec2 uv){
 return min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
}
float heightAt(sampler2D field,sampler2D material,vec2 uv,float detail){
 return clamp(texture(field,uv).r+(texture(material,uv).r-.5)*detail,.018,.982);
}
// FriktalComputeStarDiverShade: tangent UV walk with a fixed reach,
// first signed depth crossing, then secant refinement. Center about the
// base surface plane so a front view still matches the painting.
float reliefHeight(sampler2D field,sampler2D material,vec2 uv,vec4 tile,float detail,float macro){
 vec2 atlasUv=tile.xy+clamp(uv,0.,1.)*tile.zw;
 return clamp(mix(.5,texture(field,uv).r,macro)+(texture(material,atlasUv).r-.5)*detail,.018,.982);
}
vec3 traceRelief(sampler2D field,sampler2D material,vec2 uv,vec2 ray,vec4 tile,float detail,float macro,int count){
 if(dot(ray,ray)<1e-9)return vec3(uv,1.-reliefHeight(field,material,uv,tile,detail,macro));
 vec2 start=uv-ray*.5;
 float last=-1.+reliefHeight(field,material,start,tile,detail,macro),prior=0.;
 for(int i=1;i<=12;i++){
  if(i>count)break;
  float t=float(i)/float(count);
  float d=t-1.+reliefHeight(field,material,start+ray*t,tile,detail,macro);
  if(d>=0.){
   float hit=mix(prior,t,clamp(-last/max(d-last,1e-5),0.,1.));
   return vec3(start+ray*hit,hit);
  }
  last=d;prior=t;
 }
 return vec3(start+ray,1.);
}
vec3 pom(sampler2D field,sampler2D material,vec2 uv,vec2 ray,float detail,int count){
 return traceRelief(field,material,uv,ray,vec4(0.,0.,1.,1.),detail,1.,count);
}
vec2 reliefOcclusion(float fine,float lip,float depth,float facing){
 float valley=1.-smoothstep(.24,.51,fine);
 float grazing=1.-smoothstep(.49,.86,facing);
 float shadowLip=smoothstep(.07,.25,lip-fine);
 float deep=smoothstep(.49,.79,depth)*(1.-smoothstep(.14,.35,fine));
 return vec2(valley*(.10+shadowLip*.14),valley*grazing*max(deep,shadowLip));
}
float regionRelief(vec2 d,vec4 r){
 float dist=length(d);
 float outer=1.-smoothstep(1.,2.25,dist);
 if(r.x<.5)return r.y*exp(-.62*dot(d,d))*(.78+.22*sin(r.w));
 if(r.x<1.5)return r.y*outer*smoothstep(.14,.82,dist);
 float theta=r.x>2.5?atan(d.y,d.x+.0001)*1.8:0.;
 return r.y*outer*(.30+.70*(.5+.5*cos(dist*r.z-r.w+theta)));
}
`;

// CPU equivalent of the station-room shader for retained ANSI source plates.
// The baked slope bound makes the signed search strictly increasing.
export function roomReliefCrossing(height,u,v,dx,dy){
 let low=0,high=1,a,b;
 const x=u-dx*.5,y=v-dy*.5;
 for(let i=0;i<7;i++){
  const middle=(low+high)*.5;
  const d=middle-1+height(x+dx*middle,y+dy*middle);
  if(d>=0){high=middle;b=d;}
  else{low=middle;a=d;}
 }
 a??=height(x,y)-1;
 b??=height(x+dx,y+dy);
 return low+(high-low)*Math.max(0,Math.min(1,-a/Math.max(1e-6,b-a)));
}

// Reproject the received ink itself. Only the small displacement texture
// changes when the view ray changes, so the serial grid keeps its resolution.
export function createRetainedRelief(doc){
 const canvas=doc.createElement('canvas');
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl)return null;
 const compile=(type,source)=>{
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
  return shader;
 };
 const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
 void main(){
  vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);
  gl_Position=vec4(p,0.,1.);
 }`);
 const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;
 uniform sampler2D ink,field;
 uniform vec2 size,grid,origin,span;
 out vec4 color;
 void main(){
  vec2 uv=vec2(gl_FragCoord.x,size.y-gl_FragCoord.y)/size;
  vec2 world=origin+uv*span;
  vec2 p=(clamp(world,0.,1.)*(grid-1.)+.5)/grid;
  vec4 packedOffset=texture(field,p);
  vec2 offset=vec2(dot(packedOffset.rg,vec2(256.,1.)),dot(packedOffset.ba,vec2(256.,1.)))/257.;
  offset=(offset-32768./65535.)*.25;
  color=texture(ink,uv+offset/span);
 }`);
 const program=gl.createProgram();
 gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
 gl.deleteShader(vertex);gl.deleteShader(fragment);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 const uniform=name=>gl.getUniformLocation(program,name);
 const texture=(unit,filter)=>{
  const tex=gl.createTexture();
  gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return tex;
 };
 const ink=texture(0,gl.NEAREST),field=texture(1,gl.LINEAR);
 gl.uniform1i(uniform('ink'),0);gl.uniform1i(uniform('field'),1);
 const size=uniform('size'),grid=uniform('grid'),origin=uniform('origin'),span=uniform('span');
 let previousField,previousInk,previousView;
 return {
  canvas,
  draw(source,revision,offset,view){
   const {width,height}=source;
   const viewKey=[width,height,view.centerX,view.centerY,view.zoom,view.viewport?.x,view.viewport?.y].join('/');
   if(revision===previousInk&&offset===previousField&&viewKey===previousView)return canvas;
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
   if(revision!==previousInk){
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,ink);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   }
   if(offset!==previousField){
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,field);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,offset.width,offset.height,0,gl.RGBA,gl.UNSIGNED_BYTE,offset.bytes);
   }
   const zoom=2**-view.zoom,sx=zoom*(view.viewport?.x??1),sy=zoom*(view.viewport?.y??1);
   gl.uniform2f(size,width,height);gl.uniform2f(grid,offset.width,offset.height);
   gl.uniform2f(origin,view.centerX-sx*.5,view.centerY-sy*.5);gl.uniform2f(span,sx,sy);
   gl.viewport(0,0,width,height);gl.drawArrays(gl.TRIANGLES,0,3);
   previousInk=revision;previousField=offset;previousView=viewKey;
   return canvas;
  },
  destroy(){gl.deleteTexture(ink);gl.deleteTexture(field);gl.deleteProgram(program);},
 };
}

// The CPU hit map uses the same bilinearly filtered offsets as the raster.
// The inverse places a world attachment on the exact rendered surface.
export function reliefSourcePoint({width,height,bytes},x,y){
 if(x<=0||y<=0||x>=1||y>=1)return {x,y};
 const u=x*(width-1),v=y*(height-1),a=((v|0)*width+(u|0))*4,b=a+width*4;
 const s=u-(u|0),t=v-(v|0);
 const axis=channel=>{
  const top=(bytes[a+channel]*256+bytes[a+channel+1])*(1-s)+(bytes[a+4+channel]*256+bytes[a+5+channel])*s;
  const bottom=(bytes[b+channel]*256+bytes[b+channel+1])*(1-s)+(bytes[b+4+channel]*256+bytes[b+5+channel])*s;
  return (top*(1-t)+bottom*t-32768)/262140;
 };
 return {x:x+axis(0),y:y+axis(2)};
}

export function reliefProjectPoint(field,x,y){
 let u=x,v=y;
 for(let i=0;i<8;i++){
  const q=reliefSourcePoint(field,u,v);
  u+=x-q.x;v+=y-q.y;
 }
 return {x:u,y:v};
}
