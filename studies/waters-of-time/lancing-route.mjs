// Apertures are specified in the source artwork's coordinates. Both the
// retained renderer and the director consume these same moving sockets.
export function crossingPort(chapter,time){
 if(chapter===0){
  const latitude=-38.83*Math.PI/180,spin=-.28+.023*Math.sin(time*.11);
  const a=(-104.82/360-spin)*Math.PI*2;
  const north=Math.sin(latitude),forward=Math.cos(latitude)*Math.cos(a);
  return {x:.34+.51*Math.cos(latitude)*Math.sin(a),y:.75+.51*1.72*(north*.94+forward*.342),span:.009};
 }
 return ({1:{x:.672,y:.572,span:.048},3:{x:.643,y:.421,span:.214},6:{x:.817,y:.205,span:.024}})[chapter];
}
export const chapterSeconds=[8,6,4.8,8,6.4,4.8,6,1.7];
const ease=t=>t*t*(3-2*t);
export function crossingFlight(chapter,t,start,time){
 const target=crossingPort(chapter,time),q=ease(Math.max(0,Math.min(1,t)));
 const wide={zoom:0,centerX:.5,centerY:.5};
 if(!target){
  const arch=Math.sin(Math.PI*t)**2;
  return {zoom:start.zoom*(1-q)+arch*(chapter===4?.59:.28),centerX:start.centerX*(1-q)+.5*q+arch*(chapter===5?.085:-.05),centerY:start.centerY*(1-q)+.5*q-.042*arch};
 }
 const end=-Math.log2(target.span),zoom=start.zoom+(end-start.zoom)*q;
 const source=2**-start.zoom,span=2**-zoom;
 const along=Math.abs(source-target.span)<1e-8?q:(source-span)/(source-target.span);
 const bank=Math.sin(Math.PI*t)**2*span;
 return {...wide,zoom,centerX:start.centerX+(target.x-start.centerX)*along+bank*(chapter===3?-.17:.118),centerY:start.centerY+(target.y-start.centerY)*along+bank*(chapter===1?.09:-.085)};
}
export const flightTraces=[
 {id:'bus',chapter:0,x:.658,y:.386,r:.014,name:'The cold bus',line:'Ghost here. The brightest tracks detour around a dead conductor. Someone repaired this machine before we learned to write.'},
 {id:'key',chapter:1,x:.521,y:.547,r:.021,name:'The open switch',line:'Tesla put the brass knife on the bench. There is daylight between the contacts. Whatever made the next three marks, it came from outside.'},
 {id:'paper',chapter:1,x:.741,y:.753,r:.020,name:'The fourth mark',line:'Three heavy strokes. Then a faint fourth in a different ink. That one is his. Tesla tried answering.'},
 {id:'weld',chapter:2,x:.813,y:.335,r:.022,name:'Shift signatures',line:'A thumbprint in the first weld. A smaller one beside it. Their shift dates are sixty years apart.'},
];
export function flightTraceAt(chapter,pose){
 return flightTraces.find(p=>p.chapter===chapter&&p.r*2**pose.zoom>.20&&Math.hypot((pose.centerX-p.x)/p.r,(pose.centerY-p.y)/(p.r*1.72))<1);
}
