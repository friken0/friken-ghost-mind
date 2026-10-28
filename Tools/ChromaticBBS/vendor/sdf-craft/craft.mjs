// GENERATED from Tools/SdfCraft/craft-math.inc; run generate.py.
// source-sha256: a7df39d82bc3ecb4a0e97be3d68efd16ff634c6eedf154a377e974bd6268842a
export const SourceSha256="a7df39d82bc3ecb4a0e97be3d68efd16ff634c6eedf154a377e974bd6268842a";
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Canonical scalar geometry; generated unchanged into HLSL/GLSL and translated
// to C#/JS. Units are local, positive outside. Never reads clock/RNG/audio.
// Smooth fields and inverse warps are conservative estimators, not exact SDFs.
export function CraftMix(a, b, t) { return a+(b-a)*t; }
export function CraftLength2(x,y) { return Math.sqrt(x*x+y*y); }
export function CraftLength3(x,y,z) { return Math.sqrt(x*x+y*y+z*z); }
export function CraftBox(x,y,z,bx,by,bz)
{
    let a=Math.abs(x)-bx,b=Math.abs(y)-by,c=Math.abs(z)-bz;
    return CraftLength3(Math.max(a,0.0),Math.max(b,0.0),Math.max(c,0.0))+Math.min(Math.max(a,Math.max(b,c)),0.0);
}
// The axis has an explicit angle on every backend; Metal Math.atan2(0,0)
// is undefined and can turn later min/max CSG into phantom solid space.
export function CraftAngle(y,x)
{
    if(x*x+y*y<1e-20)return 0.0;
    return Math.atan2(y,x);
}
export function CraftRoundBox(x,y,z,bx,by,bz,r)
{
    r=clamp(r,0.0,Math.min(bx,Math.min(by,bz))*.8);
    return CraftBox(x,y,z,bx-r,by-r,bz-r)-r;
}
export function CraftUnion(a,b,k)
{
    if(k<=0.0) return Math.min(a,b);
    let h=clamp(.5+.5*(b-a)/k,0.0,1.0);
    return CraftMix(b,a,h)-k*h*(1.0-h);
}
export function CraftCut(a,b,k) { return -CraftUnion(-a,b,k); }
// Local CSG operations. Scope is owned by a root, never global subtraction.
export function CraftCompose(a,b,operation)
{
    if(operation==2.0) return Math.max(a,-b);
    if(operation==4.0) return Math.max(a,b);
    return Math.min(a,b);
}
export function CraftRepeat(p,pitch,halfCount)
{
    pitch=Math.max(Math.abs(pitch),.0001);
    return p-pitch*clamp(Math.floor(p/pitch+.5),-Math.floor(halfCount),Math.floor(halfCount));
}
export function CraftCurveTube(x,y,z,h,bend,sway,ra,rb)
{
    h=Math.max(Math.abs(h),.0001);ra=Math.max(ra,.0001);rb=Math.max(rb,.0001);
    let u=clamp(z/h,-1.0,1.0),cx=bend*(1.0-u*u),cy=sway*Math.sin(3.14159265359*u);
    let r=CraftMix(ra,rb,(u+1.0)*.5);
    // Global derivative bound of the inverse curve warp plus tapered radius.
    let lip=1.0+2.0*Math.abs(bend)/h+3.14159265359*Math.abs(sway)/h+Math.abs(rb-ra)/(2.0*h);
    return (CraftLength3(x-cx,y-cy,z-h*u)-r)/lip;
}
export function CraftBevel(x,y,z,bx,by,bz,cut)
{
    let d=CraftBox(x,y,z,bx,by,bz);
    d=Math.max(d,(Math.abs(x)+Math.abs(y)-bx-by+cut)*.70710678118);
    d=Math.max(d,(Math.abs(x)+Math.abs(z)-bx-bz+cut)*.70710678118);
    return Math.max(d,(Math.abs(y)+Math.abs(z)-by-bz+cut)*.70710678118);
}
export function CraftEllipsoid(x,y,z,sx,sy,sz)
{
    sx=Math.max(Math.abs(sx),.0001);sy=Math.max(Math.abs(sy),.0001);sz=Math.max(Math.abs(sz),.0001);
    return (CraftLength3(x/sx,y/sy,z/sz)-1.0)*Math.min(sx,Math.min(sy,sz));
}
// Roof construction for the existing authored hull shell grammar. This
// returns a LOCAL cutter, never a new hull or a global scene subtraction.
// Cabin center and shoulder inlet mouths are deliberately protected.
export function CraftHullRecess(x,y,z,sx,sy,sz,family,variation)
{
    sx=Math.max(sx,.001);sy=Math.max(sy,.001);sz=Math.max(sz,.001);
    let xx=Math.abs(x)-sx*.38,yy=y-sy*.88;
    let zz=CraftRepeat(z+sz*.15,sz*.32,2.0);
    let cut=CraftRoundBox(xx,yy,zz,sx*.14,sy*.13,sz*.095,Math.min(sy*.04,sx*.03));
    if(family==1.0)
        cut=CraftEllipsoid(xx,yy,zz,sx*.18,sy*.14,sz*.09);
    if(family==2.0)
        cut=Math.max(cut,(Math.abs(xx)+Math.abs(zz)*.6-sx*.13)*.8574929257);
    if(family==3.0)
        cut=Math.max(cut,Math.abs(xx)-sx*(.055+.035*variation));
    // Two construction depths: a narrow gasket course surrounds the actual
    // service mouth, with seated blind fastener wells on its shoulders.
    let outer=CraftRoundBox(xx,y-sy*.965,zz,sx*.175,sy*.055,sz*.12,Math.min(sy*.025,sx*.025));
    let inner=CraftRoundBox(xx,y-sy*.965,zz,sx*.153,sy*.075,sz*.103,Math.min(sy*.02,sx*.02));
    let gasket=Math.max(outer,-inner);
    let bolts=Math.max(CraftLength2(Math.abs(xx)-sx*.13,zz)-Math.min(sx*.025,sz*.024),
        Math.abs(y-sy*.92)-sy*.075);
    cut=Math.min(cut,Math.min(gasket,bolts));
    return Math.max(cut,sy*.64-y);
}
export function CraftSweep(x,y,z,ex,au)
{
    let ra=.16+.08*ex,rb=.04+.09*au;
    let d=CraftCurveTube(x,y,z,.72,(ex-.5)*1.10,(au-.5)*.65,ra,rb);
    let u=clamp(z/.72,-1.0,1.0),r=CraftMix(ra,rb,(u+1.0)*.5);
    let cx=(ex-.5)*1.10*(1.0-u*u),cy=(au-.5)*.65*Math.sin(3.14159265359*u);
    // A finite longitudinal cable seam follows the curved shaft itself.
    let seam=Math.max(CraftLength2(x-cx-r*.92,y-cy)-r*.16,Math.abs(z)-.59);
    return Math.max(d,-seam/(1.0+3.1*Math.abs(ex-.5)+2.9*Math.abs(au-.5)));
}
export function CraftDuct(x,y,z,ex,au)
{
    z=-z; // flared outlet faces native aft -Z
    let u=clamp(z*.5+.5,0.0,1.0),flare=.24+.38*u*u;
    let rho=CraftLength2(x,y),wall=.055+.025*ex;
    let body=Math.max(Math.abs(rho-flare)-wall,Math.abs(z)-.84)/(1.0+.38);
    let collarZ=CraftRepeat(z,.32,2.0);
    let collar=CraftLength2(rho-flare,collarZ)-(.075+.02*au);
    collar=Math.max(collar,Math.abs(z)-.84)/(1.0+.38);
    let flange=Math.max(Math.abs(rho-.64)-.13,Math.abs(z-.77)-.055);
    let slot=CraftBox(x,y,z,.10,.9,.55);
    let angle=CraftAngle(y,x),sector=Math.floor(angle/.7853981634+.5)*.7853981634;
    let bx=Math.cos(sector)*x+Math.sin(sector)*y-.64,by=-Math.sin(sector)*x+Math.cos(sector)*y;
    let bolt=Math.max(CraftLength2(bx,by)-.036,Math.abs(z-.79)-.10);
    flange=Math.max(flange,-bolt);
    // Captive flange bolts and an annular gasket seat are real voids.
    flange=Math.max(flange,-Math.max(Math.abs(rho-.69)-.014,Math.abs(z-.82)-.018));
    return Math.min(CraftCut(Math.min(body,collar),slot,.008),flange);
}
export function CraftSocket(x,y,z,ex,au)
{
    let shell=CraftEllipsoid(x,y,z,.89,.76,.62);
    let cavity=CraftEllipsoid(x,y,z+.30,.63+.08*ex,.47+.08*au,.72);
    let d=CraftCut(shell,cavity,.018);
    let ring=Math.abs(CraftLength2(x/.84,y/.70)-1.0)*.70-.045;
    d=Math.min(d,Math.max(ring,Math.abs(z+.18)-.045));
    let inner=Math.abs(CraftLength2(x/.69,y/.53)-1.0)*.53-.024;
    d=Math.min(d,Math.max(inner,Math.abs(z+.015)-.035));
    let port=CraftBox(Math.abs(x)-.75,y,z,.12,.12+.07*au,.8);
    d=CraftCut(d,port,.006);
    let a=CraftAngle(y/.70,x/.84),s=Math.floor(a/.7853981634+.5)*.7853981634;
    let bx=Math.cos(s)*x+Math.sin(s)*y-.74,by=-Math.sin(s)*x+Math.cos(s)*y;
    let detent=Math.max(CraftLength2(bx,by)-.032,Math.abs(z+.18)-.055);
    return Math.max(d,-detent);
}
export function CraftGear(x,y,z,ex,au)
{
    let rho=CraftLength2(x,y),n=8.0+Math.floor(au*12.0),a=CraftAngle(y,x);
    let teeth=(rho-.76-.065*Math.cos(a*n))/(1.0+.065*n/.34);
    let gear=Math.max(Math.max(teeth,.43-rho),Math.abs(z)-.16);
    let rim=Math.max(Math.abs(rho-.64)-.07,Math.abs(z)-.22);
    let hub=Math.max(Math.abs(rho-.20)-.095,Math.abs(z)-.25);
    let sector=Math.floor(a/1.0471975512+.5)*1.0471975512;
    let px=Math.cos(sector)*x+Math.sin(sector)*y,py=-Math.sin(sector)*x+Math.cos(sector)*y;
    let spoke=CraftBevel(px-.39,py,z,.30,.045+.02*ex,.10,.025);
    let d=Math.min(Math.min(gear,rim),Math.min(hub,spoke));
    let race=Math.max(Math.abs(rho-.64)-.018,Math.abs(Math.abs(z)-.212)-.025);
    let key=CraftBox(x-.19,y,z,.14,.031,.31);
    let spokePocket=CraftBevel(px-.43,py,Math.abs(z)-.088,.13,.024,.04,.018);
    return Math.max(Math.max(Math.max(d,-race),-key),-spokePocket);
}
export function CraftVane(x,y,z,ex,au)
{
    let u=clamp((x+.85)/1.7,0.0,1.0),width=.10+.52*Math.sin(3.14159265359*u);
    let camber=(.08+.18*ex)*Math.sin(3.14159265359*u);
    let body=Math.max(Math.max(Math.abs(x)-.85,Math.abs(y)-width),Math.abs(z-camber)-.035)/(1.0+1.15);
    let v=CraftRepeat(x+Math.abs(y)*(.25+.30*au),.10+.04*au,6.0);
    let slit=Math.max(Math.max(Math.abs(v)-.013,Math.abs(y)-width*.94),width*.15-Math.abs(y));
    slit=Math.max(slit,Math.abs(z-camber)-.12)/(1.0+1.55);
    body=Math.max(body,-slit);
    let rib=CraftCurveTube(z-.015,y,x,.88,.08+.18*ex,0.0,.055,.018);
    let quillSlot=Math.max(CraftLength2(y,z-camber+.015)-.023,Math.abs(x)-.60);
    return Math.max(Math.min(body,rib),-quillSlot/(1.0+.5*ex));
}
export function CraftPlate(x,y,z,ex,au)
{
    // Recess faces +Y: the native maintenance housings keep their service
    // opening on the roof without rotating their host attachment or rig.
    let oldY=y;y=z;z=-oldY;
    let body=CraftBevel(x,y,z,.88,.76,.30,.16);
    let bay=CraftRoundBox(x,y,z+.24,.58+.12*ex,.44+.12*au,.26,.075);
    body=CraftCut(body,bay,.025);
    let cutX=Math.abs(x)-.76,cutY=CraftRepeat(y,.22,2.0);
    let notch=CraftBevel(cutX,cutY,z,.15,.055,.5,.035);
    body=Math.max(body,-notch);
    let border=CraftBevel(x,y,z+.11,.72,.58,.065,.14);
    border=Math.max(border,-CraftBevel(x,y,z+.11,.66,.52,.14,.10));
    let chevron=Math.max(Math.abs(Math.abs(x)-(.18+.38*(y+.5)))-.022,Math.abs(y)-.45)/1.38;
    chevron=Math.max(chevron,Math.abs(z-.27)-.09);
    let screw=CraftLength2(Math.abs(x)-.66,Math.abs(y)-.52)-.034;
    screw=Math.max(screw,Math.abs(z+.14)-.09);
    let backRibs=Math.max(Math.abs(CraftRepeat(y,.18,3.0))-.015,Math.abs(x)-.52);
    backRibs=Math.max(backRibs,Math.abs(z-.275)-.045);
    return Math.max(Math.max(Math.max(Math.min(body,border),-chevron),-screw),-backRibs);
}
export function CraftPod(x,y,z,ex,au)
{
    let shell=CraftEllipsoid(x,y,z,.65,.88,.65);
    let d=Math.max(shell,-CraftEllipsoid(x,y,z,.50,.75,.50));
    let sector=Math.floor(CraftAngle(z,x)/1.0471975512+.5)*1.0471975512;
    let px=Math.cos(sector)*x+Math.sin(sector)*z,pz=-Math.sin(sector)*x+Math.cos(sector)*z;
    let pore=CraftEllipsoid(px-.55,y+.03,pz,.30,.48,.12+.045*ex);
    d=CraftCut(d,pore,.012);
    let rib=CraftCurveTube(px-.30,pz,y,.77,.32,0.0,.052,.025);
    d=Math.min(d,rib);
    let crown=Math.max(CraftLength2(x,z)-(.18+.12*au),Math.abs(y-.78)-.13);
    crown=Math.max(crown,.10-CraftLength2(x,z));
    let crownPore=Math.max(CraftLength2(px-.22,pz)-.034,Math.abs(y-.79)-.16);
    let ribChannel=Math.max(Math.abs(pz)-.013,Math.abs(y)-.62);
    ribChannel=Math.max(ribChannel,Math.abs(px-(.30+.32*(1.0-(y/.77)*(y/.77))))-.018)/1.84;
    return Math.max(Math.max(Math.min(d,crown),-crownPore),-ribChannel);
}
export function CraftCrystal(x,y,z,ex,au)
{
    let shell=(Math.abs(x)/.76+Math.abs(y)/.95+Math.abs(z)/.70-1.0)*.70*.5773502692;
    let inner=(Math.abs(x)/.53+Math.abs(y)/.70+Math.abs(z)/.49-1.0)*.49*.5773502692;
    shell=Math.max(shell,-inner);
    let barrel=Math.max(Math.abs(x)*.85+Math.abs(z)-.19,Math.abs(y)-1.1)/1.32;
    shell=Math.max(shell,-barrel);
    let waist=CraftBox(x,y,z,.90,.055,.12);
    shell=Math.max(shell,-waist);
    // Deep lateral windows make the suspended core legible from obliques,
    // not only by looking down the axial bore. Edge struts retain the cage.
    let front=CraftBevel(x,y,Math.abs(z)-.39,.22+.06*ex,.22,.32,.11);
    let side=CraftBevel(Math.abs(x)-.43,y,z,.32,.18+.05*au,.19,.10);
    shell=Math.max(shell,-Math.min(front,side));
    let core=(Math.abs(x)+Math.abs(y)+Math.abs(z)-.33)*.5773502692;
    let clasp=Math.max(Math.abs(CraftLength2(x,z)-.41)-.045,Math.abs(y)-.10);
    let stay=Math.min(CraftBox(x,y,z,.74,.022,.022),CraftBox(x,y,z,.022,.022,.68));
    let growth=Math.max(Math.abs(y)-.16,Math.abs(Math.abs(x)-.10)-.013);
    growth=Math.max(growth,Math.abs(z)-.25);
    core=Math.max(core,-growth);
    clasp=Math.max(clasp,-Math.max(Math.abs(CraftRepeat(CraftAngle(z,x),.7853981634,4.0))-.06,Math.abs(y)-.025)/8.0);
    return Math.min(Math.min(shell,stay),Math.min(core,clasp));
}
export function CraftCoil(x,y,z,ex,au)
{
    // Continuous helical spine; no chain of capsules and no branch cut in
    // atan. The clamped end stations produce real tapered terminal caps.
    let h=.70,radius=.40+.10*au,turns=1.0+1.5*ex;
    let u=clamp(z/h,-1.0,1.0),a=3.14159265359*turns*(u+1.0);
    let tube=CraftMix(.10+.025*au,.045,(u+1.0)*.5);
    let lip=1.0+radius*3.14159265359*turns/h+(.055+.025*au)/(2.0*h);
    let d=(CraftLength3(x-radius*Math.cos(a),y-radius*Math.sin(a),z-h*u)-tube)/lip;
    let envelope=Math.max(Math.abs(CraftLength2(x,y)-radius)-(.10+.025*au),Math.abs(z)-h-(.10+.025*au));
    let cx=x-radius*Math.cos(a),cy=y-radius*Math.sin(a);
    let groove=Math.max(CraftLength2(cx-tube*.82*Math.cos(a),cy-tube*.82*Math.sin(a))-tube*.16,Math.abs(z)-h*.86);
    return Math.max(Math.max(d,envelope),-groove/(lip*1.35));
}
export function CraftLoft(x,y,z,ex,au)
{
    // Closed primary mass for anatomy/keels, not a completed creature.
    // Continuous bent sections support soft tissue through faceted armor.
    let h=.84,u=clamp(z/h,-1.0,1.0),bend=(ex-.5)*.38,sway=(au-.5)*.18;
    let px=(x-bend*(1.0-u*u))/.68,py=(y-sway*Math.sin(3.14159265359*u))/.55,pz=z/h;
    let n=2.0+ex*3.5;
    let d=(Math.pow(Math.pow(Math.abs(px),n)+Math.pow(Math.abs(py),n)+Math.pow(Math.abs(pz),n),1.0/n)-1.0)*.55;
    // Broad shoulder/keel facets enrich section transitions without stamping
    // decorative holes onto every primary body mass.
    let lip=1.0+2.0*Math.abs(bend)/h+3.14159265359*Math.abs(sway)/h;
    let plane=(Math.abs(px)*.68+Math.abs(py)*.55-1.0+ex*.12)*.70710678118;
    return Math.max(d,plane)/lip;
}
export function CraftEval(kind,x,y,z,sx,sy,sz,ex,au)
{
    sx=Math.max(Math.abs(sx),.0001);sy=Math.max(Math.abs(sy),.0001);sz=Math.max(Math.abs(sz),.0001);
    let unit=Math.min(sx,Math.min(sy,sz)),bound=CraftBox(x,y,z,sx,sy,sz),gate=unit*.16;
    // Exact positive envelope gate. The final min below makes this the same
    // continuous conservative field at the boundary; it adds no box surface.
    // Distant queries need not evaluate teeth, ribs, windows or coil trig.
    if(bound>=gate) return bound;
    ex=clamp(ex,0.0,1.0);au=clamp(au,0.0,1.0);
    let px=x/sx,py=y/sy,pz=z/sz,d=10000.0;
    if(kind==33.0) d=CraftSweep(px,py,pz,ex,au);
    else if(kind==34.0) d=CraftDuct(px,py,pz,ex,au);
    else if(kind==35.0) d=CraftSocket(px,py,pz,ex,au);
    else if(kind==36.0) d=CraftGear(px,py,pz,ex,au);
    else if(kind==37.0) d=CraftVane(px,py,pz,ex,au);
    else if(kind==38.0) d=CraftPlate(px,py,pz,ex,au);
    else if(kind==39.0) d=CraftPod(px,py,pz,ex,au);
    else if(kind==40.0) d=CraftCrystal(px,py,pz,ex,au);
    else if(kind==41.0) d=CraftCoil(px,py,pz,ex,au);
    else if(kind==42.0) d=CraftLoft(px,py,pz,ex,au);
    // Complete part bounds are authored into the shape, not guessed later.
    // Uniform nonuniform-scale lower bound keeps fitting, rays and bakes aligned.
    return Math.min(Math.max(d*unit,bound),Math.max(bound,gate));
}

