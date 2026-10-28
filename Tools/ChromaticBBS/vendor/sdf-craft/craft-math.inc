// Canonical scalar geometry; generated unchanged into HLSL/GLSL and translated
// to C#/JS. Units are local, positive outside. Never reads clock/RNG/audio.
// Smooth fields and inverse warps are conservative estimators, not exact SDFs.
float CraftMix(float a, float b, float t) { return a+(b-a)*t; }
float CraftLength2(float x,float y) { return sqrt(x*x+y*y); }
float CraftLength3(float x,float y,float z) { return sqrt(x*x+y*y+z*z); }
float CraftBox(float x,float y,float z,float bx,float by,float bz)
{
    float a=abs(x)-bx,b=abs(y)-by,c=abs(z)-bz;
    return CraftLength3(max(a,0.0),max(b,0.0),max(c,0.0))+min(max(a,max(b,c)),0.0);
}
// The axis has an explicit angle on every backend; Metal atan2(0,0)
// is undefined and can turn later min/max CSG into phantom solid space.
float CraftAngle(float y,float x)
{
    if(x*x+y*y<1e-20)return 0.0;
    return atan2(y,x);
}
float CraftRoundBox(float x,float y,float z,float bx,float by,float bz,float r)
{
    r=clamp(r,0.0,min(bx,min(by,bz))*.8);
    return CraftBox(x,y,z,bx-r,by-r,bz-r)-r;
}
float CraftUnion(float a,float b,float k)
{
    if(k<=0.0) return min(a,b);
    float h=clamp(.5+.5*(b-a)/k,0.0,1.0);
    return CraftMix(b,a,h)-k*h*(1.0-h);
}
float CraftCut(float a,float b,float k) { return -CraftUnion(-a,b,k); }
// Local CSG operations. Scope is owned by a root, never global subtraction.
float CraftCompose(float a,float b,float operation)
{
    if(operation==2.0) return max(a,-b);
    if(operation==4.0) return max(a,b);
    return min(a,b);
}
float CraftRepeat(float p,float pitch,float halfCount)
{
    pitch=max(abs(pitch),.0001);
    return p-pitch*clamp(floor(p/pitch+.5),-floor(halfCount),floor(halfCount));
}
float CraftCurveTube(float x,float y,float z,float h,float bend,float sway,float ra,float rb)
{
    h=max(abs(h),.0001);ra=max(ra,.0001);rb=max(rb,.0001);
    float u=clamp(z/h,-1.0,1.0),cx=bend*(1.0-u*u),cy=sway*sin(3.14159265359*u);
    float r=CraftMix(ra,rb,(u+1.0)*.5);
    // Global derivative bound of the inverse curve warp plus tapered radius.
    float lip=1.0+2.0*abs(bend)/h+3.14159265359*abs(sway)/h+abs(rb-ra)/(2.0*h);
    return (CraftLength3(x-cx,y-cy,z-h*u)-r)/lip;
}
float CraftBevel(float x,float y,float z,float bx,float by,float bz,float cut)
{
    float d=CraftBox(x,y,z,bx,by,bz);
    d=max(d,(abs(x)+abs(y)-bx-by+cut)*.70710678118);
    d=max(d,(abs(x)+abs(z)-bx-bz+cut)*.70710678118);
    return max(d,(abs(y)+abs(z)-by-bz+cut)*.70710678118);
}
float CraftEllipsoid(float x,float y,float z,float sx,float sy,float sz)
{
    sx=max(abs(sx),.0001);sy=max(abs(sy),.0001);sz=max(abs(sz),.0001);
    return (CraftLength3(x/sx,y/sy,z/sz)-1.0)*min(sx,min(sy,sz));
}
// Roof construction for the existing authored hull shell grammar. This
// returns a LOCAL cutter, never a new hull or a global scene subtraction.
// Cabin center and shoulder inlet mouths are deliberately protected.
float CraftHullRecess(float x,float y,float z,float sx,float sy,float sz,float family,float variation)
{
    sx=max(sx,.001);sy=max(sy,.001);sz=max(sz,.001);
    float xx=abs(x)-sx*.38,yy=y-sy*.88;
    float zz=CraftRepeat(z+sz*.15,sz*.32,2.0);
    float cut=CraftRoundBox(xx,yy,zz,sx*.14,sy*.13,sz*.095,min(sy*.04,sx*.03));
    if(family==1.0)
        cut=CraftEllipsoid(xx,yy,zz,sx*.18,sy*.14,sz*.09);
    if(family==2.0)
        cut=max(cut,(abs(xx)+abs(zz)*.6-sx*.13)*.8574929257);
    if(family==3.0)
        cut=max(cut,abs(xx)-sx*(.055+.035*variation));
    // Two construction depths: a narrow gasket course surrounds the actual
    // service mouth, with seated blind fastener wells on its shoulders.
    float outer=CraftRoundBox(xx,y-sy*.965,zz,sx*.175,sy*.055,sz*.12,min(sy*.025,sx*.025));
    float inner=CraftRoundBox(xx,y-sy*.965,zz,sx*.153,sy*.075,sz*.103,min(sy*.02,sx*.02));
    float gasket=max(outer,-inner);
    float bolts=max(CraftLength2(abs(xx)-sx*.13,zz)-min(sx*.025,sz*.024),
        abs(y-sy*.92)-sy*.075);
    cut=min(cut,min(gasket,bolts));
    return max(cut,sy*.64-y);
}
float CraftSweep(float x,float y,float z,float ex,float au)
{
    float ra=.16+.08*ex,rb=.04+.09*au;
    float d=CraftCurveTube(x,y,z,.72,(ex-.5)*1.10,(au-.5)*.65,ra,rb);
    float u=clamp(z/.72,-1.0,1.0),r=CraftMix(ra,rb,(u+1.0)*.5);
    float cx=(ex-.5)*1.10*(1.0-u*u),cy=(au-.5)*.65*sin(3.14159265359*u);
    // A finite longitudinal cable seam follows the curved shaft itself.
    float seam=max(CraftLength2(x-cx-r*.92,y-cy)-r*.16,abs(z)-.59);
    return max(d,-seam/(1.0+3.1*abs(ex-.5)+2.9*abs(au-.5)));
}
float CraftDuct(float x,float y,float z,float ex,float au)
{
    z=-z; // flared outlet faces native aft -Z
    float u=clamp(z*.5+.5,0.0,1.0),flare=.24+.38*u*u;
    float rho=CraftLength2(x,y),wall=.055+.025*ex;
    float body=max(abs(rho-flare)-wall,abs(z)-.84)/(1.0+.38);
    float collarZ=CraftRepeat(z,.32,2.0);
    float collar=CraftLength2(rho-flare,collarZ)-(.075+.02*au);
    collar=max(collar,abs(z)-.84)/(1.0+.38);
    float flange=max(abs(rho-.64)-.13,abs(z-.77)-.055);
    float slot=CraftBox(x,y,z,.10,.9,.55);
    float angle=CraftAngle(y,x),sector=floor(angle/.7853981634+.5)*.7853981634;
    float bx=cos(sector)*x+sin(sector)*y-.64,by=-sin(sector)*x+cos(sector)*y;
    float bolt=max(CraftLength2(bx,by)-.036,abs(z-.79)-.10);
    flange=max(flange,-bolt);
    // Captive flange bolts and an annular gasket seat are real voids.
    flange=max(flange,-max(abs(rho-.69)-.014,abs(z-.82)-.018));
    return min(CraftCut(min(body,collar),slot,.008),flange);
}
float CraftSocket(float x,float y,float z,float ex,float au)
{
    float shell=CraftEllipsoid(x,y,z,.89,.76,.62);
    float cavity=CraftEllipsoid(x,y,z+.30,.63+.08*ex,.47+.08*au,.72);
    float d=CraftCut(shell,cavity,.018);
    float ring=abs(CraftLength2(x/.84,y/.70)-1.0)*.70-.045;
    d=min(d,max(ring,abs(z+.18)-.045));
    float inner=abs(CraftLength2(x/.69,y/.53)-1.0)*.53-.024;
    d=min(d,max(inner,abs(z+.015)-.035));
    float port=CraftBox(abs(x)-.75,y,z,.12,.12+.07*au,.8);
    d=CraftCut(d,port,.006);
    float a=CraftAngle(y/.70,x/.84),s=floor(a/.7853981634+.5)*.7853981634;
    float bx=cos(s)*x+sin(s)*y-.74,by=-sin(s)*x+cos(s)*y;
    float detent=max(CraftLength2(bx,by)-.032,abs(z+.18)-.055);
    return max(d,-detent);
}
float CraftGear(float x,float y,float z,float ex,float au)
{
    float rho=CraftLength2(x,y),n=8.0+floor(au*12.0),a=CraftAngle(y,x);
    float teeth=(rho-.76-.065*cos(a*n))/(1.0+.065*n/.34);
    float gear=max(max(teeth,.43-rho),abs(z)-.16);
    float rim=max(abs(rho-.64)-.07,abs(z)-.22);
    float hub=max(abs(rho-.20)-.095,abs(z)-.25);
    float sector=floor(a/1.0471975512+.5)*1.0471975512;
    float px=cos(sector)*x+sin(sector)*y,py=-sin(sector)*x+cos(sector)*y;
    float spoke=CraftBevel(px-.39,py,z,.30,.045+.02*ex,.10,.025);
    float d=min(min(gear,rim),min(hub,spoke));
    float race=max(abs(rho-.64)-.018,abs(abs(z)-.212)-.025);
    float key=CraftBox(x-.19,y,z,.14,.031,.31);
    float spokePocket=CraftBevel(px-.43,py,abs(z)-.088,.13,.024,.04,.018);
    return max(max(max(d,-race),-key),-spokePocket);
}
float CraftVane(float x,float y,float z,float ex,float au)
{
    float u=clamp((x+.85)/1.7,0.0,1.0),width=.10+.52*sin(3.14159265359*u);
    float camber=(.08+.18*ex)*sin(3.14159265359*u);
    float body=max(max(abs(x)-.85,abs(y)-width),abs(z-camber)-.035)/(1.0+1.15);
    float v=CraftRepeat(x+abs(y)*(.25+.30*au),.10+.04*au,6.0);
    float slit=max(max(abs(v)-.013,abs(y)-width*.94),width*.15-abs(y));
    slit=max(slit,abs(z-camber)-.12)/(1.0+1.55);
    body=max(body,-slit);
    float rib=CraftCurveTube(z-.015,y,x,.88,.08+.18*ex,0.0,.055,.018);
    float quillSlot=max(CraftLength2(y,z-camber+.015)-.023,abs(x)-.60);
    return max(min(body,rib),-quillSlot/(1.0+.5*ex));
}
float CraftPlate(float x,float y,float z,float ex,float au)
{
    // Recess faces +Y: the native maintenance housings keep their service
    // opening on the roof without rotating their host attachment or rig.
    float oldY=y;y=z;z=-oldY;
    float body=CraftBevel(x,y,z,.88,.76,.30,.16);
    float bay=CraftRoundBox(x,y,z+.24,.58+.12*ex,.44+.12*au,.26,.075);
    body=CraftCut(body,bay,.025);
    float cutX=abs(x)-.76,cutY=CraftRepeat(y,.22,2.0);
    float notch=CraftBevel(cutX,cutY,z,.15,.055,.5,.035);
    body=max(body,-notch);
    float border=CraftBevel(x,y,z+.11,.72,.58,.065,.14);
    border=max(border,-CraftBevel(x,y,z+.11,.66,.52,.14,.10));
    float chevron=max(abs(abs(x)-(.18+.38*(y+.5)))-.022,abs(y)-.45)/1.38;
    chevron=max(chevron,abs(z-.27)-.09);
    float screw=CraftLength2(abs(x)-.66,abs(y)-.52)-.034;
    screw=max(screw,abs(z+.14)-.09);
    float backRibs=max(abs(CraftRepeat(y,.18,3.0))-.015,abs(x)-.52);
    backRibs=max(backRibs,abs(z-.275)-.045);
    return max(max(max(min(body,border),-chevron),-screw),-backRibs);
}
float CraftPod(float x,float y,float z,float ex,float au)
{
    float shell=CraftEllipsoid(x,y,z,.65,.88,.65);
    float d=max(shell,-CraftEllipsoid(x,y,z,.50,.75,.50));
    float sector=floor(CraftAngle(z,x)/1.0471975512+.5)*1.0471975512;
    float px=cos(sector)*x+sin(sector)*z,pz=-sin(sector)*x+cos(sector)*z;
    float pore=CraftEllipsoid(px-.55,y+.03,pz,.30,.48,.12+.045*ex);
    d=CraftCut(d,pore,.012);
    float rib=CraftCurveTube(px-.30,pz,y,.77,.32,0.0,.052,.025);
    d=min(d,rib);
    float crown=max(CraftLength2(x,z)-(.18+.12*au),abs(y-.78)-.13);
    crown=max(crown,.10-CraftLength2(x,z));
    float crownPore=max(CraftLength2(px-.22,pz)-.034,abs(y-.79)-.16);
    float ribChannel=max(abs(pz)-.013,abs(y)-.62);
    ribChannel=max(ribChannel,abs(px-(.30+.32*(1.0-(y/.77)*(y/.77))))-.018)/1.84;
    return max(max(min(d,crown),-crownPore),-ribChannel);
}
float CraftCrystal(float x,float y,float z,float ex,float au)
{
    float shell=(abs(x)/.76+abs(y)/.95+abs(z)/.70-1.0)*.70*.5773502692;
    float inner=(abs(x)/.53+abs(y)/.70+abs(z)/.49-1.0)*.49*.5773502692;
    shell=max(shell,-inner);
    float barrel=max(abs(x)*.85+abs(z)-.19,abs(y)-1.1)/1.32;
    shell=max(shell,-barrel);
    float waist=CraftBox(x,y,z,.90,.055,.12);
    shell=max(shell,-waist);
    // Deep lateral windows make the suspended core legible from obliques,
    // not only by looking down the axial bore. Edge struts retain the cage.
    float front=CraftBevel(x,y,abs(z)-.39,.22+.06*ex,.22,.32,.11);
    float side=CraftBevel(abs(x)-.43,y,z,.32,.18+.05*au,.19,.10);
    shell=max(shell,-min(front,side));
    float core=(abs(x)+abs(y)+abs(z)-.33)*.5773502692;
    float clasp=max(abs(CraftLength2(x,z)-.41)-.045,abs(y)-.10);
    float stay=min(CraftBox(x,y,z,.74,.022,.022),CraftBox(x,y,z,.022,.022,.68));
    float growth=max(abs(y)-.16,abs(abs(x)-.10)-.013);
    growth=max(growth,abs(z)-.25);
    core=max(core,-growth);
    clasp=max(clasp,-max(abs(CraftRepeat(CraftAngle(z,x),.7853981634,4.0))-.06,abs(y)-.025)/8.0);
    return min(min(shell,stay),min(core,clasp));
}
float CraftCoil(float x,float y,float z,float ex,float au)
{
    // Continuous helical spine; no chain of capsules and no branch cut in
    // atan. The clamped end stations produce real tapered terminal caps.
    float h=.70,radius=.40+.10*au,turns=1.0+1.5*ex;
    float u=clamp(z/h,-1.0,1.0),a=3.14159265359*turns*(u+1.0);
    float tube=CraftMix(.10+.025*au,.045,(u+1.0)*.5);
    float lip=1.0+radius*3.14159265359*turns/h+(.055+.025*au)/(2.0*h);
    float d=(CraftLength3(x-radius*cos(a),y-radius*sin(a),z-h*u)-tube)/lip;
    float envelope=max(abs(CraftLength2(x,y)-radius)-(.10+.025*au),abs(z)-h-(.10+.025*au));
    float cx=x-radius*cos(a),cy=y-radius*sin(a);
    float groove=max(CraftLength2(cx-tube*.82*cos(a),cy-tube*.82*sin(a))-tube*.16,abs(z)-h*.86);
    return max(max(d,envelope),-groove/(lip*1.35));
}
float CraftLoft(float x,float y,float z,float ex,float au)
{
    // Closed primary mass for anatomy/keels, not a completed creature.
    // Continuous bent sections support soft tissue through faceted armor.
    float h=.84,u=clamp(z/h,-1.0,1.0),bend=(ex-.5)*.38,sway=(au-.5)*.18;
    float px=(x-bend*(1.0-u*u))/.68,py=(y-sway*sin(3.14159265359*u))/.55,pz=z/h;
    float n=2.0+ex*3.5;
    float d=(pow(pow(abs(px),n)+pow(abs(py),n)+pow(abs(pz),n),1.0/n)-1.0)*.55;
    // Broad shoulder/keel facets enrich section transitions without stamping
    // decorative holes onto every primary body mass.
    float lip=1.0+2.0*abs(bend)/h+3.14159265359*abs(sway)/h;
    float plane=(abs(px)*.68+abs(py)*.55-1.0+ex*.12)*.70710678118;
    return max(d,plane)/lip;
}
float CraftEval(float kind,float x,float y,float z,float sx,float sy,float sz,float ex,float au)
{
    sx=max(abs(sx),.0001);sy=max(abs(sy),.0001);sz=max(abs(sz),.0001);
    float unit=min(sx,min(sy,sz)),bound=CraftBox(x,y,z,sx,sy,sz),gate=unit*.16;
    // Exact positive envelope gate. The final min below makes this the same
    // continuous conservative field at the boundary; it adds no box surface.
    // Distant queries need not evaluate teeth, ribs, windows or coil trig.
    if(bound>=gate) return bound;
    ex=clamp(ex,0.0,1.0);au=clamp(au,0.0,1.0);
    float px=x/sx,py=y/sy,pz=z/sz,d=10000.0;
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
    return min(max(d*unit,bound),max(bound,gate));
}

