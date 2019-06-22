export class Rectangle {
	x: number;
	y: number;
	w: number;
	h: number;
	constructor(x: number, y: number, w: number, h: number) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
}

export interface PaintUnitInterface {
	draw(): void;
}

export function getBounds(vertexes: number[]): Rectangle {
	const vs = vertexes;
	const vsx = vs.filter((v, k) => k % 2 == 0);
	const vsy = vs.filter((v, k) => k % 2 != 0);
	const minx = Math.min.apply(null, vsx);
	const maxx = Math.max.apply(null, vsx);
	const miny = Math.min.apply(null, vsy);
	const maxy = Math.max.apply(null, vsy);
	return new Rectangle(minx, miny, maxx - minx, maxy - miny);
}
