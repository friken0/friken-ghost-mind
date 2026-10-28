// Shader adapter to InfiniTexture's albedo-height + E/M/R/phase channels.
export const surfaceShader=`
vec2 cgSkinUV(vec2 uv,float tile){vec2 page=vec2(mod(tile,4.0),floor(tile/4.0));vec2 pixel=vec2(1.0)/(skinSize/vec2(4.0,2.0));return (page+pixel+fract(uv*skinScale)*(1.0-pixel*2.0))/vec2(4.0,2.0);}
vec4 cgSurfaceTap(sampler2D tex,vec3 q,vec3 n,float tile){vec3 w=pow(abs(n),vec3(4.0));w/=max(w.x+w.y+w.z,.0001);return texture2D(tex,cgSkinUV(q.yz,tile))*w.x+texture2D(tex,cgSkinUV(q.xz,tile))*w.y+texture2D(tex,cgSkinUV(q.xy,tile))*w.z;}
void cgSkin(vec3 p,inout vec3 n,out vec4 alb,out vec4 matrix){
 float a=orbit.x+gaze.x*.22+sin(clock*.12)*.15,b=orbit.y+gaze.y*.11;
 p.xz*=rot(a);p.yz*=rot(b);vec3 nn=n;nn.xz*=rot(a);nn.yz*=rot(b);
 LivingResolve(p*UNIT+ORIGIN,nn,clock);
 alb=cgSurfaceTap(skinAlbedo,LivingCoord,LivingNormal,LivingTile);matrix=cgSurfaceTap(skinMatrix,LivingCoord,LivingNormal,LivingTile);
 vec3 grad=vec3(cgSurfaceTap(skinAlbedo,LivingCoord+vec3(.012,0,0),LivingNormal,LivingTile).a-alb.a,cgSurfaceTap(skinAlbedo,LivingCoord+vec3(0,.012,0),LivingNormal,LivingTile).a-alb.a,cgSurfaceTap(skinAlbedo,LivingCoord+vec3(0,0,.012),LivingNormal,LivingTile).a-alb.a)*2.2;
 grad-=LivingNormal*dot(grad,LivingNormal);nn=normalize(LivingNormal-grad);
 nn.xy=CraftRotate(nn.xy,LivingSpin);nn=CraftForward(nn,LivingAngles);nn.yz*=rot(-b);nn.xz*=rot(-a);n=normalize(nn);
}
`;
export const surfaceLighting=`
    if(skinReady<.5){col=vec3(.50,.56,.60)*(.3+diff*.7);}else{
    vec4 alb,pbr;cgSkin(p,n,alb,pbr);
    float rough=clamp(pbr.b,.10,.96),metal=pbr.g;
    vec3 base=pow(max(alb.rgb,vec3(.0)),vec3(2.2));
    diff=max(0.,dot(n,l));vec3 halfV=normalize(l-rd);
    float gloss=pow(max(0.,dot(n,halfV)),mix(112.,8.,rough))*(1.-rough*.72);
    vec3 f0=mix(vec3(.04),base,metal),sky=vec3(.15,.20,.27)+vec3(.22,.15,.07)*max(0.,reflect(rd,n).y);
    float fill=max(0.,dot(n,normalize(vec3(2.,.4,3.))));
    col=base*(.24+diff*.82+fill*.28)*(1.-metal*.35)*shade+f0*(gloss*2.8+sky*.45);
    col+=base*rim*.16+mix(ink,accent,mod(LivingTile,4.)/3.)*pbr.r*(.20+cymatics.x*.35+cymatics.w*.45)*(.7+.3*sin(clock*2.-pbr.a*6.283));
    }
`;