// Semantic surface regions, independent of race palette and field distance.
// 0 structure / 1 cladding+rim / 2 recess+mechanism / 3 conductor+inlay.
// Normals and coordinates are UNPOSED object local, never screen-space masks.
float CraftSurfaceRole(float kind,float x,float y,float z,float nx,float ny,float nz,float ex,float au)
{
    float rho=CraftLength2(x,y),role=0.0;
    if(kind==34.0)
        role=nx*x+ny*y<-.06?2.0:(z<-.65?1.0:(abs(CraftRepeat(z,.32,2.0))<.07?1.0:0.0));
    else if(kind==35.0)
        role=z<-.10?(rho>.62?1.0:2.0):(z>.06?2.0:0.0);
    else if(kind==36.0)
        role=rho>.69?1.0:(rho<.30?2.0:(abs(z)>.17?1.0:0.0));
    else if(kind==37.0)
        role=abs(y)<.075?2.0:(abs(y)>.34?1.0:0.0);
    else if(kind==38.0)
        role=y>.16?(abs(x)>.62||abs(z)>.43?1.0:2.0):(y<-.16?2.0:0.0);
    else if(kind==39.0)
        role=nx*x+ny*y+nz*z<0.0?2.0:(abs(y)>.60?1.0:0.0);
    else if(kind==40.0)
        role=y<-.40?2.0:(abs(nx)+abs(nz)>1.1?1.0:0.0);
    else if(kind==41.0)
        role=abs(z)>.65?1.0:(abs(CraftRepeat(z,.19,4.0))<.024?2.0:0.0);
    else if(kind==42.0||kind==43.0)
        role=abs(x)>.48?1.0:(y<-.25?2.0:0.0);
    else role=abs(z)>.60?1.0:0.0;
    float route=abs(CraftRepeat(z+x*.30,.48,3.0));
    if(route<.013&&role!=2.0)role=3.0;
    return role;
}
float CraftSurfaceBank(float x,float y,float z,float ex,float au)
{
    // Broad anatomical/assembly regions, never a repeating painted stripe.
    return y<-.28||abs(x)>.64&&abs(z)<.42?1.0:0.0;
}
float CraftMaterialTile(float material,float role,float bank)
{
    if(role==2.0)return bank>.5?6.0:2.0;
    if(role==3.0)return 3.0;
    if(material==4.0)return 7.0;
    if(material==2.0||material==5.0||material==6.0)return role==1.0?2.0:6.0;
    if(material==3.0||material==7.0||material==8.0)return 3.0;
    return role+bank*4.0;
}
