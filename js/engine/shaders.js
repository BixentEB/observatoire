/* ======================================================================
   OBSERVATOIRE — shaders (repris du moteur du thème Héliosphère, Codex Mental)
   Ajouts : cartes de surface réelles (uMap), lumières nocturnes (uNight),
   anneaux texturés, rendu « uni » d'attente avant chargement d'une carte.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  var COMMON = [
  'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
  'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
  'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
  'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
  'float snoise(vec3 v){',
  '  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);',
  '  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);',
  '  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);',
  '  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;',
  '  i=mod289(i);',
  '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
  '  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;',
  '  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);',
  '  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);',
  '  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);',
  '  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));',
  '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
  '  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);',
  '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
  '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
  '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;',
  '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
  '}',
  'float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}',
  'vec3 hash33(vec3 p3){p3=fract(p3*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yxz+33.33);return fract((p3.xxy+p3.yxx)*p3.zyx);}',
  'float fbm(vec3 p,float fp){ float s=0.0,a=0.5; for(int i=0;i<6;i++){ float k=1.0-smoothstep(0.4,1.1,fp); s+=a*k*snoise(p); p=p*2.03+vec3(1.7,9.2,3.1);fp*=2.03;a*=0.5; } return s; }',
  'vec3 rotY(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(c*v.x-s*v.z,v.y,s*v.x+c*v.z);}',
  'float ringDensity(float t){',
  '  float n=snoise(vec3(t*60.0,3.7,0.0))*0.5+0.5; float n2=snoise(vec3(t*170.0,1.3,5.0))*0.5+0.5;',
  '  float d=0.22+0.55*n+0.35*n2*n2;',
  '  d*=smoothstep(0.0,0.04,t)*(1.0-smoothstep(0.95,1.0,t));',
  '  return clamp(d,0.0,1.0);',
  '}'
  ].join('\n');

  var PLANET_VERT = [
  'varying vec3 vObj; varying vec3 vWPos; varying vec3 vWN; varying vec2 vUv;',
  'void main(){ vObj=normalize(position); vUv=uv; vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz;',
  '  vWN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*wp; }'
  ].join('\n');

  /* uType : 0 rocheux à cratères, 1 désertique, 3 géante à bandes, 4 uni (attente d'une carte) */
  var PLANET_FRAG = [
  'uniform float uType,uScale,uSeed,uTime,uRelief,uClouds,uBands,uWarp,uStorm,uIce,uAtmoK,uGloss,uStormLat,uStormLon,uRadius,uHasMap,uHasNight,uHasRingTex;',
  'uniform vec3 uC0,uC1,uC2,uC3,uC4,uAtmo,uRingN,uCenter,uSun;',
  'uniform vec2 uRing; uniform sampler2D uMap,uNight,uRingTex;',
  'varying vec3 vObj; varying vec3 vWPos; varying vec3 vWN; varying vec2 vUv;',
  COMMON,
  'float craters(vec3 p,float freq,float fw){',
  '  vec3 q=p*freq; vec3 ip=floor(q); vec3 fq=q-ip; float vis=1.0-smoothstep(0.25,0.8,fw*freq); float h=0.0;',
  '  for(int x=-1;x<=1;x++){ for(int y=-1;y<=1;y++){ for(int z=-1;z<=1;z++){',
  '    vec3 g=vec3(float(x),float(y),float(z)); vec3 o=hash33(ip+g); float has=step(0.42,hash13(ip+g+17.3));',
  '    float r=0.16+0.30*o.z; vec3 c=g+0.2+0.6*o-fq; float d=length(c)/r;',
  '    float bowl=-(1.0-smoothstep(0.15,1.0,d)); float rim=exp(-pow((d-1.02)*5.5,2.0))*0.55;',
  '    h+=has*(bowl+rim)*(0.4+r*1.6);',
  '  }}}',
  '  return h*vis;',
  '}',
  'vec3 bumpN(vec3 P,vec3 N,float h){ vec3 dpdx=dFdx(P); vec3 dpdy=dFdy(P); float dhx=dFdx(h); float dhy=dFdy(h);',
  '  vec3 r1=cross(dpdy,N); vec3 r2=cross(N,dpdx); float det=dot(dpdx,r1); vec3 grad=sign(det)*(dhx*r1+dhy*r2);',
  '  return normalize(abs(det)*N-grad); }',
  'void main(){',
  '  vec3 Ng=normalize(vWN); vec3 V=normalize(cameraPosition-vWPos); vec3 L=normalize(uSun-vWPos);',
  '  float fw=length(fwidth(vObj)); float ndlG=dot(Ng,L);',
  '  vec3 alb=vec3(0.5); float h=0.0; float oceanMask=0.0; float cloudA=0.0; vec3 emis=vec3(0.0);',
  '  if(uHasMap>0.5){',
  '    vec3 tx=texture2D(uMap,vUv).rgb; alb=tx;',
  '    oceanMask=smoothstep(0.02,0.12,tx.b-max(tx.r,tx.g))*uGloss;',
  '    h=(1.0-oceanMask)*dot(tx,vec3(0.33))*0.6;',
  '  } else if(uType<0.5){',
  '    vec3 pp=vObj*uScale+uSeed; float fs=fw*uScale;',
  '    float big=fbm(pp*0.8,fs*0.8); float det=fbm(pp*3.0,fs*3.0);',
  '    float cr=craters(vObj+uSeed*0.37,3.2,fw)*0.9+craters(vObj+uSeed,10.0,fw)*0.6;',
  '    h=cr*0.9+det*0.25+big*0.2;',
  '    alb=mix(uC0,uC1,0.5+0.5*det); alb=mix(alb,uC2,smoothstep(0.02,0.32,big)*uIce);',
  '    alb*=0.84+0.34*smoothstep(-0.25,0.6,cr); alb=mix(alb,uC3,smoothstep(0.35,1.0,cr)*0.28);',
  '  } else if(uType<1.5){',
  '    vec3 pp=vObj*uScale+uSeed; float fs=fw*uScale;',
  '    float cont=fbm(pp,fs); float det=fbm(pp*4.0,fs*4.0); float cr=craters(vObj+uSeed,6.0,fw)*0.45;',
  '    h=cont*0.5+det*0.2+cr;',
  '    alb=mix(uC0,uC1,smoothstep(-0.3,0.5,cont)); alb=mix(alb,uC2,smoothstep(0.05,0.5,-cont)*0.85); alb*=0.88+0.24*det;',
  '    float cap=smoothstep(0.88-0.05*cont,0.95,abs(vObj.y))*uIce; alb=mix(alb,vec3(0.92,0.94,0.97),cap);',
  '  } else if(uType<3.5){',
  '    float lat=vObj.y; float ang=uTime*0.02*(0.6+sin(lat*uBands*0.7)); vec3 q=rotY(vObj,ang);',
  '    float w=fbm(q*vec3(2.0,8.0,2.0)+uSeed,fw*8.0); float y=lat+uWarp*w;',
  '    float b1=0.5+0.5*sin(y*uBands*3.14159+1.7*sin(y*uBands*0.9)); float b2=0.5+0.5*snoise(vec3(0.0,y*uBands*0.8,uSeed));',
  '    float fine=fbm(q*vec3(2.5,24.0,2.5)+uSeed*2.0,fw*24.0);',
  '    float t=clamp(b1*0.55+b2*0.45+fine*0.12,0.0,1.0);',
  '    alb=t<0.5?mix(uC0,uC1,t*2.0):mix(uC1,uC2,(t-0.5)*2.0); alb=mix(alb,uC3,smoothstep(0.7,1.0,fine*0.5+0.5)*0.25);',
  '    if(uStorm>0.0){ float lon=atan(vObj.z,vObj.x); float dl=mod(lon-uStormLon+3.14159,6.28318)-3.14159; float dy=lat-uStormLat;',
  '      float d2=(dl*dl)/(0.30*0.30)+(dy*dy)/(0.10*0.10); float st=1.0-smoothstep(0.15,1.0,d2);',
  '      alb=mix(alb,uC4,st*uStorm*(0.65+0.35*fbm(vObj*14.0+uSeed,fw*14.0))); }',
  '    alb*=1.0-0.25*smoothstep(0.75,1.0,abs(lat));',
  '  } else {',
  '    float n=fbm(vObj*2.0+uSeed,fw*2.0); alb=mix(uC0,uC1,0.5+0.4*n);',
  '  }',
  /* couche nuageuse illustrative (Terre) */
  '  if(uClouds>0.0){',
  '    vec3 cp=rotY(vObj,-uTime*0.004)*2.3+5.0; float cf=fw*2.3;',
  '    float cn=fbm(cp,cf)+0.5*fbm(cp*2.1+4.0,cf*2.1); float t0=0.30-0.5*uClouds;',
  '    cloudA=smoothstep(t0,t0+0.55,cn)*0.7; alb=mix(alb,vec3(1.0),cloudA); oceanMask*=(1.0-cloudA); h*=(1.0-cloudA);',
  '  }',
  '  vec3 N=Ng;',
  '  if(uRelief>0.0){ vec3 Nb=bumpN(vWPos,Ng,h*uRelief); N=normalize(mix(Ng,Nb,smoothstep(0.05,0.35,dot(Ng,V)))); }',
  '  float ndl=dot(N,L); float soft=mix(max(ndl,0.0),smoothstep(-0.12,0.9,ndl),uAtmoK*0.6);',
  '  float shadow=1.0;',
  '  if(uRing.y>0.0){ float dn=dot(L,uRingN); if(abs(dn)>0.002){ float tt=dot(uCenter-vWPos,uRingN)/dn;',
  '    if(tt>0.0){ vec3 hp=vWPos+L*tt; float rr=length(hp-uCenter)/uRadius;',
  '      if(rr>uRing.x&&rr<uRing.y){ float rt=(rr-uRing.x)/(uRing.y-uRing.x);',
  '        float dens=uHasRingTex>0.5?texture2D(uRingTex,vec2(rt,0.5)).a:ringDensity(rt)*0.3; shadow*=1.0-0.85*dens; } } } }',
  '  float lit=soft*shadow;',
  '  float nightFill=(1.0-smoothstep(-0.12,0.28,ndlG))*0.12; float facing=0.55+0.45*max(dot(Ng,V),0.0);',
  '  vec3 col=alb*(lit*1.35+0.03+nightFill*facing);',
  '  vec3 Hh=normalize(L+V); float spec=pow(max(dot(N,Hh),0.0),220.0)*oceanMask*max(ndlG,0.0)*shadow; col+=vec3(1.0,0.95,0.85)*spec*0.45;',
  '  if(uHasNight>0.5){ float night=1.0-smoothstep(-0.18,0.06,ndlG); vec3 nl=texture2D(uNight,vUv).rgb; emis=nl*nl*vec3(1.0,0.82,0.55)*night*(1.0-cloudA*0.85)*2.2; }',
  '  col+=emis;',
  '  float rim=pow(1.0-max(dot(Ng,V),0.0),3.0); float litG=smoothstep(-0.2,0.5,ndlG);',
  '  col+=uAtmo*rim*litG*uAtmoK*1.25; float tw=exp(-pow(ndlG*4.0,2.0)); col+=uAtmo*vec3(1.0,0.55,0.35)*rim*tw*uAtmoK*0.5;',
  '  gl_FragColor=vec4(col,1.0);',
  '}'
  ].join('\n');

  var RING_VERT = [
  'varying float vRad; varying vec3 vWPos;',
  'void main(){ vRad=length(position.xy); vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }'
  ].join('\n');
  var RING_FRAG = [
  'uniform vec3 uCenter,uRingN,uTint,uSun; uniform float uRadius,uIn,uOut,uHasTex,uAlphaK; uniform sampler2D uTex;',
  'varying float vRad; varying vec3 vWPos;',
  COMMON,
  'void main(){',
  '  float t=(vRad-uIn)/(uOut-uIn); vec3 base; float d;',
  '  if(uHasTex>0.5){ vec4 tx=texture2D(uTex,vec2(t,0.5)); base=tx.rgb; d=tx.a; }',
  '  else { d=ringDensity(t); base=uTint*mix(0.7,1.2,d); }',
  '  vec3 L=normalize(uSun-vWPos); vec3 V=normalize(cameraPosition-vWPos); vec3 c=uCenter-vWPos;',
  '  float tt=dot(c,L); float sh=1.0; if(tt>0.0){ float dist=length(c-L*tt); sh=smoothstep(uRadius*0.97,uRadius*1.03,dist); }',
  '  float side=abs(dot(uRingN,L)); float amt=0.25+0.9*side; float opp=step(dot(uRingN,L)*dot(uRingN,V),0.0);',
  '  vec3 col=base*amt*(0.06+0.94*sh)*1.4;',
  '  gl_FragColor=vec4(col,d*uAlphaK*mix(1.0,0.75,opp));',
  '}'
  ].join('\n');

  var ATMO_VERT = [
  'varying vec3 vN; varying vec3 vWPos;',
  'void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }'
  ].join('\n');
  var ATMO_FRAG = [
  'uniform vec3 uAtmo,uSun; uniform float uK,uCmax; varying vec3 vN; varying vec3 vWPos;',
  'void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vWPos); vec3 L=normalize(uSun-vWPos);',
  '  float x=clamp(-dot(N,V)/uCmax,0.0,1.0); float a=pow(x,2.6); float lit=smoothstep(-0.35,0.45,dot(N,L));',
  '  gl_FragColor=vec4(uAtmo*a*lit*uK,1.0); }'
  ].join('\n');

  var SUN_VERT = [
  'varying vec3 vObj; varying vec3 vN; varying vec3 vV;',
  'void main(){ vObj=normalize(position); vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var SUN_FRAG = [
  'uniform float uTime; uniform vec3 uTint; uniform float uSpots; varying vec3 vObj; varying vec3 vN; varying vec3 vV;',
  COMMON,
  'vec3 ramp(float h){ vec3 a=vec3(0.42,0.12,0.02); vec3 b=vec3(0.92,0.46,0.12); vec3 c=vec3(1.0,0.78,0.42); vec3 d=vec3(1.0,0.96,0.82);',
  '  if(h<0.4) return mix(a,b,h/0.4); if(h<0.7) return mix(b,c,(h-0.4)/0.3); return mix(c,d,clamp((h-0.7)/0.3,0.0,1.0)); }',
  'void main(){ float t=uTime; vec3 p=rotY(vObj,t*0.02); float fw=length(fwidth(vObj));',
  '  float g1=fbm(p*5.0+vec3(0.0,0.0,t*0.05),fw*5.0);',
  '  float g2=snoise(p*22.0+vec3(t*0.2,0.0,0.0))*(1.0-smoothstep(0.2,0.8,fw*22.0));',
  '  float g3=snoise(p*60.0+vec3(0.0,t*0.3,0.0))*(1.0-smoothstep(0.2,0.8,fw*60.0));',
  '  float spot=smoothstep(0.46,0.62,fbm(p*2.4+vec3(4.0),fw*2.4))*0.8*uSpots;',
  '  float heat=0.7+0.1*g1+0.12*g2+0.07*g3-0.3*spot;',
  '  float mu=clamp(dot(normalize(vN),normalize(vV)),0.0,1.0); float limb=0.3+0.7*pow(mu,0.55); heat*=limb;',
  '  vec3 col=ramp(clamp(heat,0.0,1.0)); col*=1.2+1.0*pow(clamp(heat,0.0,1.0),3.0); col=mix(col,col*vec3(1.0,0.78,0.6),(1.0-mu)*0.6);',
  /* teinte selon le type d'étoile (blanc = Soleil) : on garde la luminance, on change la couleur */
  '  float lum=dot(col,vec3(0.3,0.55,0.15)); vec3 tinted=lum*uTint*1.6; col=mix(col,tinted,clamp(length(uTint-vec3(1.0,0.82,0.6))*2.2,0.0,0.9));',
  '  gl_FragColor=vec4(col,1.0); }'
  ].join('\n');

  /* Fond du ciel : Voie lactée calculée une fois (bande alignée sur le vrai plan galactique) */
  var SKY_VERT = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  var SKY_FRAG = [
  'uniform vec3 uGalN; uniform vec3 uGalC; varying vec2 vUv;',
  COMMON,
  'void main(){',
  '  float lon=(vUv.x-0.5)*6.28318; float lat=(vUv.y-0.5)*3.14159;',
  '  vec3 d=vec3(cos(lat)*cos(lon),sin(lat),-cos(lat)*sin(lon));',   /* même direction que le sommet de la sphère du ciel */
  '  float g=dot(d,uGalN); float band=exp(-g*g*14.0); float core=exp(-g*g*60.0);',
  '  vec3 q=d*3.0; float n1=fbm(q,0.0)*0.5+0.5; float n2=fbm(q*2.3+7.0,0.0)*0.5+0.5;',
  '  float dust=smoothstep(0.45,0.8,fbm(q*1.7+3.0,0.0)*0.5+0.5);',
  '  float cen=pow(max(dot(d,uGalC),0.0),3.0);',
  '  float glow=band*(0.08+0.14*n1)+core*(0.10+0.25*cen)*(0.5+n2); glow*=1.0-0.75*dust*band;',
  '  vec3 warm=vec3(1.0,0.78,0.55); vec3 cool=vec3(0.55,0.65,1.0);',
  '  vec3 col=mix(cool,warm,clamp(core*1.2+cen*0.5,0.0,1.0))*glow*0.36;',
  '  float neb=fbm(d*1.4+21.0,0.0)*0.5+0.5; col+=vec3(0.30,0.12,0.45)*smoothstep(0.55,0.85,neb)*0.04;',
  '  col+=0.003; gl_FragColor=vec4(col,1.0);',
  '}'
  ].join('\n');

  var STAR_VERT = [
  'attribute float aSize; attribute vec3 aColor; uniform float uPR; varying vec3 vC;',
  'void main(){ vC=aColor; gl_PointSize=aSize*uPR; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'
  ].join('\n');
  var STAR_FRAG = 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.0,0.5,d); a*=a; gl_FragColor=vec4(vC*a,1.0); }';

  /* Points d'astéroïdes : taille en unités de scène, atténuée par la distance */
  var DUST_VERT = [
  'attribute float aSize; attribute vec3 aColor; uniform float uPR,uScaleH; varying vec3 vC;',
  'void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=clamp(aSize*uPR*uScaleH/(-mv.z),1.0,6.0*uPR); gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var DUST_FRAG = 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.2,0.5,d); gl_FragColor=vec4(vC*a,1.0); }';

  var FINAL_VERT = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
  var FINAL_FRAG = [
  'uniform sampler2D tDiffuse; uniform float uTime,uFade; uniform vec2 uRes; varying vec2 vUv;',
  'float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
  'vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }',
  'void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; c=aces(c*0.92); vec2 d=vUv-0.5; c*=1.0-dot(d,d)*0.8;',
  '  float g=h21(vUv*uRes+fract(uTime)*91.7)-0.5; c+=g*0.018; c*=uFade; gl_FragColor=vec4(c,1.0); }'
  ].join('\n');

  OBS.GLSL = {
    PLANET_VERT: PLANET_VERT, PLANET_FRAG: PLANET_FRAG, RING_VERT: RING_VERT, RING_FRAG: RING_FRAG,
    ATMO_VERT: ATMO_VERT, ATMO_FRAG: ATMO_FRAG, SUN_VERT: SUN_VERT, SUN_FRAG: SUN_FRAG,
    SKY_VERT: SKY_VERT, SKY_FRAG: SKY_FRAG, STAR_VERT: STAR_VERT, STAR_FRAG: STAR_FRAG,
    DUST_VERT: DUST_VERT, DUST_FRAG: DUST_FRAG, FINAL_VERT: FINAL_VERT, FINAL_FRAG: FINAL_FRAG
  };
})();
