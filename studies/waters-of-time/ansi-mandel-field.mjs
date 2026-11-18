// Shared interior test and smooth escape count used by terminal surveys and GPU cave relief.
export function mandelEscape(x,y,limit){
 const q=(x-.25)**2+y*y;
 if(q*(q+x-.25)<.25*y*y||(x+1)**2+y*y<.0625)return -1;
 let a=0,b=0;
 for(let i=0;i<limit;i++){
  const aa=a*a,bb=b*b;
  if(aa+bb>256)return i+1-Math.log2(Math.log2(aa+bb)/2);
  b=2*a*b+y;a=aa-bb+x;
 }
 return -1;
}