// Semantic surface regions, independent of race palette and field distance.
// 0 structure / 1 cladding+rim / 2 recess+mechanism / 3 conductor+inlay.
// Normals and coordinates are UNPOSED object local, never screen-space masks.
export function CraftSurfaceRole(kind,x,y,z,nx,ny,nz,ex,au)
{
    let rho=CraftLength2(x,y),role=0.0;
    if(kind==34.0)
        role=nx*x+ny*y<-.06?2.0:(z<-.65?1.0:(Math.abs(CraftRepeat(z,.32,2.0))<.07?1.0:0.0));
    else if(kind==35.0)
        role=z<-.10?(rho>.62?1.0:2.0):(z>.06?2.0:0.0);
    else if(kind==36.0)
        role=rho>.69?1.0:(rho<.30?2.0:(Math.abs(z)>.17?1.0:0.0));
    else if(kind==37.0)
        role=Math.abs(y)<.075?2.0:(Math.abs(y)>.34?1.0:0.0);
    else if(kind==38.0)
        role=y>.16?(Math.abs(x)>.62||Math.abs(z)>.43?1.0:2.0):(y<-.16?2.0:0.0);
    else if(kind==39.0)
        role=nx*x+ny*y+nz*z<0.0?2.0:(Math.abs(y)>.60?1.0:0.0);
    else if(kind==40.0)
        role=y<-.40?2.0:(Math.abs(nx)+Math.abs(nz)>1.1?1.0:0.0);
    else if(kind==41.0)
        role=Math.abs(z)>.65?1.0:(Math.abs(CraftRepeat(z,.19,4.0))<.024?2.0:0.0);
    else if(kind==42.0||kind==43.0)
        role=Math.abs(x)>.48?1.0:(y<-.25?2.0:0.0);
    else role=Math.abs(z)>.60?1.0:0.0;
    let route=Math.abs(CraftRepeat(z+x*.30,.48,3.0));
    if(route<.013&&role!=2.0)role=3.0;
    return role;
}
export function CraftSurfaceBank(x,y,z,ex,au)
{
    // Broad anatomical/assembly regions, never a repeating painted stripe.
    return y<-.28||Math.abs(x)>.64&&Math.abs(z)<.42?1.0:0.0;
}
export function CraftMaterialTile(material,role,bank)
{
    if(role==2.0)return bank>.5?6.0:2.0;
    if(role==3.0)return 3.0;
    if(material==4.0)return 7.0;
    if(material==2.0||material==5.0||material==6.0)return role==1.0?2.0:6.0;
    if(material==3.0||material==7.0||material==8.0)return 3.0;
    return role+bank*4.0;
}

