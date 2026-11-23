const ports=[[.12,.65],[.24,.31],[.34,.78],[.44,.47],[.56,.23],[.62,.73],[.74,.43],[.87,.23],[.88,.81]];
function paint(canvas,solo=-1){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;
 const c=canvas.getContext('2d');c.scale(d,d);
 function oval(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill()}
 function poly(points,color){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill()}
 function island(x,y,s,k){c.save();c.translate(x,y);c.scale(s,s);
 const coast=(a,b,t,color)=>{let p=[];for(let i=0;i<80;i++){let r=i*Math.PI/40,v=1+.09*Math.sin(3*r+k)+.045*Math.cos(6*r-k);p.push([a*v*Math.cos(r),t+b*v*Math.sin(r)])}poly(p,color)};
 coast(64,29,7,'#c4efdf');coast(57,24,6,'#599e92');coast(57,23,2,'#dca864');coast(56,23,-1,'#ffe1a0');coast(49,19,-4,'#89ad5a');coast(48,18,-6,'#b7ce75');
 function pine(a,b,z){c.save();c.translate(a,b);c.scale(z,z);poly([[-2,0],[3,0],[2,-20],[-2,-19]],'#835d40');for(let j=0;j<3;j++){let t=-5-j*7,l=12-j*2;poly([[-l,t],[0,t-18],[l,t]],'#317d5d');poly([[0,t-18],[l,t],[2,t]],'#205e49')}c.restore()}
 function palm(a,b){poly([[a-2,b],[a+3,b],[a+6,b-33],[a+3,b-34]],'#936e46');for(let j=0;j<6;j++){let v=(j-2.5)*8;poly([[a+4,b-32],[a+v*.5,b-43+Math.abs(v)*.2],[a+v,b-38+Math.abs(v)*.55],[a+v*.45,b-35]],j%2?'#368668':'#21694f')}}
 if(k===0||k===4){palm(-19,-8);palm(16,-13)}
 if(k===1||k===5){pine(-22,-8,.88);pine(-5,-16,1.1);pine(20,-7,.78)}
 if(k===2||k===6||k===8){poly([[-37,-6],[-12,-44],[9,-8]],'#899c88');poly([[-12,-44],[9,-8],[-8,-11]],'#577d76');poly([[-17,-36],[-12,-44],[-6,-34],[-12,-37]],'#f9f6dc');pine(23,-8,.76)}
 if(k===3||k===7){poly([[-10,-9],[-7,-48],[6,-48],[11,-9]],'#fff2cf');poly([[-8,-33],[7,-33],[8,-25],[-9,-25]],'#e17b57');poly([[-8,-48],[-8,-59],[7,-59],[7,-48]],'#345d5a');poly([[-12,-59],[0,-68],[12,-59]],'#d26547');oval(0,-54,3,3,'#ffcf66');pine(22,-8,.55)}
 for(let j=0;j<4;j++)oval(-37+j*19,3+Math.sin(j+k)*5,3,1.4,'#8ba455');c.restore()}
 if(solo>=0){const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#e4f5dd');grad.addColorStop(1,'#a6dfd4');c.fillStyle=grad;c.fillRect(0,0,w,h);oval(w*.75,h*.27,14,14,'#fff4c0');island(w*.5,h*.68,Math.min(h/84,w/145),solo);return}
 const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#c4eddf');g.addColorStop(.52,'#9adcd8');g.addColorStop(1,'#84cfcd');c.fillStyle=g;c.fillRect(0,0,w,h);
 let seed=71;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647}
 for(let i=0;i<220;i++){let x=rand()*w,y=rand()*h,r=3+rand()*9;c.strokeStyle=i%3?'#e3f6e26b':'#61b8b640';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+r,y+3,x+r*2,y);c.stroke()}
 c.strokeStyle='#3c938d';c.lineWidth=2.5;c.setLineDash([4,7]);c.lineCap='round';c.beginPath();ports.forEach(([x,y],i)=>{if(!i)c.moveTo(x*w,y*h);else {let [a,b]=ports[i-1];c.bezierCurveTo(a*w+(i%2?-.04:.08)*w,(b+.13)*h,(x-.10)*w,(y+.11)*h,x*w,y*h)}});c.stroke();c.setLineDash([]);
 ports.forEach(([x,y],k)=>island(x*w,y*h,Math.min(w/700,h/325)*(k===0?1.13:.94),k));
 function boat(x,y,s){c.save();c.translate(x,y);c.scale(s,s);oval(0,4,18,4,'#e3f8ea');poly([[-15,-1],[17,-1],[10,5],[-8,5]],'#a86c45');poly([[-1,-4],[-1,-29],[-15,-4]],'#fff6da');poly([[2,-24],[2,-4],[13,-4]],'#e7965d');c.restore()}boat(w*.39,h*.53,.95);boat(w*.12,h*.26,.7)
}
new ResizeObserver(()=>paint(document.querySelector('#sea'))).observe(document.querySelector('#sea'));
