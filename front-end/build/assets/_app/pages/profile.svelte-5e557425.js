import{S as e,i as t,s as a,e as n,t as l,c as r,a as o,b as s,d as c,f as i,g as u,h,j as f,l as _,k as d,o as m,H as p,I as g,K as v,n as y,B as T,M as k,N as w,J as E,P as I,p as $,q as N,r as O,w as P,x as b,y as j,D as x,E as U,C}from"../chunks/index-a2f0fece.js";import{u as S,i as L}from"../chunks/store-bfd594f8.js";import{g as H}from"../chunks/navigation-ecc5701b.js";function M(e,t,a){const n=e.slice();return n[10]=t[a],n}function A(e){let t,a,f,_=e[2].message+"";return{c(){t=n("p"),a=l("Message:"),f=l(_)},l(e){t=r(e,"P",{});var n=o(t);a=s(n,"Message:"),f=s(n,_),n.forEach(c)},m(e,n){i(e,t,n),u(t,a),u(t,f)},p(e,t){4&t&&_!==(_=e[2].message+"")&&h(f,_)},d(e){e&&c(t)}}}function B(e){let t,a,n,r="1"==e[10].user_role_official&&D(),o="1"==e[10].user_role_admin&&G();return{c(){t=l("-User is :"),r&&r.c(),a=f(),o&&o.c(),n=d()},l(e){t=s(e,"-User is :"),r&&r.l(e),a=_(e),o&&o.l(e),n=d()},m(e,l){i(e,t,l),r&&r.m(e,l),i(e,a,l),o&&o.m(e,l),i(e,n,l)},p(e,t){"1"==e[10].user_role_official?r||(r=D(),r.c(),r.m(a.parentNode,a)):r&&(r.d(1),r=null),"1"==e[10].user_role_admin?o||(o=G(),o.c(),o.m(n.parentNode,n)):o&&(o.d(1),o=null)},d(e){e&&c(t),r&&r.d(e),e&&c(a),o&&o.d(e),e&&c(n)}}}function D(e){let t;return{c(){t=l("Official")},l(e){t=s(e,"Official")},m(e,a){i(e,t,a)},d(e){e&&c(t)}}}function G(e){let t;return{c(){t=l("Admin")},l(e){t=s(e,"Admin")},m(e,a){i(e,t,a)},d(e){e&&c(t)}}}function J(e){let t,a,o,u,h;return{c(){t=n("input"),o=l("\r\n            Admin"),this.h()},l(e){t=r(e,"INPUT",{type:!0,value:!0}),o=s(e,"\r\n            Admin"),this.h()},h(){m(t,"type","radio"),t.__value=a={correlated_role:"user_role_admin",user_id:e[10].user_id},t.value=t.__value,e[4][0].push(t)},m(a,n){i(a,t,n),t.checked=t.__value===e[0],i(a,o,n),u||(h=p(t,"change",e[3]),u=!0)},p(e,n){2&n&&a!==(a={correlated_role:"user_role_admin",user_id:e[10].user_id})&&(t.__value=a,t.value=t.__value),1&n&&(t.checked=t.__value===e[0])},d(a){a&&c(t),e[4][0].splice(e[4][0].indexOf(t),1),a&&c(o),u=!1,h()}}}function F(e){let t,a,o,u,h;return{c(){t=n("input"),o=l("\r\n            Official"),this.h()},l(e){t=r(e,"INPUT",{type:!0,value:!0}),o=s(e,"\r\n            Official"),this.h()},h(){m(t,"type","radio"),t.__value=a={correlated_role:"user_role_official",user_id:e[10].user_id},t.value=t.__value,e[4][0].push(t)},m(a,n){i(a,t,n),t.checked=t.__value===e[0],i(a,o,n),u||(h=p(t,"change",e[5]),u=!0)},p(e,n){2&n&&a!==(a={correlated_role:"user_role_official",user_id:e[10].user_id})&&(t.__value=a,t.value=t.__value),1&n&&(t.checked=t.__value===e[0])},d(a){a&&c(t),e[4][0].splice(e[4][0].indexOf(t),1),a&&c(o),u=!1,h()}}}function V(e,t){let a,d,m,p,g,v,y,T,k=t[10].user_email+"",w=("1"==t[10].user_role_official||"1"==t[10].user_role_admin)&&B(t),E="1"!=t[10].user_role_admin&&J(t),I="1"!=t[10].user_role_official&&F(t);return{key:e,first:null,c(){a=n("div"),d=n("li"),m=n("div"),p=l(k),g=f(),w&&w.c(),v=f(),E&&E.c(),y=f(),I&&I.c(),T=f(),this.h()},l(e){a=r(e,"DIV",{});var t=o(a);d=r(t,"LI",{});var n=o(d);m=r(n,"DIV",{});var l=o(m);p=s(l,k),g=_(l),w&&w.l(l),l.forEach(c),v=_(n),E&&E.l(n),y=_(n),I&&I.l(n),n.forEach(c),T=_(t),t.forEach(c),this.h()},h(){this.first=a},m(e,t){i(e,a,t),u(a,d),u(d,m),u(m,p),u(m,g),w&&w.m(m,null),u(d,v),E&&E.m(d,null),u(d,y),I&&I.m(d,null),u(a,T)},p(e,a){t=e,2&a&&k!==(k=t[10].user_email+"")&&h(p,k),"1"==t[10].user_role_official||"1"==t[10].user_role_admin?w?w.p(t,a):(w=B(t),w.c(),w.m(m,null)):w&&(w.d(1),w=null),"1"!=t[10].user_role_admin?E?E.p(t,a):(E=J(t),E.c(),E.m(d,y)):E&&(E.d(1),E=null),"1"!=t[10].user_role_official?I?I.p(t,a):(I=F(t),I.c(),I.m(d,null)):I&&(I.d(1),I=null)},d(e){e&&c(a),w&&w.d(),E&&E.d(),I&&I.d()}}}function Y(e){let t,a,h,d,m,p=[],T=new Map,k=e[2].success&&A(e),w=e[1];const E=e=>e[10].user_id;for(let n=0;n<w.length;n+=1){let t=M(e,w,n),a=E(t);T.set(a,p[n]=V(a,t))}return{c(){t=n("h2"),a=l("Admin Table"),h=f(),k&&k.c(),d=f(),m=n("ul");for(let e=0;e<p.length;e+=1)p[e].c()},l(e){t=r(e,"H2",{});var n=o(t);a=s(n,"Admin Table"),n.forEach(c),h=_(e),k&&k.l(e),d=_(e),m=r(e,"UL",{});var l=o(m);for(let t=0;t<p.length;t+=1)p[t].l(l);l.forEach(c)},m(e,n){i(e,t,n),u(t,a),i(e,h,n),k&&k.m(e,n),i(e,d,n),i(e,m,n);for(let t=0;t<p.length;t+=1)p[t].m(m,null)},p(e,[t]){e[2].success?k?k.p(e,t):(k=A(e),k.c(),k.m(d.parentNode,d)):k&&(k.d(1),k=null),3&t&&(w=e[1],p=g(p,t,E,1,e,w,T,m,v,V,null,M))},i:y,o:y,d(e){e&&c(t),e&&c(h),k&&k.d(e),e&&c(d),e&&c(m);for(let t=0;t<p.length;t+=1)p[t].d()}}}function q(e,t,a){let n=0,l=[],r={};const o=async()=>{try{const e=await fetch("http://localhost:5000/auth/admin/get-all-users",{method:"GET",headers:{"Content-Type":"application/json",token:localStorage.getItem("token")}}),t=await e.json();if("string"==typeof t)throw t;a(1,l=t.sort())}catch(e){console.log(e)}},s=async e=>{await(async e=>{try{const t=await fetch("http://localhost:5000/auth/admin/set-role",{method:"POST",headers:{"Content-Type":"application/json",token:localStorage.getItem("token")},body:JSON.stringify(e)}),n=await t.json();if(console.log(n),"string"==typeof n)throw n;a(2,r=n)}catch(t){console.log(t)}})(e),e.correlated_role,o()};T((async()=>o()));return e.$$.update=()=>{1&e.$$.dirty&&0!=n&&s(n)},[n,l,r,function(){n=this.__value,a(0,n)},[[]],function(){n=this.__value,a(0,n)}]}class K extends e{constructor(e){super(),t(this,e,q,Y,a,{})}}function z(e,t,a){const n=e.slice();return n[15]=t[a],n}function Q(e,t,a){const n=e.slice();return n[18]=t[a],n}function R(e){let t,a;return{c(){t=n("p"),a=l("Finished🛑")},l(e){t=r(e,"P",{});var n=o(t);a=s(n,"Finished🛑"),n.forEach(c)},m(e,n){i(e,t,n),u(t,a)},d(e){e&&c(t)}}}function W(e){let t,a;return{c(){t=n("p"),a=l("In progress🔥")},l(e){t=r(e,"P",{});var n=o(t);a=s(n,"In progress🔥"),n.forEach(c)},m(e,n){i(e,t,n),u(t,a)},d(e){e&&c(t)}}}function X(e,t){let a,d,m,p,g,v,y,T,k,w,E,I,$=t[18].tournament_name+"",N=t[18].game_type+"",O=t[18].total_players+"",P=t[18].tournament_id+"";function b(e,t){return"0"==e[18].finished?W:R}let j=b(t),x=j(t);return{key:e,first:null,c(){a=n("li"),d=n("p"),m=l("name:"),p=l($),g=l(" game_type:"),v=l(N),y=l(" total_players:"),T=l(O),k=l("  id:"),w=l(P),E=f(),x.c(),I=f(),this.h()},l(e){a=r(e,"LI",{});var t=o(a);d=r(t,"P",{});var n=o(d);m=s(n,"name:"),p=s(n,$),g=s(n," game_type:"),v=s(n,N),y=s(n," total_players:"),T=s(n,O),n.forEach(c),k=s(t,"  id:"),w=s(t,P),E=_(t),x.l(t),I=_(t),t.forEach(c),this.h()},h(){this.first=a},m(e,t){i(e,a,t),u(a,d),u(d,m),u(d,p),u(d,g),u(d,v),u(d,y),u(d,T),u(a,k),u(a,w),u(a,E),x.m(a,null),u(a,I)},p(e,n){t=e,2&n&&$!==($=t[18].tournament_name+"")&&h(p,$),2&n&&N!==(N=t[18].game_type+"")&&h(v,N),2&n&&O!==(O=t[18].total_players+"")&&h(T,O),2&n&&P!==(P=t[18].tournament_id+"")&&h(w,P),j!==(j=b(t))&&(x.d(1),x=j(t),x&&(x.c(),x.m(a,I)))},d(e){e&&c(a),x.d()}}}function Z(e){let t,a,f;return{c(){t=n("p"),a=l("Tournament has been created.Tournament_id is:"),f=l(e[2])},l(n){t=r(n,"P",{});var l=o(t);a=s(l,"Tournament has been created.Tournament_id is:"),f=s(l,e[2]),l.forEach(c)},m(e,n){i(e,t,n),u(t,a),u(t,f)},p(e,t){4&t&&h(f,e[2])},d(e){e&&c(t)}}}function ee(e,t){let a,d,g,v,y,T,k,w,E=t[15].user_email+"";return{key:e,first:null,c(){a=n("li"),d=l(E),g=f(),v=n("input"),T=f(),this.h()},l(e){a=r(e,"LI",{});var t=o(a);d=s(t,E),g=_(t),v=r(t,"INPUT",{type:!0,value:!0}),T=_(t),t.forEach(c),this.h()},h(){m(v,"type","checkbox"),v.__value=y=t[15],v.value=v.__value,t[8][0].push(v),this.first=a},m(e,n){i(e,a,n),u(a,d),u(a,g),u(a,v),v.checked=~t[3].indexOf(v.__value),u(a,T),k||(w=p(v,"change",t[7]),k=!0)},p(e,a){t=e,1&a&&E!==(E=t[15].user_email+"")&&h(d,E),1&a&&y!==(y=t[15])&&(v.__value=y,v.value=v.__value),8&a&&(v.checked=~t[3].indexOf(v.__value))},d(e){e&&c(a),t[8][0].splice(t[8][0].indexOf(v),1),k=!1,w()}}}function te(e){let t,a,h,d,T,I,$,N,O,P,b,j,x,U,C,S,L,H,M,A,B,D,G,J,F,V,Y=[],q=new Map,K=[],R=new Map,W=e[1];const te=e=>e[18].tournament_id;for(let n=0;n<W.length;n+=1){let t=Q(e,W,n),a=te(t);q.set(a,Y[n]=X(a,t))}let ae=""!=e[2]&&Z(e),ne=e[0];const le=e=>e[15].user_id;for(let n=0;n<ne.length;n+=1){let t=z(e,ne,n),a=le(t);R.set(a,K[n]=ee(a,t))}return{c(){t=n("h2"),a=l("Official Table"),h=f(),d=n("h3"),T=l("Tournaments Created By You:"),I=f(),$=n("ul");for(let e=0;e<Y.length;e+=1)Y[e].c();N=f(),O=n("h3"),P=l("New Tournament Menu"),b=f(),ae&&ae.c(),j=f(),x=n("ul");for(let e=0;e<K.length;e+=1)K[e].c();U=f(),C=n("input"),S=f(),L=n("label"),H=n("input"),M=l("Chess\r\n"),A=n("input"),B=l("Tic Tac Toe"),D=f(),G=n("button"),J=l("Create tournament with those  players"),this.h()},l(e){t=r(e,"H2",{});var n=o(t);a=s(n,"Official Table"),n.forEach(c),h=_(e),d=r(e,"H3",{});var l=o(d);T=s(l,"Tournaments Created By You:"),l.forEach(c),I=_(e),$=r(e,"UL",{});var i=o($);for(let t=0;t<Y.length;t+=1)Y[t].l(i);i.forEach(c),N=_(e),O=r(e,"H3",{});var u=o(O);P=s(u,"New Tournament Menu"),u.forEach(c),b=_(e),ae&&ae.l(e),j=_(e),x=r(e,"UL",{});var f=o(x);for(let t=0;t<K.length;t+=1)K[t].l(f);f.forEach(c),U=_(e),C=r(e,"INPUT",{placeholder:!0}),S=_(e),L=r(e,"LABEL",{});var m=o(L);H=r(m,"INPUT",{type:!0,value:!0}),M=s(m,"Chess\r\n"),A=r(m,"INPUT",{type:!0,value:!0}),B=s(m,"Tic Tac Toe"),m.forEach(c),D=_(e),G=r(e,"BUTTON",{});var p=o(G);J=s(p,"Create tournament with those  players"),p.forEach(c),this.h()},h(){m(C,"placeholder","enter tournament name here"),m(H,"type","radio"),H.__value="chess",H.value=H.__value,e[8][1].push(H),m(A,"type","radio"),A.__value="tic-tac-toe",A.value=A.__value,e[8][1].push(A)},m(n,l){i(n,t,l),u(t,a),i(n,h,l),i(n,d,l),u(d,T),i(n,I,l),i(n,$,l);for(let e=0;e<Y.length;e+=1)Y[e].m($,null);i(n,N,l),i(n,O,l),u(O,P),i(n,b,l),ae&&ae.m(n,l),i(n,j,l),i(n,x,l);for(let e=0;e<K.length;e+=1)K[e].m(x,null);i(n,U,l),i(n,C,l),k(C,e[4]),i(n,S,l),i(n,L,l),u(L,H),H.checked=H.__value===e[5],u(L,M),u(L,A),A.checked=A.__value===e[5],u(L,B),i(n,D,l),i(n,G,l),u(G,J),F||(V=[p(C,"input",e[9]),p(H,"change",e[10]),p(A,"change",e[11]),p(G,"click",w(e[6]))],F=!0)},p(e,[t]){2&t&&(W=e[1],Y=g(Y,t,te,1,e,W,q,$,v,X,null,Q)),""!=e[2]?ae?ae.p(e,t):(ae=Z(e),ae.c(),ae.m(j.parentNode,j)):ae&&(ae.d(1),ae=null),9&t&&(ne=e[0],K=g(K,t,le,1,e,ne,R,x,v,ee,null,z)),16&t&&C.value!==e[4]&&k(C,e[4]),32&t&&(H.checked=H.__value===e[5]),32&t&&(A.checked=A.__value===e[5])},i:y,o:y,d(a){a&&c(t),a&&c(h),a&&c(d),a&&c(I),a&&c($);for(let e=0;e<Y.length;e+=1)Y[e].d();a&&c(N),a&&c(O),a&&c(b),ae&&ae.d(a),a&&c(j),a&&c(x);for(let e=0;e<K.length;e+=1)K[e].d();a&&c(U),a&&c(C),a&&c(S),a&&c(L),e[8][1].splice(e[8][1].indexOf(H),1),e[8][1].splice(e[8][1].indexOf(A),1),a&&c(D),a&&c(G),F=!1,E(V)}}}function ae(e,t,a){let n=[],l=[],r="",o=[],s="",c="";const i=async()=>{try{const e=await fetch("http://localhost:5001/official/my-tournaments",{method:"GET",headers:{"Content-Type":"application/json",token:localStorage.getItem("token")}}),t=await e.json();if("string"==typeof t)throw t;a(1,l=t)}catch(e){console.log(e)}};T((async()=>{await(async()=>{try{const e=await fetch("http://localhost:5001/official/get-all-players",{method:"GET",headers:{"Content-Type":"application/json",token:localStorage.getItem("token")}}),t=await e.json();if("string"==typeof t)throw t;a(0,n=t)}catch(e){console.log(e)}})(),await i(),console.log(l)}));const u=[[],[]];return[n,l,r,o,s,c,()=>{for(let e=0;e<o.length;e++)a(3,o[e].type="user",o);(async()=>{try{const e=await fetch("http://localhost:5001/official/create-tournament",{method:"POST",headers:{"Content-Type":"application/json",token:localStorage.getItem("token")},body:JSON.stringify({tourn_users:o,tournament_name:s,tournament_type:c})}),t=await e.json();i(),a(2,r=t)}catch(e){console.log(e)}})()},function(){o=I(u[0],this.__value,this.checked),a(3,o)},u,function(){s=this.value,a(4,s)},function(){c=this.__value,a(5,c)},function(){c=this.__value,a(5,c)}]}class ne extends e{constructor(e){super(),t(this,e,ae,te,a,{})}}function le(e){let t,a;return t=new K({}),{c(){$(t.$$.fragment)},l(e){N(t.$$.fragment,e)},m(e,n){O(t,e,n),a=!0},i(e){a||(P(t.$$.fragment,e),a=!0)},o(e){b(t.$$.fragment,e),a=!1},d(e){j(t,e)}}}function re(e){let t,a;return t=new ne({}),{c(){$(t.$$.fragment)},l(e){N(t.$$.fragment,e)},m(e,n){O(t,e,n),a=!0},i(e){a||(P(t.$$.fragment,e),a=!0)},o(e){b(t.$$.fragment,e),a=!1},d(e){j(t,e)}}}function oe(e){let t,a,m,g,v,y,T,k,E,I,$,N,O,j,U,S,L=e[0].user_name+"",H="1"==e[0].user_role_admin&&le(),M="1"==e[0].user_role_official&&re();return{c(){t=n("h1"),a=l("Profile Page"),m=f(),g=n("p"),v=l("Hello "),y=l(L),T=l(" !!!"),k=f(),E=n("button"),I=l("Log out"),$=f(),H&&H.c(),N=f(),M&&M.c(),O=d()},l(e){t=r(e,"H1",{});var n=o(t);a=s(n,"Profile Page"),n.forEach(c),m=_(e),g=r(e,"P",{});var l=o(g);v=s(l,"Hello "),y=s(l,L),T=s(l," !!!"),l.forEach(c),k=_(e),E=r(e,"BUTTON",{});var i=o(E);I=s(i,"Log out"),i.forEach(c),$=_(e),H&&H.l(e),N=_(e),M&&M.l(e),O=d()},m(n,l){i(n,t,l),u(t,a),i(n,m,l),i(n,g,l),u(g,v),u(g,y),u(g,T),i(n,k,l),i(n,E,l),u(E,I),i(n,$,l),H&&H.m(n,l),i(n,N,l),M&&M.m(n,l),i(n,O,l),j=!0,U||(S=p(E,"click",w(e[1])),U=!0)},p(e,[t]){(!j||1&t)&&L!==(L=e[0].user_name+"")&&h(y,L),"1"==e[0].user_role_admin?H?1&t&&P(H,1):(H=le(),H.c(),P(H,1),H.m(N.parentNode,N)):H&&(C(),b(H,1,1,(()=>{H=null})),x()),"1"==e[0].user_role_official?M?1&t&&P(M,1):(M=re(),M.c(),P(M,1),M.m(O.parentNode,O)):M&&(C(),b(M,1,1,(()=>{M=null})),x())},i(e){j||(P(H),P(M),j=!0)},o(e){b(H),b(M),j=!1},d(e){e&&c(t),e&&c(m),e&&c(g),e&&c(k),e&&c(E),e&&c($),H&&H.d(e),e&&c(N),M&&M.d(e),e&&c(O),U=!1,S()}}}function se(e,t,a){let n;U(e,S,(e=>a(0,n=e)));return[n,()=>{S.set({}),L.set(!1),localStorage.removeItem("token"),localStorage.removeItem("user_data"),H("/")}]}export default class extends e{constructor(e){super(),t(this,e,se,oe,a,{})}}