/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../../../../../node_modules/css-loader/lib/css-base.js\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))(undefined);
// imports


// module
exports.push([module.i, ".src-components-Board-board-row:after {\r\n    clear: both;\r\n    content: \"\";\r\n    display: table;\r\n}\r\n\r\n.src-components-Board-status {\r\n    margin-bottom: 10px;\r\n}\r\n", ""]);

// exports
exports.locals = {
	"board-row": "src-components-Board-board-row",
	"boardRow": "src-components-Board-board-row",
	"status": "src-components-Board-status"
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../../../../../node_modules/css-loader/lib/css-base.js\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))(undefined);
// imports


// module
exports.push([module.i, ".src-components-Game-game {\r\n    display: flex;\r\n    flex-direction: row;\r\n}\r\n\r\n.src-components-Game-game-board {\r\n    margin-right: 20px;\r\n}\r\n\r\n.src-components-Game-game-info {\r\n    margin-left: 20px;\r\n}\r\n\r\n.src-components-Game-game-footer {\r\n    margin-top: 20px;\r\n}\r\n", ""]);

// exports
exports.locals = {
	"game": "src-components-Game-game",
	"game-board": "src-components-Game-game-board",
	"gameBoard": "src-components-Game-game-board",
	"game-info": "src-components-Game-game-info",
	"gameInfo": "src-components-Game-game-info",
	"game-footer": "src-components-Game-game-footer",
	"gameFooter": "src-components-Game-game-footer"
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Game_css_1 = __webpack_require__(1);
var Board_1 = __webpack_require__(3);
exports.Game = {
    Board: Board_1.Board,
    game: Game_css_1.locals.game,
    gameBoard: Game_css_1.locals.gameBoard,
    gameInfo: Game_css_1.locals.gameInfo,
    gameFooter: Game_css_1.locals.gameFooter
};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Board_css_1 = __webpack_require__(0);
exports.Board = {
    boardRow: Board_css_1.locals.boardRow,
    status: Board_css_1.locals.status
};


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Game_1 = __webpack_require__(2);
console.log(Game_1.Game);


/***/ })
/******/ ]);