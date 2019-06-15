import { Engine } from './engine';
import { Generator, Shape } from './display';
import { TextureFactroy, ImageTexture } from './texture'
import { Viewport } from './viewport';
import { Mesh, RectMesh } from './mesh';
// import { Searcher } from './searcher';
(function main() {
	const canvas = document.getElementById('glcanvas');
	
	let engine = new Engine(canvas);
	let tf = new TextureFactroy(engine);
	let vp = new Viewport(engine);
	// let scr = new Searcher(engine);
	let isDragging = false;
	let dragLastPoint = [];
	let activeShape: Shape;
	let uvlist = [];
	vp.setBackgroundColor(getRandomColor());
	
	canvas.addEventListener('mousewheel', wheelHandler);
	canvas.addEventListener('mousedown', dragStart);
	canvas.addEventListener('mousemove', drag);
	canvas.addEventListener('mouseup', dragEnd);
	canvas.addEventListener('mousemove', hoverHandler);
	window.addEventListener('resize', windowResize);
	windowResize();
	
	let p1 = tf.loadImage('../assets/ps.png');
	let p2 = tf.loadImage('../assets/superman.png');
	let p3 = tf.loadImage('../assets/dvd.png');

	Promise.all([p1,p2,p3]).then(init);

	var obj;


	function init(uvs) {
		uvlist = uvs;
		drawRects(uvs[0]);
		engine.render();
		
	}

	function drawRects(uv) {
		const rectMesh: RectMesh = new RectMesh();
		const g: Generator = new Generator(engine, rectMesh);
		const count = 30;
		const w = 800/count;
		for(let i = 0; i < count; i ++) {
			for(let j = 0; j < count; j ++) {
				let idx = Math.round(Math.random() * 2);
				let obj = g.instance();
				obj.show()
					.setOffset(i*w+w/2, j*w+w/2)
					.setBgColor(getRandomColor())
					.setTexture(uv)
					.setTransformValue(w);
			}
		}
	} 	

	function drawARect(uvs) {
		const rectMesh: RectMesh = new RectMesh();
		const g1: Generator = new Generator(engine, rectMesh);
		const g2: Generator = new Generator(engine, rectMesh);
		const g3: Generator = new Generator(engine, rectMesh);

		const count = 30;
		const w = 800/count;
		const gs = [g1,g2,g3];
		obj = g1.instance()
			.show()
			.setOffset(250, 100)
			.setBgColor(getRandomColor())
			.setTransformValue(100);

		// let result = scr.search(250, 100);
		// let s = result[0];
		// s.setOffset(0, 0);
	}

	function wheelHandler(evt) {
		if(evt.preventDefault) {
			evt.preventDefault();
		}
		evt.returnValue = false;
		const mx = evt.pageX;
		const my = evt.pageY;
		let d = - evt.wheelDeltaY / 1000;
		vp.setScaleOrigin(d+vp.scale, mx, my);
	}

	function dragStart(evt) {
		isDragging = true;
		dragLastPoint = [evt.x, evt.y];
	}

	function drag(evt) {
		if(!isDragging) return;
		const dx = evt.x - dragLastPoint[0];
		const dy = evt.y - dragLastPoint[1];

		vp.translate(dx, -dy);

		dragLastPoint = [evt.x, evt.y];
	}

	function dragEnd(evt) {
		isDragging = false;
		dragLastPoint = [];
	}

	function windowResize() {
		vp.setViewportSize(document.body.clientWidth, document.body.clientHeight);
	}

	function getRandomColor() {
		return [Math.random()*255,Math.random()*255,Math.random()*255,255];
	}

	function hoverHandler(evt) {
		//调用viewport的方法转换坐标系
		// let cs = vp.changeCoordinateFromScreen(evt.pageX, evt.pageY);
		// const shape: Shape = scr.search(cs[0], cs[1])[0];
		// if(shape) {
		// 	shape.setTexture(uvlist[1]);
		// 	if(activeShape != undefined && activeShape != shape) {
		// 		activeShape.setTexture(uvlist[0]);
		// 	}
		// 	activeShape = shape;
		// }
	}

})();