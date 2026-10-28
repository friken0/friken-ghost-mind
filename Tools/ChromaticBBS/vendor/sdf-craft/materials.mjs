// Race-authentic surface data from the EXISTING InfiniTexture engine.
// Eight independently seeded pages: four functional regions, two finish banks.
import {InfiniTexture} from './texture-engine.mjs';
export function bakeMaterialAtlas(skin,{tile=128}={}){
 if(!Number.isInteger(tile)||tile<16||tile>512||(tile&(tile-1)))throw new RangeError('Material tile must be a power of two in16..512');
 if(skin.culture)InfiniTexture.registerCulture(skin.culture);
 const race=InfiniTexture.resolveRace(skin.race),width=tile*4,height=tile*2;
 const albedo=new Uint8Array(width*height*4),matrix=new Uint8Array(albedo.length),receipts=[];
 for(let slot=0;slot<8;slot++){
  const surface=InfiniTexture.generateMaterialSurface({race:skin.race,seed:(skin.seed+Math.imul(slot,0x119de1f3))>>>0,tier:1,slot,resolution:tile});
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
   const src=(y*tile+x)*4,dst=((Math.floor(slot/4)*tile+y)*width+(slot%4)*tile+x)*4;
   for(let k=0;k<4;k++){albedo[dst+k]=surface.alb[src+k];matrix[dst+k]=surface.mtx[src+k];}
  }
  receipts.push(surface.recipe);
 }
 return {width,height,tile,albedo,matrix,receipts,engine:InfiniTexture.version};
}
