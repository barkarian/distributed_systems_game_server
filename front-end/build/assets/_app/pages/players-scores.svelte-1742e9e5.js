import{S as e,i as t,s,e as a,t as c,j as l,c as n,a as r,b as o,l as i,d as u,f as h,g as f,h as _,o as p,H as d,I as v,n as m,J as g,K as y}from"../chunks/index-bf7fb778.js";/* empty css                                */function k(e,t,s){const a=e.slice();return a[6]=t[s],a}function b(e){let t,s=e[6].ttt_score+"";return{c(){t=c(s)},l(e){t=o(e,s)},m(e,s){h(e,t,s)},p(e,a){2&a&&s!==(s=e[6].ttt_score+"")&&_(t,s)},d(e){e&&u(t)}}}function E(e){let t,s=e[6].chess_score+"";return{c(){t=c(s)},l(e){t=o(e,s)},m(e,s){h(e,t,s)},p(e,a){2&a&&s!==(s=e[6].chess_score+"")&&_(t,s)},d(e){e&&u(t)}}}function L(e,t){let s,p,d,v,m,g=t[6].user_name+"",y=t[6].user_email+"";function k(e,t){return"1"==e[0]?E:b}let L=k(t),S=L(t);return{key:e,first:null,c(){s=a("li"),p=c(g),d=c(y),v=c(" = \r\n        "),S.c(),m=l(),this.h()},l(e){s=n(e,"LI",{});var t=r(s);p=o(t,g),d=o(t,y),v=o(t," = \r\n        "),S.l(t),m=i(t),t.forEach(u),this.h()},h(){this.first=s},m(e,t){h(e,s,t),f(s,p),f(s,d),f(s,v),S.m(s,null),f(s,m)},p(e,a){t=e,2&a&&g!==(g=t[6].user_name+"")&&_(p,g),2&a&&y!==(y=t[6].user_email+"")&&_(d,y),L===(L=k(t))&&S?S.p(t,a):(S.d(1),S=L(t),S&&(S.c(),S.m(s,m)))},d(e){e&&u(s),S.d()}}}function S(e){let t,s,_,b,E,S,j,w,x,I,O,T,$,N,P=[],U=new Map,A=e[1];const B=e=>e[6].user_id;for(let a=0;a<A.length;a+=1){let t=k(e,A,a),s=B(t);U.set(s,P[a]=L(s,t))}return{c(){t=a("h1"),s=c("Score boards"),_=l(),b=a("label"),E=a("input"),S=c("\r\n\tchess"),j=l(),w=a("label"),x=a("input"),I=c("\r\n\ttic-tac-toe"),O=l(),T=a("ul");for(let e=0;e<P.length;e+=1)P[e].c();this.h()},l(e){t=n(e,"H1",{});var a=r(t);s=o(a,"Score boards"),a.forEach(u),_=i(e),b=n(e,"LABEL",{});var c=r(b);E=n(c,"INPUT",{type:!0,value:!0}),S=o(c,"\r\n\tchess"),c.forEach(u),j=i(e),w=n(e,"LABEL",{});var l=r(w);x=n(l,"INPUT",{type:!0,value:!0}),I=o(l,"\r\n\ttic-tac-toe"),l.forEach(u),O=i(e),T=n(e,"UL",{});var h=r(T);for(let t=0;t<P.length;t+=1)P[t].l(h);h.forEach(u),this.h()},h(){p(E,"type","radio"),E.__value=1,E.value=E.__value,e[3][0].push(E),p(x,"type","radio"),x.__value=2,x.value=x.__value,e[3][0].push(x)},m(a,c){h(a,t,c),f(t,s),h(a,_,c),h(a,b,c),f(b,E),E.checked=E.__value===e[0],f(b,S),h(a,j,c),h(a,w,c),f(w,x),x.checked=x.__value===e[0],f(w,I),h(a,O,c),h(a,T,c);for(let e=0;e<P.length;e+=1)P[e].m(T,null);$||(N=[d(E,"change",e[2]),d(x,"change",e[4])],$=!0)},p(e,[t]){1&t&&(E.checked=E.__value===e[0]),1&t&&(x.checked=x.__value===e[0]),3&t&&(A=e[1],P=v(P,t,B,1,e,A,U,T,y,L,null,k))},i:m,o:m,d(s){s&&u(t),s&&u(_),s&&u(b),e[3][0].splice(e[3][0].indexOf(E),1),s&&u(j),s&&u(w),e[3][0].splice(e[3][0].indexOf(x),1),s&&u(O),s&&u(T);for(let e=0;e<P.length;e+=1)P[e].d();$=!1,g(N)}}}function j(e,t,s){let a=0,c=[];const l=async e=>{try{const t=await fetch("http://localhost:5001/player/get-players-scores",{method:"POST",headers:{"Content-Type":"application/json",token:localStorage.getItem("token")},body:JSON.stringify({game_type:e})}),a=await t.json();if("string"==typeof a)throw a;s(1,c=a),console.log(c)}catch(t){console.log(t)}};return e.$$.update=()=>{if(1&e.$$.dirty&&0!=a){switch(a){case 1:l("chess");break;case 2:l("tic-tac-toe")}l(a)}},[a,c,function(){a=this.__value,s(0,a)},[[]],function(){a=this.__value,s(0,a)}]}export default class extends e{constructor(e){super(),t(this,e,j,S,s,{})}}