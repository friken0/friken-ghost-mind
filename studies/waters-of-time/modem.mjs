/* Exact PCM synthesis recovered from Masha 1, adapted only to module exports. */
const TAU=Math.PI*2,duration=17.6;
export const modemStages=[
 [0,'OFF HOOK / LISTENING TO 1990'],[.75,'ATDT :: 1990-2026'],
 [2.55,'REMOTE LINE / RINGING'],[3.25,'ANSWER TONE / ECHO SUPPRESSION'],
 [6,'V.8 MENU / OTHER UNIVERSE ANSWERING'],[7.6,'LINE PROBE / MEASURING THE VOID'],
 [9.1,'EQUALIZER / FINDING OUR SHARED FREQUENCY'],
 [11.4,'TRAINING / MOUNTING MEMORY RINGS'],
 [15.2,'CARRIER LOCK / THE DREAMER MATERIALIZING']
];
export function renderModem(rate){
 const pcm=new Float32Array(Math.ceil(duration*rate));let seed=0x19902026;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
 function add(start,len,fn,amp=.3,edge=.008){const lo=Math.round(start*rate),n=Math.round(len*rate);for(let i=0;i<n&&lo+i<pcm.length;i++){const t=i/rate,env=Math.min(1,t/edge,(len-t)/edge);pcm[lo+i]+=fn(t,i)*amp*Math.max(0,env);}}
 const sine=(f,t)=>Math.sin(TAU*f*t);
 // Relay, US dial tone, exact dual-tone keypad pairs and ringback.
 add(.015,.065,t=>((random()*2-1)*.7+sine(1300,t)*.3)*Math.exp(-t*65),.4,.0008);
 add(.10,.49,t=>(sine(350,t)+sine(440,t))*.5,.26);
 const digits='19902026',low=[697,770,852,941],high=[1209,1336,1477];
 for(let k=0;k<digits.length;k++){const d=+digits[k],r=d===0?3:Math.floor((d-1)/3),c=d===0?1:(d-1)%3;add(.77+k*.19,.115,t=>(sine(low[r],t)+sine(high[c],t))*.5,.38,.003);}
 add(2.56,.47,t=>(sine(440,t)+sine(480,t))*.5,.22);
 // ANSam: 2100 Hz, 15 Hz +/-20% amplitude, 180-degree reversals each 450 ms.
 add(3.25,2.70,t=>sine(2100,t)*(1+.2*sine(15,t))*(Math.floor(t/.45)%2?-1:1),.32);
 function fsk(start,len,mark,space,baud,amp){let phase=0,old=-1,bit=1;add(start,len,(t)=>{const k=Math.floor(t*baud);if(k!==old){old=k;bit=(k%80<10)?1:(random()>.5?1:0);}phase+=TAU*(bit?mark:space)/rate;return Math.sin(phase);},amp,.005);}
 fsk(6.02,.74,980,1180,300,.29);fsk(6.32,.88,1650,1850,300,.26);
 fsk(7.22,.14,980,1180,300,.26);
 // Alternating line probes: comb spectra reveal the telephone channel.
 add(7.6,.60,t=>{let v=0;for(let k=1;k<=10;k++)v+=sine(300*k,t+(k*k*.00071))*(k%2?.11:.075);return v;},.47);
 add(8.29,.62,t=>{let v=0;for(let k=1;k<=9;k++)v+=sine(330*k,t+(k*k*.00093))*.085;return v;},.44);
 add(8.99,.10,t=>sine(1800,t),.27);
 // Two training carriers, phase shifts first slow, then accelerating.
 add(9.14,.89,t=>sine(1200,t+(Math.floor(t*25)%4)/4800)+.34*sine(2400,t),.26);
 add(10.13,1.06,t=>sine(1800,t+(Math.floor(t*100)%4)/7200)+.25*sine(600,t),.30);
 // Scrambled I/Q symbols, pulse-shaped by a raised-cosine interpolation.
 function training(start,len,baud,amp){const count=Math.ceil(len*baud)+2,I=[],Q=[];for(let k=0;k<count;k++){I.push((Math.floor(random()*4)*2-3)/3);Q.push((Math.floor(random()*4)*2-3)/3);}add(start,len,t=>{const x=t*baud,k=Math.floor(x),u=(1-Math.cos(Math.PI*(x-k)))*.5;const a=I[k]*(1-u)+I[k+1]*u,b=Q[k]*(1-u)+Q[k+1]*u;return a*Math.cos(TAU*1800*t)-b*Math.sin(TAU*1800*t);},amp);}
 training(11.4,2.46,2400,.34);training(13.99,.96,2400,.33);
 fsk(15.20,.45,1650,1850,300,.27);training(15.81,1.25,2400,.34);
 add(17.12,.07,t=>(random()*2-1)*Math.exp(-t*75),.22,.001);
 // A tiny noisy line and room reflection; no modern sub-bass in a phone modem.
 for(let i=0;i<pcm.length;i++)if(i/rate<17.15)pcm[i]+=(random()*2-1)*.003;
 function biquad(kind,freq){const w=TAU*freq/rate,c=Math.cos(w),s=Math.sin(w),a=s/(2*Math.SQRT1_2),a0=1+a;const b0=(kind==='low'?(1-c):(1+c))/2/a0,b1=(kind==='low'?(1-c):-(1+c))/a0,b2=b0,a1=-2*c/a0,a2=(1-a)/a0;let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<pcm.length;i++){const x=pcm[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;pcm[i]=y;x2=x1;x1=x;y2=y1;y1=y;}}
 biquad('high',260);biquad('low',3400);biquad('low',3600);
 const delay=Math.round(rate*.0117);for(let i=pcm.length-1;i>=delay;i--)pcm[i]+=pcm[i-delay]*.08;
 let peak=0;for(let i=0;i<pcm.length;i++){pcm[i]=Math.tanh(pcm[i]*1.1);peak=Math.max(peak,Math.abs(pcm[i]));}
 const gain=.52/Math.max(peak,.001);for(let i=0;i<pcm.length;i++)pcm[i]*=gain;
 return pcm;
}
export const modemDuration=duration;
