import { ImageTexture, TextureFactroy } from "./texture";
import { RenderObject } from "./render-object";
import { Generator } from './generator';
import { IdCreator, arrayEqual } from "./utils";
import { ComponentInterface } from "./interfaces";
import { SearchableObject } from "./searchable-object";

export class TextField extends SearchableObject implements ComponentInterface {
	private _id: string;
	private _isShown: boolean = false;
	private _text: string = '';
	private _fontSize: number = 12;
	private _translation: number[] = [0, 0];
	private _color: number[] = [255,255,255,255];
	private _wordSpace: number = 10;
	private _borderWidth: number = 0;
	private _borderColor: number[] = [0,0,0,0];
	
	private _tf: TextureFactroy;
	private _fontObjects: RenderObject[];
	private _g: Generator;

	constructor(generator: Generator, textureFactroy: TextureFactroy) {
		super(generator.engine.searcher);
		this._id = IdCreator.createId();
		this._g = generator;
		this._tf = textureFactroy;
		this._fontObjects = [];
	}
	
	get id(): string {
		return this._id;
	}

	get isShown(): boolean {
		return this._isShown;
	}

	show(): TextField {
		if(this._isShown) return this;
		this._isShown = true;
		this.resetFonts();
		this.searchable && this.registToSearcher();
		return this;
	}

	hide(): TextField {
		if(!this._isShown) return this;
		this._isShown = false;
		this.resetFonts();
		this.deregistToSearcher();
		return this;
	}

	set text(str: string) {
		this._text = str;
		this.resetFonts();
		this.setFontsTranslation();
	}

	set translation(offset: number[]) {
		this._translation = offset;
		this.setFontsTranslation();
		this.searchable && this.registToSearcher();
	}

	get translation(): number[] {
		return this._translation;
	}

	set fontSize(size: number) {
		this._fontSize = size;
		this.setFontsTranslation();
		this.searchable && this.registToSearcher();
	}

	get fontSize(): number {
		return this._fontSize;
	}

	set color(color: number[]) {
		this._color = color;
		this.resetFonts();	
	}

	get color(): number[] {
		return this._color;
	}

	set wordSpace(n: number) {
		if(this._wordSpace == n) return;
		this._wordSpace = n;
		this.setFontsTranslation();
		this.searchable && this.registToSearcher();
	}

	get wordSpace(): number {
		return this._wordSpace;
	}

	set borderWidth(n: number) {
		if(this._borderWidth == n) return;
		this._borderWidth = n;
		this.resetFonts();
	}

	get borderWidth(): number {
		return this._borderWidth;
	}

	set borderColor(color: number[]) {
		if(arrayEqual(this._borderColor, color)) return;
		this._borderColor = color;
		this.resetFonts();
	}

	private resetFonts() {
		const len = this._text.length;
		const nowLen = this._fontObjects.length;
		const f = this._tf;
		const g = this._g;
		if(len > nowLen) {
			let l = len - nowLen;
			while(l > 0) {
				this._fontObjects.push(g.instance());
				l --;
			}
		} else if(len < nowLen) {
			let l = nowLen - len;
			while(l > 0) {
				this._fontObjects.pop().hide();
				l --;
			}
		}

		this._fontObjects.forEach((v,k) => {
			let text = this._text[k];

			if(this._isShown) {
				v.show();
			} else {
				v.hide();
			}

			v.isText = true;
			v.backgroundColor = this._color;
			v.textBorderWidth = this._borderWidth;
			v.textBorderColor = this._borderColor;
			let texture = f.getFontTexture(text);
			if(!texture || !(texture instanceof ImageTexture)) {
				console.error('Can not found ImageTexture of text: "'+text+'".');
				return;
			} else {
				v.texture = texture;
			}
			
		});
	}

	private setFontsTranslation() {
		const s = this._fontSize;
		const offset = this._translation;
		const space = (this._wordSpace - 25) / 100 * s;
		this._fontObjects.forEach((obj, k) => {
			obj.translation = [k*(s+space) + offset[0] + 0.5*s, offset[1]];
			obj.size = [s, s];
		});
	}

	public getVertexPositions(expand: number = 0): number[] {
		const len = this._fontObjects.length;
		if(len <= 0) return [];
		const first = this._fontObjects[0].getVertexPositions(expand);
		const last = this._fontObjects[len - 1].getVertexPositions(expand);
		const vs = first.concat(last);
		const vx = vs.filter((v, k) => k % 2 == 0);
		const vy = vs.filter((v, k) => k % 2 != 0);
		const minX = Math.min.apply(null, vx);
		const maxX = Math.max.apply(null, vx);
		const minY = Math.min.apply(null, vy);
		const maxY = Math.max.apply(null, vy);
		return [minX, maxY, minX, minY, maxX, minY, maxX, maxY];
	}
}