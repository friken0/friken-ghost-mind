// Shared interior test and smooth escape count used by terminal surveys and GPU cave relief.
export function mandelEscape(x,y,limit){
 const q=(x-.25)**2+y*y;
 if(q*(q+x-.25)<.25*y*y||(x+1)**2+y*y<.0625)return -1;
 // Periodicity check (Brent): an orbit that returns to a saved point is a
 // cycle and never escapes, so inside points stop early. Same picture.
 let a=0,b=0,sa=0,sb=0,check=8,n=0;
 for(let i=0;i<limit;i++){
  const aa=a*a,bb=b*b;
  if(aa+bb>256)return i+1-Math.log2(Math.log2(aa+bb)/2);
  b=2*a*b+y;a=aa-bb+x;
  if(Math.abs(a-sa)<1e-13&&Math.abs(b-sb)<1e-13)return -1;
  if(++n===check){sa=a;sb=b;n=0;check*=2;}
 }
 return -1;
}

// Every fractal family's escape loop (ids follow ansi-fractal's fractalFamilies).
// Pure, no DOM: shared by the renderers and the escape-grid workers.
export function escapeFamily(x,y,family,limit){
 if(family===0)return mandelEscape(x,y,limit);
 const julia=family===1;
 let a=julia?x:0,b=julia?y:0,previousA=0,previousB=0,sa=a,sb=b,pcheck=8,pn=0;
 const cr=julia?-.7:x,ci=julia?.27015:y;
 for(let i=0;i<limit;i++){
  const aa=a*a,bb=b*b;
  if(aa+bb>256)return i+1-Math.log2(Math.log2(aa+bb)/2);
  let real=aa-bb, imag=2*a*b;
  switch(family){
   case 2: imag=Math.abs(imag); break;
   case 3: imag=-imag; break;
   case 4: real=a*(aa-3*bb);imag=b*(3*aa-bb);break;
   case 5: real=Math.abs(real);break;
   case 6: imag=-2*Math.abs(a)*b;break;
   case 7: real-=.48*previousA;imag-=.48*previousB;break;
   case 8: real=Math.abs(real);imag=-Math.abs(imag);break;
   case 9: real=Math.abs(real);imag=-2*Math.abs(a)*b;break;
   case 10: {const fourth=real*real-imag*imag;imag=2*real*imag;real=fourth;break;}
   case 11: real=Math.abs(a)*(aa-3*bb);imag=Math.abs(b)*(3*aa-bb);break;
  }
  previousA=a;previousB=b;
  a=real+cr;b=imag+ci;
  // Periodicity check (Brent): a revisited point is a cycle, never escapes.
  if(family!==7){if(Math.abs(a-sa)<1e-13&&Math.abs(b-sb)<1e-13)return -1;if(++pn===pcheck){sa=a;sb=b;pn=0;pcheck*=2;}}
 }
 return -1;
}
