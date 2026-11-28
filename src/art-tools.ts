export type Mode='original'|'gray'|'tone2'|'tone3'|'tone5'|'outline'
export type ArtSettings={mode:Mode;brightness:number;contrast:number;saturation:number;grid:number;flipX:boolean;flipY:boolean;zoom:number;compare:boolean}
export const defaultArt=():ArtSettings=>({mode:'original',brightness:100,contrast:100,saturation:100,grid:0,flipX:false,flipY:false,zoom:1,compare:false})
export const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v))
export function fitRect(w:number,h:number,iw:number,ih:number){
 if(!(w>0&&h>0&&iw>0&&ih>0))return {width:0,height:0}
 const scale=Math.min(w/iw,h/ih)
 return {width:iw*scale,height:ih*scale}
}
export function panLimit(view:number,fit:number,zoom:number){return Math.max(0,(fit*zoom-view)/2)}
export function pixelGray(r:number,g:number,b:number){return .2126*r+.7152*g+.0722*b}
export function adjustedGray(r:number,g:number,b:number,brightness:number,contrast:number){
 return clamp((pixelGray(r,g,b)*brightness/100-128)*contrast/100+128,0,255)
}
export function quantize(value:number,levels:number){
 return Math.round(Math.round(clamp(value,0,255)*(levels-1)/255)*255/(levels-1))
}
export function needsCanvas(mode:Mode){return mode==='tone2'||mode==='tone3'||mode==='tone5'||mode==='outline'}
export function processPixels(source:Uint8ClampedArray,w:number,h:number,settings:ArtSettings):Uint8ClampedArray{
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||source.length!==w*h*4)throw Error('Invalid pixels')
 const result=new Uint8ClampedArray(source)
 if(!needsCanvas(settings.mode))return result
 const gray=new Float32Array(w*h)
 for(let i=0;i<gray.length;i++)gray[i]=adjustedGray(source[4*i],source[4*i+1],source[4*i+2],settings.brightness,settings.contrast)
 const levels=settings.mode==='tone2'?2:settings.mode==='tone3'?3:5
 const at=(x:number,y:number)=>gray[clamp(y,0,h-1)*w+clamp(x,0,w-1)]
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x
  let v=0
  if(settings.mode==='outline'){
   const gx=-at(x-1,y-1)+at(x+1,y-1)-2*at(x-1,y)+2*at(x+1,y)-at(x-1,y+1)+at(x+1,y+1)
   const gy=-at(x-1,y-1)-2*at(x,y-1)-at(x+1,y-1)+at(x-1,y+1)+2*at(x,y+1)+at(x+1,y+1)
   v=255-clamp(Math.hypot(gx,gy)*.8,0,255)
  }else v=quantize(gray[i],levels)
  result[4*i]=result[4*i+1]=result[4*i+2]=v
 }
 return result
}
