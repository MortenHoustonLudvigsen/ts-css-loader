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
/******/ 	__webpack_require__.p = "/";
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
exports.push([module.i, ".src-components-Board-board-row-3y3-3:after {\r\n    clear: both;\r\n    content: \"\";\r\n    display: table;\r\n}\r\n\r\n.src-components-Board-status-3z9-k {\r\n    margin-bottom: 10px;\r\n}\r\n", ""]);

// exports
exports.locals = {
	"board-row": "src-components-Board-board-row-3y3-3",
	"boardRow": "src-components-Board-board-row-3y3-3",
	"status": "src-components-Board-status-3z9-k"
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../../../../../node_modules/css-loader/lib/css-base.js\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))(undefined);
// imports


// module
exports.push([module.i, ".src-components-Game-game-3mRuP {\r\n    display: flex;\r\n    flex-direction: row;\r\n}\r\n\r\n.src-components-Game-game-board-3REsK {\r\n    margin-right: 20px;\r\n}\r\n\r\n.src-components-Game-game-info-38eO7 {\r\n    margin-left: 20px;\r\n}\r\n\r\n.src-components-Game-game-footer-3Bfp4 {\r\n    margin-top: 20px;\r\n}\r\n", ""]);

// exports
exports.locals = {
	"game": "src-components-Game-game-3mRuP",
	"game-board": "src-components-Game-game-board-3REsK",
	"gameBoard": "src-components-Game-game-board-3REsK",
	"game-info": "src-components-Game-game-info-38eO7",
	"gameInfo": "src-components-Game-game-info-38eO7",
	"game-footer": "src-components-Game-game-footer-3Bfp4",
	"gameFooter": "src-components-Game-game-footer-3Bfp4"
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var css = __webpack_require__(1);
var Board_1 = __webpack_require__(3);
exports.Game = {
    Board: Board_1.Board,
    game: css.game,
    gameBoard: css.gameBoard,
    gameInfo: css.gameInfo,
    gameFooter: css.gameFooter
};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var css = __webpack_require__(0);
exports.Board = {
    boardRow: css.boardRow,
    status: css.status
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