"use strict";(self.webpackChunklbanblog=self.webpackChunklbanblog||[]).push([[497],{3928:function(e,t,a){var n=a(2791),r=a(5985),s=a(7223),l=a(3483),i=a(184);t.Z=function(e){var t=e.children,a=e.name,o=(e.role,e.pageTitle),d=e.remove,c=void 0!==d&&d,u=(0,n.useContext)(l.V).user;return(0,i.jsxs)("div",{className:"appContainer",children:[(0,i.jsx)(s.wp,{name:a,role:null===u||void 0===u?void 0:u.role}),(0,i.jsxs)("div",{className:"contentsRight",children:[(0,i.jsx)(r.Ix,{}),(0,i.jsx)(s.h4,{title:o,user:u}),(0,i.jsx)("div",{className:c?"removePadding":"contents",children:t})]})]})}},3497:function(e,t,a){a.r(t);var n=a(4942),r=a(1413),s=a(9439),l=a(2791),i=a(3928),o=a(683),d=a(7223),c=a(3722),u=a(749),v=a(7689),m=a(1087),h=a(6584),x=a(2443),g=a.n(x),p=a(184);t.default=function(){var e=(0,c.B)(),t=(0,l.useState)({}),a=(0,s.Z)(t,2),x=a[0],j=a[1],f=(0,l.useState)({}),b=(0,s.Z)(f,2),C=b[0],Z=b[1],P=(0,l.useState)(""),N=(0,s.Z)(P,2),y=N[0],S=N[1],U=(0,v.s0)(),w=(0,v.UO)().id,B=function(e,t){j((0,r.Z)((0,r.Z)({},x),{},(0,n.Z)({},e,t)))},H=function(e,t){Z((0,r.Z)((0,r.Z)({},C),{},(0,n.Z)({},e,t)))},I=o.P.useCategory(),k=o.P.usePost(),q=null===k||void 0===k?void 0:k.find((function(e){return e._id===w})),z=o.P.useUpdatePost(),E=z.mutate,T=z.reset,D=z.isSuccess,F=z.isError,O=z.error;D&&(T(),(0,u.Cq)("Created Successfully"),U("/posts")),F&&(T(),(0,u.sD)(O));(0,l.useEffect)((function(){var e;q&&j((0,r.Z)((0,r.Z)({},q),{},{content:(e=null===q||void 0===q?void 0:q.content,(new DOMParser).parseFromString(e,"text/html").body.textContent||"")}))}),[q]);return(0,p.jsx)(i.Z,{name:"Posts",pageTitle:"Posts",children:(0,p.jsxs)("div",{className:"contents bgWhite",children:[(0,p.jsx)("div",{className:"btnContainer right",children:(0,p.jsx)(m.rU,{to:"/app/posts/",className:"btn btnSuccess shadowBtn",children:"Go Back"})}),(0,p.jsxs)(d.cw,{onSubmit:function(){E(x)},validation:x,errors:C,setErrors:Z,children:[(0,p.jsx)(d.II,{name:"title",label:"Title",value:x.title,onChange:B,type:"text",validationHandler:H,error:C.title,required:!0,size:"large"}),(0,p.jsx)(d.NU,{name:"categories",label:"Post Category",value:x.categories,onChange:B,validationHandler:H,error:C.categories,required:!0,data:I,filter:"title",filterValue:"_id"}),(0,p.jsx)(d.Ph,{name:"type",label:"Post Type",value:x.type,onChange:B,type:"text",validationHandler:H,error:C.type,required:!0,data:[{name:"Featured",value:"featured"},{name:"Alert",value:"alert"},{name:"Headline",value:"headline"},{name:"Post",value:"post"}]}),(0,p.jsxs)("div",{className:"editorContainer",children:[(0,p.jsx)("label",{style:{fontSize:"14px",marginBottom:"0.5rem"},children:"Post Content"}),(0,p.jsx)("div",{className:"editor",children:(0,p.jsx)(h.CKEditor,{editor:g(),data:x.content,onChange:function(e,t){var a=t.getData();j((function(e){return(0,r.Z)((0,r.Z)({},e),{},{content:a})}))}})})]}),(0,p.jsx)(d.II,{name:"author",label:"Author",value:x.author,onChange:B,type:"text",validationHandler:H,error:C.author,required:!0}),(0,p.jsx)(d.Ur,{name:"images",label:"Post Banner Image",onChange:function(e,t){for(var a="",s=[],l=0;l<(null===t||void 0===t?void 0:t.length);l++){a=t[l],s=URL.createObjectURL(t[l])}j((0,r.Z)((0,r.Z)({},x),{},(0,n.Z)({},e,a))),S(s)},validationHandler:H,error:C.images,className:"btnSuccess",multiple:!1}),y&&(0,p.jsxs)("div",{className:"pix",children:[(0,p.jsx)("div",{className:"title",children:"Uploaded Picture"}),(0,p.jsx)("div",{className:"pixFlex",children:(0,p.jsx)("img",{src:y,alt:"products"})})]}),(0,p.jsx)(d.zx,{title:"Create Post",loading:Boolean(e),disabled:Boolean(e),bgColor:"btnYellow",size:"small"})]})]})})}}}]);
//# sourceMappingURL=497.ba4311ac.chunk.js.map