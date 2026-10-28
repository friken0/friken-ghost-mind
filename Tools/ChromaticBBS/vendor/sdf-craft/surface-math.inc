// Canonical physical finish fields for the EXISTING InfiniTexture bake.
// Eight distinct material grammars, not eight tints. Periodic object UVs;
// channels: height / secondary pigment / edge wear / roughness. Bake-time only.
float SurfaceFrac(float x){return x-floor(x);}
float SurfaceMix(float a,float b,float t){return a+(b-a)*t;}
float SurfaceHash(float x,float y,float seed){
    float n=floor(x)*37.0+floor(y)*113.0+seed;
    n-=floor(n/4096.0)*4096.0;
    // Power-of-two reductions keep every integer exact on C#/Metal/JS.
    // Fold high bits back into low bits before the next quadratic mix.
    n=n*n+173.0;float high=floor(n/4096.0);n=n-high*4096.0+high*13.0;
    n-=floor(n/4096.0)*4096.0;
    n=n*n+89.0;high=floor(n/4096.0);n=n-high*4096.0+high*29.0;
    n-=floor(n/4096.0)*4096.0;return n/4096.0;
}
float SurfaceNoise(float u,float v,float seed,float cells){
    float x=u*cells,y=v*cells,ix=floor(x),iy=floor(y);
    float fx=SurfaceFrac(x),fy=SurfaceFrac(y);
    fx=fx*fx*(3.0-2.0*fx);fy=fy*fy*(3.0-2.0*fy);
    float xx=ix-floor(ix/cells)*cells,yy=iy-floor(iy/cells)*cells;
    float xn=xx+1.0-floor((xx+1.0)/cells)*cells;
    float yn=yy+1.0-floor((yy+1.0)/cells)*cells;
    return SurfaceMix(SurfaceMix(SurfaceHash(xx,yy,seed),SurfaceHash(xn,yy,seed),fx),
        SurfaceMix(SurfaceHash(xx,yn,seed),SurfaceHash(xn,yn,seed),fx),fy);
}
float SurfacePattern(float u,float v,float slot,float seed,float living,float channel){
    float pi=3.14159265359;
    float fine=SurfaceNoise(u,v,seed+43.0,64.0);
    float slow=SurfaceNoise(u,v,seed+71.0,8.0);
    float h=.50,pigment=0.0,wear=0.0,rough=.50;
    if(slot==0.0){ // directional brushed alloy / dermal growth fibers
        float grain=.5+.5*sin(u*128.0*pi+sin(v*8.0*pi)*1.2);
        float pore=max(0.0,(fine-.72)*3.0);
        h=.48+grain*.055-pore*.09;pigment=slow*.20;
        wear=pore;rough=.23+grain*.19+slow*.10+living*.24;
    }else if(slot==1.0){ // enamel/ceramic islands / overlapping keratin scutes
        float row=floor(v*8.0),fx=SurfaceFrac(u*8.0+SurfaceFrac(row*.5)*.5),fy=SurfaceFrac(v*8.0);
        float seam=min(min(fx,1.0-fx),min(fy,1.0-fy));
        float edge=max(0.0,1.0-seam/.055);
        float chip=edge*max(0.0,(fine-.38)*1.6);
        h=.59-edge*.27-chip*.11;pigment=chip*.70;
        wear=edge*.65;rough=.25+edge*.45+slow*.10;
    }else if(slot==2.0){ // machined bearing grooves / porous cartilage
        float ring=abs(sin((u*20.0+v*4.0)*pi));
        float pore=max(0.0,(fine-.54)*2.1);
        h=.51-ring*.10-pore*living*.20;
        pigment=ring*.22+pore*.65;wear=pow(ring,10.0)*.7;
        rough=.18+slow*.16+pore*.35+living*.18;
    }else if(slot==3.0){ // dark optical glass with embedded conductor junctions
        float fx=SurfaceFrac(u*6.0),fy=SurfaceFrac(v*6.0);
        float conductorDist=min(abs(fx-.5),abs(fy-.5));
        float route=max(0.0,1.0-conductorDist/.025);
        float node=max(0.0,1.0-sqrt((fx-.5)*(fx-.5)+(fy-.5)*(fy-.5))/.11);
        h=.44+route*.07+node*.08;pigment=max(route,node);
        wear=fine*.03;rough=.08+slow*.07;
    }else if(slot==4.0){ // textile warp/weft / collagen weave
        float warp=.5+.5*sin(u*48.0*pi),weft=.5+.5*sin(v*48.0*pi);
        float over=SurfaceFrac(floor(u*24.0)*.5+floor(v*24.0)*.5);
        h=.42+SurfaceMix(warp,weft,over)*.16;
        pigment=SurfaceMix(warp,weft,1.0-over)*.34;
        wear=max(0.0,(fine-.7)*1.2);rough=.73+slow*.16;
    }else if(slot==5.0){ // oxidation, mineral accretion / lichen colonies
        float cell=SurfaceNoise(u,v,seed+173.0,16.0);
        float boundary=abs(cell-.49);
        float crack=max(0.0,1.0-boundary/.035);
        h=.47+slow*.18-crack*.19;
        pigment=min(1.0,max(0.0,(slow-.32)*2.3));
        wear=crack*.75;rough=.58+pigment*.26;
    }else if(slot==6.0){ // carbon lamellae, gaskets / layered chitin
        float groove=pow(.5+.5*sin(v*32.0*pi+sin(u*4.0*pi)*.5),6.0);
        float fiber=.5+.5*sin((u+v)*96.0*pi);
        h=.52-groove*.20+fiber*.025;
        pigment=groove*.55;wear=(1.0-groove)*fine*.18;
        rough=.39+groove*.22+living*.15;
    }else{ // polished opaline mineral / translucent sensory nacre
        float growth=.5+.5*sin((u*4.0+v*6.0+slow*.8)*pi);
        h=.46+growth*.10+fine*.025;pigment=growth;
        wear=fine*.035;rough=.13+slow*.16;
    }
    if(channel==0.0)return min(1.0,max(0.0,h));
    if(channel==1.0)return min(1.0,max(0.0,pigment));
    if(channel==2.0)return min(1.0,max(0.0,wear));
    return min(1.0,max(0.0,rough));
}
