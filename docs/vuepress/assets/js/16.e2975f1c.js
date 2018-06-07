(window.webpackJsonp=window.webpackJsonp||[]).push([[16],{181:function(t,s,e){"use strict";e.r(s);var a=e(0),n=Object(a.a)({},function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("div",{staticClass:"content"},[t._m(0),t._m(1),t._m(2),e("p",[t._v("If you just want to play around with VuePress, you can install it globally:")]),t._m(3),t._m(4),e("p",[t._v("If you have an existing project and would like to keep documentation inside the project, you should install VuePress as a local dependency. This setup also allows you to use CI or services like Netlify for automatic deployment on push.")]),t._m(5),e("div",{staticClass:"warning custom-block"},[e("p",{staticClass:"custom-block-title"},[t._v("WARNING")]),e("p",[t._v("It is currently recommended to use "),e("a",{attrs:{href:"https://yarnpkg.com/en/",target:"_blank",rel:"noopener noreferrer"}},[t._v("Yarn"),e("OutboundLink")],1),t._v(" instead of npm when installing VuePress into an existing project that has webpack 3.x as a dependency. Npm fails to generate the correct dependency tree in this case.")])]),t._m(6),t._m(7),e("p",[t._v("You can now start writing with:")]),t._m(8),e("p",[t._v("To generate static assets, run:")]),t._m(9),e("p",[t._v("By default the built files will be in "),e("code",[t._v(".vuepress/dist")]),t._v(", which can be configured via the "),e("code",[t._v("dest")]),t._v(" field in "),e("code",[t._v(".vuepress/config.js")]),t._v(". The built files can be deployed to any static file server. See "),e("router-link",{attrs:{to:"./deploy.html"}},[t._v("Deployment Guide")]),t._v(" for guides on deploying to popular services.")],1)])},[function(){var t=this.$createElement,s=this._self._c||t;return s("h1",{attrs:{id:"getting-started"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#getting-started","aria-hidden":"true"}},[this._v("#")]),this._v(" Getting Started")])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"warning custom-block"},[s("p",{staticClass:"custom-block-title"},[this._v("COMPATIBILITY NOTE")]),s("p",[this._v("VuePress requires Node.js >= 8.")])])},function(){var t=this.$createElement,s=this._self._c||t;return s("h2",{attrs:{id:"global-installation"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#global-installation","aria-hidden":"true"}},[this._v("#")]),this._v(" Global Installation")])},function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("div",{staticClass:"language-bash extra-class"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{attrs:{class:"token comment"}},[t._v("# install globally")]),t._v("\nyarn global add vuepress "),e("span",{attrs:{class:"token comment"}},[t._v("# OR npm install -g vuepress")]),t._v("\n\n"),e("span",{attrs:{class:"token comment"}},[t._v("# create a markdown file")]),t._v("\n"),e("span",{attrs:{class:"token keyword"}},[t._v("echo")]),t._v(" "),e("span",{attrs:{class:"token string"}},[t._v("'# Hello VuePress'")]),t._v(" "),e("span",{attrs:{class:"token operator"}},[t._v(">")]),t._v(" README.md\n\n"),e("span",{attrs:{class:"token comment"}},[t._v("# start writing")]),t._v("\nvuepress dev\n\n"),e("span",{attrs:{class:"token comment"}},[t._v("# build")]),t._v("\nvuepress build\n")])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("h2",{attrs:{id:"inside-an-existing-project"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#inside-an-existing-project","aria-hidden":"true"}},[this._v("#")]),this._v(" Inside an Existing Project")])},function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("div",{staticClass:"language-bash extra-class"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{attrs:{class:"token comment"}},[t._v("# install as a local dependency")]),t._v("\nyarn add -D vuepress "),e("span",{attrs:{class:"token comment"}},[t._v("# OR npm install -D vuepress")]),t._v("\n\n"),e("span",{attrs:{class:"token comment"}},[t._v("# create a docs directory")]),t._v("\n"),e("span",{attrs:{class:"token function"}},[t._v("mkdir")]),t._v(" docs\n"),e("span",{attrs:{class:"token comment"}},[t._v("# create a markdown file")]),t._v("\n"),e("span",{attrs:{class:"token keyword"}},[t._v("echo")]),t._v(" "),e("span",{attrs:{class:"token string"}},[t._v("'# Hello VuePress'")]),t._v(" "),e("span",{attrs:{class:"token operator"}},[t._v(">")]),t._v(" docs/README.md\n")])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("p",[this._v("Then, add some scripts to "),s("code",[this._v("package.json")]),this._v(":")])},function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("div",{staticClass:"language-json extra-class"},[e("pre",{pre:!0,attrs:{class:"language-json"}},[e("code",[e("span",{attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),e("span",{attrs:{class:"token property"}},[t._v('"scripts"')]),e("span",{attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{attrs:{class:"token property"}},[t._v('"docs:dev"')]),e("span",{attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{attrs:{class:"token string"}},[t._v('"vuepress dev docs"')]),e("span",{attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),e("span",{attrs:{class:"token property"}},[t._v('"docs:build"')]),e("span",{attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{attrs:{class:"token string"}},[t._v('"vuepress build docs"')]),t._v("\n  "),e("span",{attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),e("span",{attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"language-bash extra-class"},[s("pre",{pre:!0,attrs:{class:"language-bash"}},[s("code",[this._v("yarn docs:dev "),s("span",{attrs:{class:"token comment"}},[this._v("# OR npm run docs:dev")]),this._v("\n")])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"language-bash extra-class"},[s("pre",{pre:!0,attrs:{class:"language-bash"}},[s("code",[this._v("yarn docs:build "),s("span",{attrs:{class:"token comment"}},[this._v("# Or npm run docs:build")]),this._v("\n")])])])}],!1,null,null,null);s.default=n.exports}}]);