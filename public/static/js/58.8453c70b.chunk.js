"use strict";(self.webpackChunklbanblog=self.webpackChunklbanblog||[]).push([[58],{3928:function(e,t,n){var s=n(2791),i=n(5985),r=n(7223),a=n(3483),l=n(184);t.Z=function(e){var t=e.children,n=e.name,o=(e.role,e.pageTitle),c=e.remove,u=void 0!==c&&c,d=(0,s.useContext)(a.V).user;return(0,l.jsxs)("div",{className:"appContainer",children:[(0,l.jsx)(r.wp,{name:n,role:null===d||void 0===d?void 0:d.role}),(0,l.jsxs)("div",{className:"contentsRight",children:[(0,l.jsx)(i.Ix,{}),(0,l.jsx)(r.h4,{title:o,user:d}),(0,l.jsx)("div",{className:u?"removePadding":"contents",children:t})]})]})}},6058:function(e,t,n){n.r(t);var s=n(4942),i=n(1413),r=n(9439),a=n(2791),l=n(3928),o=n(683),c=n(7223),u=n(2062),d=n.n(u),g=n(3722),C=n(749),b=n(184);t.default=function(){var e=(0,g.B)(),t=(0,a.useState)(!1),n=(0,r.Z)(t,2),u=n[0],m=n[1],f=(0,a.useState)(!1),v=(0,r.Z)(f,2),x=v[0],h=v[1],j=(0,a.useState)({}),y=(0,r.Z)(j,2),p=y[0],Z=y[1],S=(0,a.useState)({}),k=(0,r.Z)(S,2),w=k[0],N=k[1],P=function(e,t){N((0,i.Z)((0,i.Z)({},w),{},(0,s.Z)({},e,t)))},z=o.P.useCategory(),B=o.P.useAddCategory(),D=B.mutate,E=B.reset,U=B.isSuccess,A=B.isError,q=B.error,I=o.P.useUpdateCategory(),T=I.mutate,R=I.reset,H=I.isSuccess,L=I.isError,O=I.error,V=o.P.useDeleteCategory(),Y=V.mutate,_=V.reset,M=V.isSuccess,W=V.isError,F=V.error;U&&(E(),m(!1),(0,C.Cq)("Created Successfully")),A&&(E(),(0,C.sD)(q)),H&&(R(),m(!1),(0,C.Cq)("Updated Successfully")),L&&(R(),(0,C.sD)(O)),M&&(_(),(0,C.Cq)("Deleted Successfully")),W&&(_(),(0,C.sD)(F));var G=function(){m(!1)};return(0,b.jsx)(l.Z,{name:"Product Categories",pageTitle:"Category",children:(0,b.jsxs)("div",{className:"bgWhite",children:[(0,b.jsx)("div",{className:"btnContainer right",children:(0,b.jsx)("button",{type:"button",className:"btn btnSuccess shadowBtn",onClick:function(){m(!0),Z(""),h(!1)},children:"Add Category"})}),(0,b.jsx)(c.iA,{columns:[{title:"Title",field:"title"}],data:z,actions:function(e){return[{name:"Edit",onClick:function(e){Z(e),m(!0),h(!0)}},{name:"Delete",onClick:function(e){d()({title:"Are you sure?",text:"Once deleted, you will not be able to recover this",icon:"warning",buttons:["No","Yes"],dangerMode:!0}).then((function(t){t&&Y(e._id)}))}}]}}),(0,b.jsx)(c.u_,{isVisible:u,title:x?"Edit Category":"Create Category",size:"md",content:(0,b.jsxs)(c.cw,{onSubmit:x?function(){T(p)}:function(){D(p)},validation:!x&&p,errors:w,setErrors:N,children:[(0,b.jsx)(c.II,{name:"title",label:"Title",value:p.title,onChange:function(e,t){Z((0,i.Z)((0,i.Z)({},p),{},(0,s.Z)({},e,t)))},type:"text",validationHandler:P,error:w.title,required:!0,size:"large"}),(0,b.jsx)(c.Ur,{name:"image",label:"Post Banner Image",onChange:function(e,t){for(var n="",r=0;r<(null===t||void 0===t?void 0:t.length);r++){n=t[r],URL.createObjectURL(t[r])}Z((0,i.Z)((0,i.Z)({},p),{},(0,s.Z)({},e,n)))},validationHandler:P,error:w.image,className:"btnSuccess",multiple:!1}),(0,b.jsx)(c.zx,{title:x?"Update":"Add",loading:Boolean(e),disabled:Boolean(e),bgColor:"btnYellow",size:"small"}),(0,b.jsx)(c.zx,{title:"Cancel",type:"button",loading:1===e,disabled:1===e,bgColor:"btnBlack",size:"small",onClick:G})]}),onClose:G,footer:""})]})})}}}]);
//# sourceMappingURL=58.8453c70b.chunk.js.map